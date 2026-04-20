# Firebase — dev, staging, and production (portal)

Use **three separate Firebase / GCP projects** so Auth users, Firestore data, and Hosting defaults never cross between
**local demos**, **staging**, and **production**. The portal reads **web client** keys via `NEXT_PUBLIC_FIREBASE_*`
(baked at Docker build from `config/docker-build.env.*`).

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

| Environment | Typical Firebase project | Portal build-time env SSOT |
|-------------|--------------------------|----------------------------|
| **Local dev** | `odum-portal-dev` (recommended) or reuse an isolated project | `.env.local` (gitignored) |
| **Staging** | `odum-portal-staging` | `config/docker-build.env.staging.firebase.local` (see `docker-build.env.staging.firebase.example`) |
| **Production** | Existing prod project | `config/docker-build.env.production` |

Set `NEXT_PUBLIC_AUTH_PROVIDER=firebase` in dev/staging env files when real keys are present; keep **demo** only for
quick UI churn without Firebase.

## Run Next from the UI directory

`next dev` must be started with **`cwd` = `unified-trading-system-ui`** (or marketing static files will 404). The
loader also tries sibling paths under a monorepo, but the supported workflow is: `cd unified-trading-system-ui && pnpm dev`.
