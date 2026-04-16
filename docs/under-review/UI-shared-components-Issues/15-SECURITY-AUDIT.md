# O — Security Audit

**Date:** 2026-03-28  
**Scope:** `app/`, `components/`, `hooks/`, `lib/`, `next.config.mjs`, `.env.example` (excluding `node_modules`, `.next`, `docs/` except where referenced as product surface)  
**Previous audit:** First audit

## 1. Current State

- **XSS surface:** React’s default escaping is used for most UI. One `dangerouslySetInnerHTML` usage exists in `components/ui/chart.tsx` (lines 82–100) to inject **chart theme CSS** built from `ChartConfig` entries (colors/themes), not from arbitrary user HTML.
- **Dynamic code:** No `eval()` or `new Function()` in application `*.ts` / `*.tsx` (matches only appear in this audit’s instruction file under `audit-scripts/`).
- **Client env (`NEXT_PUBLIC_*`):** Documented in `.env.example` — feature flags (`NEXT_PUBLIC_MOCK_API`, `NEXT_PUBLIC_SKIP_AUTH`, `NEXT_PUBLIC_AUTH_PROVIDER`), API/auth base URLs, Firebase **public** web config keys, and `NEXT_PUBLIC_USER_MGMT_API_URL`. Firebase client API keys are **intended** to be public; protection is via Firebase console restrictions (domain, App Check, rules), not secrecy.
- **External links:** Several `target="_blank"` uses; deployment/cloud log links use explicit `rel="noopener noreferrer"`. `next/link` with `target="_blank"` on external URLs should inherit Next.js default `rel` behavior (verify on upgrade); raw `<a target="_blank">` without `rel` was **not** found in TSX except where paired with `rel` or via `Link`.
- **Forms:** Primary flows use **controlled forms** with `onSubmit` handlers calling `fetch` / client logic — not classic HTML `action` POST to a third origin. **CSRF** is primarily an API concern; Bearer-token–based calls from the SPA are less exposed to classic cross-site form POST CSRF than cookie-only sessions, provided APIs do not also rely on ambient cookies without `SameSite` / CSRF tokens.
- **Auth tokens:** `DemoAuthProvider` persists **`portal_user` / `portal_token` in `localStorage`** (`lib/auth/demo-provider.ts`). `FirebaseAuthProvider` keeps ID tokens in **memory** (`cachedToken`) and relies on the Firebase SDK’s persistence; `use-auth.tsx` holds the active token in **React state** for API calls. API calls attach `Authorization: Bearer …` in `lib/api/fetch.ts` and `lib/api/typed-fetch.ts`.
- **Security headers:** `next.config.mjs` `headers()` sets **Cache-Control** only — no `Content-Security-Policy`, `X-Frame-Options` / `frame-ancestors`, `Strict-Transport-Security`, or `Referrer-Policy` in-repo (line ranges 20–47).

## 2. Findings

| ID   | Area                                  | Severity                    | Evidence                                                                                                                                                                                                                           | Recommendation                                                                                                                                                                                 |
| ---- | ------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| O-1  | Session / token exposure (XSS impact) | 🟡 High                     | `lib/auth/demo-provider.ts` (e.g. 9–10, 42–43, 83–95, 102–103) stores demo session + token in `localStorage`; `hooks/use-auth.tsx` (41–52, 90–91) keeps token in client state; `lib/api/fetch.ts` (21–23) sends Bearer from client | For production: prefer **httpOnly, Secure, SameSite** session cookies issued by a backend, or **BFF** pattern; keep demo storage clearly **non-production**; add **CSP** + strict XSS hygiene. |
| O-2  | Missing defense-in-depth headers      | 🟡 High                     | `next.config.mjs` 20–47 — only cache headers                                                                                                                                                                                       | Add **CSP** (start report-only), **HSTS** at edge (if TLS terminated upstream, configure there too), **frame-ancestors** / clickjacking policy, **Referrer-Policy**.                           |
| O-3  | `NEXT_PUBLIC_SKIP_AUTH` / demo flags  | 🟡 High (misconfig)         | `.env.example` 8–11; `lib/providers.tsx` (mock/demo detection uses `NEXT_PUBLIC_*`)                                                                                                                                                | **Never** enable `NEXT_PUBLIC_SKIP_AUTH=true` or `NEXT_PUBLIC_AUTH_PROVIDER=demo` on production builds; enforce in CI/deploy (assert env).                                                     |
| O-4  | Authorization request shape           | 🟢 Medium                   | `lib/auth/authorize-client.ts` 31–33 — `GET` with `uid` in query string                                                                                                                                                            | Prefer **POST** + body or **authenticated** server-side lookup to avoid UID leakage via logs, proxies, and Referer.                                                                            |
| O-5  | `dangerouslySetInnerHTML`             | 🟢 Medium (contextual)      | `components/ui/chart.tsx` 82–100                                                                                                                                                                                                   | Ensure `ChartConfig` color/theme values are **never** fed untrusted strings; keep chart config server- or build-defined; if user theming is added, validate format (e.g. strict allowlist).    |
| O-6  | Custom markdown links (future risk)   | 🟢 Medium                   | `app/(public)/docs/page.tsx` 400–411 — `<a href={linkMatch[2]}>` with no `javascript:` / scheme allowlist                                                                                                                          | Today content is **static** in-file; if reused for **user/ CMS markdown**, sanitize URLs (`https:` / `mailto:` only) and add `rel` for `target="_blank"` if used.                              |
| O-7  | `window.open`                         | 🟢 Medium (low in practice) | `app/(platform)/services/observe/health/page.tsx` 314–317 — `window.open(..., "_blank")` for same-origin path                                                                                                                      | Prefer `window.open(url, "_blank", "noopener")` or open in-tab; avoids tabnabbing patterns on other origins if URL ever changes.                                                               |
| O-8  | Staging gate secret                   | 🟢 Medium                   | `components/staging-gate.tsx` — documents credentials in `localStorage` for staging overlay                                                                                                                                        | Acceptable only for **non-prod** staging gates; do not reuse pattern for real auth.                                                                                                            |
| O-9  | Sidebar cookie                        | 🟢 Low                      | `components/ui/sidebar.tsx` ~87 — `document.cookie` for UI state                                                                                                                                                                   | Not auth; ensure value is non-sensitive; path/max-age as now is typical.                                                                                                                       |
| O-10 | CSRF (API contract)                   | 🟢 Low (SPA + Bearer)       | Forms: e.g. `app/(public)/login/page.tsx` 122+, `app/(public)/contact/page.tsx` 284+ — JS `fetch`                                                                                                                                  | Confirm backend **does not** accept privileged cookie auth without CSRF protection; document SameSite requirements.                                                                            |

