# Security — authentication, provisioning, and GCP blast radius

This note complements `docs/DEPLOYMENT.md` with **threat-model expectations** for the website and its backing services.

## Firebase and custom claims

- Firebase **custom claims** are set only via **Admin SDK on trusted servers**, not from the browser.
- The UI calls provisioning / user-management APIs through `/api/auth/*`, which `next.config.mjs` rewrites to `NEXT_PUBLIC_AUTH_URL` (see deployment docs). **All privilege changes must be enforced in that service** (or equivalent backend), not inferred from OAuth identity alone.

### deployment-api (`/api/user-management/*`)

The trading portal also surfaces **deployment RBAC users** via the gateway path `…/deployment-api/api/user-management/*` (see `unified-trading-system-ui` OpenAPI registry). That surface is implemented in-repo by **`deployment-api`**:

- **Actor identity:** trusted gateways set **`X-Acting-User-Email`** to the signed-in human. `deployment-api` copies it onto `request.state.user_email` via `ActingUserMiddleware` (`deployment_api/middleware.py`). Role mutations return **400** if this header is missing while `DISABLE_AUTH` is false.
- **Org-owner allowlist:** comma-separated **`ORG_OWNER_EMAILS`** on the deployment-api process (see `DeploymentApiConfig.org_owner_emails`). Only those emails may grant **`admin`** or **`super_admin`** to another principal.
- **Self-elevation:** blocked when the new role rank is strictly above the previous rank for the **same** email (`deployment_api/security/provisioning_guards.py`).
- **Rank rule:** callers who are **not** org owners cannot grant a role **above their own** RBAC role.
- **Audit events:** `PROVISIONING_USER_CREATE`, `PROVISIONING_USER_ROLE_PATCH`, `PROVISIONING_ROLE_ASSIGN` are emitted from `deployment_api/routes/user_management.py` in addition to existing `USER_*` service logs.

The separate **user-management / authorize** host configured as `NEXT_PUBLIC_USER_MGMT_API_URL` (port **8017** in local topology docs) must apply the **same policy class** if it performs writes; keep capability maps aligned with `lib/auth/firebase-provider.ts` in the portal. The **`user-management-ui`** repo implements this on the bundled Express API (`server/index.js`): **`ORG_OWNER_EMAILS`**, **`PLATFORM_OWNER_UIDS`**, self-elevation blocks for platform `admin` and privileged app roles, **`X-Acting-User-Email`** must match the token email when sent, and the Next client attaches that header from `lib/api/client.ts` — see `user-management-ui/docs/SECURITY_PROVISIONING.md`.

**Example env (deployment-api):** `deployment-api/config/example-provisioning.env` lists `ORG_OWNER_EMAILS` and the acting-user header contract.

## Provisioning rules (must-have)

1. **Org-owner allowlist** for actions that grant `admin`, wildcard `*`, or org-wide entitlements (UID/email allowlist, Google Group checked with a **service account**, etc.).
2. **Deny self-elevation** — callers cannot grant themselves roles or capabilities above their current maximum; no “grant if caller is authenticated” shortcuts.
3. **Audit log** — append-only record of who changed claims or org permissions, with before/after payloads.

Map backend capabilities to UI entitlements in `lib/auth/firebase-provider.ts` (`CAPABILITY_TO_ENTITLEMENT`). When adding investor-only keys (for example `investor.archive` → `investor-archive`), update the **authorisation service** capability catalogue in lockstep.

## Staging Firebase project (second user database)

- **Never** bake production `NEXT_PUBLIC_FIREBASE_PROJECT_ID` into staging images.
- When ready, create a **separate Firebase/GCP project** for staging, copy
  `config/docker-build.env.staging.firebase.example` to a **gitignored** env file, fill web keys + URLs, and
  deploy with `bash scripts/deploy-cloud-run.sh --build-env-file=<path>` so the `:staging` image bakes
  `NEXT_PUBLIC_AUTH_PROVIDER=firebase` without editing the default demo `docker-build.env.staging`.
- Document rotation and which Cloud Run revision consumes which `BUILD_ENV_FILE` (see `docs/DEPLOYMENT.md`).

## GCP IAM and data plane

- End-user Firebase tokens must **not** imply GCS bucket admin, Firestore superuser, or Cloud Run deployer roles.
- Destructive or bulk operations should use **dedicated service accounts** with least privilege.
- Review Firestore / Storage security rules independently of Auth — rules must not trust client-supplied roles.

### Data plane review checklist (Firestore / GCS)

Use this as a **P1 close-out** for any project that stores user or investor content:

1. **Firestore rules** — default deny; no client write to `user_profiles`, entitlements, audit collections, or
   admin-only docs. Only the **user-management** Express API / Admin SDK paths used in operations may mutate
   privileged collections (`user-management-ui/server/index.js` is the in-repo reference server).
2. **Storage rules** — uploads scoped by `request.auth.uid` and path prefix; no public write buckets for
   operational data.
3. **Indexes** — confirm query surfaces used by the UI do not leak cross-tenant rows when rules tighten.
4. **Break-glass** — document who can deploy rule changes and how changes are reviewed (link from runbooks).

## Lighter-gate (`/briefings`)

- Optional `NEXT_PUBLIC_BRIEFING_ACCESS_CODE` gates the hub; acceptance is stored under `odum-briefing-session` in `localStorage` (see `lib/briefings/session.ts`). This is **not** a substitute for entitlements on Investor Relations or Platform routes.
