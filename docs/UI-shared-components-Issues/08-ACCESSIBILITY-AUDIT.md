# H — Accessibility Audit

**Date:** 2026-03-28  
**Scope:** `app/`, `components/`, `hooks/`, `lib/` (`.tsx` / interactive UI; `archive/` noted where scanned)  
**Previous audit:** First audit

## 1. Current State

| Area                     | State                                                                                                                                                                                                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Root document**        | `app/layout.tsx` sets `lang="en"` on `<html>` (line 74).                                                                                                                                                                                                   |
| **Focus rings (Button)** | `components/ui/button.tsx` uses `outline-none` with `focus-visible:ring-[3px]` and `focus-visible:border-ring` (line 8) — visible focus for keyboard users.                                                                                                |
| **Dialogs / sheets**     | `components/ui/dialog.tsx` and `components/ui/sheet.tsx` use Radix primitives; close control includes `<span className="sr-only">Close</span>` (dialog lines 74–75, sheet lines 76–77). Radix provides focus trap and `aria-modal` on content.             |
| **Command palette**      | `components/ui/command.tsx` `CommandDialog` wraps `DialogTitle` / `DialogDescription` in `sr-only` (lines 47–49) — accessible name for the modal.                                                                                                          |
| **Select**               | `components/ui/select.tsx` is Radix `@radix-ui/react-select` — listbox keyboard pattern and ARIA roles delegated to the library.                                                                                                                           |
| **Landmarks**            | Many routes use `<main>` (e.g. `components/shell/unified-shell.tsx` line 71). `components/shell/trading-vertical-nav.tsx` uses `<nav … aria-label="Trading sections">` (line 284). `components/ui/breadcrumb.tsx` uses `aria-label="breadcrumb"` (line 8). |
| **ESLint**               | `eslint.config.mjs` extends `eslint-config-next` only — inherits Next/core-web-vitals rules; no project-specific strict `jsx-a11y` preset beyond that.                                                                                                     |
| **Images**               | Logo `<img>` usages checked include `alt` text (`site-header.tsx` 84, `lifecycle-nav.tsx` 187–190, investor-relations pages). `app/opengraph-image.tsx` uses `alt=""` for decorative logo beside visible title (lines 35–41) — acceptable pattern.         |
| **Positive examples**    | `lifecycle-nav.tsx` dropdown chevron `button` has `aria-label={\`${nav.label} destinations\`}`(lines 248–256).`context-bar.tsx`uses`aria-expanded`/`aria-label` on group toggles (lines 328–336).                                                          |

## 2. Findings

### 2.1 Skip link and main target

| Severity  | Location                                     | Issue                                                                    | Remediation                                                                                     |
| --------- | -------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| 🟡 High   | `app/layout.tsx`                             | No “skip to main content” link at the start of `<body>`.                 | Add a visually hidden link that becomes visible on focus, pointing to `id` on primary `<main>`. |
| 🟢 Medium | `components/shell/unified-shell.tsx` line 71 | `<main>` has no `id` (e.g. `main-content`) for skip-link target.         | Add `id="main-content"` (or match skip `href`).                                                 |
| 🟢 Medium | `app/(public)/layout.tsx`                    | Wrap uses `<main>` (per route scan) but skip link still missing at root. | Same skip link in root layout benefits all route groups.                                        |

### 2.2 Icon-only and unnamed controls

Ripgrep: **58** lines with `size="icon"` across **30** files; **45** total `aria-label=` matches in `.tsx` (not all on buttons). Many icon-only `Button`s have no accessible name.

