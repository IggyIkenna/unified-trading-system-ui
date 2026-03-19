# Deployment Service — Deployment Guide

## Overview

Deployment service runs as a CLI or is invoked by deployment-api. It does not run as a long-lived service; deployment-api orchestrates it.

## Prerequisites

- GCP project, Cloud Build API, Artifact Registry
- GCP_PROJECT_ID set
- Service account with Cloud Build and Storage roles

## Deployment

The deployment service is packaged and invoked by deployment-api. To run CLI locally:

```bash
deploy-shards --config-dir configs/ ...
```

## Via deployment-api

deployment-api depends on deployment-service. Deploy deployment-api; it uses deployment-service as a library.
