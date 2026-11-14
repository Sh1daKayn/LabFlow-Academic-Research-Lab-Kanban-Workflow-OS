# syntax=docker/dockerfile:1

# Stage 1: Base image
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

# Stage 2: Dependencies
FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci

# Stage 3: Builder
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npx prisma generate
RUN npm run build
RUN node -e "\
const fs = require('fs');\
const path = require('path');\
const dest = '/app/prisma-cli/node_modules';\
fs.mkdirSync(dest, { recursive: true });\
const seen = new Set();\
const q = ['prisma', '@prisma/engines', '@prisma/config', 'iconv-lite'];\
while (q.length) {\
  const pkg = q.shift();\
  if (seen.has(pkg)) continue;\
  const src = path.join('/app/node_modules', pkg);\
  if (!fs.existsSync(src)) continue;\
  seen.add(pkg);\
  const out = path.join(dest, pkg);\
  fs.mkdirSync(path.dirname(out), { recursive: true });\
  fs.cpSync(src, out, { recursive: true });\
  const pj = path.join(src, 'package.json');\
  if (fs.existsSync(pj)) {\
    const d = JSON.parse(fs.readFileSync(pj, 'utf8'));\
    for (const k of Object.keys({ ...(d.dependencies || {}), ...(d.optionalDependencies || {}) })) q.push(k);\
  }\
}"

# Stage 4: Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /app/.data && chown -R nextjs:nodejs /app/.data

# Copy public, prisma schema, standalone bundle & isolated prisma CLI closure
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder --chown=nextjs:nodejs /app/prisma-cli ./prisma-cli

USER nextjs
EXPOSE 3000

CMD ["sh", "-c", "if [ -n \"$DATABASE_URL\" ]; then node /app/prisma-cli/node_modules/prisma/build/index.js db push --skip-generate --schema=/app/prisma/schema.prisma; fi && exec node server.js"]
