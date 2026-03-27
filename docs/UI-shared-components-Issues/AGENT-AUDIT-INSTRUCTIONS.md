# UI Codebase Audit — Reusable Agent Instructions

**Purpose:** Hand this document to any AI agent to conduct a comprehensive UI quality audit.
**Last updated:** 2026-03-27
**Output location:** `docs/UI-shared-components-Issues/`

---

## Instructions for the Agent

You are performing a **production-grade UI codebase audit** on the `unified-trading-system-ui` repository. Think of this as a senior staff engineer at a major fintech firm reviewing the entire frontend for design system compliance, code quality, and maintainability before a platform-wide release.

**Your job is to:**

1. Search the codebase systematically for each audit category below
2. Produce one document per category, with file paths, line numbers, variable names, counts, and specific examples
3. Produce an executive summary document with severity ratings and effort estimates
4. Produce a prioritized remediation plan

**Rules:**

- Every finding must have **file path + line number** evidence — no vague claims
- Group findings by directory (`app/(platform)/`, `app/(ops)/`, `app/(public)/`, `components/`, `lib/`, `hooks/`)
- Count occurrences — "many files" is not acceptable; "47 files, ~320 occurrences" is
- For each violation, state **what token/component/pattern SHOULD be used** instead
- Rate severity: 🔴 Critical (systemic) · 🟡 High (widespread) · 🟢 Medium (localized)
- Estimate fix effort in developer-days
- Cross-reference with `globals.css`, `.cursorrules`, and `UI_STRUCTURE_MANIFEST.json` as the SSOTs

**Parallelization:** Launch audit categories in parallel where possible. Each category is independent.

---

## Pre-Audit: Read These Files First

Before auditing, read these to understand the design system and project rules:

| File                                 | Why                                                                      |
| ------------------------------------ | ------------------------------------------------------------------------ |
| `app/globals.css`                    | SSOT for color tokens, CSS variables, font families, radii, print styles |
| `.cursorrules`                       | Architecture rules, mock data policy, component placement, API patterns  |
| `UI_STRUCTURE_MANIFEST.json`         | Current structural state of the app                                      |
| `lib/config/branding.ts`             | Branding constants — check for divergence from globals.css               |
| `components/ui/badge.tsx`            | Core Badge primitive — check token usage                                 |
| `components/ui/card.tsx`             | Core Card primitive — check typography defaults                          |
| `components/ui/table.tsx`            | Core Table primitive — check size defaults                               |
| `components/shared/metric-card.tsx`  | Shared KPI card — check adoption                                         |
| `components/ui/empty-state.tsx`      | Shared empty state — check adoption                                      |
| `components/platform/filter-bar.tsx` | Shared filter bar — check adoption                                       |
| `components/shell/service-tabs.tsx`  | Shell tab navigation — check consistency                                 |

---

## Audit Categories

### Category 1: Typography & Type Scale

**Search for:**

- All Tailwind text size classes: `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`, `text-4xl`, `text-5xl`, `text-6xl`+
- Arbitrary pixel sizes: `text-[Npx]`, `text-[Nrem]`, `text-[Nem]`
- Inline `font-size:` in CSS strings
- `fontSize:` in JS/TS style objects (charts, canvas)
- Font weight inconsistencies: `font-bold` vs `font-semibold` vs `font-medium` for same semantic level
- Line height: `leading-*` usage patterns
- Letter spacing: `tracking-*` usage patterns
- Responsive text: `sm:text-*`, `md:text-*`, `lg:text-*`

**Specifically check consistency of:**

- Page `h1` titles across all `app/(platform)/**/page.tsx` — same size and weight?
- Section headers (`h2`, `h3`) — consistent hierarchy?
- Table header text — all using same primitive defaults?
- Card titles — all using CardTitle or ad-hoc?
- Form labels — all using Label primitive or ad-hoc?
- Badge text — consistent sizing?
- Navigation items — consistent sizing?
- Tooltip / popover text — consistent?

**Check for existence of:**

