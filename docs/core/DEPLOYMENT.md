# Deploying the Odum Research Website

**SSOT for build + deploy of the Next.js app behind `www.odum-research.com` (prod) and `uat.odum-research.com` (uat).**

UAT and production are **separate, one-at-a-time deploys** — different Cloud Run services, different BUILD_ENV_FILE, different images, different image tags. They may ship different code. Never assume a prod deploy is a no-op because uat just shipped.

`--env=prod|uat` is **required** — there is no silent default. `scripts/deploy-cloud-run.sh` exits `2` if you omit it.

---

## Service map across the workspace

The portal (`unified-trading-system-ui`, this repo) is **just the frontend**. It calls multiple sibling services, each in its own repo, each deployed as its own Cloud Run service:

| Repo                        | Cloud Run service      | Region(s)                                                        | Purpose                                 |
| --------------------------- | ---------------------- | ---------------------------------------------------------------- | --------------------------------------- |
| `unified-trading-system-ui` | `odum-portal`          | europe-west4 + us-central1 + asia-northeast1 (multi-region prod) | The Next.js public + signed-in portal   |
| `unified-trading-api`       | `unified-trading-api`  | (varies per env)                                                 | Main trading backend                    |
| `user-management-api`       | `user-management-api`  | us-central1                                                      | Auth / role / entitlement `/authorize`  |
| `client-reporting-api`      | `client-reporting-api` | us-central1                                                      | Client-facing P&L, performance, exports |
| `deployment-api`            | `deployment-api`       | us-central1                                                      | Deployment automation                   |

The portal calls these via `NEXT_PUBLIC_*_URL` env vars baked at build time. **`user-management-api` is not part of this repo** — it's a sibling service whose URL is configured in `docker-build.env.production`.

---

## Multi-region prod

`odum-portal` (the UI) deploys to **3 regions** for global latency and HA:

- `europe-west4` → `odum-portal-cldtjniqvq-ez.a.run.app`
- `us-central1` → `odum-portal-cldtjniqvq-uc.a.run.app`
- `asia-northeast1` → `odum-portal-cldtjniqvq-an.a.run.app`

A Google global HTTPS load balancer in front of `www.odum-research.com` routes each user to the nearest healthy region. Same image tag (`:production`) deployed to all three; same env file; identical code. The image lives in a single Artifact Registry (`europe-west4-docker.pkg.dev/...`) and is pulled by Cloud Run in each region.

⚠️ **`scripts/deploy-cloud-run.sh --env=prod` only deploys to `europe-west4` today.** us-central1 and asia-northeast1 get refreshed by a separate workflow. **It's easy to ship a europe-only fix and leave US / Asia stale** — verify with `gcloud run services list --region=us-central1 --project=central-element-323112` and `gcloud run services list --region=asia-northeast1 --project=central-element-323112` after a prod deploy that needs to reach all users. Improving the deploy script to fan out to all three (or fail loudly) is a follow-up.

UAT is single-region (`europe-west4`). No multi-region need — UAT serves staff testing, not global customer traffic.

---

## Environments

| Env  | Public URL                      | Cloud Run service       | GCP project (compute / Firebase)                    | Image tag     | BUILD_ENV_FILE                       |
| ---- | ------------------------------- | ----------------------- | --------------------------------------------------- | ------------- | ------------------------------------ |
| prod | `https://www.odum-research.com` | `odum-portal`           | `central-element-323112` / `central-element-323112` | `:production` | `config/docker-build.env.production` |
| uat  | `https://uat.odum-research.com` | `odum-portal-staging` † | `central-element-323112` / `odum-staging`           | `:uat`        | `config/docker-build.env.uat`        |

**UAT compute lives on `central-element-323112` but UAT data + auth live on `odum-staging`.** Decoupled by design — the UI bundle is built with `NEXT_PUBLIC_FIREBASE_*` pointing at `odum-staging`, so when the user's browser calls Firebase APIs they go directly to the staging project, bypassing Cloud Run entirely. Cloud Run is just the static-asset host. See `config/docker-build.env.uat` header comment for the full split.

**Why isn't UAT compute on `odum-staging` too?** Pipeline cost. Cloud Build triggers, Artifact Registry, GitHub Actions deploy SAs, secrets — all wired against `central-element-323112`. Moving UAT compute to staging means duplicating that infra. Cheaper to keep compute on prod and isolate the data layer where it actually matters (Auth pool, Firestore, Storage). If/when that calculus changes, parallel pipeline on `odum-staging` is a separate plan.

