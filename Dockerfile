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
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Firebase config must be available at build time for Next.js NEXT_PUBLIC_* inlining
ENV NEXT_PUBLIC_AUTH_PROVIDER=firebase
ENV NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAd6_p1UIGPY2Va5yGzLOR4DyxyHJ8QCzo
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=central-element-323112.firebaseapp.com
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=central-element-323112
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=central-element-323112.appspot.com
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1060025368044
ENV NEXT_PUBLIC_FIREBASE_APP_ID=1:1060025368044:web:95b700e83573c9a05a94c9
ENV NEXT_PUBLIC_USER_MGMT_API_URL=https://user-management-api-1060025368044.us-central1.run.app
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
