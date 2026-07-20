# ============================================================
# Music Service — Multi-stage Dockerfile
# ============================================================
# Audio streaming backend with music-metadata for tag extraction.
# Uses boot.js for Vault secrets.
# ============================================================

# ── Stage 1: Install dependencies ─────────────────────────────
FROM node:26-alpine AS deps
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN apk add --no-cache git
RUN --mount=type=ssh \
    --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile


# ── Stage 2: Build TypeScript ─────────────────────────────────
FROM deps AS build
WORKDIR /app
COPY . .
RUN pnpm run typecheck
# Prune devDependencies for the runtime image
RUN pnpm prune --prod

# ── Stage 3: Runtime ──────────────────────────────────────────
FROM node:26-alpine
WORKDIR /app

# Copy pre-built node_modules from deps stage
COPY --from=build /app/node_modules ./node_modules

# Copy application source
COPY --from=build /app/src ./src
COPY --from=build /app/package.json ./package.json

# Non-root user for security (docker-compose overrides with 1026:100 for NAS volume ACL)
RUN addgroup --system --gid 1001 music && \
    adduser --system --uid 1001 music
USER music

EXPOSE 5614

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 -O /dev/null http://127.0.0.1:5614/health || exit 1

CMD ["node", "src/boot.ts"]
