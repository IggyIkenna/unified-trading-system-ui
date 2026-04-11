# A — Typography & Type Scale Audit

**Date:** 2026-03-28  
**Scope:** `app/(platform)/`, `app/(ops)/`, `components/` (TypeScript/TSX). Per Module A instructions, **`app/(public)/` is excluded** from adoption metrics and raw-scale counts. `app/health/` (14 raw size matches) and root `app/layout.tsx` are outside this scope but noted where relevant.  
**Previous audit:** First audit (no prior `01-TYPOGRAPHY-AUDIT.md` baseline in repo).

---

## 1. Current State

### SSOT in `app/globals.css`

Semantic typography is defined under `@theme inline` and documented as the single change point for the dense trading UI:

```171:176:app/globals.css
  --text-page-title: 1.25rem;
  --text-section-title: 1rem;
  --text-body: 0.875rem;
  --text-label: 0.75rem;
  --text-caption: 0.6875rem;
  --text-data: 0.8125rem;
```

These map to Tailwind utilities: `text-page-title`, `text-section-title`, `text-body`, `text-label`, `text-caption`, `text-data`. Font stacks are also declared in the same block (`--font-sans`, `--font-mono`).

### `UI_STRUCTURE_MANIFEST.json`

Manifest v4.0.0 (2026-03-22) describes shell components (`lifecycle-nav`, `service-tabs`, `breadcrumbs`, etc.) but does not encode typography rules; visual SSOT remains `globals.css`.

### `lib/config/branding.ts`

- States CSS variables in `globals.css` as SSOT for design tokens.
- `FONTS.sans` / `FONTS.mono` reference Next.js font CSS variables (`--font-ibm-plex-sans`, `--font-jetbrains-mono`), while `@theme` lists literal family names (`"IBM Plex Sans"`, `"JetBrains Mono"`). **Font wiring is split** between `app/layout.tsx` (next/font variables on `<body>`) and `@theme` font tokens — not a second font-size system, but two parallel ways of expressing the same families.

### shadcn primitives (downstream of tokens)

Core UI components bake in **raw** Tailwind text sizes, so every consumer inherits non-semantic scale until primitives are updated:

| Component         | Evidence                                             | Issue                                                              |
| ----------------- | ---------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `Badge`           | `text-xs` in `badgeVariants`                         | `8:8:components/ui/badge.tsx`                                      | Should align to `text-label` (or a dedicated badge token if added).              |
| `Label`           | `text-sm` default                                    | `16:16:components/ui/label.tsx`                                    | Expected migration: `text-label` + keep `font-medium`.                           |
| `CardDescription` | `text-sm`                                            | `45:45:components/ui/card.tsx`                                     | → `text-body` or `text-caption` by hierarchy.                                    |
| `CardTitle`       | No `text-*` size (only `leading-none font-semibold`) | `31:37:components/ui/card.tsx`                                     | Inconsistent baseline; consumers often add raw `text-*` ad hoc.                  |
| `Table` / caption | `text-sm` on `<table>` and caption                   | `15:15:components/ui/table.tsx`, `101:101:components/ui/table.tsx` | → `text-body` for table default; caption → `text-caption text-muted-foreground`. |

---

## 2. Findings

### Part 1 — Token adoption (platform + ops + components)

**Semantic token usage:** **0** occurrences of `text-page-title`, `text-section-title`, `text-body`, `text-label`, `text-caption`, and `text-data` in `app/(platform)/`, `app/(ops)/`, and `components/` (`*.tsx` / `*.ts`).

**Raw Tailwind text scale** (occurrence counts via `rg -o` word-boundary matches, same scope):

