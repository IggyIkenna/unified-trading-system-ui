#!/usr/bin/env bash
# DEPRECATED 2026-05-08 — wrapper to canonical deployment-service Cloud Run script.
#
# Per CLAUDE.md "VM launcher script SSOT (codified 2026-05-07)" + 2026-05-08
# operator direction "VM + Cloud Run stuff in one place". Logic now lives in:
#   deployment-service/scripts/cloud-run/deploy-ui.sh
#
# Edit the canonical script for any logic changes; this wrapper is a
# 1-line pass-through preserving operator workflow.
set -euo pipefail
WORKSPACE="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CANONICAL="${WORKSPACE}/deployment-service/scripts/cloud-run/deploy-ui.sh"
echo "[migrated 2026-05-08] redirecting to canonical: ${CANONICAL}"
exec bash "${CANONICAL}" "$@"
