# C — Spacing & Layout Audit

**Date:** 2026-03-28  
**Scope:** `app/(platform)/`, `app/(ops)/` (all `*.tsx`); cross-referenced `components/ui/card.tsx`, `components/shell/unified-shell.tsx`, `app/globals.css`  
**Previous audit:** First audit

## 1. Current State

**SSOT (`app/globals.css`):** The `@theme inline` block defines semantic spacing:

| Token               | Value          | Intended utilities                     |
| ------------------- | -------------- | -------------------------------------- |
| `--spacing-page`    | 1.5rem (24px)  | `p-page`, `px-page`, `py-page`, etc.   |
| `--spacing-section` | 1rem (16px)    | `gap-section`, `space-y-section`, etc. |
| `--spacing-card`    | 1rem (16px)    | `p-card`                               |
| `--spacing-widget`  | 0.75rem (12px) | `p-widget`, `gap-widget`               |
| `--spacing-cell`    | 0.5rem (8px)   | `p-cell`, `gap-cell`                   |
| `--spacing-tight`   | 0.25rem (4px)  | `gap-tight`, etc.                      |

**Layout SSOT:** `.platform-page-width` and `.container` both use `max-width: min(100%, var(--platform-page-max-width))` (2400px). `UnifiedShell` renders `<main className="flex-1 min-h-0 overflow-auto">` with **no** shared page padding — each page sets its own spacing.

**shadcn Card (`components/ui/card.tsx`):** Uses raw Tailwind `gap-6`, `py-6`, `px-6` on `Card` / `CardHeader` / `CardContent` — not `p-card` / `gap-section`. Vertical rhythm is 24px (spacing scale `6`), while `--spacing-card` is 16px (`1rem`).

**Adoption summary:** In `app/(platform)/` and `app/(ops)/`, **zero** matches for `p-page`, `gap-section`, `space-y-section`, `p-card`, `p-widget`, `gap-widget`, `p-cell`, `gap-cell`, or `gap-tight`. The same search across all `*.tsx` under the repo also returned **no** semantic spacing utilities — tokens exist in CSS only.

---

## 2. Findings

### Part 1: Spacing token adoption (`app/(platform)/` + `app/(ops)/`, `*.tsx`)

| Pattern                                                                                                                   | Occurrences (line matches) | Expected                                                                            | Severity                       |
| ------------------------------------------------------------------------------------------------------------------------- | -------------------------: | ----------------------------------------------------------------------------------- | ------------------------------ |
| `p-4`                                                                                                                     |                        106 | `p-page` for page chrome where 24px is intended; or `p-card` if inside card context | 🟡 High                        |
| `p-6`                                                                                                                     |                        167 | Page shell → `p-page`; nested → context-dependent                                   | 🟡 High                        |
| `p-8`                                                                                                                     |                         24 | Prefer `p-page` + section tokens                                                    | 🟢 Medium                      |
| `px-4`                                                                                                                    |                         87 | `px-page` or wrapper component                                                      | 🟡 High                        |
| `px-6`                                                                                                                    |                         58 | Same                                                                                | 🟡 High                        |
| `py-4`                                                                                                                    |                         44 | Same                                                                                | 🟢 Medium                      |
| `py-6`                                                                                                                    |                         20 | Same                                                                                | 🟢 Medium                      |
| `py-8`                                                                                                                    |                         29 | Same                                                                                | 🟢 Medium                      |
| `px-8`                                                                                                                    |                          1 | Same                                                                                | 🟢 Medium                      |
| `gap-4`                                                                                                                   |                        191 | `gap-section` (16px)                                                                | 🟡 High                        |
| `gap-6`                                                                                                                   |                         41 | Map to `gap-section` if 16px is standard; else document exception                   | 🟢 Medium                      |
| `gap-8`                                                                                                                   |                          3 | Review                                                                              | 🟢 Medium                      |
| `space-y-4`                                                                                                               |                        103 | `space-y-section`                                                                   | 🟡 High                        |
| `space-y-6`                                                                                                               |                        110 | Align to section token or document                                                  | 🟡 High                        |
| `space-y-8`                                                                                                               |                          4 | Review                                                                              | 🟢 Medium                      |
| `p-page` / `gap-section` / `space-y-section` / `p-card` / `p-widget` / `gap-widget` / `p-cell` / `gap-cell` / `gap-tight` |                      **0** | Correct target                                                                      | 🔴 Critical (systemic non-use) |
| `gap-1` / `gap-2` / `gap-1.5`                                                                                             |             233 + 432 + 79 | `gap-tight` / `gap-cell` where they match 4px/8px intent                            | 🟢 Medium (context-dependent)  |
| `space-y-1` / `space-y-2`                                                                                                 |                  102 + 195 | Same                                                                                | 🟢 Medium                      |