| Class       | Occurrences | Semantic equivalent (from Module A)                                                                  | Migration needed |
| ----------- | ----------: | ---------------------------------------------------------------------------------------------------- | ---------------- |
| `text-xs`   |    **2857** | `text-label` or `text-caption`                                                                       | Yes              |
| `text-sm`   |    **1425** | `text-body` or `text-data`                                                                           | Yes              |
| `text-base` |     **190** | `text-section-title`                                                                                 | Yes              |
| `text-lg`   |     **204** | `text-page-title` (verify hierarchy)                                                                 | Yes              |
| `text-xl`   |     **104** | `text-page-title`                                                                                    | Yes              |
| `text-2xl`  |     **218** | Often page hero / dashboard — map to `text-page-title` + weight, or new token if intentional step-up | Contextual       |
| `text-3xl`  |      **66** | Same as above                                                                                        | Contextual       |
| `text-4xl`  |       **7** | Same                                                                                                 | Contextual       |
| `text-5xl`  |       **3** | Same                                                                                                 | Contextual       |
| `text-6xl`  |       **2** | Same                                                                                                 | Contextual       |

**Subtotal named raw scale (`text-xs` … `text-6xl`):** **5076** occurrences.

**Arbitrary font-size utilities**

| Pattern           | Occurrences | Notes                                                                                                                                               |
| ----------------- | ----------: | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `text-[Npx]`      |    **1536** | Worst-offender class; **222** distinct `.tsx` files. Replace with `text-caption` / `text-label` / `text-data` where possible.                       |
| `text-[Nrem]`     |       **2** | Treat like arbitrary px.                                                                                                                            |
| `text-[var(--…)]` |    **1216** | Mostly **semantic colors** (e.g. P&L, status), not font size — track under Module B for color token compliance; do not count as font-size adoption. |

**`fontSize:` in style objects (charts / Recharts / canvas)**

- **27** files, **109** lines matching `fontSize` under `app/(platform)/`, `app/(ops)/`, `components/` — consistent with Module A exception for chart ticks/legends (e.g. `components/ml/loss-curves.tsx`, `components/dashboards/executive-dashboard.tsx`, `components/trading/live-batch-comparison.tsx`). **No change required** unless you centralize chart theming later.

**Coverage**

- **396** `.tsx` files contain at least one of `text-xs` … `text-6xl`.
- **`lib/` + `hooks/`:** negligible (`text-sm`: **1** occurrence total) — not a driver.

**Adoption ratio**

- Let **S** = semantic token matches = **0**.
- Let **R** = named raw scale matches = **5076**.
- **Adoption ratio = S / (S + R) = 0%.**
- If arbitrary **px** sizes are included as non-semantic sizing: **0 / (0 + 5076 + 1536) ≈ 0%.**

**Severity:** 🔴 **Critical (systemic)** — tokens exist in SSOT but are unused; the entire platform+ops+components tree bypasses the semantic scale.  
**Effort (this section):** **~4–6 developer-days** for broad class replacement after primitives + shell are fixed (see §4–5).

---

### Part 2 — Semantic level consistency

