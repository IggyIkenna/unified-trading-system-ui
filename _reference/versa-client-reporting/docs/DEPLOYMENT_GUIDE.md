# Deployment Guide

## Prerequisites

- Node.js >= 18
- npm >= 9 (or compatible)
- Access to the GCS bucket used for static hosting
- Okta application credentials (or Google OAuth client ID) for the target environment

## Build

```bash
npm install
npm run build        # runs tsc then vite build; output goes to dist/
```

Verify locally before deploying:

```bash
npm run preview      # serves dist/ on http://localhost:4173
```

## Environment Variables

Copy `.env.example` to `.env` and populate:

| Variable              | Description                                                    |
| --------------------- | -------------------------------------------------------------- |
| `VITE_API_BASE_URL`   | Base URL of the reporting backend                              |
| `VITE_OKTA_ISSUER`    | Okta OIDC issuer URL                                           |
| `VITE_OKTA_CLIENT_ID` | Okta application client ID                                     |
| `GH_PAT`              | GitHub PAT for CI quality-gate access (CI secret, not bundled) |

All `VITE_*` variables are inlined at build time by Vite. Never place secrets in `VITE_*` vars.

## Deployment

The app is deployed as a GCS static site served via Cloud CDN:

```bash
# Build
npm run build

# Upload dist/ to GCS
gsutil -m rsync -r -d dist/ gs://{project_id}-client-reporting-ui/

# Immutable cache for hashed assets
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000, immutable" \
  "gs://{project_id}-client-reporting-ui/assets/**"

# Short cache for index.html
gsutil setmeta -h "Cache-Control:public, max-age=60" \
  "gs://{project_id}-client-reporting-ui/index.html"
```

CI deploys on merge to `main` via `.github/workflows/quality-gates.yml`.

## Health Check

The SPA has no server process to probe. Confirm the CDN origin is serving:

```bash
curl -I https://reporting.{project_id}.example.com/
# Expect: HTTP/2 200
```

The backend reporting API exposes its own `/health` endpoint, checked separately.
