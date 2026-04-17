# Deploying the Odum Research Website

Canonical steps for deploying to **odum-research.co.uk** or **odum-research.com**.

Both domains point to the same Cloud Run service (`odum-portal`) in `europe-west4`.

---

## Prerequisites

| Tool      | Install                                                  | Verify              |
| --------- | -------------------------------------------------------- | ------------------- |
| gcloud    | https://cloud.google.com/sdk/docs/install                | `gcloud version`    |
| Docker    | Docker Desktop (enable "Use Rosetta for amd64 emulation" on Apple Silicon) | `docker info`       |
| pnpm      | `corepack enable && corepack prepare pnpm@latest`        | `pnpm --version`    |
| firebase  | `npm install -g firebase-tools` (optional, for `.co.uk`) | `firebase --version`|

Authenticate once:

```bash
gcloud auth login
gcloud auth configure-docker europe-west4-docker.pkg.dev --quiet
gcloud config set project central-element-323112
```

---

## Infrastructure Overview

```
                      ┌─────────────────────┐
                      │  Firebase Hosting    │
  odum-research.co.uk │  (rewrites ** →      │
                      │   Cloud Run)         │
                      └────────┬────────────┘
                               │
                      ┌────────▼────────────┐
  odum-research.com   │  Cloud Run           │
  (direct mapping)    │  odum-portal         │
                      │  europe-west4        │
                      └────────┬────────────┘
                               │
                      ┌────────▼────────────┐
                      │  Artifact Registry   │
                      │  cloud-run-source-   │
                      │  deploy/odum-portal  │
                      └─────────────────────┘
```

- **odum-research.com** — Cloud Run domain mapping (direct).
- **odum-research.co.uk** — Firebase Hosting → rewrites all traffic to Cloud Run.
- Both serve the same container image and the same Next.js app.

---

## Quick Deploy (90% of the time)

From the repo root (`unified-trading-system-ui/`):

```bash
bash scripts/deploy-cloud-run.sh
```

This runs: local Docker build → push to Artifact Registry → deploy to Cloud Run → route 100% traffic → clean up old revisions.

Both `.com` and `.co.uk` are served from the same Cloud Run service, but `proxy.ts` uses host-based routing to serve different content (see Staging Hosts below).

If you also need to update Firebase Hosting config (rare — only when `firebase.json` changes):

```bash
firebase deploy --only hosting --project=central-element-323112
```

---

## Step-by-Step Manual Deploy

Use this when the script fails or you need more control.

### 1. Sync the lockfile

If `package.json` changed (new deps added), the Docker build will fail with `ERR_PNPM_OUTDATED_LOCKFILE`. Fix first:

```bash
pnpm install --no-frozen-lockfile
```

Commit the updated `pnpm-lock.yaml` before building.

### 2. Build for linux/amd64

**Critical on Apple Silicon (M1/M2/M3/M4).** Cloud Run runs `linux/amd64`. A default `docker build` on Mac produces an ARM image that fails with `exec format error` on Cloud Run.

```bash
IMAGE="europe-west4-docker.pkg.dev/central-element-323112/cloud-run-source-deploy/odum-portal"

docker buildx build \
  --platform linux/amd64 \
  -t "${IMAGE}:latest" \
  --load \
  .
```

The `--platform linux/amd64` flag is mandatory on Apple Silicon. The `--load` flag imports the image into the local Docker daemon.

Build takes ~4 minutes on first run, ~1 minute with cache.

### 3. Push the image

```bash
docker push "${IMAGE}:latest"
```

Takes 1-3 minutes depending on layer changes.

### 4. Deploy to Cloud Run

```bash
gcloud run deploy odum-portal \
  --image "${IMAGE}:latest" \
  --region europe-west4 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars="NEXT_PUBLIC_MOCK_API=true,NEXT_PUBLIC_AUTH_PROVIDER=demo"
```

Wait for "Routing traffic...done". Typically ~60 seconds.

### 5. Route traffic

```bash
gcloud run services update-traffic odum-portal \
  --region europe-west4 \
  --to-latest
```

### 6. Verify

```bash
# Check HTTP status
curl -sI https://odum-research.co.uk/ | head -5
curl -sI https://odum-research.com/ | head -5

# Check page title
curl -s https://odum-research.co.uk/ | grep -o '<title>[^<]*</title>'
```

Expected: `HTTP/2 200` and title containing "Odum Research".

---

## Cloud Build Alternative (no local Docker needed)

Use `--cloud` to build on Google's servers (avoids architecture issues entirely):

```bash
bash scripts/deploy-cloud-run.sh --cloud
```

Or manually:

```bash
IMAGE="europe-west4-docker.pkg.dev/central-element-323112/cloud-run-source-deploy/odum-portal"

gcloud builds submit \
  --tag "${IMAGE}:latest" \
  --timeout=1200 \
  --project=central-element-323112
```

Cloud Build always produces `linux/amd64` images. Slower (~5-8 min) but avoids all local Docker issues.

---

## Troubleshooting

### `exec format error` — container fails to start on Cloud Run

**Cause:** Image built on Apple Silicon without `--platform linux/amd64`.

