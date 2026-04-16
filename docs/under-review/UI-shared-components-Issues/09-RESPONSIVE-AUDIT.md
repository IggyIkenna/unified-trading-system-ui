# I — Responsive Design & Mobile Audit

**Date:** 2026-03-28  
**Scope:** `app/(platform)/`, `app/(ops)/`, `app/(public)/`, `components/`, `hooks/`, `lib/` (`.tsx` primary; Tailwind responsive patterns)  
**Previous audit:** First audit

## 1. Current State

- **Breakpoints:** Tailwind defaults (`sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px, `2xl` 1536px) via `@import "tailwindcss"` in `app/globals.css`.
- **Page width token:** `--platform-page-max-width: 2400px` in `:root` (`app/globals.css` ~L85) — institutional wide layouts, not phone-first.
- **Viewport:** `app/layout.tsx` exports `viewport` with `themeColor` and `colorScheme` only (`~L60–66`). Next.js 16 default viewport still includes `width: device-width` / `initialScale: 1` when not overridden — acceptable baseline.
- **JS breakpoint hook:** `hooks/use-mobile.ts` defines `MOBILE_BREAKPOINT = 768` (`max-width: 767px`), matching `md`. **Duplicate:** `components/ui/use-mobile.tsx` is identical; only `components/ui/sidebar.tsx` imports `@/hooks/use-mobile` — the `ui` copy is redundant.
- **Shell layout:** `components/shell/unified-shell.tsx` uses `h-screen flex flex-col overflow-hidden` and `main` with `flex-1 min-h-0 overflow-auto` (`~L51–71`) — scroll is delegated to main; nested `overflow-hidden` pages must manage their own scroll.
- **Progressive disclosure:** ~39 matches of `hidden {sm|md|lg|xl}:` in `app/` + `components/` `.tsx` — labels and chrome scale down on small widths (e.g. `lifecycle-nav.tsx`, `site-header.tsx`, pagination).
- **Horizontal overflow mitigation:** Many tables and toolbars wrap in `overflow-x-auto` (shared `components/ui/table.tsx`, filter bars, research sections, promote flows, widgets).
- **Buttons:** `components/ui/button.tsx` — `default` `h-9` (36px), `sm` `h-8` (32px), `icon-sm` `size-8` (32px) (`~L23–29`) — below common **44×44px** touch-target guidance for primary actions.

## 2. Findings

| ID  | Area                                     | Severity    | Evidence                                                                                                                                                                                                                                                               | Recommendation                                                                                                                                                  |
| --- | ---------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I1  | Fixed pixel widths                       | 🟡 High     | **~276** matches of `w-\[Npx\]`, `min-w-\[Npx\]`, `max-w-\[Npx\]` in `app` + `components` + `hooks` + `lib` `.tsx`                                                                                                                                                     | Prefer `min-w-0`, `%`, `min(…)`, `clamp`, or responsive `max-w-*`; reserve fixed px for known safe interiors (e.g. modals with `sm:max-w-*`).                   |
| I2  | Forced horizontal scroll / desktop floor | 🔴 Critical | `app/(platform)/services/research/strategy/compare/page.tsx` **`min-w-[800px]`** on main content (`~L458`) forces horizontal scroll below 800px                                                                                                                        | Remove fixed `min-w` on page root; use stacked layout &lt;`md` or wrap in `overflow-x-auto` with clear scroll affordance.                                       |
| I3  | Wide tables without mobile layout        | 🟡 High     | `min-w-[720px]` `components/promote/execution-readiness-tab.tsx`; `min-w-[700px]` `components/trading/predictions/portfolio-tab.tsx` (×2); `min-w-[560px]` `components/trading/sports/arb-grid.tsx`; `min-w-[600px]` `components/ops/deployment/EpicReadinessView.tsx` | Keep `overflow-x-auto` parent (several already do); add sticky first column or card fallback on `sm` for key flows.                                             |
| I4  | Large fixed cards / panels               | 🟡 High     | `components/dashboards/quant-dashboard.tsx` `Card` **`w-[500px]`**; `components/chat/chat-widget.tsx` **`w-[560px] h-[680px]`** / **`w-[380px]`**; `components/shared/finder/finder-browser.tsx` / `finder-detail-panel.tsx` default **`w-[420px]`**                   | Use `w-full max-w-[500px]` / viewport-relative `max-h-[dvh]`; finder: full-screen sheet on mobile via `useIsMobile` or CSS `md:` breakpoints.                   |
| I5  | Manual trading drawer widths             | 🟢 Medium   | `components/trading/manual-trading-panel.tsx` `w-[480px] sm:w-[520px]` / `w-[400px] sm:w-[440px]`                                                                                                                                                                      | On narrow viewports use `w-full` or `max-w-[100vw]` with safe padding; avoid exceeding screen width.                                                            |
| I6  | Typography &lt; 12px                     | 🟡 High     | **`text-[10px]`** ~**1188** lines; **`text-[9px]`** ~**180**; **`text-[11px]`** ~**182** (line hits in `app` + `components` `.tsx`) — dense ops/trading/promote surfaces                                                                                               | Map to tokens ≥`text-xs` (12px) for body; if labels must shrink, use `md:text-xs` + larger default on mobile or accept audit-only density on desktop.           |
| I7  | Touch targets                            | 🟡 High     | Widespread **`h-7`**, **`h-8`**, **`size-3`** icon hits in toolbars (`options-futures-panel.tsx`, dashboards, promote panels); Button **`sm` / `icon-sm`** = 32px                                                                                                      | Increase tap targets on touch breakpoints (`min-h-11 min-w-11` or `size-11` for icon-only); keep compact sizes under `md:` only if paired with desktop-only UI. |
| I8  | `useIsMobile` usage                      | 🟢 Medium   | **`useIsMobile`** used in **`components/ui/sidebar.tsx`** only (plus duplicate `components/ui/use-mobile.tsx` unused duplicate)                                                                                                                                        | Delete duplicate `components/ui/use-mobile.tsx` or re-export from `@/hooks/use-mobile` only; extend hook to finder/chat/panels if JS-driven layout is required. |
| I9  | `hidden md:flex` / nav density           | 🟢 Medium   | `components/shell/site-header.tsx` `hidden md:flex` for nav (`~` nav block) — marketing/header pattern is desktop-first                                                                                                                                                | Ensure mobile menu / hamburger covers all header links (verify parity).                                                                                         |
| I10 | Config sheet width                       | 🟢 Medium   | `app/(ops)/config/page.tsx` `SheetContent` **`w-[600px] sm:max-w-[600px]`**                                                                                                                                                                                            | Use `w-full sm:max-w-[600px]` so sheet does not overflow small phones.                                                                                          |

## 3. Worst Offenders

Top files by count of `w-[*px]`, `min-w-[*px]`, `max-w-[*px]` in scoped `.tsx`:

| Rank | File                                                                           | Approx. matches |
| ---- | ------------------------------------------------------------------------------ | --------------- |
| 1    | `app/(platform)/settings/notifications/page.tsx`                               | 12              |
| 2    | `components/trading/options-futures-panel.tsx`                                 | 11              |
| 3    | `app/(platform)/services/research/ml/components/run-analysis-sections.tsx`     | 10              |
| 4    | `app/(platform)/services/observe/health/page.tsx`                              | 10              |
| 5    | `app/(platform)/services/reports/settlement/page.tsx`                          | 9               |
| 6    | `components/promote/execution-readiness-tab.tsx` (plus `min-w-[720px]` table)  | 8+              |
| 7    | `app/(platform)/services/trading/options/combos/page.tsx`                      | 7               |
| 8    | `app/(platform)/services/research/strategies/page.tsx`                         | 7               |
| 9    | `components/dashboards/devops-dashboard.tsx`                                   | 5               |
| 10   | `app/(platform)/services/research/strategy/compare/page.tsx` (`min-w-[800px]`) | 5+              |

**Breakpoint adoption:** **146** `.tsx` files under `app/`, `components/`, `hooks/`, `lib/` contain at least one of `sm:` / `md:` / `lg:` / `xl:` / `2xl:` — broad use, but uneven vs. fixed-width hot spots above.

## 4. Recommended Fixes

1. **Remove or gate `min-w-[800px]`** on strategy compare (`compare/page.tsx`) — highest user-visible mobile breakage.
2. **Consolidate mobile hook:** remove `components/ui/use-mobile.tsx` (or single import path from `hooks/use-mobile.ts`) to satisfy “no parallel code paths.”
3. **Touch layer:** add responsive classes so primary actions in `lifecycle-nav`, filter bars, and table row actions use ≥44px hit areas on widths where `useIsMobile` is true or `@media (pointer: coarse)`.
4. **Typography floor:** replace pervasive `text-[10px]` in promote/trading with `text-xs` + `truncate` / column hide on `sm`, or scope micro type behind `lg:` only.
5. **Finder & chat:** `finder-browser` / `chat-widget` — full-width bottom sheet or `100dvw` cap under `md`.
6. **Sheets & modals:** audit fixed `w-[Npx]` on `SheetContent` / `DialogContent` for `max-w-[100vw]` and padding.

## 5. Remediation Priority

| Phase  | Focus                                                                                                 | Effort (est.) |
| ------ | ----------------------------------------------------------------------------------------------------- | ------------- |
| **P0** | `compare/page.tsx` min-width; config sheet `w-full` on small screens; quant dashboard card width      | ~0.5–1 d      |
| **P1** | Promote + predictions + arb tables: sticky column or mobile card; options panel toolbar touch targets | ~2–3 d        |
| **P2** | Systematic `text-[9–11px]` reduction; Button `sm`/`icon-sm` touch overrides for mobile                | ~3–5 d        |
| **P3** | Delete duplicate `use-mobile`; optional `useIsMobile` for finder/chat                                 | ~0.5 d        |

---

**Audit method:** Executed Module I checklist (`audit-scripts/I-responsive.md`) via repository search (Tailwind breakpoints, `hidden *:`, arbitrary px widths, overflow, `use-mobile`, root `viewport`, sub-12px text, button sizes). Counts are approximate line/match totals from ripgrep at audit time.
