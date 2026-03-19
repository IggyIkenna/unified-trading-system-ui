#!/usr/bin/env bash
#
# Add collaborators with write (push) permission to all Unified Trading System repos.
#
# Adds: datadodo, cosmictrader (push permission)
#
# Prerequisites:
#   - gh CLI installed and authenticated (gh auth login)
#   - Admin access to IggyIkenna org repos
#
# Usage:
#   ./scripts/add-collaborators.sh              # Add collaborators to all repos
#   ./scripts/add-collaborators.sh --dry-run    # List what would be done, no changes
#
set -eo pipefail

GH_ORG="${GH_ORG:-IggyIkenna}"
DRY_RUN=false

if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
fi

# Collaborators to add with push (write) permission
COLLABORATORS=(
  datadodo
  cosmictrader
)

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

echo "Collaborators to add: ${COLLABORATORS[*]}"
echo "Permission: push (write)"
echo "Repos: ${#REPOS[@]} total"
echo ""

if [[ "$DRY_RUN" == "true" ]]; then
  echo "Dry run - no changes made."
  for repo in "${REPOS[@]}"; do
    for collab in "${COLLABORATORS[@]}"; do
      echo "  Would add $collab to $GH_ORG/$repo with push permission"
    done
  done
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
SUCCESS=0

for repo in "${REPOS[@]}"; do
  full_repo="$GH_ORG/$repo"
  echo "--- $full_repo ---"
  for collab in "${COLLABORATORS[@]}"; do
    if gh api "repos/$full_repo/collaborators/$collab" \
         --method PUT \
         --field permission=push \
         --silent 2>/dev/null; then
      echo "  ✅ $collab added with push permission"
      SUCCESS=$((SUCCESS + 1))
    else
      echo "  ❌ Failed to add $collab to $full_repo (skipping)"
      FAILED=$((FAILED + 1))
    fi
  done
done

echo ""
echo "Results: $SUCCESS collaborator additions succeeded, $FAILED failed"

if [[ $FAILED -gt 0 ]]; then
  echo "⚠️  Some additions failed. Check repo existence and admin access."
  exit 1
fi
