# Multi-stage build for deployment-ui
#
# Stage 1: Node.js builder — install deps (including local @unified-admin/core), build Vite SPA
# Stage 2: Nginx runtime — serve static dist/ (lean; no node/npm in production)
#
# Quality gates (typecheck + lint + vitest) run in buildspec.aws.yaml / cloudbuild.yaml BEFORE
# this build. The Dockerfile is intentionally QG-free to keep the runtime image lean.
#
# Local dep: @unified-admin/core is resolved from ../unified-admin-ui/packages/core
# Cloud Build must pass the core package directory via build context or --build-context.

FROM node:20-alpine AS builder

WORKDIR /app

# Copy local dependency first (package.json references file:../unified-admin-ui/packages/core)
COPY unified-admin-ui/packages/core /unified-admin-ui/packages/core

# Install dependencies (layer caching: package files before source)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ── Production: nginx serving static files ───────────────────────────────────
FROM nginx:alpine AS prod

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