**Adoption ratio (platform + ops `*.tsx`):** Semantic spacing utilities **0** / (0 + widespread raw usage) → **0%** effective adoption. Raw `p-*` / `gap-*` / `space-y-*` from the table above total **~1,850+** token-relevant matches (excluding tight gaps), dominated by `gap-2`, `gap-4`, `space-y-6`, `p-6`.

**Evidence — Card primitive vs tokens:**

```10:11:components/ui/card.tsx
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className,
```

```23:24:components/ui/card.tsx
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className,
```

Replace `gap-6`/`py-6`/`px-6` with design tokens when aligning Card to `--spacing-card` / section gaps.

**Evidence — page-level raw padding (example):**

```37:37:app/(platform)/services/trading/overview/page.tsx
    <div className="mx-4 my-4 p-4 rounded-lg border border-destructive/50 bg-destructive/10 flex items-center gap-3">
```

---

### Part 2: Page structure consistency

**Inventory:** **103** `page.tsx` files under `app/(platform)/`; **19** under `app/(ops)/`.

**Shared wrapper:** There is **no** `PageWrapper` / `PageShell` component. Layout is fragmented per page.

**Width / container patterns (platform `page.tsx` only):**

| Pattern                                                                    | Files (count) | Notes                                                                           |
| -------------------------------------------------------------------------- | ------------: | ------------------------------------------------------------------------------- |
| `platform-page-width`                                                      |            16 | Matches SSOT                                                                    |
| `container`                                                                |             9 | Matches SSOT (same max-width token)                                             |
| `max-w-[...]`                                                              |            23 | Arbitrary caps (900px–1800px+) — diverges from `var(--platform-page-max-width)` |
| `space-y-4` or `space-y-6` present                                         |            65 | Common vertical rhythm; not tokenized                                           |
| **No** `platform-page-width`, **no** `container`, **no** `max-w-[` in file |            59 | Often relies on inner layouts / full-bleed / different wrappers — inconsistent  |

**Examples of arbitrary max-width (should use `platform-page-width` or documented exception):**

| File                                                         | Line (approx.)     | Snippet                                         |
| ------------------------------------------------------------ | ------------------ | ----------------------------------------------- |
| `app/(ops)/config/page.tsx`                                  | 463                | `max-w-[1600px] mx-auto space-y-6`              |
| `app/(ops)/ops/page.tsx`                                     | 195                | `max-w-[1600px] mx-auto space-y-6`              |
| `app/(platform)/services/reports/overview/page.tsx`          | 170, 183, 209      | `p-6 max-w-[1600px] mx-auto` / `space-y-6`      |
| `app/(platform)/services/observe/news/page.tsx`              | 109                | `max-w-[1000px] mx-auto space-y-6`              |
| `app/(platform)/services/data/markets/pnl/page.tsx`          | 285                | `max-w-[1400px] mx-auto space-y-6`              |
| `app/(platform)/services/research/quant/page.tsx`            | 261, 362, 462, 607 | `max-w-[1200px]` / `[1400px]` + `space-y-4`/`6` |
| `app/(platform)/services/research/strategy/handoff/page.tsx` | 111                | `max-w-[900px] mx-auto space-y-6`               |

