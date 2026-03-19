---
name: user-management-platform-2026-03-13
overview:
  "New repo user-management-ui: Odum's own Okta replacement. Full lifecycle user management — onboard, modify, off-board
  with one click. Provisions GitHub, Slack, Microsoft 365 (Outlook + SharePoint), GCP IAM, and website portal access per
  role. Matches deployment-ui visual style."
todos:
  - id: unblock-microsoft-admin
    content:
      "[HUMAN BLOCKER — must complete before implementation starts] (1) Grant Femi Amoo Microsoft 365 admin role in
      Microsoft 365 Admin Center. (2) Grant Femi Slack Workspace Admin role. (3) Detach Outlook from Okta: M365 Admin
      Center → Azure AD → Enterprise Apps → remove Okta as IdP. (4) Detach Slack from Okta: Slack Admin → Authentication
      → remove Okta SAML/SSO. Document completion in unified-trading-pm/docs/okta-migration.md."
    status: blocked
  - id: scaffold-repo
    content:
      "- [x] Create IggyIkenna/user-management-ui GitHub repo. Scaffold from deployment-ui as visual template: same
      React 19 + Vite + Tailwind setup. Install @unified-admin/core (auth, types) + @unified-trading/ui-kit (design
      tokens, components). Same sidebar nav pattern, same AppShell, same auth wrapper as deployment-ui. Port 5184.
      Collaborators: datadodo, CosmicTrader (admin)."
    status: done
  - id: add-to-workspace-manifest
    content:
      "- [x] Add user-management-ui entry to workspace-manifest.json: type=ui, arch_tier=ui, cluster=admin-ui,
      merge_level=11, github_url=https://github.com/IggyIkenna/user-management-ui, dependencies=[unified-admin-ui,
      unified-trading-ui-kit]. Added to workspace-uis.code-workspace, workspace-complete.code-workspace,
      unified-trading-system-repos.code-workspace, and ui-api-mapping.json (port 5184)."
    status: done
  - id: setup-quality-gates
    content:
      "- [x] Add scripts/quality-gates.sh (sources base-ui.sh from PM — shared with all UI repos). Add
      .github/workflows/quality-gates.yml + 5 more workflows (semver-agent, staging-lock, request-major-bump,
      major-bump-issue-handler, update-dependency-version). Configure vitest.config.ts (pool: forks, 70% coverage) +
      playwright.config.ts. GH secrets: GH_PAT, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID. Includes Dockerfile,
      cloudbuild.yaml, .pre-commit-config.yaml, .cursorignore, .actrc, .npmrc, symlinks (CLAUDE.md, quickmerge.sh,
      pre-flight-audit.sh)."
    status: done
  - id: design-person-schema
    content: |-
      Define Person type in @unified-admin/core/types/person.ts: { id: string, name: string, email: string, role: UserRole,
        github_handle?: string, microsoft_upn?: string, slack_handle?: string,
        gcp_email?: string, product_slugs: string[], status: 'active'|'offboarded'|'pending',
        provisioned_at: string, last_modified: string,
        services: { github: bool, slack: bool, microsoft365: bool, gcp: bool, portal: bool } }
    status: todo
  - id: build-users-list-page
    content:
      "- [x] UsersPage.tsx: table of all users. Columns: name, email, role, status, GitHub ✓/✗, Slack ✓/✗, M365 ✓/✗, GCP
      ✓/✗, AWS ✓/✗, Portal ✓/✗ (6 services). Click row → user detail. Search + role filter + status filter. 8 mock
      users."
    status: done
  - id: build-onboard-user-page
    content:
      "- [x] OnboardUserPage.tsx: form with name, email, role selector, product slugs (multi-select for client roles),
      GitHub handle (for admin/collaborator roles only). On submit: triggers provisioning for up to 6 services; shows
      live status per step (GitHub ✓, Slack ✓, M365 ✓, GCP ✓, AWS ✓, Portal ✓). Mock mode returns instant success."
    status: done
  - id: build-modify-user-page
    content:
      "ModifyUserPage.tsx: change role, add/remove product slugs (for client roles), re-provision individual services,
      view provisioning history."
    status: todo
  - id: build-offboard-page
    content:
      "- [x] Offboard built into UserDetailPage.tsx (not separate page): confirm dialog → single button triggers
      revocation of all 6 services (GitHub, Slack, M365, GCP, AWS, Portal). Shows per-service revocation status. Marks
      user status=offboarded. Also includes re-provision button."
    status: done
  - id: github-provisioning
    content:
      "Implement provisionGitHub(person): - admin role: POST /orgs/IggyIkenna/invitations (org member, role=member) -
      datadodo/CosmicTrader equivalent (collaborator pattern): POST /repos/{owner}/{repo}/collaborators/{username} for
      relevant repos - all other roles: skip Revoke: DELETE /orgs/IggyIkenna/members/{username} or DELETE
      /repos/{owner}/{repo}/collaborators/{username} Secret: github-admin-pat in SM (admin:org + repo scope)."
    status: todo
  - id: slack-provisioning
    content:
      "Implement provisionSlack(person): - Invite by email: POST https://slack.com/api/users.admin.invite - Assign
      role-mapped channels (see role matrix below) - Revoke: deactivate user via users.admin.setInactive Secret:
      slack-admin-token in SM."
    status: todo
  - id: microsoft365-provisioning
    content:
      "Implement provisionMicrosoft365(person) using Microsoft Graph API: - Create user: POST /v1.0/users (for
      admin/accounting/operations roles) - Assign M365 license: POST /v1.0/users/{id}/assignLicense - Add to SharePoint
      groups: POST /v1.0/groups/{id}/members/$ref - Revoke: PATCH /v1.0/users/{id} { accountEnabled: false } App
      registration: client_credentials flow, User.ReadWrite.All + Group.ReadWrite.All + Directory.ReadWrite.All.
      Secrets: ms-graph-client-id + ms-graph-client-secret in SM."
    status: todo
  - id: gcp-provisioning
    content:
      "Implement provisionGCP(person): - gcloud projects add-iam-policy-binding central-element-323112
      --member=user:{gcp_email} --role={role_iam_role} - admin/datadodo/CosmicTrader: roles/editor -
      accounting/operations: roles/viewer - all others: skip Revoke: gcloud projects remove-iam-policy-binding SA: needs
      roles/resourcemanager.projectIamAdmin."
    status: todo
  - id: website-access-provisioning
    content:
      "Implement provisionPortal(person): Create/update user record in portal auth backend (GCS JSON or lightweight DB)
      with role + product_slugs. This record is read by odum-research-website PortalPage to filter visible
      presentations. Revoke: set status=offboarded in record."
    status: todo
  - id: email-onboarding
    content:
      "Implement emailOnboardingCredentials(person): send branded Odum Research email with: - GitHub org invite link (if
      applicable) - Slack workspace join link - Portal URL: https://odum-research.com/portal - M365 login instructions
      (for admin/accounting/operations) - GCP project info (for admin) Email template: matches Odum brand (dark bg, gold
      accent, logo). Secret: sendgrid-api-key in SM (or SES SMTP credentials)."
    status: todo
  - id: okta-deprecation-doc
    content:
      "Create unified-trading-pm/docs/okta-migration.md: - Okta dropped 2026-03-10 (oauth_pkce plan archived) - Auth:
      Google OAuth + AWS Cognito PKCE (packages/core) - People management: user-management-ui - Steps to fully
      decommission Okta account"
    status: todo
  - id: e2e-tests
    content:
      "Playwright smoke tests: (1) Onboard admin → GitHub org invite fired + Slack invite + GCP IAM binding added +
      portal access granted (2) Onboard Elysium client (client:elysium) → portal access only (Elysium deck visible) (3)
      Onboard investor → portal access + doc upload enabled (4) Offboard admin → all 5 services revoked; user
      status=offboarded (5) Re-provision: re-run provisioning for an existing user → idempotent"
    status: todo
  - id: aws-provisioning
    content:
      "- [ ] [AGENT] P1. Implement provisionAWS(person): Create IAM user via AWS SDK (CreateUser + CreateLoginProfile).
      Admin/collaborator: PowerUserAccess policy. Accounting: ReadOnlyAccess. All others: skip. Revoke: DeleteUser. SA
      needs iam:CreateUser, iam:DeleteUser, iam:AttachUserPolicy. Secret: aws-admin-access-key-id +
      aws-admin-secret-access-key in SM. Account: 123456789012."
    status: todo
  - id: shared-exchange-email
    content:
      "- [ ] [HUMAN+AGENT] P1. Shared exchange login management: Add exchangelogins@odum-research.com as a shared
      credential entry. Build SharedCredentialsPage.tsx in user-management-ui to display shared logins (exchange name,
      email, last rotated, who has access). Credentials stored in Secret Manager, UI reads via backend API. Use this for
      centralised exchange logins (Binance, OKX, Bybit, etc.) so team members can access without individual accounts."
    status: todo
  - id: shared-2fa-tool
    content:
      "- [ ] [HUMAN] P2. Research and implement shared 2FA for exchange accounts. Options to evaluate: (1) 1Password
      Teams — shared TOTP vault, browser extension auto-fills 2FA codes, audit log. (2) Bitwarden Teams — similar,
      self-hostable. (3) Authy multi-device — shared TOTP seeds, but less audit trail. (4) AWS Secrets Manager — store
      TOTP seeds, backend generates codes on-demand via API. Recommendation: 1Password Teams (best Cursor/CLI
      integration, shared vaults, audit trail). Decision needed from Ikenna before implementation."
    status: todo
  - id: slack-workspace-setup
    content:
      "- [ ] [HUMAN] P0. Set up Slack workspace for Odum Research. Create channels: #engineering, #general, #board,
      #clients, #shareholders, #finance, #ops, #investors, #ci-cd-alerts, #trading-alerts. Install Cursor Slack
      integration for autonomous bot approvals. Enable Slack API (Bot Token Scopes: users.admin.invite,
      users.admin.setInactive, channels:manage, chat:write). Store slack-admin-token in Secret Manager."
    status: todo
  - id: slack-cursor-integration
    content:
      "- [ ] [AGENT] P2. Once Slack workspace is live, configure Cursor/Claude Code Slack integration: (1)
      Approve/reject commits via Slack (bot posts PR summary → human reacts with approve/reject). (2) CI/CD alerts to
      #ci-cd-alerts channel (QG failures, deploy status, version bumps). (3) Trading alerts to #trading-alerts (position
      limits, circuit breaker triggers). Requires slack-bot-token with chat:write + reactions:read scopes."
    status: todo
  - id: quality-gate-pass
    content:
      "- [x] bash scripts/quality-gates.sh passes in user-management-ui. All 4 gates: typecheck, lint, unit tests (21
      passing), build. Pushed to main."
    status: done