| Semantic level    | Expected pattern                     | Finding                                                                                                                                                                                                                                                     | Consistent? |
| ----------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| Page title (`h1`) | `text-page-title font-semibold`      | **114** `<h1>` elements in scope; **0** use `text-page-title`. Mix of `text-xl`, `text-2xl`, `text-4xl`, responsive `md:text-5xl`, etc. Examples: `233:233:app/(platform)/dashboard/page.tsx` (`text-xl`), `185:185:app/(ops)/admin/page.tsx` (`text-2xl`). | **No**      |
| Section title     | `text-section-title font-semibold`   | Widespread `text-base` / `text-lg` / raw `font-semibold` without token.                                                                                                                                                                                     | **No**      |
| Card title        | `CardTitle` + tokenized size         | `CardTitle` has **no** default text size; **360** `<CardTitle>` usages across **131** files — sizes vary by caller.                                                                                                                                         | **No**      |
| Table header      | Table primitive defaults             | `TableHead` has weight/spacing but inherits **`text-sm`** from parent `Table` (`15:15:components/ui/table.tsx`), not semantic tokens.                                                                                                                       | **No**      |
| Body text         | `text-body`                          | Dominated by `text-sm` / default inheritance.                                                                                                                                                                                                               | **No**      |
| Label text        | `text-label font-medium`             | `Label` uses **`text-sm`** (`16:16:components/ui/label.tsx`).                                                                                                                                                                                               | **No**      |
| Caption / helper  | `text-caption text-muted-foreground` | Heavy use of `text-xs` + `text-muted-foreground` instead of `text-caption`.                                                                                                                                                                                 | **No**      |
| Badge             | Badge primitive defaults             | **`text-xs`** baked into `badgeVariants` (`8:8:components/ui/badge.tsx`).                                                                                                                                                                                   | **No**      |
| Nav items         | `text-label`                         | Shell uses **`text-xs` / `text-sm`**: e.g. `lifecycle-nav.tsx` (brand `text-sm`, pills `text-xs`, user menu `text-sm`/`text-xs`), `service-tabs.tsx` (`text-sm`), `trading-vertical-nav.tsx` (`text-sm` / `text-xs`), `breadcrumbs.tsx` (`text-xs`).        | **No**      |
| Data cells        | `text-data font-mono`                | Numeric columns often `text-sm` / `text-xs` / arbitrary px; monospace sometimes `font-mono` without `text-data`.                                                                                                                                            | **No**      |

---

### Part 3 — Parallel type systems

| Location                                               | Evidence                                                     | Severity               | Notes                                                            |
| ------------------------------------------------------ | ------------------------------------------------------------ | ---------------------- | ---------------------------------------------------------------- |
| `components/ui/*.tsx`                                  | CVA / `cn()` strings with `text-xs`, `text-sm`               | 🟡 High                | Duplicates global scale; highest blast radius.                   |
| Arbitrary `text-[Npx]`                                 | 1536 matches, 222 files                                      | 🔴 Critical            | One-off scale outside SSOT.                                      |
| `globals.css` `@theme` vs `branding.ts` + `layout.tsx` | Font names in `@theme` vs `var(--font-ibm-*)` from next/font | 🟢 Medium              | Document single wiring path; not duplicate font _sizes_.         |
| Chart `fontSize` props                                 | 27 files                                                     | 🟢 Medium (acceptable) | Keep as chart exception unless shared chart theme is introduced. |
| Tailwind `tailwind.config.*`                           | None at repo root (Tailwind v4 + CSS-first)                  | —                      | No extra JS fontSize overrides found.                            |
| `lib/config/` font size constants                      | No `FONT_SIZE` / `TEXT_SIZE` constants found                 | —                      | Good — avoid adding them; use `globals.css` only.                |

---

## 3. Worst Offenders

Top files by **combined** count of raw named sizes (`text-xs` … `text-6xl`) + `text-[Npx]` (TSX under scope):

| Rank | Combined | Raw scale | `text-[Npx]` | File                                                            |
| ---- | -------: | --------: | -----------: | --------------------------------------------------------------- |
| 1    |      189 |       128 |           61 | `app/(platform)/services/trading/strategies/[id]/page.tsx`      |
| 2    |      188 |        96 |           92 | `components/trading/options-futures-panel.tsx`                  |
| 3    |      154 |       127 |           27 | `components/ops/deployment/DataStatusTab.tsx`                   |
| 4    |      120 |       102 |           18 | `components/ops/deployment/DeploymentDetails.tsx`               |
| 5    |      103 |        93 |           10 | `app/(platform)/investor-relations/board-presentation/page.tsx` |
| 6    |       91 |        86 |            5 | `components/dashboards/quant-dashboard.tsx`                     |
| 7    |       88 |        83 |            5 | `components/dashboards/risk-dashboard.tsx`                      |
| 8    |       86 |        68 |           18 | `app/(platform)/services/manage/clients/page.tsx`               |
| 9    |       84 |        73 |           11 | `components/research/features/feature-dialogs.tsx`              |
| 10   |       77 |        66 |           11 | `app/(platform)/services/trading/defi/staking/page.tsx`         |

