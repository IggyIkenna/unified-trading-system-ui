# Deploying the Odum Research Website

**SSOT for build + deploy of the Next.js app behind odum-research.com and odum-research.co.uk.**

Staging and production are **separate, one-at-a-time deploys** — different Cloud Run services, different BUILD_ENV_FILE, different images. They may ship different code. Never assume a prod deploy is a no-op because staging just shipped.

---

## Environments

| Domain                                             | Cloud Run service        | Image tag     | BUILD_ENV_FILE                        | Auth + data mode                               |
| -------------------------------------------------- | ------------------------ | ------------- | ------------------------------------- | ---------------------------------------------- |
| `www.odum-research.com` (**production, private**)  | `odum-portal`            | `:production` | `config/docker-build.env.production`  | Firebase Auth (`central-element-323112`), live |
| `odum-research.co.uk` (**staging**)                | `odum-portal-staging` *  | `:staging`    | `config/docker-build.env.staging`     | Demo auth + mock API                           |

*The `odum-portal-staging` service currently has no custom domain mapping. `odum-research.co.uk` still domain-maps to `odum-portal` (prod) at the Cloud Run layer — this is intentional until the Firebase staging project split is fully wired. See "Firebase project split" below.*

**NEXT_PUBLIC_\* are inlined at Docker build time.** Cloud Run runtime `--set-env-vars` cannot retroactively change an already-baked client bundle. Change env → rebuild image → redeploy.

---

## Quick reference

```bash
# Staging (deploy to odum-portal-staging; safe — no live-advisor-facing domain points here today)
bash scripts/deploy-cloud-run.sh --cloud

# Production (deploy to odum-portal; serves both .com and .co.uk today)
bash scripts/deploy-cloud-run.sh --cloud --production
```

Cloud Build (`--cloud`) is the default: it produces a `linux/amd64` image and avoids Apple-Silicon architecture mismatches. Drop `--cloud` only if you have `docker buildx` set up for amd64 locally.

### Override the env file for a one-off staging build

```bash
bash scripts/deploy-cloud-run.sh --cloud \
  --build-env-file=config/docker-build.env.staging.firebase.local
```

Useful when testing a dedicated staging Firebase project (see `config/docker-build.env.staging.firebase.example`).

---

## Build speed: cache-from is already wired

`scripts/cloudbuild-odum-portal.yaml` pulls the previous image tag before every build and passes `--cache-from`. A **code-only change** (no `package.json` / `pnpm-lock.yaml` diff) reuses the already-built `deps` stage layer — dependency install + `node_modules` are skipped on warm builds.

First deploy of a new tag = cold build. Every deploy after that = warm. **Never bump a dependency as part of a purely-content deploy** if you care about build time.

To force a cold build (debug a cache hit): run the deploy with `--no-cache` after the `docker build` args, or `docker image rm <image>:staging` in the registry UI.

### Local warm cache

`docker buildx build` reuses local layer cache automatically — same semantics. Turbopack's filesystem cache (`turbopackFileSystemCacheForBuild: true` in `next.config.mjs`) makes `pnpm build` in the host shell (not Docker) noticeably faster on the second run.

---

## Two-environment contract

Staging and production are **not a single pipeline**. They are:

- **Separate services.** `odum-portal` and `odum-portal-staging` are independent Cloud Run services with independent revisions. Rolling one back does not roll the other back.
- **Separate images.** Never tag the staging image `:production` or vice versa. The Dockerfile bakes different `NEXT_PUBLIC_*` values for each.
- **Deployed one at a time.** Never deploy both in one operation — you lose the ability to stage-test a change before it hits prod.
- **Allowed to diverge.** Shipping staging does not imply shipping prod. A staging build can carry in-progress content; prod only advances when you explicitly run `--production`.

The expected flow for any customer-visible change:

1. `bash scripts/deploy-cloud-run.sh --cloud` — staging build + deploy.
2. Smoke-test `https://odum-portal-staging-<hash>.a.run.app/` (or `.co.uk` if mapped).
3. `bash scripts/deploy-cloud-run.sh --cloud --production` — prod build + deploy.
4. Smoke-test `https://www.odum-research.com/`.

Do **not** skip step 2. The same Next.js code runs in both envs, but the baked env vars differ — what passes locally in demo mode can still break when Firebase Auth is wired up.

---

## Quality gates before deploy

```bash
bash scripts/quality-gates.sh
```

Runs lint + unit tests + `next build`. Cloud Build does not currently run QG inside `cloudbuild-odum-portal.yaml` — the top-level `cloudbuild.yaml` does, but it's for the `asia-northeast1` image path, not the `europe-west4` deploy path. Run QG locally before every deploy.

