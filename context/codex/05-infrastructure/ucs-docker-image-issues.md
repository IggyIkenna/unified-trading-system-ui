# UCS Docker Image: Known Issues & Rollout Tracking

**Owner:** Ikenna
**Priority:** P1-high
**Status:** Rollout complete (11/11 services); auto-trigger bug open
**Last Updated:** 2026-02-12

---

## Active Issues

### Issue 1: Cloud Build Not Auto-Triggering on Main Push

**Priority:** P1-high
**Status:** Open
**Tracking:** `unified-trading-services/.github/ISSUE_BUG_UCS_IMAGE_NOT_AUTO_PUSHING.md`

**Problem:** Cloud Build trigger for `unified-trading-services` is configured correctly but does NOT automatically
trigger on pushes to main. Manual trigger works.

**Impact:** Downstream services must manually trigger UCS build after main merges. Migration is complete (11/11
services); all use UCS base image with manual workaround.

**Evidence:**

- ✅ PR #40 merged to main (2026-02-12 15:53:33Z)
- ❌ No automatic Cloud Build triggered
- ✅ Manual trigger succeeds: `gcloud builds triggers run unified-trading-services-build --branch=main`
- ✅ Image pushed to:
  `asia-northeast1-docker.pkg.dev/test-project/unified-trading-services/unified-trading-services:latest`

**Root Cause (Under Investigation):**

1. GitHub App permissions missing (`contents: read`, `metadata: read`)
2. Webhook delivery failure (GitHub → Cloud Build)
3. Repository connection stale (needs refresh)
4. Branch protection interference (squash merge commits not matching filter)

**Workaround (Temporary):**

```bash
# After merging to main, manually trigger:
gcloud builds triggers run unified-trading-services-build \
  --region=asia-northeast1 \
  --branch=main
```

**Acceptance Criteria:**

- [ ] Push to main automatically triggers Cloud Build
- [ ] Images pushed to Artifact Registry automatically on every main merge
- [ ] Verify with test commit: merge trivial change, observe automatic build
- [ ] Document solution in codex

**Time Estimate:** 2-4 hours

**Debug Commands:**

```bash
# Check trigger config
gcloud builds triggers describe unified-trading-services-build \
  --project=test-project \
  --region=asia-northeast1

# List recent builds
gcloud builds list \
  --filter="source.repoSource.repoName=unified-trading-services" \
  --region=asia-northeast1 \
  --limit=10

# Check webhook delivery (GitHub UI)
https://github.com/IggyIkenna/unified-trading-services/settings/hooks

# Test manual trigger
gcloud builds triggers run unified-trading-services-build \
  --region=asia-northeast1 \
  --branch=main
```

**Next Steps:**

1. Verify GitHub webhook is configured and delivering events
2. Check Cloud Build trigger IAM permissions
3. Consider recreating the GitHub connection if stale
4. Test with a trivial commit to verify auto-triggering

---

## Rollout Tracking

**Goal:** Migrate all services from cloning `unified-trading-services` via `GH_PAT` to using pre-built Docker base image
from Artifact Registry.

**See:** `05-infrastructure/ucs-image-rollout-plan.md` for full plan.

### Rollout Phases

| Phase   | Services                 | Status  | Blockers                               |
| ------- | ------------------------ | ------- | -------------------------------------- |
| Phase 0 | unified-trading-services | ✅ Done | Auto-trigger bug (workaround in place) |
| Phase 1 | ML services (2)          | ✅ Done | —                                      |
| Phase 2 | Batch pipeline (6)       | ✅ Done | —                                      |
| Phase 3 | Strategy + Features (5)  | ✅ Done | —                                      |
| Phase 4 | execution-service        | ✅ Done | —                                      |

### Migration Complete (11/11 services)

**All services migrated:**

- unified-trading-services, ml-training-service, ml-inference-service
- instruments-service, market-data-processing-service, market-tick-data-service
- strategy-service
- features-calendar, features-delta-one, features-onchain, features-volatility
- execution-service (Python 3.13, full migration)

**Changes applied:**

1. ✅ Dockerfile uses UCS base image
2. ✅ No `GH_PAT` in Dockerfiles
3. ✅ cloudbuild.yaml pulls UCS image, containerized quality gates
4. ✅ Python 3.13 alignment
5. ✅ uv for 30% faster builds

**Known Issue:** UCS auto-trigger bug — use manual trigger after main merges.

---

## Python Version Alignment

**Current State:** ✅ Python 3.13 everywhere (11/11 services)
**Target State:** Python 3.13 everywhere — **achieved**

**Completed:**

- [x] unified-trading-services: 3.13
- [x] All 11 downstream services: 3.13
- [x] execution-service: 3.13 (NautilusTrader supports 3.13-3.14)

**See:** `ucs-image-rollout-plan.md` Section "Python Version Alignment"

---

## uv Migration

**Status:** ✅ Complete (11/11 services)
**Goal:** Replace `pip` with `uv` for 10-100x faster builds — **achieved**

**Migration Pattern:**

```dockerfile
# Before
RUN pip install -e .

# After
RUN uv pip install --system -e .
```

**Completed:**

- [x] unified-trading-services
- [x] All 11 downstream services

---

## Success Metrics

**Phase 1 Success Criteria:**

- [x] ml-training-service builds without `GH_PAT`
- [x] ml-inference-service builds without `GH_PAT`
- [x] Both pass quality gates in GitHub Actions
- [x] Both pass quality gates in Cloud Build
- [x] Docker images build faster (uv + UCS image caching)

**Overall Success Criteria (11 pipeline services):**

- [x] All 11 services use UCS base image
- [x] Zero `GH_PAT` usage in Dockerfiles
- [x] All services use Python 3.13
- [x] All services use `uv`
- [x] Build times reduced 70-75% (44-82s overhead reduction)

---

## References

- Bug Report: `unified-trading-services/.github/ISSUE_BUG_UCS_IMAGE_NOT_AUTO_PUSHING.md`
- Rollout Plan: `05-infrastructure/ucs-image-rollout-plan.md`
- Codex: `05-infrastructure/ci-cd.md`
- Codex: `06-coding-standards/dependency-management.md`
