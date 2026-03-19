# Deployment Guide

## Build

```bash
npm install
npm run build
```

Output: `dist/` (static assets: HTML, JS, CSS).

## Environment Variables

| Variable              | Required   | Description                                                               |
| --------------------- | ---------- | ------------------------------------------------------------------------- |
| `VITE_SKIP_AUTH`      | No         | Set to `true` to bypass Okta (local/dev). Omit or `false` for production. |
| `VITE_OKTA_ISSUER`    | Yes (prod) | Okta issuer URL (e.g. `https://{tenant}.okta.com/oauth2/default`)         |
| `VITE_OKTA_CLIENT_ID` | Yes (prod) | Okta application client ID                                                |

Use `{project_id}` placeholders in configs; never hardcode project IDs or bucket names.

## Deployment Target: GCS Static CDN

Deployment model: `gcs_static_cdn` — static files served from a GCS bucket behind a CDN.

### Steps

1. Build: `npm run build`
2. Upload `dist/` to the configured GCS bucket (path per deployment config).
3. Ensure bucket has public read or CDN cache configured per security policy.
4. CDN origin points to the bucket; users hit CDN URL.

### CI/CD

Use Cloud Build or equivalent to:

- Run `npm run build`
- Upload `dist/*` to `gs://{bucket}/batch-audit-ui/` (or configured path)
- Invalidate CDN cache if applicable

## Local Preview

```bash
npm run preview
```

Serves `dist/` locally (default port 4173). For dev with HMR:

```bash
npm run dev
```

## Health / Readiness

Static SPA has no server-side health endpoint. CDN/bucket availability implies app availability.