isProject: false
---

# Plan: User Management Platform (Okta Replacement)

## Context

Okta was explicitly dropped (archived plan `ui_auth_oauth_pkce_2026_03_09`, done 2026-03-10). Auth now uses Google OAuth
2.0 + AWS Cognito PKCE in `unified-admin-ui/packages/core`.

However, there is no self-service platform to provision and manage user access across the Odum Research toolset (GitHub,
Slack, Microsoft 365, GCP, website portal, AWS). This plan creates `user-management-ui` — a new dedicated repo that does
what Okta's admin console did, but as Odum's own managed service.

Visual style matches `deployment-ui` — same sidebar nav, same `@unified-admin/core` components, same
`@unified-trading/ui-kit` design tokens. Consistent brand experience.

**Implementer: Femi Amoo**

**PREREQUISITE (human action before coding):** Femi needs Microsoft 365 admin + Slack Workspace Admin. Also: detach
Outlook + Slack from Okta before implementing provisioning.

---

## Internal Team Access Requirements

**All internal team members need both Slack and email before they can begin work.** This is a hard prerequisite — no dev
setup, no GitHub collaboration, no internal communication is possible without it. Provisioning must happen in this order
for any new internal hire:

1. **Email (M365 Outlook)** — required for: receiving GitHub org invites, calendar access, SharePoint, and all internal
   communication. **Every internal role** (admin, dev collaborators, accounting, operations) must have an M365 account.
   The provisioning matrix currently omits M365 for `datadodo`/`CosmicTrader` — this must be confirmed: either provision
   them a company Outlook account or document explicitly that they use personal email.
