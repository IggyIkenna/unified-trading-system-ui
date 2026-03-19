# Deployment Service — Architecture

## Overview

Deployment service is the orchestration engine for deploying and managing trading system services. It provides CLI (`deploy-shards`), config loading, shard calculation, and Cloud Build integration.

## Key Components

- **Config Loader**: Loads YAML configs from configs/ directory
- **Shard Calculator**: Computes deployment shards from config
- **Orchestrator**: Runs deployments via Cloud Build
- **Runtime Topology**: SSOT in configs/runtime-topology.yaml

## Data Flows

Configs → ConfigLoader → ShardCalculator → Orchestrator → Cloud Build API
