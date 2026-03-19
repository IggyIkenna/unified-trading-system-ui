# GitHub Token for Cloud Build (Least Privilege)

Guide for creating and using a GitHub token so Cloud Build can clone private repos—with minimal permissions and no secrets in image layers.

---

## Test-in-Image Pattern (Preferred – No Token Needed)

**Services using the market-tick-data-handler pattern do NOT need a GitHub token:**

| Service                        | Pattern         | GitHub Token? |
| ------------------------------ | --------------- | ------------- |
| market-tick-data-handler       | test-in-image   | No            |
| market-data-processing-service | test-in-image   | No            |
| instruments-service            | test-in-image   | No            |
| execution-service              | test-in-image   | No            |
| unified-trading-library        | base image only | No            |
| features-delta-one-service     | test-in-image   | No            |
| features-calendar-service      | test-in-image   | No            |
| features-onchain-service       | test-in-image   | No            |
| features-volatility-service    | test-in-image   | No            |
| ml-training-service            | test-in-image   | No            |
| ml-inference-service           | test-in-image   | No            |
| strategy-service               | test-in-image   | No            |

**How it works:** Build the service image from `unified-trading-library:latest` (Artifact Registry), run quality gates inside the built image, push only if tests pass. No git clone. No token.

---

## OLD Pattern (Git Clone – Token Required)

Services still using git clone need the token below. Migrate to test-in-image when possible.

### GCP Secret Manager: `github-token`

- **Path**: `projects/test-project/secrets/github-token`
- **Usage**: `gcloud secrets versions access latest --secret=github-token`
- **Content**: GitHub fine-grained PAT with read-only access to `unified-trading-library`, `deployment-service`
- **IAM**: Cloud Build SA needs `roles/secretmanager.secretAccessor`

### GitHub Actions: `GH_PAT`

- **Variable**: `GH_PAT` (from `secrets.GH_PAT` or `secrets.GITHUB_TOKEN`)
- **Purpose**: Clone private dependencies during CI

---

## Version Consistency: Clone a Verified Ref, Not "Latest"

**Problem**: Cloning `main` (or default branch) gives you whatever is on GitHub at build time. That can be:

- Code that hasn't passed quality gates yet
- A different commit than what unified-trading-library CI just verified
- A version mismatch between the service image and what you intended to deploy

**unified-trading-library** is a Python package (pip-installed), not a Docker image. There is no "built image" to pull. The fix is to pin to a **git ref** that has passed quality gates.

### Option A: Pin to a Git Tag (recommended)

When unified-trading-library CI passes, tag a release (e.g. `v1.2.3`). Downstream services clone that tag:

```yaml
# In cloudbuild.yaml, replace:
#   git clone https://.../unified-trading-library.git
# With:
git clone --branch v1.2.3 --depth 1 https://x-access-token:${GITHUB_TOKEN}@github.com/IggyIkenna/unified-trading-library.git /workspace/unified-trading-library
```

Store the tag in a substitution or config file; update it when you cut a new release.

### Option B: Pin to a Commit SHA

When unified-trading-library Cloud Build passes, store the commit SHA (e.g. in a Secret Manager or config). Downstream services clone that ref:

```bash
git clone https://.../unified-trading-library.git /workspace/unified-trading-library
cd /workspace/unified-trading-library && git checkout ${COMMIT_SHA}
```

### Option C: Chain Builds + Substitution

Cloud Build triggers can pass the commit SHA. When unified-trading-library build succeeds, trigger downstream builds with `_UCS_COMMIT_SHA` as a substitution. Downstream services use that value.

### Option D: Publish as Versioned Package

Publish unified-trading-library to Artifact Registry (Python) or private PyPI when CI passes. Services then `pip install unified-trading-library==1.2.3` with a pinned version. No git clone during service build.

---

## 1. Create a Fine-Grained Personal Access Token (PAT)

### Scope: Read-only clone