If QG fails: **fix the failing code, don't bypass the gate.** The only acceptable skips are advisory (e.g. generated diagrams). A red gate on a production deploy is not a generate-and-ignore situation.

---

## Firebase project split

`.firebaserc` declares three project aliases:

- `prod` / `default` → `central-element-323112`
- `staging` → `odum-staging`

Today, both staging and production build **against the prod Firebase project** (`central-element-323112`) via `config/docker-build.env.production`. The staging build uses demo auth + mock API, so it never touches the live Firestore — the `odum-staging` project is reserved but not yet wired end-to-end.

To activate dedicated staging Firebase:

1. Copy `config/docker-build.env.staging.firebase.example` → `config/docker-build.env.staging.firebase.local` (gitignored).
2. Fill in the `odum-staging` web-app keys.
3. `firebase use staging` before `firebase deploy --only hosting` (hosting config also needs an update — `firebase.json` currently only declares the prod site).
4. Run `bash scripts/deploy-cloud-run.sh --cloud --build-env-file=config/docker-build.env.staging.firebase.local`.

This is a **follow-up**, not a prerequisite for content deploys. See `docs/FIREBASE_ENVIRONMENTS.md` for the console-side setup.

---

## Briefings / light-auth gate

`NEXT_PUBLIC_BRIEFING_ACCESS_CODE` (set in both env files) gates `/briefings/*` and `/docs`. The current shared code is `odum-briefings-2026`. Rotation policy: `unified-trading-pm/codex/14-playbooks/authentication/light-auth-briefings.md`. If the code is empty in the env file, the gate is **open**. This is load-bearing for the advisor flow — if you zero it out without confirming, you have publicly exposed the briefings hub.

---

## Firebase Auth accounts (prod)

The `investor@odum-research.co.uk` account (password rotates; current `OdumIR2026!`) is stored in Firebase Auth on `central-element-323112`. It **cannot be created from source** — it's a runtime record. If the account is missing or the password is wrong, the `/login` flow on `.com` will fail; fix it in the Firebase Console (Authentication → Users) before deploying, not after.

---

## Manual / fallback commands

Use these when the script fails or you need finer control.

### Cloud Build (staging)

```bash
gcloud builds submit . \
  --config=scripts/cloudbuild-odum-portal.yaml \
  --substitutions=_IMAGE="europe-west4-docker.pkg.dev/central-element-323112/cloud-run-source-deploy/odum-portal:staging",_BUILD_ENV_FILE=config/docker-build.env.staging \
  --timeout=1200 \
  --project=central-element-323112
```

### Cloud Run deploy (staging)

```bash
gcloud run deploy odum-portal-staging \
  --image europe-west4-docker.pkg.dev/central-element-323112/cloud-run-source-deploy/odum-portal:staging \
  --region europe-west4 \
  --platform managed \
  --allow-unauthenticated \
  --port=3000
```

### Same for production — swap `staging` → `production` and `odum-portal-staging` → `odum-portal`.

### Rollback

```bash
# List revisions
gcloud run revisions list --service=odum-portal --region=europe-west4

# Route 100% to a named revision
gcloud run services update-traffic odum-portal \
  --region=europe-west4 \
  --to-revisions=<revision-name>=100
```

### Logs

```bash
gcloud run services logs read odum-portal --region=europe-west4 --limit=100
gcloud run services logs read odum-portal-staging --region=europe-west4 --limit=100
```

---

## Troubleshooting

### `exec format error` on Cloud Run

Image was built on Apple Silicon without `--platform linux/amd64`. Use `--cloud` (Cloud Build is always amd64) or pass the platform flag explicitly.

### `ERR_PNPM_OUTDATED_LOCKFILE`

`pnpm-lock.yaml` is out of sync with `package.json`. This also **invalidates the Docker cache for the `deps` stage**, so this will slow the next deploy.

```bash
pnpm install --no-frozen-lockfile
git add pnpm-lock.yaml && git commit -m "chore: sync lockfile"
```

### Cloud Run deploys but pages show old content

Browser cache or Cloud Run routing lag. Force-reload; `curl -sI https://www.odum-research.com/ | grep -i 'x-cloud-revision'` confirms the active revision.

### Firebase Hosting `central-element-323112` targets `odum-portal` in `firebase.json`

That is the current prod wiring. Do not change `firebase.json` as part of a routine content deploy — it only needs a `firebase deploy --only hosting` run when the hosting config itself changes (rewrites, site bindings, functions predeploy).

---

## Related docs

- `docs/FIREBASE_ENVIRONMENTS.md` — Firebase console + CLI setup per project.
- `docs/core/QA_GATES.md` — quality-gate expectations.
- `unified-trading-pm/codex/14-playbooks/authentication/light-auth-briefings.md` — briefings gate rotation policy.
