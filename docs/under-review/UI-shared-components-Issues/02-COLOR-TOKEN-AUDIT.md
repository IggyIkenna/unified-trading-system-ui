# B — Color Tokens, Theming & Theme-Readiness Audit

**Date:** 2026-03-28  
**Scope:** `app/`, `components/` (TypeScript/TSX only for automated counts; `globals.css` and `lib/config/branding.ts` read as SSOT — per Module B instructions, Part 1 searches exclude `globals.css`)  
**Previous audit:** First audit (prior `02-COLOR-TOKEN-AUDIT.md` removed from tree; this document replaces it)

---

## 1. Current State

- **`app/globals.css`** defines a full semantic token system in `:root` (light) and `.dark` (dark), including core UI, P&amp;L (`--pnl-positive` / `--pnl-negative`), status, surface-nav, risk, chart (`--chart-1`…`--chart-6`), surface hierarchy (`--surface-1`…`--surface-4`), sidebar, and shadow CSS variables.
- **`@theme inline`** maps those variables to Tailwind color utilities (`--color-background`, `text-foreground`, `bg-card`, `text-pnl-positive`, `text-status-live`, etc.) — see `188:262:app/globals.css`.
- **`next-themes`** (via app shell) is expected to toggle `.dark`; components must use semantic tokens or `var(--*)` so both themes stay coherent.
- **Gap:** Large parts of the tree still use raw Tailwind palette classes (`text-emerald-400`, `bg-amber-500`, `text-zinc-400`, …), hardcoded hex/rgba in TSX, and shadcn primitives (`Badge`) that bake in palette utilities — so **theme switching is not visually reliable** across the product.

---

## 2. Findings

### 2.1 Part 1 — Theme-breaking violations (counts)

Counts below are **occurrence totals** (one line may contain multiple matches), summed with `rg --count-matches` over `app/**/*.tsx` and `components/**/*.tsx`.

| Category | What we searched                                                                       |                                                                                                                Occurrences | Severity    |
| -------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------: | ----------- |
| **1a**   | `text-*` / `bg-*` / `border-*` on zinc, gray, slate, neutral, stone                    |                                                                                    **462** (text 260 + bg 106 + border 96) | 🟡 High     |
| **1b**   | `text-*` / `bg-*` / `border-*` on green, red, blue, cyan, amber, yellow, emerald, rose |                                                                               **3,109** (text 1,721 + bg 858 + border 530) | 🔴 Critical |
| **1c**   | Whole-word `text-white`, `text-black`, `bg-white`, `bg-black`                          |                                                                                                                    **121** | 🟡 High     |
| **1c′**  | Related: `bg-black/…`, `text-white/…`, `bg-white/…` (opacity variants)                 |                                                                                                                     **18** | 🟡 High     |
| **1d**   | Arbitrary Tailwind hex: `text-[#…]`, `bg-[#…]`, `border-[#…]`                          |                                                                                                                    **141** | 🟡 High     |
| **1d′**  | Any `#hex` substring in `.tsx` under `app/` + `components/`                            | **304** lines (includes inline HTML/CSS strings, SVG `fill`/`stroke`, theme-color meta — not all are className violations) | 🟡 High     |
| **1e**   | `rgb(`, `rgba(`, `hsl(`, `hsla(` in `.tsx`                                             |                                                                                                              **117** lines | 🟢 Medium   |

**Files touched (any of 1a–1d Tailwind patterns above):** **262** unique `.tsx` files.

**Top raw palette tokens (frequency sampling):**

| Token              | Approx. occurrences |
| ------------------ | ------------------: |
| `text-emerald-400` |                 591 |
| `text-amber-400`   |                 302 |
| `text-red-400`     |                 203 |
| `text-rose-400`    |                 180 |
| `bg-emerald-500`   |                 195 |
| `bg-amber-500`     |                 151 |
| `bg-red-500`       |                  92 |

**Neutral breakdown (text-\*):** zinc 223, slate 24, gray 2, neutral/stone 0 (subset of 260 total text neutral matches including multi-pattern lines).

### 2.2 Evidence tables (file:line + replacement)

#### `components/` — primitives & shared

