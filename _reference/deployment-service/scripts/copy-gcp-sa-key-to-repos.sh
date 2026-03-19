#!/usr/bin/env bash
# Copy GCP_SA_KEY secret to all repos in workspace-manifest.json.
#
# Prerequisites:
#   - gh CLI installed and authenticated (gh auth login)
#   - GCP service account JSON key file
#   - jq installed
#
# Usage:
#   # Propagate to all manifest repos (62 repos):
#   ./scripts/copy-gcp-sa-key-to-repos.sh /path/to/github-actions-sa-key.json
#
#   # Single repo:
#   ./scripts/copy-gcp-sa-key-to-repos.sh /path/to/sa-key.json --repo my-repo
#
#   # Dry-run (shows what would be set):
#   ./scripts/copy-gcp-sa-key-to-repos.sh /path/to/sa-key.json --dry-run
#
# The service account must have:
#   - roles/storage.admin (GCS test buckets)
#   - roles/artifactregistry.reader (pip install from Artifact Registry)
#   - roles/run.admin (Cloud Run deployments)
#
# SA used: github-actions-deploy@central-element-323112.iam.gserviceaccount.com
# GCP Secret Manager: github-actions-sa-key (project: central-element-323112)
# To retrieve from SM: gcloud secrets versions access latest --secret=github-actions-sa-key

set -euo pipefail

KEY_FILE="${1:-}"
FILTER_REPO=""
DRY_RUN=false

shift || true
while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo) FILTER_REPO="$2"; shift 2 ;;
    --dry-run) DRY_RUN=true; shift ;;
    *) echo "Unknown flag: $1"; exit 1 ;;
  esac
done

if [[ -z "$KEY_FILE" || ! -f "$KEY_FILE" ]]; then
  echo "Usage: $0 /path/to/service-account-key.json [--repo <name>] [--dry-run]"
  echo ""
  echo "Retrieve key from GCP Secret Manager:"
  echo "  gcloud secrets versions access latest --secret=github-actions-sa-key > /tmp/github-actions-sa-key.json"
  echo "  $0 /tmp/github-actions-sa-key.json"
  exit 1
fi

# Resolve workspace root (this script lives in deployment-service/scripts/)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MANIFEST="${WORKSPACE_ROOT}/unified-trading-pm/workspace-manifest.json"

if [[ ! -f "$MANIFEST" ]]; then
  echo "ERROR: workspace-manifest.json not found at: $MANIFEST"
  exit 1
fi
if ! command -v jq &>/dev/null; then
  echo "ERROR: jq not found. Install: brew install jq"
  exit 1
fi

REPO_SLUGS=()
while IFS= read -r slug; do
  [[ -n "$slug" ]] && REPO_SLUGS+=("$slug")
done < <(
  jq -r '.repositories | to_entries[] | .value.github_url | ltrimstr("https://github.com/")' "$MANIFEST"
)

PASS=0; FAIL=0; SKIP=0

echo "================================================="
echo " GCP_SA_KEY Propagation"
echo "================================================="
echo "  Key file  : $KEY_FILE"
echo "  Repos     : ${#REPO_SLUGS[@]} (from workspace-manifest.json)"
echo "  Dry-run   : $DRY_RUN"
[[ -n "$FILTER_REPO" ]] && echo "  Filter    : $FILTER_REPO"
echo "================================================="
echo ""

for slug in "${REPO_SLUGS[@]}"; do
  repo_name="${slug##*/}"
  if [[ -n "$FILTER_REPO" && "$repo_name" != "$FILTER_REPO" ]]; then
    continue
  fi

  echo -n "  [$slug] "

  if [[ "$DRY_RUN" == true ]]; then
    echo "[DRY] would set GCP_SA_KEY"
    ((PASS++))
    continue
  fi

  if ! gh repo view "$slug" --json name -q '.name' &>/dev/null; then
    echo "[SKIP] repo not found on GitHub"
    ((SKIP++))
    continue
  fi

  if gh secret set GCP_SA_KEY --repo "$slug" < "$KEY_FILE" 2>/dev/null; then
    echo "[OK]"
    ((PASS++))
  else
    echo "[FAIL]"
    ((FAIL++))
  fi
done

echo ""
echo "================================================="
if [[ "$DRY_RUN" == true ]]; then
  echo " DRY-RUN complete — nothing changed"
else
  echo " Done: ${PASS} OK  |  ${FAIL} FAILED  |  ${SKIP} SKIPPED"
fi
echo "================================================="

[[ $FAIL -gt 0 ]] && exit 1 || exit 0
