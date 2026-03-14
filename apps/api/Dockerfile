# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy workspace manifests first for layer caching
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json tsconfig.base.json ./
COPY packages/types/package.json       ./packages/types/
COPY packages/ui/package.json          ./packages/ui/
COPY apps/api/package.json             ./apps/api/

RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/types/ ./packages/types/
COPY apps/api/       ./apps/api/

# Build shared types then API
RUN pnpm --filter @snaptik/types run build
RUN pnpm --filter @snaptik/api   run build

# Prune dev dependencies
RUN pnpm deploy --filter @snaptik/api --prod /app/deploy


# ─── Stage 2: Production image ───────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 apiuser

WORKDIR /app

# Copy pruned production install
COPY --from=builder --chown=apiuser:nodejs /app/deploy .

USER apiuser

EXPOSE 5001

ENV NODE_ENV=production \
    PORT=5001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5001/health || exit 1

CMD ["node", "dist/index.js"]
