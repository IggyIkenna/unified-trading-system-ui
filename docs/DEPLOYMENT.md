# Deploying the Odum Research Website

Canonical steps for deploying the UI. **Public DNS today:** **`odum-research.com`** resolves to **Firebase Hosting**, which rewrites `**` to Cloud Run **`odum-portal`** (see `firebase.json`). **`odum-research.co.uk`** resolves to **Cloud Run domain mapping** (A/AAAA `216.239.*`) on the same **`odum-portal`** service. Use **`odum-portal-staging`** for canary work via `deploy-cloud-run.sh` (default target); roll production with **`--production`**.

Static marketing HTML is still host-gated in `proxy.ts` (`.co.uk` hosts only).

**Note:** A Cloud Run domain mapping for `odum-research.com` also exists but stays **certificate-pending** while DNS points at Firebase (`199.36.158.*` / `*.web.app`); traffic uses Hosting → Run until you move DNS to the Run records if you want Run-native TLS only.

**Local smoke (marketing → IR → terminal):** `unified-trading-pm/plans/active/portal_local_smoke_checklist_2026_04_19.md` — run Next from `unified-trading-system-ui` so `public/*.html` resolves. **Firebase (separate dev / staging / prod projects):** `docs/FIREBASE_ENVIRONMENTS.md`.

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
  odum-research.com   ──► Firebase Hosting (site central-element-323112) ──► Cloud Run  odum-portal

  odum-research.co.uk ──► Cloud Run domain mapping (216.239.*) ─────────────► odum-portal

  Artifact Registry: …/cloud-run-source-deploy/odum-portal:latest  (image shared by prod + staging services)
```

- **`odum-research.com`** — **Firebase Hosting** custom domain; `firebase.json` rewrites `**` → **`odum-portal`**. After changing `firebase.json`, run **`firebase deploy --only hosting`**.
- **`odum-research.co.uk`** — **Cloud Run mapped domain** → **`odum-portal`** (same Next service; marketing routes still come from `proxy.ts` staging hosts).
- **Default deploy** — `bash scripts/deploy-cloud-run.sh --cloud` updates **`odum-portal-staging`** only. **`--cloud --production`** rolls the image onto **`odum-portal`**. Firebase Hosting for `.com` serves whatever revision **`odum-portal`** is on after you deploy Cloud Run **and** redeploy Hosting if static assets changed.

---

## Quick Deploy (90% of the time)

From the repo root (`unified-trading-system-ui/`):

```bash
bash scripts/deploy-cloud-run.sh --cloud
```

This runs: Cloud Build → push `…/odum-portal:latest` → deploy to **`odum-portal-staging`** → route traffic → prune old **staging** revisions.

Production (**`odum-portal`**) is updated only when you run the same script with **`--production`** (after **`--cloud`** if you are building). `proxy.ts` still gates static marketing HTML by `Host` (see Staging Hosts below).

If you also need to update Firebase Hosting config (required after `firebase.json` rewrite target changes, and whenever you want Hosting cache/CDN refreshed):

```bash
firebase deploy --only hosting --project=central-element-323112
```

**New Cloud Run service:** the first deploy of `odum-portal-staging` must use **`--port=3000`** (Next.js listens on 3000; the default 8080 causes a startup timeout). `deploy-cloud-run.sh` sets this for you.

---

## Custom domains: `www.odum-research.co.uk` (Firebase Hosting)

The app already treats **`www.odum-research.co.uk`** as a staging host in `proxy.ts` (same marketing rewrites as the apex). If only **`https://odum-research.co.uk`** works, the missing piece is almost always **Firebase + DNS**, not a code deploy.

1. Open **Firebase Console → Hosting → custom domains** for this project:
   `https://console.firebase.google.com/project/central-element-323112/hosting/sites`
2. Select the site **`central-element-323112`** (matches `firebase.json` → `hosting.site`).
3. **Add custom domain** → enter **`www.odum-research.co.uk`** (not only the apex).
4. Complete **domain verification** (TXT) and add the **DNS records** Firebase shows (often a **CNAME** for `www` to a `ghs.googlehosted.com`-style target, or A/AAAA — use exactly what the wizard lists).
5. Wait until the console shows **Connected** and SSL is **Provisioning / Active** (can take up to a few hours for DNS/SSL).
6. Optionally set a **redirect** in the same wizard so visitors always land on either apex or `www` (your choice).

`firebase deploy --only hosting` does **not** attach new hostnames; it only publishes config for hostnames already connected in the console.

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

### 4. Deploy to Cloud Run (staging)

```bash
gcloud run deploy odum-portal-staging \
  --image "${IMAGE}:latest" \
  --region europe-west4 \
  --platform managed \
  --allow-unauthenticated \
  --port=3000 \
  --set-env-vars="NEXT_PUBLIC_MOCK_API=true,NEXT_PUBLIC_AUTH_PROVIDER=demo"
```