- Typography tokens in `globals.css` (e.g., `--text-page-title`, `--text-body`)
- Shared `Typography`, `Heading`, or `PageTitle` component
- Typography constants file in `lib/config/`
- Any parallel type scale files (like `finder-text-sizes.ts`)

**Output:** `01-TYPOGRAPHY-AUDIT.md`

---

### Category 2: Color Tokens & Theming

**Search for:**

- Hardcoded hex colors (`#` + hex digits) in `.tsx`/`.ts` files (exclude `globals.css`)
- Hardcoded `rgb()` / `rgba()` / `hsl()` / `hsla()` in styles
- Tailwind neutrals bypassing tokens: `text-zinc-*`, `text-gray-*`, `text-slate-*`, `text-neutral-*`, `text-stone-*`, `bg-zinc-*`, `bg-gray-*`, `bg-slate-*`, `border-zinc-*`, `border-gray-*`
- Tailwind semantic colors bypassing tokens: `text-green-*`, `text-red-*`, `text-blue-*`, `text-cyan-*`, `text-amber-*`, `text-yellow-*`, `text-emerald-*`, `text-rose-*`, `bg-green-*`, `bg-red-*`, etc.
- `text-white`, `text-black`, `bg-white`, `bg-black` (should use `text-foreground`, `bg-background`)
- Arbitrary color classes: `text-[#...]`, `bg-[#...]`, `border-[#...]`
- Inline `style={{ color: ... }}` or `style={{ backgroundColor: ... }}` with hardcoded values

**Cross-reference with `globals.css` tokens:**

- Map each hardcoded value to the correct design token
- Flag divergence between `branding.ts` and `globals.css`
- Check Badge, StatusBadge, and other primitives for token compliance

**Output:** `02-COLOR-TOKEN-AUDIT.md`

---

### Category 3: Spacing & Layout Consistency

**Search for:**

- Page-level padding: is it `p-4`, `p-6`, `p-8`, or something else? Is it consistent?
- Page max-width: `max-w-*` or `platform-page-width` class — consistent?
- Section gaps: `space-y-*`, `gap-*` — consistent for same structural level?
- Card padding: using Card primitive defaults or overriding?
- Margin patterns: `mt-*`, `mb-*`, `mx-auto` — ad-hoc or systematic?
- Container/wrapper patterns: is there a shared `PageWrapper` or equivalent?

**Check for existence of:**

- Spacing tokens in `globals.css`
- Shared page wrapper / content container component
- Consistent responsive breakpoint usage

**Output:** `03-SPACING-LAYOUT-AUDIT.md`

---

### Category 4: Shared Component Reuse

**For each of these component categories, check: does a shared component exist, and what % of pages use it vs rolling their own?**

| Component Pattern                           | Shared Location (if exists)           | Check For                                            |
| ------------------------------------------- | ------------------------------------- | ---------------------------------------------------- |
| Page header (title + description + actions) | ?                                     | Every `<h1>` in `app/` pages                         |
| Metric/KPI card                             | `components/shared/metric-card.tsx`   | Ad-hoc Card+number patterns                          |
| Status badge                                | `components/trading/status-badge.tsx` | Inline status pills, colored dots                    |
| Empty state                                 | `components/ui/empty-state.tsx`       | "No data" / "No results" patterns                    |
| Loading skeleton                            | `components/ui/skeleton.tsx`          | Per-page skeleton compositions                       |
| Data table                                  | `components/ui/data-table.tsx`        | Inline `<table>` or raw `Table` where DataTable fits |
| Filter bar                                  | `components/platform/filter-bar.tsx`  | Per-page filter/search UI                            |
| Error boundary                              | ?                                     | Per-page try/catch vs shared                         |
| Confirmation dialog                         | `components/ui/alert-dialog.tsx`      | Custom modal patterns                                |
| Toast/notification                          | `components/ui/sonner.tsx` or toast   | Ad-hoc notification patterns                         |
| Tab navigation                              | `components/shell/service-tabs.tsx`   | Ad-hoc tab styling                                   |
| Breadcrumb                                  | ?                                     | Per-page breadcrumb vs shared                        |
| Page wrapper                                | ?                                     | Per-page padding/max-width vs shared                 |

