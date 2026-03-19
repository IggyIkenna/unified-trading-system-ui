# Disaster Recovery -- RTO/RPO Targets

## Recovery Targets by Environment

| Environment     | RTO (Recovery Time) | RPO (Data Loss Tolerance) | Notes                                                                |
| --------------- | ------------------- | ------------------------- | -------------------------------------------------------------------- |
| **Production**  | < 30 minutes        | < 5 minutes               | Trading systems must resume within 30min; max 5min of data loss      |
| **Staging**     | < 1 hour            | < 1 hour                  | Staging can tolerate longer recovery; SIT re-validates after restore |
| **Development** | < 4 hours           | Best effort               | Dev environments are ephemeral; rebuild from manifest if needed      |

## Recovery Tiers

| Tier   | Scope                    | RTO Target   | Method                                      |
| ------ | ------------------------ | ------------ | ------------------------------------------- |
| Tier 0 | Single service rollback  | < 5 minutes  | Cloud Run revision rollback                 |
| Tier 1 | Multi-service rollback   | < 15 minutes | Manifest-pinned version redeploy            |
| Tier 2 | Full environment restore | < 30 minutes | Manifest restore + SIT validation           |
| Tier 3 | Cross-region failover    | < 1 hour     | Secondary region activation (if configured) |

## Restore Procedure from Manifest State

The `workspace-manifest.json` is the SSOT for all repo versions. To restore the full system to a known-good state:

1. **Identify target state**: Check `main_commits.history` in manifest for the last successful promotion
2. **For each repo in `versions` map**:
   ```bash
   VERSION=$(python3 -c "import json; m=json.load(open('workspace-manifest.json')); print(m['versions']['<repo>'])")
   cd <repo> && git checkout "v${VERSION}"
   ```
3. **Redeploy services**: Use deployment-service with the manifest-pinned versions
4. **Validate**: Run SIT against the restored state

## Single Service Rollback (Tier 0)

```bash
# List recent revisions
gcloud run revisions list --service <service> --region asia-northeast1 --limit 5

# Route 100% traffic to previous revision
gcloud run services update-traffic <service> \
  --region asia-northeast1 \
  --to-revisions <previous-revision>=100
```

## Artifact Registry Image Rollback

```bash
# List available tags for a service
gcloud artifacts docker tags list \
  asia-northeast1-docker.pkg.dev/${PROJECT_ID}/unified-trading-services/<service>

# Deploy a specific previous version
gcloud run deploy <service> \
  --image asia-northeast1-docker.pkg.dev/${PROJECT_ID}/unified-trading-services/<service>:v<VERSION> \
  --region asia-northeast1

# Verify the rollback
gcloud run services describe <service> \
  --region asia-northeast1 \
  --format='value(status.traffic[0].revisionName)'
```

For batch services (Cloud Build jobs), update the image tag in the Cloud Build trigger config.

## GCS Backup Locations

| Data               | Bucket                      | Path                                           | Retention                  |
| ------------------ | --------------------------- | ---------------------------------------------- | -------------------------- |
| Manifest snapshots | `unified-trading-manifests` | `snapshots/YYYY-MM-DD/workspace-manifest.json` | 90 days                    |
| Service configs    | `unified-trading-configs`   | `<service>/config.json`                        | 30 days (versioned bucket) |
| Market data        | `unified-market-data`       | `<venue>/<instrument>/YYYY/MM/DD/`             | Indefinite                 |
| ML models          | `unified-ml-models`         | `<model>/<version>/`                           | Indefinite (tagged)        |
| Audit logs         | `unified-audit-logs`        | `<service>/YYYY/MM/DD/`                        | 1 year                     |

## Communication Protocol During Incidents

### Severity Levels

| Severity | Description                       | Response Time     | Channel                            |
| -------- | --------------------------------- | ----------------- | ---------------------------------- |
| **SEV1** | Production trading halted         | Immediate         | Telegram alert + direct escalation |
| **SEV2** | Degraded trading (partial outage) | < 15 min          | Telegram alert                     |
| **SEV3** | Staging/CI broken                 | < 1 hour          | Telegram alert (automated)         |
| **SEV4** | Non-critical (dev env, docs)      | Next business day | GitHub issue                       |

### Incident Response Steps

1. **Detect**: Automated alerts (dead man switch, starvation detector, health checks)
2. **Acknowledge**: Respond in Telegram within response time SLA
3. **Triage**: Determine severity; check if automated recovery is possible
4. **Mitigate**: Rollback if needed (image rollback, manifest restore)
5. **Resolve**: Fix root cause; deploy fix through normal pipeline
6. **Post-mortem**: Document in `unified-trading-pm/plans/ops/post-mortems/` within 48h for SEV1/SEV2

## Dependency Failure Matrix

| Dependency        | Impact if Down                     | Mitigation                                      |
| ----------------- | ---------------------------------- | ----------------------------------------------- |
| GitHub Actions    | No CI/CD, no version cascade       | Manual deploy from local; pre-built images      |
| GCP Cloud Run     | Services unreachable               | Multi-region if configured; manual VM fallback  |
| Artifact Registry | Cannot pull images for new deploys | Cached images on existing revisions still serve |
| Pub/Sub           | Event delivery stalled             | Services queue locally; replay on recovery      |
| BigQuery          | Analytics/reporting delayed        | Non-critical path; services continue trading    |
| Telegram          | No alert delivery                  | GitHub Issue fallback via `notify_critical()`   |

## Testing DR Procedures

DR restore should be tested quarterly:

1. Pick a non-production environment (staging preferred)
2. Simulate failure: scale service to 0 replicas
3. Execute Tier 0 rollback; measure actual RTO
4. Execute Tier 2 manifest restore; measure actual RTO
5. Document results in `plans/ops/dr-test-results/`
