# Deploying the Odum Research Website

**SSOT for build + deploy of the Next.js app behind `www.odum-research.com` (prod) and `uat.odum-research.com` (uat).**

UAT and production are **separate, one-at-a-time deploys** — different Cloud Run services, different BUILD_ENV_FILE, different images, different image tags. They may ship different code. Never assume a prod deploy is a no-op because uat just shipped.

`--env=prod|uat` is **required** — there is no silent default. `scripts/deploy-cloud-run.sh` exits `2` if you omit it.

---

## Environments

| Env  | Public URL                      | Cloud Run service       | Image tag     | BUILD_ENV_FILE                       | Firebase Hosting site        | Auth + data mode                                   |
| ---- | ------------------------------- | ----------------------- | ------------- | ------------------------------------ | ---------------------------- | -------------------------------------------------- |
| prod | `https://www.odum-research.com` | `odum-portal`           | `:production` | `config/docker-build.env.production` | `central-element-323112`     | Firebase Auth (`central-element-323112`), live API |
| uat  | `https://uat.odum-research.com` | `odum-portal-staging` † | `:uat`        | `config/docker-build.env.uat`        | `odum-portal-staging-site` † | Demo auth + mock API                               |

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

## Firebase Auth accounts

### Architecture

| Env  | Auth provider                       | Who authenticates                                                               |
| ---- | ----------------------------------- | ------------------------------------------------------------------------------- |
| prod | Firebase (`central-element-323112`) | Real users only. Demo/advisor emails → redirected to UAT before Firebase fires. |
| uat  | Demo (client-side PERSONAS)         | All personas from `lib/auth/personas.ts`, no Firebase needed.                   |

The redirect is based on `NEXT_PUBLIC_SITE_URL` (baked at build time): if it contains `www.odum-research.com`, any `@odum-research.co.uk` or `@odum-research.com` login attempt redirects to `uat.odum-research.com` without touching Firebase.

### Seeding prod Firebase

Run once (requires ADC pointed at `central-element-323112`):

```bash
# Ensure the account exists in Firebase Console first (Authentication → Users → Add user)
node scripts/admin/seed-firebase-users.mjs --env=prod
```

This sets `{ role: "admin", entitlements: ["*"] }` as custom claims on `ikenna@odum-research.com`.
The `firebase-provider.ts` reads these claims on login and bypasses all backend calls.

### Seeding staging Firebase (when separate project is created)

```bash
FIREBASE_STAGING_PROJECT=your-staging-project-id \
  node scripts/admin/seed-firebase-users.mjs --env=staging
```

Creates all 22 demo personas from `lib/auth/personas.ts` with their entitlements as custom claims.
Passwords match the persona definitions (e.g. `OdumIR2026!` for IR accounts, `demo` for others).
When `staging` is seeded, update `config/docker-build.env.uat` to set `NEXT_PUBLIC_AUTH_PROVIDER=firebase`
and point the Firebase config vars at the staging project.

---

## Public form submissions (questionnaire / strategy-evaluation)

Both forms write to Firestore + send confirmation email via Resend. The persistence
target is keyed off `NEXT_PUBLIC_FIREBASE_*` baked at build time:

| Env  | Firestore project                                                               | Email sender (Resend)                                                                                  |
| ---- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| prod | `central-element-323112`                                                        | `hello@mail.odum-research.com`                                                                         |
| uat  | Same as prod by default; override via the staging-firebase template (see below) | `hello@mail.uat.odum-research.com`                                                                     |
| dev  | None (writes silently no-op)                                                    | `onboarding@resend.dev` — Resend's test domain; only delivers to the email tied to your Resend account |

### Pointing UAT at a separate Firebase project

To make UAT submissions land in their own Firestore (so prod and UAT can be tested
independently without polluting each other):

1. Create a new Firebase project in the console (e.g. `odum-staging`).
2. Add a Web app, copy the config values.
3. Copy the template:
   ```bash
   cp config/docker-build.env.staging.firebase.example \
      config/docker-build.env.uat.firebase.local
   ```
   Fill in the `NEXT_PUBLIC_FIREBASE_*` values from the new project. Set
   `NEXT_PUBLIC_SITE_URL=https://uat.odum-research.com` and keep `NEXT_PUBLIC_MOCK_API=true`.
4. Deploy UAT with the override:
   ```bash
   bash scripts/deploy-cloud-run.sh --env=uat --cloud \
     --build-env-file=config/docker-build.env.uat.firebase.local
   ```
5. Add to the staging-project's Storage and Firestore rules — the same files that
   live in `storage.rules` and `firestore.rules` apply (anonymous create on
   `strategy-evaluations/*` + `questionnaires/*`, admin-only read).
6. Optionally seed staging personas (see "Seeding staging Firebase" above).

### Local dev — testing the full email flow

1. Create `.env.local` (gitignored) with at minimum:
   ```
   RESEND_API_KEY=re_...your-key...
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
   Optionally set `NEXT_PUBLIC_FIREBASE_*` to your staging project to test
   Firestore persistence locally too.
2. `npm run dev` and submit a form using **the email address tied to your Resend account**
   (Resend's test domain `onboarding@resend.dev` only delivers to the verified owner).
3. Magic-link emails use `NEXT_PUBLIC_SITE_URL` for the `/strategy-evaluation/status?token=...`
   URL, so dev links open against `http://localhost:3000`.

If `RESEND_API_KEY` is unset locally, submissions still succeed and console-log; no email fires.
If `NEXT_PUBLIC_FIREBASE_*` is unset, Firestore writes silently no-op (the route returns
`ok: true` but no submission is persisted) — fine for UI-only testing.

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
