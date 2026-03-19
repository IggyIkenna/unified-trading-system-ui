# Deployment API — GCS Paths

## Bucket Pattern

State bucket from STATE_BUCKET config. Deployment state stored in GCS.

## Path Templates

- Deployment state: `{bucket}/deployment/state/`
- Data status queries: via deployment-service path logic