| File                                            | Line(s)                             | Violation                                                                                                                                                                                 | Replace with                                                                                                                                                                                                                      |
| ----------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/ui/badge.tsx`                       | 17, 20–24                           | `text-white` on destructive; `success`/`error`/`warning`/`running`/`pending` use `bg-green-500/15 text-green-500`, `bg-red-500/15`, `bg-amber-500/15`, `bg-cyan-500/15`, `bg-gray-500/15` | `text-destructive-foreground`; map variants to `text-pnl-positive` / `text-pnl-negative` / `text-status-warning` / `text-status-running` / `text-muted-foreground` with `bg-*` using `color-mix` or token-based opacity utilities |
| `components/ui/button.tsx`                      | 14                                  | `text-white` on destructive                                                                                                                                                               | `text-destructive-foreground`                                                                                                                                                                                                     |
| `components/ui/dialog.tsx`                      | 41                                  | `bg-black/50` overlay                                                                                                                                                                     | `bg-background/80` or dedicated `--overlay` token in `globals.css` + `bg-overlay`                                                                                                                                                 |
| `components/shared/data-card.tsx`               | 32–41                               | `border-l-[#4ade80]`, `text-[#4ade80]`, etc.                                                                                                                                              | `border-l-pnl-positive`, `text-pnl-positive`, `text-pnl-negative`, `border-l-primary` (add token if needed)                                                                                                                       |
| `components/ops/venue-connectivity.tsx`         | 223–229                             | `color: "#3b82f6"` (and other hex) in TS objects                                                                                                                                          | `var(--status-running)`, `var(--status-idle)`, chart or status tokens                                                                                                                                                             |
| `components/dashboards/executive-dashboard.tsx` | 78–118                              | Chart series `color: "#4ade80"` …                                                                                                                                                         | `var(--chart-1)` … `var(--chart-6)` or theme-aware chart palette helper                                                                                                                                                           |
| `components/shared/status-badge.tsx`            | (line numbers drift — re-open file) | `style={{ color, backgroundColor }}` with **`rgba(...)` literals** for fills                                                                                                              | Prefer CSS vars only: `color-mix(in srgb, var(--status-live) 10%, transparent)` or new utility classes in `globals.css`; **blocked** uses `rgba(239, 68, 68, 0.1)` — not aligned with `--status-critical`                         |

#### `components/trading/` (highest-density)

| File                                                  | Line(s)                             | Violation                                                  | Replace with                                                                                                             |
| ----------------------------------------------------- | ----------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `components/trading/options-futures-panel.tsx`        | 568, 610, 622–624                   | `text-emerald-400`, `bg-emerald-500/5`, `text-emerald-500` | `text-pnl-positive`, `bg-pnl-positive/5` (add `@theme` if missing), muted variants via `text-muted-foreground` / opacity |
| `components/trading/sports/my-bets-tab.tsx`           | (file-wide; **63** palette matches) | Heavy emerald/amber/red stacks                             | Tokenize P&amp;L + status                                                                                                |
| `components/trading/sports/fixtures-match-card.tsx`   | (file-wide; **61** matches)         | Same                                                       | Same                                                                                                                     |
| `components/trading/sports/fixtures-detail-panel.tsx` | (file-wide; **56** matches)         | Same                                                       | Same                                                                                                                     |

#### `app/(public)/`

| File                                        | Line(s)                     | Violation                                                      | Replace with                                                                                                                                    |
| ------------------------------------------- | --------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/(public)/signup/page.tsx`              | 321–341                     | Inline `<style>` and `style="color:#555"` for PDF-style output | For **print/PDF-only** views, acceptable isolated stylesheet — but document as exception; prefer CSS variables if same component renders in-app |
| `app/(public)/services/investment/page.tsx` | 285–314                     | SVG `stroke`/`fill`/`stopColor` hex (`#4ade80`)                | `currentColor` + `className="text-pnl-positive"` or `stroke="var(--pnl-positive)"`                                                              |
| `app/(public)/services/regulatory/page.tsx` | (file-wide; **50** matches) | Marketing palette classes                                      | Marketing may keep stronger art direction — still use tokens where components are shared with platform                                          |

#### `app/(platform)/`

| File                                                            | Line(s)                     | Violation                          | Replace with                                                             |
| --------------------------------------------------------------- | --------------------------- | ---------------------------------- | ------------------------------------------------------------------------ |
| `app/(platform)/investor-relations/board-presentation/page.tsx` | (file-wide; **48** matches) | Dense slate/zinc + accent palettes | `text-foreground` / `text-muted-foreground` / `bg-card` / surface tokens |
| `app/(platform)/services/research/ml/page.tsx`                  | (file-wide; **33** matches) | Raw blues/purples                  | `text-primary`, `text-status-running`, `text-chart-*`                    |

#### `app/(ops)/`

| File                                   | Line(s)                     | Violation                 | Replace with                                 |
| -------------------------------------- | --------------------------- | ------------------------- | -------------------------------------------- |
| `app/(ops)/internal/data-etl/page.tsx` | (file-wide; **33** matches) | Status colors via palette | `text-status-*`, `bg-muted`, `border-border` |

#### `app/layout.tsx` (meta — not className but color SSOT)

| File             | Line(s) | Violation                              | Replace with                                                                                                                                     |
| ---------------- | ------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `app/layout.tsx` | 62–63   | `themeColor` hex `#0a0a0b` / `#f8f9fa` | Acceptable if kept in sync with `globals.css` **or** read from a single TS export of theme metadata; **document** as duplicate of `--background` |

### 2.3 `components/ui` — Select, Tooltip

- **`select.tsx`:** Uses `border-input`, `text-muted-foreground`, `bg-popover` — **compliant** for listed primitives.
- **`tooltip.tsx`:** Uses `bg-foreground text-background` — **token-based** (good contrast inversion pattern).

---

## 3. Worst Offenders

Top **10** `.tsx` files by combined count of Module B Tailwind violations (1a + 1b + 1c + arbitrary `-[#` hex utilities):

| Rank | Matches | File                                                            |
| ---: | ------: | --------------------------------------------------------------- |
|    1 |      83 | `components/trading/options-futures-panel.tsx`                  |
|    2 |      63 | `components/trading/sports/my-bets-tab.tsx`                     |
|    3 |      61 | `components/trading/sports/fixtures-match-card.tsx`             |
|    4 |      56 | `components/trading/sports/fixtures-detail-panel.tsx`           |
|    5 |      50 | `app/(public)/services/regulatory/page.tsx`                     |
|    6 |      48 | `app/(platform)/investor-relations/board-presentation/page.tsx` |
|    7 |      42 | `components/trading/sports/arb-grid.tsx`                        |
|    8 |      37 | `components/trading/predictions/arb-stream-tab.tsx`             |
|    9 |      36 | `components/trading/manual-trading-panel.tsx`                   |
|   10 |      36 | `app/(public)/services/backtesting/page.tsx`                    |

---

## 4. Part 2 — Token coverage (`globals.css` vs usage)

| Token family                                                            | `:root` | `.dark` | `@theme` mapping               | Used in components?                                                                                                                                      |
| ----------------------------------------------------------------------- | ------- | ------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Core (background, foreground, card, popover, primary, muted, border, …) | Yes     | Yes     | Yes                            | **Yes** — widespread (`text-foreground`, `bg-background`, `bg-card`, …)                                                                                  |
| P&amp;L (`pnl-positive` / `pnl-negative`)                               | Yes     | Yes     | Yes                            | **Underused as Tailwind utilities** — ~0 `text-pnl-positive` / `text-pnl-negative`; heavy use of `text-emerald-*` / `text-rose-*` / `text-red-*` instead |
| Status (`status-live`, `warning`, `critical`, `idle`, `running`)        | Yes     | Yes     | Yes                            | **Sparse** as utilities; `StatusBadge` uses CSS vars for text but **rgba backgrounds** bypass theme                                                      |
| Surface nav (`surface-trading`, … `surface-reports`)                    | Yes     | Yes     | Yes                            | **Low** direct utility usage; marketing/trading often uses raw greens/blues                                                                              |
| Risk (`risk-healthy`, `warning`, `critical`)                            | Yes     | Yes     | Yes                            | **Very low** — `risk-*` utilities rarely appear; risk UI often uses emerald/amber/red                                                                    |
| Chart (`chart-1` … `chart-6`)                                           | Yes     | Yes     | Yes                            | **Low** — many charts pass **hardcoded hex** in config objects                                                                                           |
| Surface hierarchy (`surface-1` … `surface-4`)                           | Yes     | Yes     | Yes                            | **Moderate** — some `bg-surface-*`; many files still use `bg-zinc-*` / `bg-slate-*`                                                                      |
| Sidebar                                                                 | Yes     | Yes     | Yes                            | **Yes** (`bg-sidebar`, related)                                                                                                                          |
| Shadows (`shadow-sm` / `md` / `lg`)                                     | Yes     | Yes     | Yes (`--shadow-*` in `@theme`) | **Some** usage (`shadow-sm` ~21 matches); verify consistency vs raw `shadow-*` on colored backgrounds                                                    |

**SSOT note (outside Part 1 scope but affects theming):** `react-grid-layout` overrides in `globals.css` use `hsl(var(--primary) / 0.15)` while `--primary` is defined as **hex** (e.g. `#22d3ee`), not HSL components — placeholders/handles may not resolve as intended. Track as a **separate CSS fix** in `globals.css` (convert to OKLCH/HSL tokens or use `color-mix` with `var(--primary)`).

---

## 5. Part 3 — `lib/config/branding.ts` cross-reference

| Check                         | Result                                                                                                                                                                                                                                   |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Color values vs `globals.css` | **`BRAND_COLORS` uses HSL strings** (e.g. primary `hsl(142, 76%, 36%)`) that **do not match** the cyan-forward institutional palette in `globals.css` (light primary `#0891b2`, dark `#22d3ee`).                                         |
| Used in UI?                   | **`BRAND_COLORS` is not referenced** in `app/` or `components/` (only exported from `lib/config/index.ts` and asserted in `__tests__/lib/config/config.test.ts`).                                                                        |
| Recommendation                | Either **delete `BRAND_COLORS`** until a real consumer exists, or **regenerate from the same SSOT** as `globals.css` and use only for non-CSS contexts (e.g. OG images) with a documented pipeline — **do not** let it diverge silently. |

---

## 6. Part 4 — Component primitive compliance

| Component       | Token compliance     | Notes                                                                                                                                    |
| --------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Badge**       | **Non-compliant**    | Raw palette for `success`/`error`/`warning`/`running`/`pending`; destructive uses `text-white` (`16:24:components/ui/badge.tsx`)         |
| **Button**      | **Mostly compliant** | Destructive uses `text-white` (`13:14:components/ui/button.tsx`)                                                                         |
| **StatusBadge** | **Mixed**            | Text colors use `var(--status-*)`; **backgrounds use hardcoded `rgba`** (`41:88:components/shared/status-badge.tsx`) — light theme drift |
| **Select**      | **Compliant**        | Semantic borders/backgrounds                                                                                                             |
| **Dialog**      | **Mostly compliant** | Overlay `bg-black/50` breaks strict token rule (`41:41:components/ui/dialog.tsx`)                                                        |
| **Tooltip**     | **Compliant**        | Inverted `foreground`/`background` pattern                                                                                               |

---

## 7. Recommended fixes (concrete)

1. **Extend `@theme` / utilities** where needed (e.g. `bg-pnl-positive/10` if opacity variants are missing) so authors do not reach for `emerald-*`.
2. **Refactor `components/ui/badge.tsx` variants** to semantic tokens; same for **Button destructive** text color.
3. **Replace `StatusBadge` `rgba(...)`** with `color-mix(in srgb, var(--status-*) …)` or dedicated classes in `globals.css` per status.
4. **Codemod-style pass** on `components/trading/**` and top public pages: map emerald→pnl-positive, rose/red→pnl-negative or destructive, amber→status-warning, cyan/blue→primary or status-running.
5. **Charts:** centralize series colors in a helper that reads `getComputedStyle` or passes `var(--chart-n)` so Recharts / custom SVG respects theme.
6. **Dialog overlay:** add `--overlay` or use `bg-background` with opacity in tokens.
7. **branding.ts:** align or remove `BRAND_COLORS`.

---

## 8. Remediation priority & effort

| Phase  | Scope                                                                                            | Goal                                                     | Effort (indicative) |
| ------ | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------- | ------------------- |
| **P0** | `components/ui/badge.tsx`, `button.tsx`, `dialog.tsx`, plus `components/shared/status-badge.tsx` | Fix **shared primitives** so new code defaults to tokens | **0.5–1 dev-day**   |
| **P1** | Top 15 offender files (~60% of raw matches if clustered)                                         | Cut worst trading + sports surfaces                      | **3–5 dev-days**    |
| **P2** | Remaining `app/(platform)` + `components/trading`                                                | Platform parity in light/dark                            | **1–2 dev-weeks**   |
| **P3** | `app/(public)` marketing art, SVGs, inline HTML                                                  | Decide exceptions vs tokenization                        | **3–5 dev-days**    |
| **P4** | `branding.ts`, chart helpers, `react-grid-layout` CSS                                            | SSOT + CSS correctness                                   | **1–2 dev-days**    |

**Total to ~100% theme-readiness (all 262 files + tests + visual QA):** **~4–6 engineer-weeks** (assuming one primary owner + design sign-off on marketing exceptions).

---

## 9. Summary counts (executive)

| Metric                                                       |                       Value |
| ------------------------------------------------------------ | --------------------------: |
| **1a** neutral palette matches                               |                         462 |
| **1b** semantic palette matches                              |                       3,109 |
| **1c** absolute black/white utilities                        | 121 (+ 18 opacity variants) |
| **1d** arbitrary `-[#` utilities                             |                         141 |
| **1e** rgb/hsl in `.tsx` lines                               |                         117 |
| **Files with Tailwind palette violations (1a–1d composite)** |                         262 |

**Overall severity:** 🔴 **Critical** — raw **1b** semantic Tailwind usage alone exceeds **3k** occurrences across **most** feature areas, so **light theme and dark theme cannot be considered visually unified** until remediation proceeds.
