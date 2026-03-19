# versa-admin-ui — Odum Research Admin Panel

## What this is
Internal admin panel for Odum Research. Handles authentication and configuration for:
- Internal system management
- GCP, AWS, Slack integrations
- User/permission management
- System health and settings

## Stack
React 19 + TypeScript + Vite, npm workspaces monorepo (`packages/`)

## For Versa
Admin-facing UI — clean, functional over decorative. Consider:
- Consistent auth flows
- Integration status cards (GCP connected / AWS connected / Slack connected)
- Role-based access controls
- Dark mode option for internal tools

## Run
```bash
npm install && npm run dev
```
