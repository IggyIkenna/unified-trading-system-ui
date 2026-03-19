# Agent API Key Tiers

Three-tier API key isolation for Claude-powered agents in the Unified Trading System. Each tier has a dedicated
Anthropic project key to prevent quota exhaustion in one tier from blocking another.

## Tier Map

| Tier      | Secret Name                   | Workflows                                                                                              | Priority                                         | Volume |
| --------- | ----------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------ | ------ |
| CICD      | `ANTHROPIC_API_KEY_CICD`      | conflict-resolution-agent, rules-alignment-agent, codex-sync-agent, semver-agent                       | Critical path — never rate-limited by batch work | Low    |
| SYSHEALTH | `ANTHROPIC_API_KEY_SYSHEALTH` | overnight-agent-orchestrator, agent-audit (all repos), claude-api-health-monitor, cassette-drift-check | Scheduled/batch — deferrable                     | High   |
| ANALYSIS  | `ANTHROPIC_API_KEY_ANALYSIS`  | _(future)_ trading-quality-agent, performance-analysis, scenario-analysis                              | Future — separate Anthropic project              | —      |

All workflows use `|| secrets.ANTHROPIC_API_KEY` fallback so the shared key keeps everything working while dedicated
keys are provisioned.

## Setup

Create dedicated Anthropic projects at console.anthropic.com and set secrets:

```bash
gh secret set ANTHROPIC_API_KEY_CICD --repo IggyIkenna/unified-trading-pm
gh secret set ANTHROPIC_API_KEY_SYSHEALTH --repo IggyIkenna/unified-trading-pm
# Propagate SYSHEALTH to all service repos (used by agent-audit.yml):
bash unified-trading-pm/scripts/propagation/propagate-github-secrets.sh \
  --secret ANTHROPIC_API_KEY_SYSHEALTH \
  --repos "$(cat workspace-manifest.json | python3 -c "import json,sys; print(' '.join(json.load(sys.stdin)['repositories'].keys()))")"
```

## Quota Budget

| Tier      | Recommended Monthly Budget | Notes                                 |
| --------- | -------------------------- | ------------------------------------- |
| CICD      | $20–50                     | Low volume, critical — never throttle |
| SYSHEALTH | $100–200                   | 65 repos × nightly × retries          |
| ANALYSIS  | $50–200                    | Future — PnL/scenario analysis        |

## Rotation

Rotate all keys every 90 days. On rotation:

1. Create new key in Anthropic console
2. `gh secret set ANTHROPIC_API_KEY_CICD --body "sk-ant-..."` (PM repo)
3. For SYSHEALTH: propagate to all 65 service repos
4. Verify overnight orchestrator runs successfully

## Error Classification

All agent workflows source `scripts/claude-helpers.sh` via `handle-claude-api-error` composite action. Error classes:

| Class        | HTTP                   | Action                             | Retry |
| ------------ | ---------------------- | ---------------------------------- | ----- |
| auth_error   | 401/403                | Rotate key immediately, no retry   | No    |
| rate_limited | 429/529                | Retry 3× with 15s/60s/300s backoff | Yes   |
| service_down | 503/connection refused | Graceful skip, no pipeline failure | No    |
| timeout      | job timeout            | TG alert with repo+branch, exit 1  | No    |
| unknown      | other                  | TG with stderr excerpt for triage  | No    |