**Also check:**

- Duplicate component names across directories (e.g., two `EmptyState`, two `FilterBar`)
- Components that exist in `components/ui/` but are never imported
- Components in `components/trading/` that are generic enough for `components/shared/`

**Output:** `04-SHARED-COMPONENT-REUSE-AUDIT.md`

---

### Category 5: Mock Data Placement

**The rule:** All mock/fixture data belongs in `lib/` (ideally `lib/mocks/fixtures/` and `lib/mocks/generators/`). No page or component should define mock data inline.

**Search for:**

- `const MOCK_*`, `const mock*`, `const SAMPLE_*`, `const DEMO_*`, `const FAKE_*`, `const FALLBACK_*`, `const DEFAULT_*` (when value is a data array/object, not a config primitive)
- `const SEED_*` in hooks
- Large array literals (`[{` with 3+ objects containing fields like `id`, `name`, `status`, `price`, `venue`, `timestamp`)
- Data generation functions: `generateMock*`, `generateSample*`, `Array.from({length:N})` creating domain data
- `Math.random()` used for synthetic data generation inside pages/components
- Mock data files (`mock-data.ts`, `mock-fixtures.ts`) adjacent to components instead of in `lib/`

**For each finding:**

- File path, line numbers, variable name, approximate size (lines, array items)
- What domain it represents
- Whether a corresponding `lib/` mock file already exists
- Whether the data shape matches any `hooks/api/` response type

**Also audit the mock architecture:**

- Does `lib/mocks/` exist with `handlers/` and `fixtures/` (per `.cursorrules`)?
- Is MSW in `package.json`?
- How does mock interception actually work (env flag, mock-handler, etc.)?
- Do `hooks/api/*.ts` files contain inline data or import from `lib/`?
- Are types co-located with mock data (should be separate)?

**Check for duplication:**

- Same data generation functions copy-pasted between pages
- Same fixture arrays with slight variations across files

**Output:** `05-MOCK-DATA-AUDIT.md`

---

### Category 6: Accessibility (a11y)

**Search for:**

- Images without `alt` attributes: `<img` without `alt=`
- Icons used as buttons without `aria-label`: icon-only `<button>` or clickable elements
- Color-only indicators (no text/icon fallback for colorblind users)
- Missing `role` attributes on interactive custom elements
- Missing `aria-*` attributes on modals, dialogs, dropdowns, tooltips
- Keyboard navigation: are all interactive elements focusable? Tab order logical?
- `tabIndex` usage — overuse or misuse
- Skip-to-content link: does one exist?
- Focus trap: do modals/dialogs trap focus correctly?
- Form labels: `<label htmlFor>` or `aria-labelledby` on all inputs?
- Contrast: do status indicators rely solely on color?

**Check primitives:**

- Does `Button` have proper focus styles?
- Does `Dialog` / `Sheet` / `Drawer` have proper focus management?
- Does `Select` / `Combobox` have keyboard support?
- Does the sidebar have proper `nav` landmark?

**Output:** `06-ACCESSIBILITY-AUDIT.md`

---

### Category 7: Responsive Design & Mobile

**Search for:**

- Responsive breakpoints: `sm:`, `md:`, `lg:`, `xl:`, `2xl:` — usage patterns
- `hidden md:block` / `block md:hidden` — mobile vs desktop show/hide
- Fixed widths: `w-[Npx]`, `min-w-[Npx]`, `max-w-[Npx]` — do they break on small screens?
- Overflow: `overflow-x-auto`, `overflow-hidden`, `truncate` — are tables/grids horizontally scrollable?
- Touch targets: are buttons/links large enough for touch (min 44×44px)?
- `use-mobile.ts` hook — is it used consistently?
- Viewport meta tag: is it set correctly?
- Font sizes below 12px — problematic on mobile

**Output:** `07-RESPONSIVE-DESIGN-AUDIT.md`

---

### Category 8: Performance Patterns

**Search for:**

