# Deployment API — Deployment Guide

## Overview

Deployment API is the backend for the deployment UI. Deploy as Cloud Run service.

## Prerequisites

- GCP project, deployment-service as dependency
- GCP_PROJECT_ID, STATE_BUCKET, REDIS_URL (if using cache)

## Deployment Steps

```bash
gcloud builds submit --tag gcr.io/{project_id}/deployment-api:latest
gcloud run deploy deployment-api \
  --image gcr.io/{project_id}/deployment-api:latest \
  --region {region} \
  --set-env-vars GCP_PROJECT_ID={project_id}
```

## Health Check

`GET /health`