| Severity    | Location                                                                                    | Issue                                                                                                                               | Remediation                                                                       |
| ----------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 🔴 Critical | `components/shell/notification-bell.tsx` 84–91                                              | `Button variant="ghost" size="icon"` with only `<Bell />` — no `aria-label`.                                                        | `aria-label={`Alerts${count ? `, ${count} unread` : ""}`}`                        |
| 🔴 Critical | `components/shell/lifecycle-nav.tsx` 436–446                                                | User menu trigger shows initials only inside `Button` — screen readers get unclear name.                                            | `aria-label={\`Account menu for ${userName}\`}`on`Button`or`DropdownMenuTrigger`. |
| 🟡 High     | `components/shell/lifecycle-nav.tsx` 404–413                                                | Search control: text `Search` hidden below `sm` (`hidden sm:inline`) — mobile presents near–icon-only control without `aria-label`. | `aria-label="Open command palette"` (and optional `aria-keyshortcuts`).           |
| 🟡 High     | `app/(ops)/internal/data-etl/page.tsx` 162–172, 536–541                                     | Multiple `size="icon"` buttons (Bell, Settings, RefreshCw) without labels.                                                          | Per-action `aria-label` strings.                                                  |
| 🟡 High     | `components/ops/deployment/DeploymentDetails.tsx`                                           | **13** `size="icon"` occurrences in one file (highest count) — high risk of unnamed actions.                                        | Audit each trigger; add `aria-label` or visible text.                             |
| 🟢 Medium   | `notification-bell.tsx` 127–138                                                             | Ack `Button` uses `title="Acknowledge"` only.                                                                                       | Prefer `aria-label="Acknowledge alert"` (`title` is weak for AT).                 |
| 🟢 Medium   | `app/(ops)/ops/jobs/page.tsx`, `markets-tab.tsx`, `time-series-panel.tsx`, admin user pages | Multiple icon buttons (back, pause, cancel, etc.) — spot checks show missing names.                                                 | Systematic pass: every `size="icon"` gets `aria-label`.                           |

### 2.3 Custom interactive elements (role, keyboard)

| Severity  | Location                                                                                                                                             | Issue                                                                                                                 | Remediation                                                                |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 🟡 High   | `components/shared/data-card.tsx` 81–93                                                                                                              | When `onClick` is set: `role="button"` and `tabIndex={0}` but **no** `onKeyDown` for Enter/Space.                     | Add handler: activate on `Enter`/`Space` (prevent default on Space).       |
| 🟢 Medium | `components/trading/context-bar.tsx` 268–274, 353–357, etc.                                                                                          | `role="button"` + `onKeyDown` only for `Enter` — **Space** not handled.                                               | Also handle `e.key === " "` with `preventDefault()`.                       |
| 🟢 Medium | `components/platform/global-scope-filters.tsx`, `watchlist-panel.tsx`, `fixtures-match-card.tsx`, `instruction-pipeline-rows.tsx`, `markets-tab.tsx` | `tabIndex={0}` on non-button elements — verify each has keyboard equivalent and name.                                 | Per-widget review; prefer native `<button>` where possible.                |
| 🟢 Medium | `components/widgets/alerts/alerts-table-widget.tsx` 87–91                                                                                            | `span tabIndex={0}` as `TooltipTrigger` — focusable but relies on tooltip for explanation; child may still need name. | Ensure wrapped control has `aria-label` if disabled-looking in batch mode. |

### 2.4 Navigation landmarks and structure

| Severity  | Location                              | Issue                                                                                                                                 | Remediation                                                           |
| --------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 🟢 Medium | `components/shell/site-header.tsx` 93 | `<nav>` without `aria-label` — ambiguous when multiple nav regions exist.                                                             | e.g. `aria-label="Marketing"` or `"Primary"`.                         |
| 🟢 Medium | `lifecycle-nav.tsx` (overall)         | Complex row of stage controls + dropdowns; primary stage link and chevron are separate tab stops — document expected tab order in QA. | Consider `aria-current="page"` on active stage link where applicable. |

### 2.5 Color-only and status communication

| Severity  | Location                                         | Issue                                                                                                                                 | Remediation                                                                                            |
| --------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 🟡 High   | `components/shared/data-card.tsx` 31–36, 102–104 | Status uses **left border color** (`STATUS_BORDER`) and change text uses **hex colors** (`CHANGE_COLOR`) — reinforces meaning by hue. | Add non-color cue: icon, `aria-label` on card, or visible “Positive/Negative” / trend text for status. |
| 🟢 Medium | `notification-bell.tsx` 115–119                  | Severity dot is color-only (`severityColors`).                                                                                        | Add `sr-only` severity text or visible label alongside message.                                        |
| 🟢 Medium | Trading / PnL surfaces                           | ~**163** class hits for `text-pnl-positive` / `text-pnl-negative` (and related) across `.tsx` — many cells use color for sign.        | Ensure numeric sign (`+`/`-`) or text always present (several places already do).                      |

### 2.6 Images (complete pass)

| Severity | Location        | Issue                                                                                              | Remediation                                        |
| -------- | --------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| —        | (none critical) | Sampled `<img>` in shell and investor-relations: `alt` present or decorative `alt=""` in OG image. | Keep `alt` in sync if logo/marketing copy changes. |