- Large component files (>500 lines) — candidates for splitting
- `"use client"` on pages that could be server components
- Missing `React.memo`, `useMemo`, `useCallback` on expensive renders
- Unnecessary re-renders: components accepting new object/array refs on every render
- Image optimization: `<img>` vs `next/image`
- Dynamic imports / code splitting: `next/dynamic` usage for heavy components
- Bundle size: are large libraries imported at the top level? (e.g., entire chart libs)
- `useEffect` with missing or incorrect dependency arrays
- Inline function definitions in JSX that cause re-renders

**Output:** `08-PERFORMANCE-AUDIT.md`

---

### Category 9: Code Organization & File Structure

**Search for:**

- Files > 500 lines — should be split
- Files > 900 lines — must be split (per quality gates)
- Components with mixed concerns (data fetching + rendering + state)
- Barrel exports (`index.ts`) — are they complete and correct?
- Import paths: `@/` aliases used consistently?
- Circular dependencies between modules
- Dead code: exported functions/components with zero imports
- `archive/` folder contents — still imported anywhere?

**Output:** `09-CODE-ORGANIZATION-AUDIT.md`

---

### Category 10: Error Handling & Edge Cases

**Search for:**

- API error states: do pages handle loading, error, and empty states for every `useQuery`?
- Missing `Suspense` boundaries
- Unhandled promise rejections in event handlers
- `try/catch` around data transformations that could fail
- `?.` optional chaining — is it used defensively where data could be undefined?
- Form validation: are all form inputs validated before submission?
- URL parameter validation: do pages using `useSearchParams` / `useParams` validate inputs?
- Fallback UI for when components crash (ErrorBoundary)

**Output:** `10-ERROR-HANDLING-AUDIT.md`

---

### Category 11: Naming Conventions & Consistency

**Search for:**

- Component naming: PascalCase consistently?
- File naming: kebab-case for files, PascalCase for components?
- Hook naming: `use-*` prefix?
- Type/interface naming: consistent pattern (e.g., `*Props`, `*State`)?
- Constant naming: `UPPER_SNAKE_CASE` for constants?
- Event handler naming: `on*` / `handle*` consistently?
- Boolean prop naming: `is*`, `has*`, `should*`?
- CSS class naming in globals: consistent BEM or utility pattern?

**Output:** `11-NAMING-CONVENTIONS-AUDIT.md`

---

### Category 12: Internationalization Readiness (i18n)

**Search for:**

- Hardcoded English strings in JSX (user-visible text not in a constants file or i18n system)
- Date/time formatting: using `date-fns` / `Intl` consistently? Or hardcoded formats?
- Number formatting: using `Intl.NumberFormat` or a shared formatter? Or inline `.toFixed()`?
- Currency formatting: consistent across P&L, positions, reports?
- Pluralization: hardcoded "1 item" / "N items" vs dynamic?
- RTL readiness: using `start`/`end` vs `left`/`right` in layout?

**Output:** `12-I18N-READINESS-AUDIT.md`

---

### Category 13: Security Patterns

**Search for:**