1. Go to [GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens](https://github.com/settings/personal-access-tokens/new).
2. **Token name**: `cloud-build-clone` (or similar).
3. **Expiration**: 90 days recommended; rotate on schedule.
4. **Repository access**: "Only select repositories".
5. **Repos to allow**:
   - `unified-trading-library`
   - `deployment-service`
   - Any other private repo Cloud Build needs to clone.
6. **Permissions** (least privilege):

   | Permission   | Access level | Reason                       |
   | ------------ | ------------ | ---------------------------- |
   | **Contents** | Read-only    | Clone and read repo contents |
   | **Metadata** | Read-only    | Required for git operations  |

7. **Generate token** and copy it once (it will not be shown again).

---

## 2. Store in GCP Secret Manager

```bash
# Create secret (if it doesn't exist)
echo -n "YOUR_GITHUB_TOKEN" | gcloud secrets create github-token \
  --data-file=- \
  --project=test-project

# Or add new version to existing secret
echo -n "YOUR_GITHUB_TOKEN" | gcloud secrets versions add github-token \
  --data-file=- \
  --project=test-project
```

**Important**: Use `echo -n` so no trailing newline is stored.

---

## 3. Cloud Build Access (No Secrets in Logs)

Your `cloudbuild.yaml` already uses Secret Manager correctly:

```yaml
steps:
  - name: "gcr.io/cloud-builders/gcloud"
    id: "get-github-token"
    entrypoint: "bash"
    args:
      - "-c"
      - |
        gcloud secrets versions access latest --secret=github-token > /workspace/github_token.txt
```

- Token is fetched at runtime, not hardcoded.
- `options: logging: CLOUD_LOGGING_ONLY` keeps logs out of stdout (avoids accidental token exposure).
- Cleanup step removes the file after build.

---

## 4. Avoid Baking Token into Docker Image (BuildKit Secrets)

**Current risk**: `docker build --build-arg GH_PAT=...` can bake the token into image layers. Anyone with image access can inspect history and recover it.

**Fix**: Use Docker BuildKit `--secret` so the token is never written to a layer:

### In `cloudbuild.yaml` (build step):

```yaml
- name: "gcr.io/cloud-builders/docker"
  id: "build"
  entrypoint: "bash"
  args:
    - "-c"
    - |
      DOCKER_BUILDKIT=1 docker build \
        --secret id=ghpat,src=/workspace/github_token.txt \
        -t asia-northeast1-docker.pkg.dev/$PROJECT_ID/instruments/instruments-service:$SHORT_SHA \
        -t asia-northeast1-docker.pkg.dev/$PROJECT_ID/instruments/instruments-service:latest \
        .
```

### In `Dockerfile`:

```dockerfile
# Instead of ARG GH_PAT + RUN git clone https://${GH_PAT}@...
RUN --mount=type=secret,id=ghpat \
    export GH_PAT=$(cat /run/secrets/ghpat) && \
    git clone https://x-access-token:${GH_PAT}@github.com/IggyIkenna/unified-trading-library.git /app/unified-trading-library && \
    pip install /app/unified-trading-library && \
    rm -rf /app/unified-trading-library/.git
```

The `--mount=type=secret` makes the token available only during that `RUN` and never persists in any layer.

---

## 5. IAM: Who Can Access the Secret

Cloud Build’s service account needs `roles/secretmanager.secretAccessor` on the `github-token` secret (or project-wide). Your Cloud Build default SA already has this if builds work.

To restrict to a single secret:

```bash
gcloud secrets add-iam-policy-binding github-token \
  --member="serviceAccount:PROJECT_NUMBER@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=test-project
```

---

## 6. Checklist

| Item                                              | Status                     |
| ------------------------------------------------- | -------------------------- |
| Fine-grained PAT (Contents: Read, Metadata: Read) | Create                     |
| PAT limited to required repos only                | Configure                  |
| Token stored in Secret Manager                    | `gcloud secrets`           |
| Cloud Build fetches at runtime                    | Already in cloudbuild.yaml |
| Token not passed as `--build-arg`                 | Migrate to `--secret`      |
| Cleanup step removes token file                   | Already in cloudbuild.yaml |
| `logging: CLOUD_LOGGING_ONLY`                     | Check options block        |

---

## 7. Rotate the Token

1. Create a new PAT in GitHub.
2. Add a new version: `echo -n "NEW_TOKEN" | gcloud secrets versions add github-token --data-file=- --project=test-project`
3. Revoke the old PAT in GitHub.
4. Re-run a build to confirm it works.

---

## References

- [GitHub fine-grained PATs](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token)
- [Docker BuildKit secrets](https://docs.docker.com/build/building/secrets/)
- [GCP Secret Manager](https://cloud.google.com/secret-manager/docs)
