# Deployment API — Architecture

## Overview

Deployment API is the FastAPI service that serves the deployment dashboard. It depends on deployment-service for orchestration logic, config loading, and shard calculation.

## Key Components

- **FastAPI app**: Routes for deployments, data status, builds, config
- **deployment-service**: Library dependency for DeploymentOrchestrator, ConfigLoader, ShardCalculator
- **Config symlink**: configs/ -> ../deployment-service/configs/
