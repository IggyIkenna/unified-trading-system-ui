# Secret Rotation Policy

## Rotation Schedule

| Secret Name                   | Type                      | Scope                                           | Rotation Period | Expiry Monitoring             |
| ----------------------------- | ------------------------- | ----------------------------------------------- | --------------- | ----------------------------- |
| `GH_PAT`                      | GitHub PAT (fine-grained) | All repos (cross-repo dispatch, PR creation)    | 90 days         | `secret-health-check.yml`     |
| `GCP_SA_KEY`                  | GCP Service Account Key   | Deployment workflows                            | 90 days         | GCP IAM key listing           |
| `ANTHROPIC_API_KEY_SYSHEALTH` | Anthropic API Key         | Agent workflows (overnight orchestrator, audit) | 90 days         | Agent workflow failure alerts |
| `TELEGRAM_BOT_TOKEN`          | Telegram Bot API Token    | Alert notifications                             | 180 days        | Dead man switch workflow      |
| `TELEGRAM_CHAT_ID`            | Telegram Chat ID          | Alert routing (repo variable, not secret)       | N/A (stable)    | N/A                           |

## Expiry Monitoring

The `secret-health-check.yml` workflow runs weekly (every Monday 06:00 UTC) and validates:

- **GH_PAT**: Calls `gh api user` -- 401 means expired or revoked
- **Workflow status**: If agent workflows fail with auth errors, the Telegram alert chain fires

All monitoring is non-destructive (read-only API calls). Secret values are never logged.

### Alert Chain on Expiry

1. `secret-health-check.yml` detects invalid secret
2. Telegram alert sent via `telegram-helpers.sh`
3. If Telegram itself is broken (TELEGRAM_BOT_TOKEN expired), GitHub Issue fallback via `notify_critical()`

## Rotation Procedures

### GH_PAT (GitHub Personal Access Token)

1. Go to GitHub Settings > Developer Settings > Personal Access Tokens > Fine-grained tokens
2. Create new token with scopes: `repo`, `workflow`, `admin:org` (read)
3. Update the secret across all manifest repos:
   ```bash
   REPOS=$(python3 -c "import json; m=json.load(open('workspace-manifest.json')); print('\n'.join(m['repositories'].keys()))")
   for repo in $REPOS; do
     gh secret set GH_PAT --repo "IggyIkenna/$repo" --body "$NEW_TOKEN"
   done
   gh secret set GH_PAT --repo "IggyIkenna/unified-trading-pm" --body "$NEW_TOKEN"
   ```
4. Verify: `gh api user` returns your user info
5. Revoke the old token in GitHub Settings

### GCP_SA_KEY (Service Account Key)

1. Create new key:
   ```bash
   gcloud iam service-accounts keys create key.json --iam-account=<SA_EMAIL>
   ```
2. Base64 encode and set:
   ```bash
   gh secret set GCP_SA_KEY --repo "IggyIkenna/<repo>" --body "$(base64 -i key.json | tr -d '\n')"
   ```
3. Verify a deployment workflow runs successfully
4. Delete old key:
   ```bash
   gcloud iam service-accounts keys delete <OLD_KEY_ID> --iam-account=<SA_EMAIL>
   ```
5. Securely delete local key file: `rm -f key.json`

### ANTHROPIC_API_KEY_SYSHEALTH

1. Generate new API key from Anthropic Console
2. Update: `gh secret set ANTHROPIC_API_KEY_SYSHEALTH --repo "IggyIkenna/unified-trading-pm" --body "$NEW_KEY"`
3. Verify: trigger a manual overnight orchestrator run; confirm agent steps work
4. Revoke old key in Anthropic Console

### TELEGRAM_BOT_TOKEN

1. Message @BotFather on Telegram: `/revoke` then `/token` to get a new token
2. Update: `gh secret set TELEGRAM_BOT_TOKEN --repo "IggyIkenna/unified-trading-pm" --body "$NEW_TOKEN"`
3. Verify: trigger dead-man-switch workflow manually; confirm Telegram message received
4. Old token is automatically revoked by BotFather

## Recovery Runbook

### Scenario: Secret expired and was not rotated in time

1. **Immediate**: Identify which workflows are failing (check GHA logs)
2. **Mitigate**: Rotate the expired secret using procedures above
3. **Verify**: Re-run the failed workflow; confirm it passes
4. **Post-mortem**: Check why expiry monitoring did not alert in time; update `secret-health-check.yml` if needed

### Scenario: Secret leaked (exposed in logs or public repo)

1. **Immediate**: Revoke the compromised secret within 5 minutes
2. **Replace**: Generate a new secret and deploy using procedures above
3. **Audit**: Check GHA logs and repo history for the exposure source
4. **Harden**: Ensure `add-mask` is used for all secret references in workflows; review `GITHUB_TOKEN` permissions

### Scenario: Telegram alerting is down

1. GitHub Issue fallback (`notify_critical()` in `telegram-helpers.sh`) creates an issue automatically
2. Check TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID values
3. Test with: `curl -s "https://api.telegram.org/bot${TOKEN}/getMe"` -- should return bot info
4. If CHAT_ID wrong: message the bot, then check `getUpdates` for the correct chat ID
