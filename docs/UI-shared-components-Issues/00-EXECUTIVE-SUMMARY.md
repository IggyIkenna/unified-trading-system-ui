# UI Design System Audit — Executive Summary

**Date:** 2026-03-27
**Scope:** `unified-trading-system-ui` — all files in `app/`, `components/`, `lib/`
**Auditor:** Automated codebase analysis
**Severity Legend:** 🔴 Critical (systemic, blocks theming) · 🟡 High (widespread inconsistency) · 🟢 Medium (localized, fixable per-file)

---

## Top-Level Findings

The UI has a well-designed **color token system** in `globals.css` (~60 CSS custom properties for colors, surfaces, status, charts) but it is **not consistently adopted** across the codebase. Typography has **no centralized scale at all** — every component picks its own `text-*` class. Shared components exist but are **underutilized**, with many pages building ad-hoc versions of patterns that already have shared implementations.

---

## Finding Summary

| #   | Finding                                                                  | Severity | Files Affected         | Fix Effort |
| --- | ------------------------------------------------------------------------ | -------- | ---------------------- | ---------- |
| 1   | No typography scale — page `h1`s range from `text-lg` to `text-4xl`      | 🔴       | ~50 page files         | 3–5 days   |
| 2   | Hardcoded colors bypass design tokens (~500+ occurrences)                | 🔴       | ~80 files              | 5–8 days   |
| 3   | `branding.ts` color values diverge from `globals.css` tokens             | 🔴       | 1 file (cascading)     | 0.5 day    |
| 4   | No `PageHeader` component — 50+ pages roll their own                     | 🟡       | ~50 pages              | 2–3 days   |
| 5   | Badge component uses raw Tailwind colors instead of tokens               | 🟡       | 1 file (cascading)     | 0.5 day    |
| 6   | `StatusBadge` mixes `var()` tokens with `rgba()` hardcodes               | 🟡       | 1 file                 | 0.5 day    |
| 7   | Duplicate `EmptyState` / `KpiTile` in sports vs shared                   | 🟡       | 2–5 files              | 1 day      |
| 8   | `FilterBar` exists but only 3 pages use it                               | 🟢       | ~10 pages              | 2–3 days   |
| 9   | Page padding inconsistent (`p-4` vs `p-6` vs none)                       | 🟢       | ~40 pages              | 1–2 days   |
| 10  | `finder-text-sizes.ts` is a parallel type scale                          | 🟢       | 8 files                | 1 day      |
| 11  | ~60% of mock data is inline in pages/components, not in `lib/`           | 🔴       | ~30 files              | 10–13 days |
| 12  | P&L and Markets pages share ~700 lines of duplicated generator code      | 🔴       | 2 pages                | 1 day      |
| 13  | `lib/mocks/` directory (prescribed by .cursorrules) does not exist       | 🟡       | Architecture           | 2 days     |
| 14  | Sports/predictions/promote have mock-data.ts files next to components    | 🟡       | 4 files (~2,820 lines) | 2 days     |
| 15  | Types mixed with mock data in `build-mock-data.ts` and `trading-data.ts` | 🟢       | 2 files                | 1 day      |

---

## Documents in This Audit

| Document                                                                   | Contents                                                    |
| -------------------------------------------------------------------------- | ----------------------------------------------------------- |
| [01-TYPOGRAPHY-AUDIT.md](./01-TYPOGRAPHY-AUDIT.md)                         | Font size inconsistencies, missing type scale, fix plan     |
| [02-COLOR-TOKEN-AUDIT.md](./02-COLOR-TOKEN-AUDIT.md)                       | Hardcoded colors, token bypass, remediation map             |
| [03-SHARED-COMPONENT-REUSE-AUDIT.md](./03-SHARED-COMPONENT-REUSE-AUDIT.md) | Component duplication, underutilized shared components      |
| [04-REMEDIATION-PLAN.md](./04-REMEDIATION-PLAN.md)                         | Prioritized fix plan with phases and effort estimates       |
| [05-MOCK-DATA-AUDIT.md](./05-MOCK-DATA-AUDIT.md)                           | Mock data placement, inline violations, centralization plan |

---

## Root Cause

The codebase was built feature-first over multiple sprints with different contributors. `globals.css` was designed as the SSOT for colors, but:

1. **No enforcement mechanism** (ESLint rule, PR review checklist) ensures new code uses tokens
2. **No typography tokens exist** in the design system — colors were formalized, font sizes were not
3. **Shared components** were built (MetricCard, FilterBar, EmptyState) but adoption was not tracked or enforced
4. **`branding.ts`** was created as a parallel source of truth with different color values than `globals.css`

## Recommended Immediate Actions

1. **Add typography tokens** to `globals.css` and create a `PageHeader` component
2. **Add ESLint rules** to flag `text-zinc-*`, `bg-zinc-*`, `text-green-*`, etc. (prefer semantic tokens)
3. **Align `branding.ts`** with `globals.css` (single source of truth)
4. **Fix Badge component** to use `--status-*` / `--pnl-*` tokens instead of raw `green-500`, `red-500`
5. **Centralize mock data** — ~60% of mock data (~10,000+ lines) is inline in pages/components instead of `lib/`; extract to `lib/mocks/` for clean API wiring