**Responsive breakpoints:** Many pages use `sm:` / `md:` / `lg:`; no single shared grid — acceptable but increases drift risk without a page template.

**Representative page roots (pattern, not exhaustive):**

| Page                                 | Root / outer pattern                        | Padding                           | Max-width                 | Gap         | Consistent?         |
| ------------------------------------ | ------------------------------------------- | --------------------------------- | ------------------------- | ----------- | ------------------- |
| `services/trading/overview/page.tsx` | `WidgetGrid` + banners with `mx-4 my-4 p-4` | Raw `p-4`                         | None on main grid         | Various     | 🟡 Partial          |
| `dashboard/page.tsx`                 | Section stacks                              | `p-4` / `p-6` style usage in body | Often `container` / inner | `gap-4`/`6` | 🟡 Partial          |
| `services/reports/overview/page.tsx` | Conditional branches                        | `p-6`                             | `max-w-[1600px]`          | `space-y-6` | 🟡 Partial          |
| Promote lifecycle pages              | Mostly thin re-exports                      | (delegate)                        | (delegate)                | —           | ⚪ Depends on child |

**Shell main (no page padding):**

```71:71:components/shell/unified-shell.tsx
      <main className="flex-1 min-h-0 overflow-auto">{children}</main>
```

---

### Part 3: Shadow token adoption

| Pattern                                                                   |                Occurrences | Expected                                 | Status                |
| ------------------------------------------------------------------------- | -------------------------: | ---------------------------------------- | --------------------- |
| `shadow-sm` / `shadow-md` / `shadow-lg` in `app/(platform)` + `app/(ops)` | **7** (total line matches) | OK — `@theme` maps these to `--shadow-*` | ✅ Correct where used |
| `shadow-[...]` arbitrary                                                  |                  See below | Prefer token or CSS variable             | 🔴 / 🟡               |
| `boxShadow` inline in `*.tsx`                                             |                      **0** | N/A                                      | ✅                    |

**Arbitrary shadows (sample — violations for theme / single-place elevation changes):**

| File                                                                       | Line            | Issue                                       |
| -------------------------------------------------------------------------- | --------------- | ------------------------------------------- |
| `app/(platform)/investor-relations/board-presentation/page.tsx`            | 1017–1042, 1102 | Multiple `shadow-[0_0_8px_rgba(...)]` glows |
| `components/shell/lifecycle-nav.tsx`                                       | 354, 366, 378   | `shadow-[0_0_10px_rgba(...)]`               |
| `components/trading/kpi-card.tsx`                                          | 60              | `hover:shadow-[0_2px_8px_rgba(0,0,0,0.4)]`  |
| `components/widgets/strategies/strategies-catalogue-widget.tsx`            | 246             | Same hover shadow                           |
| `components/trading/sports/arb-grid.tsx`                                   | 78              | `shadow-2xl shadow-[#4ade80]/10`            |
| `app/(platform)/services/research/ml/components/run-analysis-sections.tsx` | 775, 803        | Sticky column `shadow-[2px_0_8px_...]`      |

**`components/` (reference):** ~**41** matches for `shadow-sm|shadow-md|shadow-lg` — token-aligned. ~**24** lines with `shadow-[` across `app` + `components` (grep scope) — flag for elevation SSOT.

---

### Part 4: Container / max-width

| Pattern               | Occurrences (platform + ops `*.tsx`) | Expected                                                                                             |
| --------------------- | -----------------------------------: | ---------------------------------------------------------------------------------------------------- |
| `max-w-7xl`           |                                    0 | ✅ None found                                                                                        |
| `max-w-screen-*`      |                                    0 | ✅                                                                                                   |
| `platform-page-width` |                                   24 | ✅                                                                                                   |
| `container`           |                                   23 | ✅                                                                                                   |
| `max-w-[...]`         |                                   38 | 🟡 Replace page-level caps with `platform-page-width` unless product requires narrower reading width |

**Narrow-content exceptions:** `max-w-[300px]` on `truncate` table cells (e.g. `services/manage/compliance/page.tsx` ~363) are **OK** for column layout, not page max-width.