2. **Slack** — required for: day-to-day comms, CI/CD alerts, trading alerts, incident channels. Every role gets at least
   one channel (see matrix below). Slack invite goes to their M365 email address.
3. **GitHub** (admin/dev only) — org invite is sent to the email address; cannot be accepted without step 1.

> **Gap to resolve:** `datadodo`/`CosmicTrader` rows in the matrix below show `M365: N/A`. Confirm whether these
> developers use personal email or should receive a company `@odum-research.com` Outlook account. Update the matrix and
> the `microsoft365-provisioning` todo accordingly before implementation.

---

## Role → Provisioning Matrix

| Role                  | GitHub                  | Slack Channels         | Microsoft 365                   | GCP IAM        | AWS IAM         | Website Portal                |
| --------------------- | ----------------------- | ---------------------- | ------------------------------- | -------------- | --------------- | ----------------------------- |
| `admin`               | IggyIkenna org member   | #engineering, #general | Outlook + SharePoint (licensed) | Project Editor | PowerUserAccess | Full                          |
| datadodo/CosmicTrader | Collaborator (per-repo) | #engineering, #general | N/A                             | Viewer         | PowerUserAccess | Full                          |
| `board`               | N/A                     | #board                 | N/A                             | N/A            | N/A             | Board decks                   |
| `client:{slug}`       | N/A                     | #clients               | N/A                             | N/A            | N/A             | Product-specific decks        |
| `shareholder`         | N/A                     | #shareholders          | N/A                             | N/A            | N/A             | Shareholder report            |
| `accounting`          | N/A                     | #finance               | Outlook + SharePoint (licensed) | N/A            | ReadOnlyAccess  | Financials deck               |
| `operations`          | N/A                     | #ops                   | Outlook + SharePoint (licensed) | N/A            | N/A             | Company docs                  |
| `investor`            | N/A                     | #investors             | N/A                             | N/A            | N/A             | Investment decks + doc upload |