### 2.7 `tabIndex` audit

| File                                                                                                                                                                                            | Usage                  | Notes                                                                  |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------- |
| `components/ui/sidebar.tsx` 291                                                                                                                                                                 | `tabIndex={-1}`        | Typical roving-tab pattern companion — verify with Radix sidebar docs. |
| `data-card.tsx`, `context-bar.tsx`, `global-scope-filters.tsx`, `watchlist-panel.tsx`, `fixtures-match-card.tsx`, `markets-tab.tsx`, `instruction-pipeline-rows.tsx`, `alerts-table-widget.tsx` | `0` or conditional `0` | Pair with keyboard handlers and accessible names (see above).          |

## 3. Worst Offenders

| Rank | File                                              | Primary issue                                                         |
| ---- | ------------------------------------------------- | --------------------------------------------------------------------- |
| 1    | `components/ops/deployment/DeploymentDetails.tsx` | 13× `size="icon"` — likely many unnamed actions.                      |
| 2    | `app/(ops)/internal/data-etl/page.tsx`            | 5× icon buttons; ops-critical UI.                                     |
| 3    | `components/trading/predictions/markets-tab.tsx`  | 5× icon buttons + custom `tabIndex`.                                  |
| 4    | `components/shell/lifecycle-nav.tsx`              | Global chrome: user trigger, search, mode — naming and mobile labels. |
| 5    | `components/shell/notification-bell.tsx`          | Icon bell + nested icon ack without robust naming.                    |
| 6    | `components/shared/data-card.tsx`                 | Clickable card pattern incomplete for keyboard.                       |
| 7    | `app/(ops)/ops/jobs/page.tsx`                     | Multiple unnamed icon actions in tables.                              |
| 8    | `components/trading/context-bar.tsx`              | Many custom `role="button"` rows; Enter-only keyboard.                |
| 9    | `components/platform/global-scope-filters.tsx`    | Multiple `tabIndex={0}` custom rows.                                  |
| 10   | `app/layout.tsx`                                  | Missing skip link (affects every page).                               |

## 4. Recommended Fixes

1. **Skip link (Phase 1):** In `app/layout.tsx`, add as first focusable child inside `body`:

   ```tsx
   <a
     href="#main-content"
     className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:p-3 focus:bg-primary focus:text-primary-foreground"
   >
     Skip to main content
   </a>
   ```

   Set `id="main-content"` on the primary shell `<main>` in `unified-shell.tsx` and on public layout `<main>` if it is the sole main for that tree.

2. **Icon button rule:** ESLint: enable or tighten `@next/next/no-html-link-for-pages`-adjacent rules where applicable; add `eslint-plugin-jsx-a11y` rules `anchor-is-valid`, `alt-text`, **`control-has-associated-label`** / **`label-has-associated-control`** for forms, and **`click-events-have-key-events`** / **`no-static-element-interactions`** for custom widgets (configure to match Radix patterns).

3. **DataCard:** Add `onKeyDown` for Enter/Space when `onClick` is provided; optional `aria-label` prop for the card when the label text is insufficient.

4. **Lifecycle nav:** `aria-label` on user `Button`, search `button`, and notification bell (or wrap with shared `IconButton` that requires `aria-label`).

5. **Severity / status:** Add visually hidden or explicit text for alert severity and DataCard status beyond border color.

6. **Space key:** Extend `context-bar` (and similar) `onKeyDown` handlers to treat Space like Enter for `role="button"` divs.

## 5. Remediation Priority

| Phase            | Items                                                                                                                                                               | Est. effort                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| **P0 — 0.5–1 d** | Skip link + `main` id; `NotificationBell` + user menu + search `aria-label`; fix `DataCard` keyboard.                                                               | Fixes global chrome and a reusable primitive. |
| **P1 — 1–2 d**   | `DeploymentDetails.tsx`, `data-etl`, `ops/jobs`, `markets-tab` icon audit; `notification-bell` ack button `aria-label`; Space key on `context-bar` custom buttons.  | High-traffic ops/trading surfaces.            |
| **P2 — 1–2 d**   | `site-header` nav `aria-label`; severity / DataCard non-color cues; `global-scope-filters` / watchlist `tabIndex` review; optional stricter ESLint jsx-a11y preset. | Hardening + CI prevention.                    |

**Total rough order:** ~3–5 developer-days for P0–P2, depending on QA and design input on status semantics.
