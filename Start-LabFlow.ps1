Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "               LabFlow: Academic Research Kanban & Workflow OS                " -ForegroundColor White
Write-Host "                     Paper-Driven & Blocker-Aware System                      " -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan

# 1. Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js is not found on your system!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit..."
    exit 1
}

$nodeVer = node -v
Write-Host "[*] Detected Node.js: $nodeVer" -ForegroundColor Green

# 2. Check node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "[*] Installing dependencies (npm install)..." -ForegroundColor Yellow
    npm install
}

# 3. Open browser after startup
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 3
    Start-Process "http://localhost:3000"
} | Out-Null

Write-Host "[*] Launching LabFlow on http://localhost:3000 ..." -ForegroundColor Cyan
npm run dev