---

## Pages / Navigation

```
Sidebar:
  ├── Users           → UsersPage.tsx (all users table)
  ├── Onboard         → OnboardUserPage.tsx
  └── [user detail]   → UserDetailPage.tsx
                          ├── Modify
                          └── Offboard
```

---

## Key Secrets Needed in Secret Manager

| Secret                                                    | Scope                                                                                       |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `github-admin-pat`                                        | GH PAT: `admin:org` + `repo` (IggyIkenna org)                                               |
| `slack-admin-token`                                       | Slack Bot: `users.admin.invite`, `users.admin.setInactive`, `channels:manage`, `chat:write` |
| `ms-graph-client-id` + `ms-graph-client-secret`           | Graph API: `User.ReadWrite.All`, `Group.ReadWrite.All`, `Directory.ReadWrite.All`           |
| `aws-admin-access-key-id` + `aws-admin-secret-access-key` | AWS IAM: `iam:CreateUser`, `iam:DeleteUser`, `iam:AttachUserPolicy` (account 123456789012)  |
| `sendgrid-api-key`                                        | Onboarding emails                                                                           |
| GCP SA: `resourcemanager.projectIamAdmin`                 | GCP provisioning                                                                            |
| `1password-connect-token` (future)                        | Shared vault API access for exchange credentials + 2FA seeds                                |

---

## Verification Gates

- `IggyIkenna/user-management-ui` repo exists with quality gates passing
- `workspace-manifest.json` contains `user-management-ui` entry
- `bash scripts/quality-gates.sh` exits 0
- Onboard admin: GitHub invite triggered + Slack invite sent + GCP IAM bound + portal access created
- Offboard user: all 5 services revoked in one action
- `unified-trading-pm/docs/okta-migration.md` documents Okta decommission steps

## Files Created / Modified

- `IggyIkenna/user-management-ui/` (new repo — entire scaffold)
- `workspace-manifest.json` (modified — add user-management-ui)
- `unified-admin-ui/packages/core/types/person.ts` (new — Person type)
- `unified-trading-pm/docs/okta-migration.md` (new)
