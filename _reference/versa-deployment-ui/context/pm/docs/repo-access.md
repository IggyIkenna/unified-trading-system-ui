# Repo Access Reference

Reference for granting GitHub repo access. Access is managed on GitHub (per-repo or via organization teams).

## Principals to grant access

| Principal        | Type         |
| ---------------- | ------------ |
| **datadodo**     | User or team |
| **CosmicTrader** | User or team |

## Repositories (11)

Grant **datadodo** and **CosmicTrader** access to these repos:

| #   | Repo                             | GitHub URL                                                     |
| --- | -------------------------------- | -------------------------------------------------------------- |
| 1   | alerting-service                 | https://github.com/IggyIkenna/alerting-service                 |
| 2   | deployment-api                   | https://github.com/IggyIkenna/deployment-api                   |
| 3   | deployment-service               | https://github.com/IggyIkenna/deployment-service               |
| 4   | execution-analytics-ui           | https://github.com/IggyIkenna/execution-analytics-ui           |
| 5   | execution-analytics-ui           | https://github.com/IggyIkenna/execution-analytics-ui           |
| 6   | features-multi-timeframe-service | https://github.com/IggyIkenna/features-multi-timeframe-service |
| 7   | ml-training-ui                   | https://github.com/IggyIkenna/ml-training-ui                   |
| 8   | system-integration-tests         | https://github.com/IggyIkenna/system-integration-tests         |
| 9   | unified-api-contracts            | https://github.com/IggyIkenna/unified-api-contracts            |
| 10  | unified-cloud-interface          | https://github.com/IggyIkenna/unified-cloud-interface          |
| 11  | unified-trading-ui-auth          | https://github.com/IggyIkenna/unified-trading-ui-auth          |

_Note: `unified-cloud-interface`, `deployment-api`, `system-integration-tests`, `execution-analytics-ui`, and
`ml-training-ui` may not have `github_url` in `workspace-manifest.json`; URLs above use the same owner. Adjust if your
org or repo names differ._

## How to grant access (GitHub)

### Per-repo (Collaborators)

1. Open the repo URL (e.g. `https://github.com/IggyIkenna/alerting-service`).
2. **Settings** → **Collaborators and teams** (or **Collaborators** for personal repos).
3. **Add people** → enter `datadodo` → choose role (Read / Write / Admin) → **Add**.
4. Repeat for `CosmicTrader`.
5. Repeat for all 11 repos.

### Via GitHub Organization (recommended if you use an org)

1. Create a team (e.g. **Unified Trading – Dev**).
2. Add **datadodo** and **CosmicTrader** to that team.
3. Grant the team access to the 11 repos (Repository access → Add repositories → select all 11 → choose role).

### Script (recommended)

From the `unified-trading-pm` repo root:

```bash
# Write access (read + push) for both datadodo and CosmicTrader — default
bash scripts/repo-management/add-repo-collaborators.sh

# Read-only for both
bash scripts/repo-management/add-repo-collaborators.sh --read

# Preview only (no API calls)
bash scripts/repo-management/add-repo-collaborators.sh --dry-run

# Different owner (e.g. org)
GITHUB_OWNER=MyOrg bash scripts/repo-management/add-repo-collaborators.sh
```

Requires: `gh` CLI installed and authenticated (`gh auth login`). The script uses the GitHub API to add collaborators;
users receive an invite email if they don’t already have access.