† The Cloud Run service name and Firebase Hosting site still carry the historical "staging" suffix. Renaming them to `odum-portal-uat` / `odum-portal-uat-site` is a clean-up pass (create new service + site → move domain mapping + hosting target → delete old — involves a cert-provisioning window). Until then: the service/site names in GCP / Firebase console say "staging"; every other surface (domain, env file, deploy flag, image tag, Firebase target alias) says "uat". See §Follow-ups.

`odum-research.co.uk` is a **redirect-only** domain. It forwards (via Squarespace) to `https://www.odum-research.com`. No Cloud Run service or Firebase Hosting site is bound to `.co.uk` in steady state.

**NEXT*PUBLIC*\* are inlined at Docker build time.** Cloud Run runtime `--set-env-vars` cannot retroactively change an already-baked client bundle. Change env → rebuild image → redeploy.

---

## Quick reference

```bash
# UAT (deploy to odum-portal-staging; serves uat.odum-research.com)
bash scripts/deploy-cloud-run.sh --env=uat --cloud

# Production (deploy to odum-portal; serves www.odum-research.com)
bash scripts/deploy-cloud-run.sh --env=prod --cloud
```

`--env` is **required**. Running without it (or with the old `--production` flag) exits `2` with an error.

Cloud Build (`--cloud`) is the default: it produces a `linux/amd64` image and avoids Apple-Silicon architecture mismatches. Drop `--cloud` only if you have `docker buildx` set up for amd64 locally.

### Override the env file for a one-off uat build

```bash
bash scripts/deploy-cloud-run.sh --env=uat --cloud \
  --build-env-file=config/docker-build.env.staging.firebase.local
```

Useful when testing a dedicated uat Firebase project (see `config/docker-build.env.staging.firebase.example`).

---

## Build speed: cache-from is already wired

`scripts/cloudbuild-odum-portal.yaml` pulls the previous image tag before every build and passes `--cache-from`. A **code-only change** (no `package.json` / `pnpm-lock.yaml` diff) reuses the already-built `deps` stage layer — dependency install + `node_modules` are skipped on warm builds.

First deploy of a new tag = cold build. Every deploy after that = warm. **Never bump a dependency as part of a purely-content deploy** if you care about build time.

To force a cold build (debug a cache hit): run the deploy with `--no-cache` after the `docker build` args, or `docker image rm <image>:uat` in the registry UI.

### Local warm cache

`docker buildx build` reuses local layer cache automatically — same semantics. Turbopack's filesystem cache (`turbopackFileSystemCacheForBuild: true` in `next.config.mjs`) makes `pnpm build` in the host shell (not Docker) noticeably faster on the second run.

---

## Two-environment contract

UAT and production are **not a single pipeline**. They are:

- **Separate services.** `odum-portal` (prod) and `odum-portal-staging` (uat, pending rename) are independent Cloud Run services with independent revisions. Rolling one back does not roll the other back.
- **Separate images.** Never tag the uat image `:production` or vice versa. The Dockerfile bakes different `NEXT_PUBLIC_*` values for each.
- **Deployed one at a time.** Never deploy both in one operation — you lose the ability to uat-test a change before it hits prod. The script enforces this via `--env=prod|uat` being required with no silent default.
- **Allowed to diverge.** Shipping uat does not imply shipping prod. A uat build can carry in-progress content; prod only advances when you explicitly run `--env=prod`.

The expected flow for any customer-visible change:

1. `bash scripts/deploy-cloud-run.sh --env=uat --cloud` — uat build + deploy.
2. Smoke-test `https://uat.odum-research.com/`.
3. `bash scripts/deploy-cloud-run.sh --env=prod --cloud` — prod build + deploy.
4. Smoke-test `https://www.odum-research.com/`.

Do **not** skip step 2. The same Next.js code runs in both envs, but the baked env vars differ — what passes locally in demo mode can still break when Firebase Auth is wired up on prod.

---

## Quality gates before deploy

```bash
bash scripts/quality-gates.sh
```

Runs lint + unit tests + `next build`. Cloud Build does not currently run QG inside `cloudbuild-odum-portal.yaml` — the top-level `cloudbuild.yaml` does, but it's for the `asia-northeast1` image path, not the `europe-west4` deploy path. Run QG locally before every deploy.

