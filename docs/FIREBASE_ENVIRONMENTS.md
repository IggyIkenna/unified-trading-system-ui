# Firebase — local, staging, and production (portal)

> **Current state:** all three environments live and isolated as of 2026-04-25.
> Per-env SSOTs in codex:
>
> - [firebase-local.md](../../unified-trading-pm/codex/14-playbooks/authentication/firebase-local.md)
> - [firebase-staging.md](../../unified-trading-pm/codex/14-playbooks/authentication/firebase-staging.md)
> - [firebase-production.md](../../unified-trading-pm/codex/14-playbooks/authentication/firebase-production.md)

| Env   | Project ID                  | Host                            | Cloud Run service         | Build env file                       |
| ----- | --------------------------- | ------------------------------- | ------------------------- | ------------------------------------ |
| Local | `odum-local-dev` (emulator) | `localhost:3000`                | n/a                       | `.env.development` / `.env.local`    |
| UAT   | `odum-staging`              | `https://uat.odum-research.com` | `odum-portal-staging`     | `config/docker-build.env.uat`        |
| Prod  | `central-element-323112`    | `https://www.odum-research.com` | `odum-portal` (3 regions) | `config/docker-build.env.production` |

Three projects, **same Next.js bundle**: `lib/auth/firebase-config.ts` reads
`NEXT_PUBLIC_FIREBASE_*` at build time and routes accordingly. The 54 native `/api/v1/*`
Admin SDK routes use the same code path against all three. Result: a bug reproducible against
any project is reproducible against all of them; the only difference is data.

## Local emulator (most dev sessions)

```bash
cd unified-trading-system-ui
bash scripts/dev-tiers.sh --tier 0     # boots emulators + Next.js + auto-seeds personas
```

Tier 0 layers two things: the **Firebase Emulator Suite** (Auth :9099, Firestore :8080, Storage :9199, UI :4000) for SDK calls, and **`NEXT_PUBLIC_MOCK_API=true`** so API gateway-bound fetches resolve from in-repo fixtures via `lib/api/mock-handler.ts`. Sign-in works against the local emulator pool while widgets render without a Python service fleet running. The two layers are orthogonal: Firebase SDK paths bypass mock-handler, and mock-handler doesn't intercept Firebase. Auto-saves state to `.local-dev-cache/emulator-state/` so subsequent boots persist users / docs / files. The first boot writes the demo personas via the auto-seeder; re-seed manually with `npm run emulators:seed`.

Full guide: [codex/14-playbooks/authentication/firebase-local.md](../../unified-trading-pm/codex/14-playbooks/authentication/firebase-local.md).

## Three deviation switches (when local should diverge from the integrated default)

| Switch                       | Effect                                                                               | When                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| `--no-firebase-local`        | Local server talks to a real Firebase project                                        | Reproducing a staging-only bug                        |
| `--no-mock-api`              | Firebase emulator only; widget fetches go nowhere                                    | Auth-flow testing where you want no mock interception |
| `npm run emulators:seed:dev` | Inject extra personas only useful locally (edit `seed-firebase-users.dev.mjs` first) | Edge cases, scale tests, unusual claim shapes         |

Pre-2026-04-28 the firebase-local handoff bypassed the mock-API flag and produced blank widgets ("Failed to load market data"). Now `NEXT_PUBLIC_MOCK_API=true` is part of the Tier 0 default; the row is no longer a "never combine with auth" warning.

## Hydrate from staging snapshot

For development needing realistic data shape (apps + groups + entitlements + audit log):

```bash
npm run emulators:hydrate-from-staging
```

Pulls a managed Firestore export + Auth dump from `odum-staging` into
`.local-dev-cache/firestore-staging-snapshot/` + `.local-dev-cache/auth-staging-export.json`.
Boot once with `--import=...` to load it, then it persists via `--export-on-exit`.

---

## Reference — setting up a fresh Firebase project (rare)

The three above are already provisioned. The instructions below are kept for the rare case
of standing up a new sibling project (e.g. a dedicated EU staging in addition to
`odum-staging`). For day-to-day work use the codex SSOTs linked above.

## What you do in Google Cloud / Firebase Console (once per project)

1. **Create the GCP project** (Firebase console → “Add project”, or Cloud Console). Pick a stable **Project ID**
   (e.g. `odum-portal-dev`, `odum-portal-staging`; production may already be `central-element-323112`).
2. **Enable Firebase Authentication** → Sign-in method → **Email/Password** (and any others you use).
3. **Authorized domains** (Authentication → Settings → Authorized domains): add at least
   `localhost`, `127.0.0.1`, your **staging** host(s) (e.g. `odumresearch.co.uk`), and **production** host(s).
4. **Register a Web app** (Project overview → `</>`) — copy the **Firebase JS SDK** snippet values into the env file
   for that environment (`NEXT_PUBLIC_FIREBASE_*`).
5. **Firestore / Storage** — only if the portal or related services use them in that environment; lock rules before
   any real data.

## Command line (Firebase CLI)

Install: `npm i -g firebase-tools` (you already have `firebase` if `firebase --version` works).

```bash
# Log in (opens browser once)
firebase login

# List existing projects
firebase projects:list

# Create a new project (billing may be required; you will be prompted)
firebase projects:create PROJECT_ID --display-name "Odum Portal Dev"

# Use a project for subsequent commands in this shell
firebase use PROJECT_ID

# Optional: print Web SDK config for the default Web app after you register it in Console
firebase apps:sdkconfig WEB
```

There is **no single CLI command** that replaces the Console steps for **enabling Auth providers** and **authorized
domains** — those remain in the Firebase UI (or Terraform if you add it later).

## Map projects → portal build files

| Environment    | Typical Firebase project                                     | Portal build-time env SSOT                                                                         |
| -------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| **Local dev**  | `odum-portal-dev` (recommended) or reuse an isolated project | `.env.local` (gitignored)                                                                          |
| **Staging**    | `odum-portal-staging`                                        | `config/docker-build.env.staging.firebase.local` (see `docker-build.env.staging.firebase.example`) |
| **Production** | Existing prod project                                        | `config/docker-build.env.production`                                                               |

Set `NEXT_PUBLIC_AUTH_PROVIDER=firebase` in dev/staging env files when real keys are present; keep **demo** only for
quick UI churn without Firebase.

## Run Next from the UI directory

`next dev` must be started with **`cwd` = `unified-trading-system-ui`** (or marketing static files will 404). The
loader also tries sibling paths under a monorepo, but the supported workflow is: `cd unified-trading-system-ui && pnpm dev`.
