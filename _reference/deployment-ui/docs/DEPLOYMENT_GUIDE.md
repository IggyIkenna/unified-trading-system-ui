# deployment-ui — Deployment Guide

## Build

```bash
cd deployment-ui
npm ci
npm run build   # outputs to dist/
```

## Container

```
asia-northeast1-docker.pkg.dev/{project_id}/trading/deployment-ui:latest
```

Served by Nginx. Nginx config routes all paths to `index.html` for SPA.

## Cloud Run Deployment

```bash
gcloud run deploy deployment-ui \
  --image asia-northeast1-docker.pkg.dev/{project_id}/trading/deployment-ui:latest \
  --region asia-northeast1 \
  --set-env-vars VITE_DEPLOYMENT_API_URL=https://deployment-api-xxx.run.app \
  --set-env-vars VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com \
  --allow-unauthenticated
```

## Environment Variables (Build-Time)

| Variable                  | Default                 | Description                |
| ------------------------- | ----------------------- | -------------------------- |
| `VITE_DEPLOYMENT_API_URL` | `http://localhost:8004` | deployment-api base URL    |
| `VITE_GOOGLE_CLIENT_ID`   | —                       | Google OAuth 2.0 client ID |

## Google OAuth Setup

1. Create OAuth 2.0 client: GCP Console → APIs → Credentials
2. Authorized origins: `https://deployment-ui-xxx.run.app`
3. Authorized redirect URIs: `https://deployment-ui-xxx.run.app/auth/callback`

## Access Control

This UI triggers live deployments. Restrict access via:

- IAP (Cloud Identity-Aware Proxy) for network-level restriction
- App-level: `deployment-api` enforces role-based auth on all mutating endpoints
- Recommended: restrict Cloud Run ingress to internal + load balancer only