Wait for "Routing traffic...done". Typically ~60 seconds.

### 5. Route traffic

```bash
gcloud run services update-traffic odum-portal-staging \
  --region europe-west4 \
  --to-latest
```

To roll **production** (`odum-portal`) to the same image without changing env vars:

```bash
gcloud run deploy odum-portal \
  --image "${IMAGE}:latest" \
  --region europe-west4 \
  --platform managed \
  --allow-unauthenticated \
  --port=3000
gcloud run services update-traffic odum-portal --region europe-west4 --to-latest
```

### 6. Verify

```bash
# Check HTTP status (use .co.uk only — static marketing rewrites apply here)
curl -sI https://odum-research.co.uk/ | head -5

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
gcloud run deploy odum-portal-staging --image "${IMAGE}:latest" --region europe-west4 --platform managed --allow-unauthenticated --port=3000 --set-env-vars="NEXT_PUBLIC_MOCK_API=true,NEXT_PUBLIC_AUTH_PROVIDER=demo"
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

| Script                   | Registry / target                     | Use case                         |
| ------------------------ | ------------------------------------- | -------------------------------- |
| `deploy-cloud-run.sh`    | `…/odum-portal:staging` / `…/odum-portal:production` (build-time env SSOT) | Standard deploy (use this)       |
| `deploy.sh`              | `asia-northeast1/…/unified-trading-system-ui` → `odum-portal-staging` | Legacy path; prefer `deploy-cloud-run.sh` |

Use `deploy-cloud-run.sh` for day-to-day deploys. Use `deploy.sh` only if you intentionally need the alternate image path and understand the drift risk.

### Staging vs production — hosts and client bundles

**Infrastructure:** `.co.uk` traffic is typically routed to **`odum-portal-staging`** (Firebase Hosting → Cloud Run). `.com` maps to **`odum-portal`**. Both run the same Next.js App Router; marketing lives on real routes under `app/(public)/` (not host-based rewrites to flat HTML).

| Domain                     | What it serves |
| -------------------------- | -------------- |
| `odumresearch.com`         | **Production** image (`odum-portal:production`): `config/docker-build.env.production` bakes Firebase + live API defaults. |
| `odumresearch.co.uk`       | **Staging** image (`odum-portal:staging`): `config/docker-build.env.staging` bakes demo auth + mock API for internal churn. |
| `odum-research.co.uk`      | Same staging path as above when used for DNS/CNAME compatibility. |
| `localhost:*`            | Local dev — use `.env.local`; `NEXT_PUBLIC_*` follows your local file. |

`proxy.ts` is a **no-op** pass-through (kept for tests / future host hooks). Do not rely on Cloud Run runtime env vars to flip `NEXT_PUBLIC_AUTH_PROVIDER` or Firebase web config: those values are inlined at **`pnpm build`** from the `BUILD_ENV_FILE` Docker build-arg (see `Dockerfile` and `scripts/deploy-cloud-run.sh`).

### Staging Firebase cutover (dedicated non-prod project)

Use this when you want **staging (.co.uk) to authenticate like production** (real Firebase) while still
keeping `NEXT_PUBLIC_MOCK_API=true` for API churn, or flip mock off when gateways are stable.

1. **Create** a separate Firebase/GCP project (do **not** reuse production web keys).
2. **Authorized domains:** add staging hostnames (e.g. `odumresearch.co.uk`, `odum-research.co.uk`, and any
   direct Cloud Run URL you use for smoke tests).
3. **Copy** `config/docker-build.env.staging.firebase.example` → a **gitignored** file (for example
   `config/docker-build.env.staging.firebase.local`), replace `REPLACE_ME` and optional gateway URLs.
4. **Deploy** with an explicit build-time file (same image tag `:staging`; only the client bundle changes):

```bash
bash scripts/deploy-cloud-run.sh --build-env-file=config/docker-build.env.staging.firebase.local
# or Cloud Build:
bash scripts/deploy-cloud-run.sh --cloud --build-env-file=config/docker-build.env.staging.firebase.local
```

5. **Optional:** when `NEXT_PUBLIC_MOCK_API=false`, set `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_AUTH_URL`,
   `NEXT_PUBLIC_DEPLOYMENT_API_URL`, and `NEXT_PUBLIC_REPORTING_API_URL` in that file so `next.config.mjs`
   rewrites target non-production APIs (see `next.config.mjs` defaults).

See `docs/SECURITY_AUTH.md` (staging Firebase + data plane) and `deployment-api/config/example-provisioning.env`
for org-owner / acting-user headers on role mutations.

### Five-space engagement map (IA)

| Space | Who | Primary routes | Notes |
| --- | --- | --- | --- |
| **Public** | Everyone | `/`, `/investment-management`, `/platform`, `/regulatory`, `/firm`, `/contact` | Zero-auth marketing; no global preview banner. |
| **Lighter gate** | Prospects / invited | `/briefings`, `/briefings/*` | Optional `NEXT_PUBLIC_BRIEFING_ACCESS_CODE`; session key `odum-briefing-session` (separate from staging gate + Firebase). |
| **Investor relations** | Entitled viewers | `/investor-relations/*` | `investor-*` entitlements; archive decks may require `investor-archive`. Optional deck catalogue merge from **client-reporting-api** `GET /api/reporting/investor-relations/archive-metadata` (rewritten when `NEXT_PUBLIC_MOCK_API=false`). |
| **Investment management** | Signed-in allocators | `/services/research/strategy/catalog` (+ detail routes) | Catalogue source controlled by `NEXT_PUBLIC_STRATEGY_CATALOG_SOURCE` (see below). |
| **Platform** | Signed-in builders / desk | `/dashboard`, `/services/*` | Same identity as IM; different nav grouping (lifecycle). |

`components/staging-gate.tsx` allowlists public marketing paths including `/briefings` so **co.uk staging** does not wall lighter-gate content.

### Strategy catalogue sourcing

| Variable | Typical staging | Typical production |
| --- | --- | --- |
| `NEXT_PUBLIC_STRATEGY_CATALOG_SOURCE` | `mock` (explicit in `docker-build.env.staging`) | `api` |
| `NEXT_PUBLIC_MOCK_API` | `true` | `false` |
| `NEXT_PUBLIC_STRATEGY_CATALOG_API_ERROR_FALLBACK` | unset / `true` — fall back to fixtures if the registry call fails | set `false` when you want a hard failure instead of degraded fixture mode |

When `STRATEGY_CATALOG_SOURCE` is unset, the UI chooses **mock** if `NEXT_PUBLIC_MOCK_API=true`, otherwise **api** (`lib/strategy-catalog/source.ts`).

### Mock / reporting delta (maintenance pass)

Re-run periodically:

```bash
rg -l "isMockDataMode|NEXT_PUBLIC_MOCK_API|getMock|orgMode=\\\"demo\\\"" app components hooks lib"
```

Representative touchpoints (2026-04-17): `components/runtime-mode-badge.tsx`, `lib/api/mock-handler.ts`, `hooks/api/use-performance.ts`, `hooks/api/use-strategies.ts`, `components/widgets/terminal/use-terminal-page-data.ts`, `app/(public)/services/data/page.tsx` (`orgMode="demo"` for marketing catalogue), and multiple hooks under `hooks/api/*` that branch on mock mode.

### Marketing routes (App Router)

| URL path                 | Source (build-time content) |
| ------------------------ | --------------------------- |
| `/`                      | `public/homepage.html` (shadow-mounted) |
| `/investment-management` | `public/strategies.html` |
| `/platform`              | `public/platform.html` |
| `/regulatory`            | `public/regulatory.html` |
| `/firm`                  | `public/firm.html` |
| `/contact`               | React page `app/(public)/contact` |
| `/briefings`             | Lighter-gate hub `app/(public)/briefings` |

Legacy `*.html` URLs redirect to the routes above (`next.config.mjs`).

### Environment Variables

| Variable                    | Where set | Purpose |
| --------------------------- | --------- | ------- |
| `NEXT_PUBLIC_*`             | **Docker build** (`config/docker-build.env.staging` vs `docker-build.env.production`) | Client bundle; not overridden meaningfully at Cloud Run runtime. |
| `NODE_ENV`                  | Dockerfile | `production` for optimized Next server. |
| `ORG_OWNER_EMAILS` / `X-Acting-User-Email` | **deployment-api** service env & gateway headers | Role mutation guards — see `docs/SECURITY_AUTH.md` and `deployment-api/config/example-provisioning.env`. |

---

## Quick Reference

```bash
# Standard deploy → staging (local Docker)
bash scripts/deploy-cloud-run.sh

# Cloud Build → staging
bash scripts/deploy-cloud-run.sh --cloud

# Cloud Build → production (separate `:production` image + prod build-time env)
bash scripts/deploy-cloud-run.sh --cloud --production

# Staging with a custom build-time env file (e.g. Firebase web keys — gitignored copy of the example template)
bash scripts/deploy-cloud-run.sh --build-env-file=config/docker-build.env.staging.firebase.local

# Check what's running
gcloud run revisions list --service=odum-portal-staging --region=europe-west4
gcloud run revisions list --service=odum-portal --region=europe-west4

# View logs
gcloud run services logs read odum-portal-staging --region=europe-west4 --limit=50

# Rollback staging to previous revision
gcloud run services update-traffic odum-portal-staging --region=europe-west4 --to-revisions=REVISION_NAME=100
```
