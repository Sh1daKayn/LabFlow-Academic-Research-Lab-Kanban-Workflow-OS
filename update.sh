#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# LabFlow One-Click Zero-Sudo Updater & Daemon Manager (Linux / macOS)
# - Preserves .data/labflow-state.json, .env, and database state
# - Supports GitHub pull OR offline bundle (--bundle ~/labflow-update.bundle)
# - Stops previous LabFlow process cleanly before build (prevents EADDRINUSE/500)
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
cd "$SCRIPT_DIR"

PORT="${PORT:-3000}"
BUNDLE_PATH=""
SKIP_PULL="0"
NPM_REGISTRY="${NPM_REGISTRY:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --port)
      PORT="$2"
      shift 2
      ;;
    --bundle)
      BUNDLE_PATH="$2"
      shift 2
      ;;
    --mirror)
      NPM_REGISTRY="https://registry.npmmirror.com"
      shift
      ;;
    --registry)
      NPM_REGISTRY="$2"
      shift 2
      ;;
    --no-pull)
      SKIP_PULL="1"
      shift
      ;;
    -h|--help)
      cat <<EOF
Usage: ./update.sh [options]
  --port <port>       Port to listen on (default: 3000 or \$PORT)
  --bundle <path>     Pull update from a local git bundle instead of GitHub
  --mirror            Use China npm mirror (https://registry.npmmirror.com)
  --registry <url>    Use custom npm registry URL
  --no-pull           Skip git pull step (rebuild and restart current working tree)
EOF
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

# Load .env safely (stripping Windows CRLF if present) so DATABASE_URL / PORT take effect
if [[ -f ".env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source <(sed 's/\r$//' .env)
  set +a
  PORT="${PORT:-3000}"
fi

DATA_DIR="${LABFLOW_DATA_DIR:-$SCRIPT_DIR/.data}"
mkdir -p "$DATA_DIR"
PID_FILE="$DATA_DIR/labflow-server.pid"
LOG_FILE="$DATA_DIR/labflow-server.log"

echo "==> [1/5] Checking repository source in $SCRIPT_DIR"
if [[ "$SKIP_PULL" != "1" ]]; then
  if ! git diff --quiet || ! git diff --cached --quiet; then
    STASH_NAME="auto-stash-before-update-$(date +%s)"
    echo "    Stashing local tracked edits as '$STASH_NAME'..."
    git stash push -m "$STASH_NAME" >/dev/null
  fi

  if [[ -n "$BUNDLE_PATH" ]]; then
    if [[ ! -f "$BUNDLE_PATH" ]]; then
      echo "ERROR: Bundle file not found: $BUNDLE_PATH" >&2
      exit 1
    fi
    echo "    Pulling from local bundle: $BUNDLE_PATH"
    git pull --ff-only "$BUNDLE_PATH" HEAD || git pull --no-rebase "$BUNDLE_PATH" HEAD
  else
    CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)"
    if [[ "$CURRENT_BRANCH" == "HEAD" || -z "$CURRENT_BRANCH" ]]; then
      CURRENT_BRANCH="main"
    fi
    echo "    Pulling latest commits from origin/$CURRENT_BRANCH..."
    if ! git pull --ff-only origin "$CURRENT_BRANCH"; then
      echo "ERROR: Failed to pull from GitHub. If GitHub access is blocked/unstable," >&2
      echo "       upload a git bundle and run: ./update.sh --bundle ~/labflow-update.bundle" >&2
      exit 1
    fi
  fi
fi

echo "==> [2/5] Installing dependencies..."
if [[ -n "$NPM_REGISTRY" ]]; then
  npm ci --registry="$NPM_REGISTRY"
else
  npm ci
fi

if [[ -n "${DATABASE_URL:-}" ]]; then
  echo "==> [2.5/5] DATABASE_URL detected -> syncing PostgreSQL schema..."
  npx prisma db push --skip-generate
fi

echo "==> [3/5] Stopping previous LabFlow server before build..."
stop_pid_if_alive() {
  local target_pid="$1"
  [[ -z "$target_pid" || ! "$target_pid" =~ ^[0-9]+$ ]] && return 0
  if kill -0 "$target_pid" 2>/dev/null; then
    echo "    Stopping PID $target_pid..."
    kill "$target_pid" 2>/dev/null || true
    for _ in {1..15}; do
      if ! kill -0 "$target_pid" 2>/dev/null; then
        return 0
      fi
      sleep 0.3
    done
    kill -9 "$target_pid" 2>/dev/null || true
  fi
}

if [[ -f "$PID_FILE" ]]; then
  OLD_PID="$(tr -d '[:space:]' < "$PID_FILE" || true)"
  stop_pid_if_alive "$OLD_PID"
  rm -f "$PID_FILE"
fi

# Stop any remaining Next.js processes owned by current user
if command -v pgrep >/dev/null 2>&1; then
  MY_UID="$(id -u)"
  while IFS= read -r pid; do
    [[ -n "$pid" && "$pid" != "$$" ]] && stop_pid_if_alive "$pid"
  done < <(pgrep -u "$MY_UID" -f "$SCRIPT_DIR/node_modules/.*next" || true)
fi

# Also check if any process owned by current user is still listening on $PORT
if command -v ss >/dev/null 2>&1; then
  PORT_PIDS="$(ss -lptn "sport = :$PORT" 2>/dev/null | grep -oE 'pid=[0-9]+' | cut -d= -f2 | sort -u || true)"
  for p in $PORT_PIDS; do
    stop_pid_if_alive "$p"
  done
  sleep 0.5
  if ss -ltn "sport = :$PORT" 2>/dev/null | grep -q ":$PORT "; then
    echo "ERROR: Port $PORT is still occupied by another process (likely owned by another user)." >&2
    echo "       Check 'ss -lptn \"sport = :$PORT\"' or run: ./update.sh --port 3001" >&2
    exit 1
  fi
fi

echo "==> [4/5] Building production bundle..."
npm run build

echo "==> [5/5] Starting LabFlow daemon on 0.0.0.0:$PORT..."
: > "$LOG_FILE"
nohup npx next start -H 0.0.0.0 -p "$PORT" </dev/null >>"$LOG_FILE" 2>&1 &
NEW_PID=$!
echo "$NEW_PID" > "$PID_FILE"
disown "$NEW_PID" 2>/dev/null || true

# Verify server boots cleanly and passes /api/health
HEALTH_OK="0"
for _ in {1..40}; do
  if ! kill -0 "$NEW_PID" 2>/dev/null; then
    echo "ERROR: LabFlow process exited unexpectedly. Recent logs:" >&2
    tail -n 40 "$LOG_FILE" >&2 || true
    exit 1
  fi
  if node -e "fetch('http://127.0.0.1:${PORT}/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" 2>/dev/null; then
    HEALTH_OK="1"
    break
  fi
  sleep 0.5
done

if [[ "$HEALTH_OK" != "1" ]]; then
  echo "WARNING: Health check timed out; inspect logs at $LOG_FILE:" >&2
  tail -n 30 "$LOG_FILE" >&2 || true
  exit 1
fi

echo "✅ LabFlow is updated and running! PID=$NEW_PID Port=$PORT"
echo "   Logs: $LOG_FILE"