**Fix:** Rebuild with the platform flag:

```bash
docker buildx build --platform linux/amd64 -t "${IMAGE}:latest" --load .
docker push "${IMAGE}:latest"
gcloud run deploy odum-portal --image "${IMAGE}:latest" --region europe-west4 --platform managed --allow-unauthenticated --set-env-vars="NEXT_PUBLIC_MOCK_API=true,NEXT_PUBLIC_AUTH_PROVIDER=demo"
```

Or use `--cloud` to build on Google's servers.

### `ERR_PNPM_OUTDATED_LOCKFILE` — Docker build fails

**Cause:** `pnpm-lock.yaml` is out of sync with `package.json`.

**Fix:**

```bash
pnpm install --no-frozen-lockfile
git add pnpm-lock.yaml && git commit -m "chore: sync lockfile"
```

### `Both middleware.ts and proxy.ts detected` — Next.js build fails

**Cause:** Next.js 16 does not allow both files to coexist.

**Fix:** Delete `middleware.ts`. This app uses `proxy.ts` for routing (Next.js 16 preferred mechanism).

```bash
rm middleware.ts
```

### Cloud Run deploys but pages show old content

**Cause:** Firebase Hosting may be caching stale content for `.co.uk`.

**Fix:**

```bash
firebase deploy --only hosting --project=central-element-323112
```

### `deploy.sh` fails with "invalid tag"

**Cause:** The `deploy.sh` script uses a different Artifact Registry path than `deploy-cloud-run.sh`.

**Fix:** Use `deploy-cloud-run.sh` for the standard flow. It uses the correct registry path (`cloud-run-source-deploy`).

---

## Architecture Notes

### Two Deploy Scripts

| Script                   | Registry                              | Use case                  |
| ------------------------ | ------------------------------------- | ------------------------- |
| `deploy-cloud-run.sh`    | `cloud-run-source-deploy/odum-portal` | Standard deploy (use this)|
| `deploy.sh`              | `unified-trading-system/...`          | Full deploy + Firebase    |

Use `deploy-cloud-run.sh` for day-to-day deploys. Use `deploy.sh --local` only if you also need to update Firebase Hosting configuration.

### Staging Hosts — How `.com` and `.co.uk` Serve Different Content

Both domains point to the same Cloud Run service, but `proxy.ts` checks the `Host` header to decide what to serve:

| Domain                  | What it serves                          |
| ----------------------- | --------------------------------------- |
| `odum-research.com`     | **Production React app** (auth, sign-in, full platform) |
| `odum-research.co.uk`   | **Marketing pages** (static HTML, internal review) |
| `localhost:*`           | **Production React app** (default)      |

The staging host list is defined in `proxy.ts`:

```typescript
const STAGING_HOSTS = ["odum-research.co.uk", "www.odum-research.co.uk"];
```

Only requests with a `Host` header matching a staging host get rewritten to the static HTML marketing pages. All other hosts (including `.com`, `localhost`, and the raw Cloud Run URL) serve the normal Next.js React app.

**To add a new staging host** (e.g. a preview domain): add it to `STAGING_HOSTS` in `proxy.ts`, rebuild and deploy.

**To promote marketing pages to production** (`.com`): add `"odum-research.com"` to `STAGING_HOSTS`. This replaces the React landing page with the static marketing pages on `.com`. The platform routes (`/dashboard`, `/services/*`, `/admin`) are unaffected — they always serve the React app regardless of host.

**WARNING:** Never remove the host check entirely. Doing so serves marketing pages on ALL hosts including `.com`, replacing the production sign-in flow.

### Marketing Page Routes (`.co.uk` only)

| URL path               | Serves              |
| ---------------------- | -------------------- |
| `/`                    | `public/homepage.html` |
| `/investment-management` | `public/strategies.html` |
| `/platform`            | `public/platform.html`  |
| `/regulatory`          | `public/regulatory.html` |
| `/firm`                | `public/firm.html`       |
| `/contact`             | `public/contact.html`    |

To add or rename a marketing page: edit the `MARKETING_ROUTES` map in `proxy.ts`, add the HTML file to `public/`, rebuild and deploy.

### Environment Variables

| Variable                    | Value    | Purpose                         |
| --------------------------- | -------- | -------------------------------- |
| `NEXT_PUBLIC_MOCK_API`      | `true`   | Use mock data (no live backend)  |
| `NEXT_PUBLIC_AUTH_PROVIDER`  | `demo`   | Demo auth mode                   |
| `NODE_ENV`                  | `production` | Set by Dockerfile            |

---

## Quick Reference

```bash
# Standard deploy (most common)
bash scripts/deploy-cloud-run.sh

# Cloud Build (avoids Docker architecture issues)
bash scripts/deploy-cloud-run.sh --cloud

# Check what's running
gcloud run revisions list --service=odum-portal --region=europe-west4

# View logs
gcloud run services logs read odum-portal --region=europe-west4 --limit=50

# Rollback to previous revision
gcloud run services update-traffic odum-portal --region=europe-west4 --to-revisions=REVISION_NAME=100
```