If QG fails: **fix the failing code, don't bypass the gate.** The only acceptable skips are advisory (e.g. generated diagrams). A red gate on a production deploy is not a generate-and-ignore situation.

---

## Firebase project split

`.firebaserc` declares project aliases + hosting targets.

Project aliases (`projects`):

- `default` / `prod` → `central-element-323112`
- `staging` → `odum-staging` (reserved; see below)

Hosting targets (`targets.central-element-323112.hosting`):

- `prod` → site `central-element-323112` (serves `odum-research.com` via rewrites to Cloud Run `odum-portal`)
- `uat` → site `odum-portal-staging-site` (serves `uat.odum-research.com` via rewrites to Cloud Run `odum-portal-staging` — currently routed through Cloud Run's own domain mapping, not Firebase Hosting; Firebase Hosting binding for `uat.` is a follow-up that would need DNS A-records → `199.36.158.100`)

Today, both uat and production build **against the prod Firebase project** (`central-element-323112`). The uat build uses demo auth + mock API (`NEXT_PUBLIC_AUTH_PROVIDER=demo`, `NEXT_PUBLIC_MOCK_API=true`), so it never touches the live Firestore — the `odum-staging` project is reserved but not yet wired end-to-end.

To activate dedicated uat Firebase:

1. Copy `config/docker-build.env.staging.firebase.example` → `config/docker-build.env.uat.firebase.local` (gitignored).
2. Fill in the `odum-staging` web-app keys.
3. `firebase use staging` before `firebase deploy --only hosting:uat`.
4. Run `bash scripts/deploy-cloud-run.sh --env=uat --cloud --build-env-file=config/docker-build.env.uat.firebase.local`.

This is a **follow-up**, not a prerequisite for content deploys. See `docs/FIREBASE_ENVIRONMENTS.md` for the console-side setup.

---

## Briefings / light-auth gate

`NEXT_PUBLIC_BRIEFING_ACCESS_CODE` (set in both env files) gates `/briefings/*` and `/docs`. The current shared code is `odum-briefings-2026`. Rotation policy: `unified-trading-pm/codex/14-playbooks/authentication/light-auth-briefings.md`. If the code is empty in the env file, the gate is **open**. This is load-bearing for the advisor flow — if you zero it out without confirming, you have publicly exposed the briefings hub.

---

## Firebase Auth + GCP IAM topology

### Two isolated Firebase projects (provisioned 2026-04-25)

| Env  | GCP / Firebase project   | Auth pool                                 | Firestore             | Storage default bucket               |
| ---- | ------------------------ | ----------------------------------------- | --------------------- | ------------------------------------ |
| prod | `central-element-323112` | Real users only                           | `(default)` in `eur3` | `central-element-323112.appspot.com` |
| uat  | `odum-staging`           | Demo personas + internal team for testing | `(default)` in `eur3` | `odum-staging.firebasestorage.app`   |

UAT and prod have **fully isolated** Auth pools, Firestore data, Storage buckets, and IAM. Anyone admin'ing UAT cannot affect prod. Keys for `odum-staging` are baked into `config/docker-build.env.uat`.

### Per-env admins (target IAM state)

| Project                  | Project owners (`roles/owner`)                       | Firebase admin (`roles/firebase.admin`)                      |
| ------------------------ | ---------------------------------------------------- | ------------------------------------------------------------ |
| `central-element-323112` | `ikenna@odum-research.com`, `femi@odum-research.com` | (not granted directly — owners have it implicitly)           |
| `odum-staging`           | `ikenna@odum-research.com` (project creator)         | `femi@odum-research.com`, `harshkantariya@odum-research.com` |

`harshkantariya@odum-research.com` is staging-only — never grant `firebase.admin` on prod. The script that mirrors his prod operational roles from the legacy Gmail (`harshkantariya.work@gmail.com`) is at `scripts/admin/grant-harsh-iam.sh` and explicitly excludes `firebase.admin` on prod.

### Seeding staging Firebase

```bash
FIREBASE_STAGING_PROJECT=odum-staging \
  node scripts/admin/seed-firebase-users.mjs --env=staging
```

Creates all 22 demo personas from `lib/auth/personas.ts` as Firebase Auth users in `odum-staging`, with their entitlements as custom claims. Passwords are bumped to ≥6 chars (Firebase minimum) — `demo` → `demo123`; `OdumIR2026!` accounts unchanged.

### Seeding prod Firebase

```bash
# Ensure the admin account exists in Firebase Console first (admin.google.com → Users)
node scripts/admin/seed-firebase-users.mjs --env=prod
```

This sets `{ role: "admin", entitlements: ["*"] }` as custom claims on `ikenna@odum-research.com`. `firebase-provider.ts` reads these claims on login and bypasses all backend calls.

### Login routing on prod

Demo/advisor emails (`@odum-research.co.uk`, `@odum-research.com` non-staff) on `www.odum-research.com` get redirected to `uat.odum-research.com/login` before Firebase Auth fires. Detection is via `NEXT_PUBLIC_SITE_URL` (baked at build), not `window.location.hostname`, so this also works when accessing prod via the Cloud Run URL.

---

## Public form submissions (questionnaire / strategy-evaluation)

Both forms write to Firestore + send confirmation email via Resend. The persistence
target is the env-specific Firebase project (now fully isolated since 2026-04-25):

| Env  | Firestore project            | Email sender (Resend)                                                                                  |
| ---- | ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| prod | `central-element-323112`     | `hello@mail.odum-research.com` — DKIM + SPF verified                                                   |
| uat  | `odum-staging`               | `hello@mail.uat.odum-research.com` ⚠️ **DKIM/SPF not yet set up** (see below)                          |
| dev  | None (writes silently no-op) | `onboarding@resend.dev` — Resend's test domain; only delivers to the email tied to your Resend account |

⚠️ **Resend domain verification for `mail.uat.odum-research.com` is a separate setup.** The DKIM/SPF records you added for `mail.odum-research.com` do NOT cover the `mail.uat.` subdomain — Resend verifies per exact subdomain. Until the staging subdomain is verified, sends from `hello@mail.uat.odum-research.com` will fail SPF/DKIM and likely be quarantined. Two options:

- **Easy:** in `lib/email/resend.ts` `getMailDomain()`, change the uat branch to return `mail.odum-research.com` instead of `mail.uat.odum-research.com`. UAT sends then route through the prod-domain sender. Minor cosmetic confusion (UAT users see "@mail.odum-research.com" in the From), but works today with no DNS changes.
- **Properly isolated:** in Resend dashboard → Domains → Add domain → `mail.uat.odum-research.com`. Resend gives you 4 DKIM CNAMEs + 1 SPF TXT for that exact subdomain. Add them to your DNS (probably via Squarespace or wherever `odum-research.com` is hosted). Then the staging-domain sender starts delivering cleanly.

Recommended: do the easy fix today, plan the properly-isolated setup when UAT-sourced email volume / cosmetic distinction actually matters.

API routes use the **Admin SDK** (`firebase-admin`) on the server — runs as the Cloud Run service account. Works regardless of `NEXT_PUBLIC_FIREBASE_*` bake-state. The Cloud Run service account `1060025368044-compute@developer.gserviceaccount.com` (prod's compute SA) has cross-project `datastore.user` + `storage.admin` + `firebaseauth.admin` on `odum-staging` so the same UAT image can hit the staging project from server-side routes.

### Storage rules

Both projects use `storage.rules` from the repo. Public-write paths (`strategy-evaluations/{draftId}/{fieldKey}/{filename}`) are gated by **size cap (500 MB) only** — no content-type allow-list (browser MIMEs vary too much for `.md`, exotic CSVs, etc.). Read access stays admin / im_desk-claim-gated. Deploy with:

```bash
firebase deploy --only storage --project central-element-323112  # prod
firebase deploy --only storage --project odum-staging            # uat
```

### Local dev — testing the full email flow

1. Create `.env.local` (gitignored) with at minimum:
   ```
   RESEND_API_KEY=re_...your-key...
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
   Optionally set `NEXT_PUBLIC_FIREBASE_*` to `odum-staging` to test Firestore persistence
   against the real staging project.
2. `npm run dev` and submit a form using **the email address tied to your Resend account**
   (Resend's test domain `onboarding@resend.dev` only delivers to the verified owner).
3. Magic-link emails use `NEXT_PUBLIC_SITE_URL` for the `/strategy-evaluation/status?token=...`
   URL, so dev links open against `http://localhost:3000`.

If `RESEND_API_KEY` is unset locally, submissions still succeed and console-log; no email fires.
If `NEXT_PUBLIC_FIREBASE_*` is unset, Firestore writes silently no-op (the route returns
`ok: true` but no submission is persisted) — fine for UI-only testing.

### Local dev — Firebase Emulator Suite (default-on since 2026-04-25)

Every `bash scripts/dev-tiers.sh --tier <N>` invocation auto-boots the Firebase Emulator
Suite alongside Next.js so a developer can never accidentally write drafts / claims / file
uploads to the real `odum-staging` or `central-element-323112` projects from their machine.

```bash
bash scripts/dev-tiers.sh --tier 0          # UI + emulators (default)
bash scripts/dev-tiers.sh --tier 0 --no-firebase-local  # opt-out (rare)
bash scripts/dev-tiers.sh --stop            # kill everything
```

Stack: Auth :9099 (Node), Firestore :8080 (JVM), Storage :9199 (JVM), Emulator UI :4000
(browser inspector), Hub :4400 (internal coordination), Next.js :3000.

**Java requirement:** Firestore + Storage emulators are JVM apps. The dev-tiers script
auto-locates a brew-installed OpenJDK 21 (Apple Silicon and Intel paths both probed) and
sets `JAVA_HOME`. If neither is installed:

```bash
brew install openjdk@21
```

The macOS `/usr/bin/java` shim is detected and bypassed (it just opens an "install Java" dialog).

#### Persistence

Emulator state is auto-saved to `.local-dev-cache/emulator-state/` on shutdown via
`--export-on-exit` and reloaded on next start via `--import`. Wipe everything with
`bash scripts/dev-tiers.sh --reset`.

| State           | Path                                                | Survives restart? |
| --------------- | --------------------------------------------------- | ----------------- |
| Auth users      | `.local-dev-cache/emulator-state/auth_export/`      | ✅                |
| Firestore docs  | `.local-dev-cache/emulator-state/firestore_export/` | ✅                |
| Storage objects | `.local-dev-cache/emulator-state/storage_export/`   | ✅                |

#### Seeding

```bash
npm run emulators:seed                  # 23 personas matching staging shape
npm run emulators:seed:dev              # local-only edge-case fixtures (edit dev.mjs first)
npm run emulators:hydrate-from-staging  # pull a real Firestore + Auth snapshot from odum-staging
```

`emulators:seed` fires once on a fresh emulator boot to populate the Auth pool with the same
23 demo personas that staging has, password `demo123`. Subsequent boots persist via
`--export-on-exit`.

`emulators:hydrate-from-staging` is for development that needs realistic data shape (apps +
groups + entitlements + audit log + onboarding requests, not just Auth users): it runs
`gcloud firestore export` against `odum-staging`, downloads the export to
`.local-dev-cache/firestore-staging-snapshot/`, and dumps Auth via `firebase auth:export`.
You then boot once with `--import=.local-dev-cache/firestore-staging-snapshot` to load it.

`emulators:seed:dev` reads `scripts/admin/seed-firebase-users.dev.mjs` for fixtures only
useful locally (pagination at scale, weird claim shapes). The script refuses to run unless
the emulator host env vars are set, so a misconfiguration can never write to staging or prod.

SSOT: [unified-trading-pm/codex/14-playbooks/authentication/firebase-local.md](../../../unified-trading-pm/codex/14-playbooks/authentication/firebase-local.md).

### Local dev — demo personas vs Firebase users

The 23 personas in `lib/auth/personas.ts` exist in two parallel forms:

| Where     | Auth provider                             | Login password                               | Source                               |
| --------- | ----------------------------------------- | -------------------------------------------- | ------------------------------------ |
| Local dev | demo (client-side)                        | as in `personas.ts` (`demo` / `OdumIR2026!`) | Validated against in-memory PERSONAS |
| UAT       | firebase against `odum-staging`           | bumped to `demo123` (Firebase 6-char min)    | Seeded via `seed-firebase-users.mjs` |
| Prod      | firebase against `central-element-323112` | only `ikenna@` exists with admin claim       | Manually created in Firebase console |

Same persona email everywhere; password differs by environment because Firebase enforces a 6-char minimum that the demo provider doesn't. The DemoPlanToggle (`lib/auth/tier-override.ts`) is provider-agnostic — it overlays entitlements via localStorage on top of the authenticated user, so a UAT user can flip between FOMO ("show me everything in the catalogue") and scoped ("show me only what my plan buys") without re-login.

---

## API token-verification — seam closed 2026-04-25

This seam used to be open: the legacy `user-management-api` Cloud Run service ran in
`central-element-323112` and its auth middleware verified Firebase ID tokens against a single
project. UAT bundles signed by `odum-staging` would have hit a token-audience rejection.

**Resolved by retiring the API.** All admin endpoints now run as native `/api/v1/*` Next.js
routes inside this repo, on the same Cloud Run service that serves the bundle. The Firebase
Admin SDK auto-resolves project ID from `NEXT_PUBLIC_FIREBASE_PROJECT_ID` baked at build
time — UAT bundle reads `odum-staging`, prod bundle reads `central-element-323112`, local
emulator reads `odum-local-dev`. Token verification never crosses a project boundary.

The 54 native routes are listed in `app/api/v1/*` and described in
[unified-trading-pm/codex/14-playbooks/authentication/README.md](../../../unified-trading-pm/codex/14-playbooks/authentication/README.md)
§"All admin endpoints native (2026-04-25)".

The legacy source is preserved at `archive/user-management-api-2026-04-25/` for historical
reference; do not import or extend it. New endpoints go in `app/api/v1/*` as Next.js route
handlers.

---

## Manual / fallback commands

Use these when the script fails or you need finer control.

### Cloud Build (uat)

```bash
gcloud builds submit . \
  --config=scripts/cloudbuild-odum-portal.yaml \
  --substitutions=_IMAGE="europe-west4-docker.pkg.dev/central-element-323112/cloud-run-source-deploy/odum-portal:uat",_BUILD_ENV_FILE=config/docker-build.env.uat \
  --timeout=1200 \
  --project=central-element-323112
```

### Cloud Run deploy (uat)

```bash
gcloud run deploy odum-portal-staging \
  --image europe-west4-docker.pkg.dev/central-element-323112/cloud-run-source-deploy/odum-portal:uat \
  --region europe-west4 \
  --platform managed \
  --allow-unauthenticated \
  --port=3000
```

### Same for production — swap `:uat` → `:production`, `docker-build.env.uat` → `docker-build.env.production`, and `odum-portal-staging` → `odum-portal`.

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

## Follow-ups (not blockers for routine deploys)

1. **Rename Cloud Run service `odum-portal-staging` → `odum-portal-uat`.** Workflow: `gcloud run services describe odum-portal-staging --region=europe-west4` to dump the config, recreate as `odum-portal-uat` with the same `:uat` image, move the `uat.odum-research.com` domain mapping to the new service (delete-and-recreate; ~10 min cert-provisioning window), update `scripts/deploy-cloud-run.sh:SERVICE_UAT`, `firebase.json` `rewrites[].run.serviceId`, and this doc, then delete the old service.
2. **Rename Firebase Hosting site `odum-portal-staging-site` → `odum-portal-uat-site`.** Firebase site names are immutable; the workflow is `firebase hosting:sites:create odum-portal-uat-site` → `firebase target:apply hosting uat odum-portal-uat-site` → `firebase deploy --only hosting:uat` → `firebase hosting:sites:delete odum-portal-staging-site`. Brief outage only on that specific `.web.app` URL; `uat.odum-research.com` is unaffected because it routes via Cloud Run domain mapping, not Firebase Hosting today.
3. **Bind `uat.odum-research.com` to the Firebase Hosting uat site.** Requires DNS A-record change at Squarespace: change `CNAME uat → ghs.googlehosted.com.` to the A-record set Firebase Console provides (typically `A uat → 199.36.158.100`). Then add the custom domain in Firebase Console on the uat site. At that point Firebase Hosting serves uat and the Cloud Run domain mapping for `uat.*` can be deleted.
4. **Confirm `odum-research.co.uk` Squarespace forwarding → `https://www.odum-research.com`** and then delete the Cloud Run domain mapping for `.co.uk` (currently still mapped to `odum-portal-staging`; harmless but dead once forwarding is on).

---

## Related docs

- `docs/FIREBASE_ENVIRONMENTS.md` — Firebase console + CLI setup per project.
- `docs/core/QA_GATES.md` — quality-gate expectations.
- `unified-trading-pm/codex/14-playbooks/authentication/light-auth-briefings.md` — briefings gate rotation policy.
