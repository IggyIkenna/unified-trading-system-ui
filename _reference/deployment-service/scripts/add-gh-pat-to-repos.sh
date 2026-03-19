#!/usr/bin/env bash
#
# Add GH_PAT secret to all Unified Trading System repos.
#
# Prerequisites:
#   - gh CLI installed and authenticated (gh auth login)
#   - Token with repo scope (for private repo access)
#
# Usage:
#   ./scripts/add-gh-pat-to-repos.sh              # Add GH_PAT from gh auth token
#   ./scripts/add-gh-pat-to-repos.sh --dry-run    # List repos only, no changes
#
# The script uses your current gh auth token. To use a different token:
#   GH_PAT=your_token ./scripts/add-gh-pat-to-repos.sh
#
set -e

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
  client-reporting-api
  client-reporting-ui
  deployment-api
  deployment-service
  execution-algo-library
  execution-results-api
  execution-services
  features-calendar-service
  features-cross-instrument-service
  features-delta-one-service
  features-multi-timeframe-service
  features-onchain-service
  features-sports-service
  features-volatility-service
  ibkr-gateway-infra
  instruments-service
  live-health-monitor-ui
  logs-dashboard-ui
  market-data-api
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
  sports-betting-services
  strategy-service
  strategy-ui
  system-integration-tests
  trading-analytics-ui
  unified-api-contracts
  unified-cloud-interface
  unified-config-interface
  unified-defi-execution-interface
  unified-domain-client
  unified-events-interface
  unified-feature-calculator-library
  unified-feed-interface
  unified-internal-contracts
  unified-market-interface
  unified-ml-interface
  unified-position-interface
  unified-reference-data-interface
  unified-sports-execution-interface
  unified-trade-execution-interface
  unified-trading-codex
  unified-trading-deployment
  unified-trading-deployment-v2
  unified-trading-library
  unified-trading-pm
  unified-trading-ui-auth
)

echo "Unified Trading System repos (${#REPOS[@]} total):"
for repo in "${REPOS[@]}"; do
  echo "  - $GH_ORG/$repo"
done
echo ""

if [[ "$DRY_RUN" == "true" ]]; then
  echo "Dry run - no changes made. Run without --dry-run to add GH_PAT."
  exit 0
fi

# Get token: prefer GH_PAT env, else gh auth token
if [[ -n "${GH_PAT:-}" ]]; then
  TOKEN="$GH_PAT"
  echo "Using GH_PAT from environment"
else
  if ! command -v gh &>/dev/null; then
    echo "Error: gh CLI not found. Install: brew install gh"
    exit 1
  fi
  if ! gh auth status &>/dev/null; then
    echo "Error: gh not authenticated. Run: gh auth login"
    exit 1
  fi
  TOKEN=$(gh auth token)
  echo "Using token from gh auth"
fi

echo ""
echo "Adding GH_PAT secret to ${#REPOS[@]} repos..."
echo ""

FAILED=0
for repo in "${REPOS[@]}"; do
  full_repo="$GH_ORG/$repo"
  if echo "$TOKEN" | gh secret set GH_PAT --repo "$full_repo" 2>/dev/null; then
    echo "  ✅ $full_repo"
  else
    echo "  ❌ $full_repo (check repo exists and you have admin access)"
    FAILED=$((FAILED + 1))
  fi
done

echo ""
if [[ $FAILED -gt 0 ]]; then
  echo "⚠️  $FAILED repo(s) failed. Add GH_PAT manually:"
  echo "   Settings → Secrets and variables → Actions → New repository secret"
  exit 1
else
  echo "✅ GH_PAT added to all ${#REPOS[@]} repos"
fi
