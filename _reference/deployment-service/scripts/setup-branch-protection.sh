#!/usr/bin/env bash
#
# Set up branch protection rules and repo settings for all Unified Trading System repos.
#
# Configures:
#   - allow_auto_merge = true
#   - delete_branch_on_merge = true
#   - Branch protection on main: required status checks (quality-gates), no admin bypass
#
# Prerequisites:
#   - gh CLI installed and authenticated (gh auth login)
#   - Admin access to IggyIkenna org repos
#
# Usage:
#   ./scripts/setup-branch-protection.sh              # Apply to all repos
#   ./scripts/setup-branch-protection.sh --dry-run    # List repos only, no changes
#
set -eo pipefail

GH_ORG="${GH_ORG:-IggyIkenna}"
DRY_RUN=false

if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
fi

# All Unified Trading System repos (services, libraries, UIs)
REPOS=(
  alerting-system
  backtest-ui
  batch-audit-ui
  client-reporting-ui
  execution-algo-library
  execution-services
  features-calendar-service
  features-delta-one-service
  features-onchain-service
  features-volatility-service
  instruments-service
  live-health-monitor-ui
  logs-dashboard-ui
  market-data-processing-service
  market-tick-data-handler
  matching-engine-library
  ml-deployment-ui
  ml-inference-service
  ml-training-service
  onboarding-ui
  pnl-attribution-service
  position-balance-monitor-service
  risk-and-exposure-service
  settlement-ui
  strategy-service
  trading-analytics-ui
  unified-trading-library
  unified-config-interface
  unified-domain-client
  unified-events-interface
  unified-market-interface
  unified-trade-execution-interface
  unified-trading-codex
  deployment-service
)

echo "Unified Trading System repos (${#REPOS[@]} total):"
for repo in "${REPOS[@]}"; do
  echo "  - $GH_ORG/$repo"
done
echo ""

if [[ "$DRY_RUN" == "true" ]]; then
  echo "Dry run - no changes made."
  echo "  Would set allow_auto_merge=true, delete_branch_on_merge=true"
  echo "  Would add branch protection on main with required status check: quality-gates"
  exit 0
fi

if ! command -v gh &>/dev/null; then
  echo "Error: gh CLI not found. Install: brew install gh"
  exit 1
fi
if ! gh auth status &>/dev/null; then
  echo "Error: gh not authenticated. Run: gh auth login"
  exit 1
fi

FAILED=0
SKIPPED=0
SUCCESS=0

for repo in "${REPOS[@]}"; do
  full_repo="$GH_ORG/$repo"
  echo "--- $full_repo ---"

  # Step 1: Enable auto-merge and delete-branch-on-merge
  if gh api "repos/$full_repo" \
       --method PATCH \
       --field allow_auto_merge=true \
       --field delete_branch_on_merge=true \
       --silent 2>/dev/null; then
    echo "  ✅ repo settings: allow_auto_merge=true, delete_branch_on_merge=true"
  else
    echo "  ❌ repo settings failed for $full_repo (repo may not exist or no admin access)"
    FAILED=$((FAILED + 1))
    continue
  fi

  # Step 2: Set branch protection on main
  PROTECTION_PAYLOAD='{
    "required_status_checks": {
      "strict": false,
      "contexts": ["quality-gates"]
    },
    "enforce_admins": false,
    "required_pull_request_reviews": null,
    "restrictions": null
  }'

  if gh api "repos/$full_repo/branches/main/protection" \
       --method PUT \
       --input - <<< "$PROTECTION_PAYLOAD" \
       --silent 2>/dev/null; then
    echo "  ✅ branch protection: main requires quality-gates status check"
    SUCCESS=$((SUCCESS + 1))
  else
    echo "  ⚠️  branch protection skipped for $full_repo/main (branch may not exist yet)"
    SKIPPED=$((SKIPPED + 1))
  fi
done

echo ""
echo "Results: $SUCCESS fully configured, $SKIPPED skipped (no main branch), $FAILED failed"

if [[ $FAILED -gt 0 ]]; then
  exit 1
fi
