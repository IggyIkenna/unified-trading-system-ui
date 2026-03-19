#!/usr/bin/env bash
#
# setup-cloud-infra.sh — Master cloud infrastructure orchestrator
#
# Routes to the appropriate cloud-specific scripts based on --cloud gcp|aws.
# Each component script handles both GCP and AWS via its own --cloud flag.
#
# Usage:
#   GCP_PROJECT_ID=central-element-323112 ./setup-cloud-infra.sh [options]
#   AWS_REGION=ap-northeast-1 ./setup-cloud-infra.sh --cloud aws [options]
#
# Options:
#   --cloud gcp|aws           Cloud provider (default: gcp)
#   --component COMPONENT     Which component to set up (default: all)
#                             Choices: all messaging cache database registry billing
#   --dry-run                 Pass --dry-run to each sub-script
#
# Components:
#   messaging   Pub/Sub (GCP) / SNS+SQS (AWS)
#   cache       Memorystore Redis (GCP) / ElastiCache (AWS)
#   database    Cloud SQL PostgreSQL (GCP) / RDS (AWS)
#   registry    Artifact Registry (GCP) / ECR+CodeArtifact (AWS)
#   billing     Budget alerts (GCP) / Cost Explorer (AWS)
#
# AWS requirements (set before running):
#   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION
#   AWS_ACCOUNT_ID  — used to construct ECR URIs
#
# GCP requirements:
#   GCP_PROJECT_ID, authenticated via gcloud auth application-default login
#

set -euo pipefail

CLOUD="gcp"
COMPONENT="all"
DRY_RUN=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --cloud) CLOUD="$2"; shift 2 ;;
        --component) COMPONENT="$2"; shift 2 ;;
        --dry-run) DRY_RUN="--dry-run"; shift ;;
        *) shift ;;
    esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log_section() { echo -e "\n${BLUE}══════════════════════════════════════════${NC}"; echo -e "${BLUE}$1${NC}"; echo -e "${BLUE}══════════════════════════════════════════${NC}"; }
log_ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_fail() { echo -e "${RED}[FAIL]${NC} $1"; }

echo "================================================="
echo "Unified Trading System — Cloud Infrastructure Setup"
echo "================================================="
echo "Cloud:     $CLOUD"
echo "Component: $COMPONENT"
echo "Dry-run:   ${DRY_RUN:-false}"
echo "================================================="
echo

run_component() {
    local name="$1"
    local script="$2"
    shift 2

    log_section "$name ($CLOUD)"
    if [[ -f "$script" ]]; then
        # shellcheck disable=SC2086
        bash "$script" --cloud "$CLOUD" $DRY_RUN "$@" && log_ok "$name done" || log_warn "$name completed with warnings"
    else
        log_warn "Script not found: $script (skipping)"
    fi
}

case "$COMPONENT" in
    all)
        run_component "Messaging (Pub/Sub / SNS+SQS)"  "${SCRIPT_DIR}/setup-pubsub.sh"
        run_component "Cache (Memorystore / ElastiCache)" "${SCRIPT_DIR}/setup-redis.sh"
        run_component "Database (Cloud SQL / RDS)"     "${SCRIPT_DIR}/setup-cloudsql.sh"
        run_component "Registry (AR / ECR)"            "${SCRIPT_DIR}/setup-registry.sh"
        run_component "Billing (Budgets / Cost Explorer)" "${SCRIPT_DIR}/setup-billing-alerts.sh"
        ;;
    messaging) run_component "Messaging"  "${SCRIPT_DIR}/setup-pubsub.sh" ;;
    cache)     run_component "Cache"      "${SCRIPT_DIR}/setup-redis.sh" ;;
    database)  run_component "Database"   "${SCRIPT_DIR}/setup-cloudsql.sh" ;;
    registry)  run_component "Registry"   "${SCRIPT_DIR}/setup-registry.sh" ;;
    billing)   run_component "Billing"    "${SCRIPT_DIR}/setup-billing-alerts.sh" ;;
    *)
        log_fail "Unknown component: $COMPONENT"
        echo "Valid: all messaging cache database registry billing"
        exit 1
        ;;
esac

echo ""
echo "================================================="
echo "Cloud infrastructure setup complete ($CLOUD)"
echo "================================================="
