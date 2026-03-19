# Multi-stage build for unified-admin-ui
#
# Stage 1: Node.js builder — install deps, build Vite SPA
# Stage 2: Nginx runtime — serve static dist/ (lean; no node/npm in production)
#
# Quality gates (typecheck + lint + vitest) run in cloudbuild.yaml BEFORE this build.
# The Dockerfile is intentionally QG-free to keep the runtime image lean.

FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer caching)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ── Production: nginx serving static files ───────────────────────────────────
FROM nginx:alpine AS prod

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config if present, otherwise use default
COPY nginx.conf /etc/nginx/conf.d/default.conf 2>/dev/null || true

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
