# Multi-stage build for Next.js 16 on Cloud Run (pnpm)
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install ALL dependencies (needed for build)
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Build the app
FROM base AS builder
WORKDIR /app
ARG BUILD_ENV_FILE=config/docker-build.env.production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# `.env.production` is gitignored; Next inlines NEXT_PUBLIC_* at build time. Pick SSOT file per image:
#   --build-arg BUILD_ENV_FILE=config/docker-build.env.production   (default)
#   --build-arg BUILD_ENV_FILE=config/docker-build.env.staging      (staging / demo)
COPY ${BUILD_ENV_FILE} ./.env.production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN pnpm build

# Production deps only (smaller than full node_modules)
FROM base AS proddeps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Production runner — minimal image
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=proddeps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs

RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node_modules/.bin/next", "start", "-p", "3000"]
