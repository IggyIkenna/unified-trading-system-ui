#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# load-dev-secrets.sh — pull local-dev secrets from GCS Secret Manager.
#
# Usage:
#   source scripts/load-dev-secrets.sh
#
# For each entry in DEV_SECRETS, fetches the latest version from Secret Manager
# (project DEV_SECRETS_PROJECT_ID) and exports it as an env var of the same
# name, so the running process sees `process.env.<NAME>` exactly as Cloud Run
# prod does (where the same secret is mounted via secretKeyRef).
#
# Single source of truth: a secret lives in GSM, is referenced by Cloud Run
# prod via secretKeyRef, and is pulled here for local dev. No .env.local
# duplication — keeps prod / local from drifting out of sync.
#
# Behaviour:
#   - If a secret is already exported in the calling shell, that value wins
#     (developers can override locally without editing this file).
#   - Failures are logged but don't abort dev startup — set DEV_SECRETS_STRICT=1
#     to make missing secrets fatal.
#   - DEV_SECRETS_SKIP=1 short-circuits the whole loader (offline work, etc.).
#
# Adding a new secret:
#   1. Create it in GSM:   gcloud secrets create <NAME> --project=<project>
#   2. Append to DEV_SECRETS below.
#   3. Reference it from Cloud Run via --set-secrets so prod stays aligned.
# ─────────────────────────────────────────────────────────────────────────────

# Default project. Override per-shell with `DEV_SECRETS_PROJECT_ID=… source ...`.
: "${DEV_SECRETS_PROJECT_ID:=central-element-323112}"

# Manifest. Each entry MUST be the GSM secret name AND the env var name the
# app code reads — keep them identical so the Cloud Run secretKeyRef pattern
# (`name: <NAME>` → `secretKeyRef.name: <NAME>`) stays trivial.
DEV_SECRETS=(
  RESEND_API_KEY
)

__dev_secrets_log() {
  # Single prefix for grep-ability. Routed to stderr so a `source` doesn't
  # pollute any subshell that captures stdout.
  echo "[dev-secrets] $*" >&2
}

__dev_secrets_check_gcloud() {
  if ! command -v gcloud >/dev/null 2>&1; then
    __dev_secrets_log "gcloud CLI not found — install via 'brew install --cask gcloud-cli' or set DEV_SECRETS_SKIP=1"
    return 1
  fi
  if ! gcloud auth print-access-token >/dev/null 2>&1; then
    __dev_secrets_log "not authenticated — run 'gcloud auth login' first"
    return 1
  fi
  return 0
}

__dev_secrets_load_one() {
  local name="$1"
  if [[ -n "${!name:-}" ]]; then
    __dev_secrets_log "$name already set in shell, keeping local value"
    return 0
  fi
  local value
  if ! value=$(gcloud secrets versions access latest \
      --secret="$name" \
      --project="$DEV_SECRETS_PROJECT_ID" 2>/dev/null); then
    __dev_secrets_log "failed to fetch $name from project $DEV_SECRETS_PROJECT_ID"
    if [[ "${DEV_SECRETS_STRICT:-}" == "1" ]]; then
      return 1
    fi
    return 0
  fi
  export "$name"="$value"
  __dev_secrets_log "$name loaded from Secret Manager"
}

if [[ "${DEV_SECRETS_SKIP:-}" == "1" ]]; then
  __dev_secrets_log "DEV_SECRETS_SKIP=1 — using shell env only, no GSM fetch"
elif __dev_secrets_check_gcloud; then
  for __ds_name in "${DEV_SECRETS[@]}"; do
    __dev_secrets_load_one "$__ds_name" || {
      __dev_secrets_log "strict mode aborted on $__ds_name"
      return 1 2>/dev/null || exit 1
    }
  done
  unset __ds_name
fi
