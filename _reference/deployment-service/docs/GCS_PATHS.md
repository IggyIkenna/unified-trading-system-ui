# Deployment Service — GCS Paths

## Bucket Pattern

State and build artifacts use GCS. Bucket from config or STATE_BUCKET env.

## Path Templates

- Deployment state: `{bucket}/deployment/state/`
- Build logs: via Cloud Build API

Variables: `{bucket}` from config.