Additional high-occurrence files (raw scale only): `components/research/execution/new-execution-dialog.tsx`, `components/trading/manual-trading-panel.tsx`, `components/widgets/accounts/accounts-transfer-widget.tsx`, `app/(platform)/services/data/events/page.tsx`.

---

## 4. Recommended Fixes

1. **Prove tokens in UI** — Add one internal demo or story (optional) using only `text-page-title` … `text-data` to validate Tailwind v4 emits utilities correctly (already defined in `171:176:app/globals.css`).
2. **Update shadcn primitives first** — `badge.tsx`, `label.tsx`, `card.tsx` (`CardTitle` + `CardDescription`), `table.tsx`, and any `button` / `tabs` variants that hardcode `text-sm`/`text-xs`. This fixes thousands of call sites indirectly.
3. **Shell** — Normalize `lifecycle-nav.tsx`, `service-tabs.tsx`, `trading-vertical-nav.tsx`, `breadcrumbs.tsx` to `text-label` (and `text-body` where secondary).
4. **Codemod + manual pass** — Suggested mapping (verify visually per context):
   - `text-sm` → `text-body` (default body / table)
   - `text-xs` → `text-label` (UI chrome) or `text-caption` (timestamps, fine print)
   - `text-base` → `text-section-title`
   - `text-lg` / `text-xl` page headers → `text-page-title`
   - Large marketing-style headings inside **platform** (e.g. `text-4xl` on admin landing) → either `text-page-title` + layout tokens or a **new** semantic token if marketing-like blocks are intentional in-app.
5. **Arbitrary px** — Replace `text-[8px]`–`text-[12px]` clusters with `text-caption` / `text-label`; reserve px only for true one-off chart overlays if needed.
6. **Font SSOT** — Align `@theme` `--font-sans` / `--font-mono` with next/font variables (single source) to match `branding.ts` and avoid drift.

---

## 5. Remediation Priority

| Phase  | Action                                                                                                                                       | Severity | Effort   |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------- |
| **P0** | Migrate `components/ui` text sizes to semantic tokens; give `CardTitle` a default size (`text-section-title`).                               | 🔴       | ~0.5–1 d |
| **P0** | Shell nav + tabs + breadcrumbs → `text-label` / `text-body`.                                                                                 | 🔴       | ~0.5 d   |
| **P1** | Codemod `text-sm` / `text-xs` in `components/` and `app/(platform)/` (largest files first: strategy detail, options panel, deployment tabs). | 🟡       | ~2–3 d   |
| **P2** | Eliminate `text-[Npx]` hot spots (222 files; batch by directory).                                                                            | 🔴       | ~1–2 d   |
| **P2** | Normalize all `<h1>` to `text-page-title` + agreed weight (`font-semibold`).                                                                 | 🟡       | ~0.5–1 d |
| **P3** | Optional: chart theme helper to read caption/body sizes from CSS variables (reduces scattered `fontSize: 10`).                               | 🟢       | ~0.5 d   |

**Total rough order of magnitude:** **~5–8 developer-days** for typography compliance across platform+ops+components, assuming no new tokens; add time if new heading steps are introduced in `@theme`.

---

### Summary metrics

| Metric                               | Value                              |
| ------------------------------------ | ---------------------------------- |
| Semantic token occurrences (scope)   | **0**                              |
| Raw `text-xs`…`text-6xl` occurrences | **5076**                           |
| `text-[Npx]` occurrences             | **1536** (222 files)               |
| Files with any raw named size        | **396**                            |
| `<h1>` count                         | **114** (0 with `text-page-title`) |
| Adoption ratio S/(S+R)               | **0%**                             |