---

### Part 5: Parallel layout systems

| Finding                     | Detail                                                                                  | Severity            |
| --------------------------- | --------------------------------------------------------------------------------------- | ------------------- |
| No `PAGE_PADDING` constants | No `const PAGE_PADDING =` style layout SSOT in app code (search empty)                  | 🟢 N/A              |
| Per-page `max-w-[Npx]`      | Multiple competing values (900–1800px)                                                  | 🟡 High             |
| Card / dialog / sheet       | `components/ui/*` uses `p-4`/`p-6`/`gap-4` — third parallel spacing dialect             | 🟡 High             |
| `react-grid-layout`         | Custom handle sizing in `globals.css` (px literals) — separate from Tailwind page scale | 🟢 Low (library UI) |

---

## 3. Worst Offenders

Top files by combined raw spacing pattern density (`p-4|p-6|p-8|px-4|px-6|py-4|py-6|py-8|gap-4|gap-6|space-y-4|space-y-6` matches per file):

| Rank | File                                                            | ~Matches |
| ---- | --------------------------------------------------------------- | -------: |
| 1    | `app/(platform)/investor-relations/board-presentation/page.tsx` |       46 |
| 2    | `app/(platform)/services/manage/clients/page.tsx`               |       32 |
| 3    | `app/(platform)/services/trading/strategies/[id]/page.tsx`      |       29 |
| 4    | `app/(platform)/services/reports/overview/page.tsx`             |       28 |
| 5    | `app/(platform)/services/research/quant/page.tsx`               |       26 |
| 6    | `app/(platform)/settings/notifications/page.tsx`                |       23 |
| 7    | `app/(platform)/services/observe/health/page.tsx`               |       23 |
| 8    | `app/(ops)/config/page.tsx`                                     |       20 |
| 9    | `app/(ops)/admin/users/page.tsx`                                |       19 |
| 10   | `app/(platform)/services/research/strategy/backtests/page.tsx`  |       19 |

---

## 4. Recommended Fixes

1. **Introduce `PlatformPage` (or `PageShell`)** — single wrapper: `platform-page-width` + `p-page` + optional `space-y-section` for default vertical rhythm; allow `variant="narrow"` only where product requires it.
2. **Migrate pages in waves** — replace outer `p-6`/`px-6`/`max-w-[1600px] mx-auto` with the wrapper; keep cell-level `max-w-[300px] truncate` as-is.
3. **Align shadcn Card** — change `components/ui/card.tsx` to use `p-card`, `gap-section` (or explicit token-mapped utilities) so card padding tracks `globals.css`.
4. **Codemod / ESLint** — optional rule: disallow raw `p-4`/`p-6`/`gap-4` on files under `app/(platform)` except in `components/ui` or whitelisted paths.
5. **Shadows** — replace decorative `shadow-[0_0_Npx_rgba(...)]` with named utilities or new CSS variables (e.g. `--shadow-glow-primary`) in `:root`/`.dark` for theme safety (ties to Module B).
6. **Document exceptions** — reading-width pages (`max-w-[900px]`) as explicit variants of `PlatformPage`.

---

## 5. Remediation Priority

| Phase  | Action                                                                        | Effort   |
| ------ | ----------------------------------------------------------------------------- | -------- |
| **P0** | Add `PlatformPage` + migrate **new** pages; document standard                 | ~0.5 d   |
| **P1** | Tokenize `Card` + migrate 10 worst offender pages                             | ~1–1.5 d |
| **P2** | Roll `p-page` / `gap-section` across remaining `app/(platform)` + `app/(ops)` | ~2–3 d   |
| **P3** | Arbitrary shadow cleanup + optional lint                                      | ~1 d     |

**Total rough order:** **~5–6 developer-days** for full spacing + shadow alignment (excluding unrelated refactors).

---

**Severity legend:** 🔴 Critical (systemic) · 🟡 High (widespread) · 🟢 Medium (localized)
