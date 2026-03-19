# Architecture

## Overview

batch-audit-ui is a React/TypeScript monitoring UI for batch job audits, quality metrics, and data completeness. It is deployed as a static SPA via GCS + CDN and consumes backend APIs for audit data.

## Tech Stack

- **Framework:** React 18 + TypeScript
- **Build:** Vite 5
- **Auth:** Okta (optional; skippable via `VITE_SKIP_AUTH=true` for local/dev)
- **Deployment:** GCS static hosting (`gcs_static_cdn`)

## Components

| Component    | Purpose                                                                  |
| ------------ | ------------------------------------------------------------------------ |
| `App.tsx`    | Root component; wraps content in Okta `Security` when auth enabled       |
| `AppContent` | Main UI shell (heading, description, placeholder for future audit views) |
| `main.tsx`   | React entry; mounts `App` into `#root`                                   |

## Data Flow

1. **Auth:** When `VITE_SKIP_AUTH !== 'true'`, Okta handles OAuth flow and redirects to `/login/callback` before rendering app content.
2. **Static assets:** Vite bundles JS/CSS; served from GCS bucket via CDN.
3. **API consumption:** Future audit views will call unified-cloud-services (or equivalent) APIs for batch job status, quality metrics, and completeness data. No Python dependencies; UI is TypeScript-only per DAG.

## Mode Support

- **Batch:** Not applicable (UI observes batch jobs; does not run them)
- **Live:** Yes — real-time monitoring of batch job status and quality metrics

## Dependencies

- **Upstream:** unified-cloud-services (API layer)
- **Runtime:** No Python; TypeScript-only per `dag-enforcement.mdc`

## File Layout

```
batch-audit-ui/
├── src/
│   ├── App.tsx       # Root + Okta wrapper
│   ├── main.tsx      # Entry
│   └── vite-env.d.ts
├── tests/smoke/      # Playwright smoke tests
├── docs/             # Canonical docs (this file)
├── index.html
├── vite.config.ts
├── playwright.config.ts
└── package.json
```