**Counts (approx.):**

- `localStorage` / `sessionStorage`: **22** `*.ts` / `*.tsx` files under the repo (includes mocks, onboarding drafts, Zustand persist, demo auth).
- `NEXT_PUBLIC_` references: **30+** lines across app, hooks, lib, scripts, and docs (non-secret config and flags; see `.env.example`).
- `target="_blank"`: **6** occurrences in `*.tsx` (see §3).
- `dangerouslySetInnerHTML`: **1** component file (`chart.tsx`) plus audit docs.

## 3. Worst Offenders

| Rank | File                                              | Why                                                                                                        |
| ---- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 1    | `lib/auth/demo-provider.ts`                       | Demo `portal_token` + user JSON in `localStorage` — full XSS exfiltration surface in demo/staging configs. |
| 2    | `next.config.mjs`                                 | No CSP / HSTS / frame protections in application config.                                                   |
| 3    | `hooks/use-auth.tsx` + `lib/api/fetch.ts`         | Bearer token from client memory/state on every API call — standard SPA risk without CSP.                   |
| 4    | `lib/auth/authorize-client.ts`                    | Firebase UID in query string on authorize GET.                                                             |
| 5    | `app/(public)/docs/page.tsx`                      | Custom markdown link rendering without URL scheme allowlist (safe today only because content is static).   |
| 6    | `components/ui/chart.tsx`                         | Only `dangerouslySetInnerHTML` in UI components — monitor trust boundary for config.                       |
| 7    | `app/(platform)/services/observe/health/page.tsx` | `window.open` without explicit noopener feature.                                                           |
| 8    | `components/staging-gate.tsx`                     | Staging password pattern in `localStorage` (explicitly staging-only).                                      |

## 4. Recommended Fixes

1. **CSP (phased):** Add `Content-Security-Policy-Report-Only` via `next.config.mjs` or edge middleware; tighten to enforce after fixing violations; include `default-src 'self'`, script hashes/nonces for any inline needs, and restrict `connect-src` to API origins.
2. **Production auth path:** Move long-lived session to **httpOnly cookies** via backend/BFF; keep Firebase ID token refresh server-side if possible, or document accepted residual XSS risk and rely on short TTL + CSP.
3. **Deploy guards:** CI check that production env excludes `NEXT_PUBLIC_SKIP_AUTH`, `NEXT_PUBLIC_AUTH_PROVIDER=demo`, and `NEXT_PUBLIC_MOCK_API=true` unless building a known demo artifact.
4. **Authorize API:** Change `fetchAuthorization` to a method that does not put PII/UID in query strings (POST + JSON, or server-side session).
5. **Links:** For any raw `<a target="_blank">` to external URLs, always set `rel="noopener noreferrer"` explicitly; for `window.open`, pass noopener in the feature string.
6. **Chart component:** Document that `ChartConfig` must not accept end-user-controlled CSS fragments; add validation if theming becomes user-facing.
7. **Markdown reuse:** If `DocContent` is reused for CMS/user input, integrate `sanitize-html` / DOMPurify (or a hardened MD pipeline) and URL allowlists.

## 5. Remediation Priority

| Phase                   | Items                                                                                                   | Effort                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| **P0 — Quick wins**     | Production env assertions; explicit `rel` / `noopener` on any external `_blank`; `window.open` noopener | ~0.5–1 dev-day                        |
| **P1 — Headers**        | CSP-Report-Only + HSTS/frame/referrer at CDN or `next.config`                                           | ~1–2 dev-days (tune + fix violations) |
| **P2 — Auth hardening** | BFF/httpOnly session; reduce `localStorage` tokens in non-demo builds                                   | ~1–2 weeks (cross-repo)               |
| **P3 — API hygiene**    | Authorize endpoint shape; CSRF/SameSite documentation and tests against real API                        | ~2–5 dev-days                         |

---

**Module script reference:** `docs/UI-shared-components-Issues/audit-scripts/O-security.md`