- `dangerouslySetInnerHTML` usage — is input sanitized?
- User input rendered without escaping
- API keys / secrets in client-side code (`.env` vars with `NEXT_PUBLIC_` that shouldn't be public)
- `eval()` or `new Function()` usage
- External URLs opened without `rel="noopener noreferrer"`
- Form submissions: CSRF protection?
- Auth token handling: stored in localStorage (vulnerable) vs httpOnly cookie?

**Output:** `13-SECURITY-AUDIT.md`

---

## Output Format

### Per-Category Document Structure

Each document should follow this template:

```markdown
# [NN] — [Category Name] Audit

**Date:** [auto]
**Scope:** [directories searched]

## 1. Current State

[What exists — tokens, components, patterns already in place]

## 2. Findings

[Tables with file paths, line numbers, specific violations, counts]

## 3. Worst Offenders

[Top 5–10 files by violation count]

## 4. Recommended Fixes

[Specific code changes, new components/tokens to create]

## 5. Remediation Priority

[Phased plan with effort estimates]
```

### Executive Summary Document

```markdown
# UI Design System Audit — Executive Summary

**Date:** [auto]
**Scope:** [repo name] — all files in app/, components/, lib/

## Finding Summary

[Table: #, Finding, Severity, Files Affected, Fix Effort]

## Documents in This Audit

[Links to each category document]

## Root Cause Analysis

[Why these issues exist]

## Recommended Immediate Actions

[Top 5 highest-impact fixes]
```

### Remediation Plan Document

```markdown
# Remediation Plan

## Phase 1: Fix the Foundation (tokens, primitives)

## Phase 2: Create Missing Shared Components

## Phase 3: Migrate High-Traffic Pages

## Phase 4: Sweep Remaining Files

## Phase 5: Add Enforcement (ESLint rules, PR checklist)
```

---

## Audit Scope Options

When running this audit, you can choose scope:

| Scope                           | Categories | Effort   |
| ------------------------------- | ---------- | -------- |
| **Quick** (design system only)  | 1–5        | ~2 hours |
| **Standard** (design + quality) | 1–10       | ~4 hours |
| **Full** (enterprise-grade)     | 1–13       | ~6 hours |

Default is **Standard** unless instructed otherwise.

---

## How to Run This Audit

### Option A: Full Fresh Audit

Copy-paste one of these prompts to the agent verbatim:

**Quick scope (design system only, ~2 hours):**

```
Read the audit instructions at docs/UI-shared-components-Issues/AGENT-AUDIT-INSTRUCTIONS.md.
Run a FRESH UI codebase audit using Quick scope (categories 1–5).

Steps:
1. Read the pre-audit files listed in the instructions document.
2. For each category 1–5, launch parallel sub-agents to search the codebase per the search patterns described.
3. Produce one document per category in docs/UI-shared-components-Issues/ following the per-category template.
4. Produce 00-EXECUTIVE-SUMMARY.md with the finding summary table, severity ratings, and effort estimates.
5. Produce a REMEDIATION-PLAN.md with phased fix plan.
6. Each finding MUST have file path + line number evidence, occurrence counts, and a recommended fix.

Output all documents to: docs/UI-shared-components-Issues/
Overwrite existing documents if they exist (this is a fresh audit).
```

**Standard scope (design + quality, ~4 hours):**

```
Read the audit instructions at docs/UI-shared-components-Issues/AGENT-AUDIT-INSTRUCTIONS.md.
Run a FRESH UI codebase audit using Standard scope (categories 1–10).

Steps:
1. Read the pre-audit files listed in the instructions document.
2. For each category 1–10, launch parallel sub-agents to search the codebase per the search patterns described.
3. Produce one document per category in docs/UI-shared-components-Issues/ following the per-category template.
4. Produce 00-EXECUTIVE-SUMMARY.md with the finding summary table, severity ratings, and effort estimates.
5. Produce a REMEDIATION-PLAN.md with phased fix plan.
6. Each finding MUST have file path + line number evidence, occurrence counts, and a recommended fix.

Output all documents to: docs/UI-shared-components-Issues/
Overwrite existing documents if they exist (this is a fresh audit).
```

**Full scope (enterprise-grade, ~6 hours):**

```
Read the audit instructions at docs/UI-shared-components-Issues/AGENT-AUDIT-INSTRUCTIONS.md.
Run a FRESH UI codebase audit using Full scope (categories 1–13).

Steps:
1. Read the pre-audit files listed in the instructions document.
2. For each category 1–13, launch parallel sub-agents to search the codebase per the search patterns described.
3. Produce one document per category in docs/UI-shared-components-Issues/ following the per-category template.
4. Produce 00-EXECUTIVE-SUMMARY.md with the finding summary table, severity ratings, and effort estimates.
5. Produce a REMEDIATION-PLAN.md with phased fix plan.
6. Each finding MUST have file path + line number evidence, occurrence counts, and a recommended fix.

Output all documents to: docs/UI-shared-components-Issues/
Overwrite existing documents if they exist (this is a fresh audit).
```

---

### Option B: Delta Audit (What Changed Since Last Audit)

Use this when you want to check only what changed since the last audit, not re-scan everything.

```
Read the audit instructions at docs/UI-shared-components-Issues/AGENT-AUDIT-INSTRUCTIONS.md.
Run a DIFFERENTIAL UI codebase audit.

Steps:
1. Read the previous executive summary at docs/UI-shared-components-Issues/00-EXECUTIVE-SUMMARY.md to understand prior findings.
2. Run `git diff --name-only <last-audit-commit-or-date>..HEAD` to get the list of files changed since the last audit.
   If no commit is known, use `git log --since="YYYY-MM-DD" --name-only --pretty=format:""` with the date from the previous executive summary.
3. For ONLY the changed files, run the Standard scope (categories 1–10) audit checks.
4. Compare findings against the previous audit:
   - NEW findings (violations introduced since last audit) — flag as 🆕
   - FIXED findings (violations from last audit that are now resolved) — flag as ✅
   - UNCHANGED findings (still present, not touched) — skip (don't re-report)
   - REGRESSED findings (was partially fixed, now worse) — flag as 🔴
5. Produce a single document: docs/UI-shared-components-Issues/DELTA-AUDIT-<YYYY-MM-DD>.md with:
   - Summary of changes since last audit (files added/modified/deleted)
   - New findings table
   - Fixed findings table
   - Updated executive summary metrics (before vs after)
   - Remaining remediation priority

Do NOT overwrite the existing category documents — this is an incremental report.
```

---

### Option C: Single-Category Deep Dive

Use this when you want to audit just one specific area in depth.

```
Read the audit instructions at docs/UI-shared-components-Issues/AGENT-AUDIT-INSTRUCTIONS.md.
Run a DEEP DIVE audit on Category [N]: [Category Name].

Steps:
1. Read the pre-audit files listed in the instructions document.
2. Follow ALL search patterns for Category [N] exhaustively — every file, every occurrence.
3. For this category, also check the archive/ directory and any test files for violations.
4. Produce an updated document: docs/UI-shared-components-Issues/[NN]-[CATEGORY-NAME]-AUDIT.md
5. Include a per-file violation table (every file, every line number, every occurrence).
6. Include before/after code examples for the top 10 worst offenders.
7. Update 00-EXECUTIVE-SUMMARY.md with the revised findings for this category.

Overwrite the existing category document.
```

Replace `[N]` with the category number and `[Category Name]` with the name. Examples:

- Category 1: Typography & Type Scale
- Category 2: Color Tokens & Theming
- Category 5: Mock Data Placement
- Category 6: Accessibility
- Category 8: Performance Patterns

---

### Option D: Audit + Fix

Use this when you want the agent to audit AND apply fixes in one session.

```
Read the audit instructions at docs/UI-shared-components-Issues/AGENT-AUDIT-INSTRUCTIONS.md.
Run a Quick scope audit (categories 1–5), then APPLY Phase 1 fixes from the remediation plan.

Steps:
1. Run the Quick scope audit per the instructions.
2. Produce the audit documents.
3. Then execute Phase 1 of the remediation plan:
   - Add typography tokens to globals.css
   - Fix branding.ts to align with globals.css
   - Fix Badge component to use design tokens
   - Fix StatusBadge rgba values to use color-mix
   - Create PageHeader shared component
4. After applying fixes, run a delta check on the fixed files to confirm violations are resolved.
5. Update the executive summary with the post-fix state.

Do NOT commit — leave changes staged for my review.
```

---

### Option E: Targeted File/Directory Audit

Use this to audit a specific directory or set of files (useful after a feature branch).

```
Read the audit instructions at docs/UI-shared-components-Issues/AGENT-AUDIT-INSTRUCTIONS.md.
Run a TARGETED audit on these paths only:
- [path1]
- [path2]
- [path3]

Use Standard scope (categories 1–10) but restrict all searches to the listed paths.
Produce a single report: docs/UI-shared-components-Issues/TARGETED-AUDIT-<YYYY-MM-DD>.md
Include a summary of how each path scores against each category.
Do NOT overwrite existing audit documents.
```

Replace the paths with the directories or files you want audited. Examples:

- `components/trading/sports/`
- `app/(platform)/services/trading/`
- `components/promote/`
