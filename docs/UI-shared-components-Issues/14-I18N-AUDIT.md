# N — Internationalization (i18n) Audit

**Date:** 2026-03-28  
**Scope:** `app/`, `components/`, `lib/`, `hooks/` (TypeScript/TSX; `node_modules` / `.next` excluded)  
**Previous audit:** First audit

## 1. Current State

| Area                            | What exists                                                                                                                                                                                                                                                                                                                       |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **i18n framework**              | None. No `next-intl`, `react-i18next`, Lingui, or FormatJS in `package.json` or imports (verified via repo-wide search).                                                                                                                                                                                                          |
| **Date/time**                   | `date-fns` ^4.1.0 is a dependency. Used in **8 files** for `format`, `formatDistanceToNow`, and date math. Calls do not pass a `locale` option. `components/ui/date-picker.tsx` uses `format(value, "PPP")`; `components/trading/as-of-datetime-picker.tsx` uses `format(selectedDate, "MMM d, HH:mm")` — English-centric tokens. |
| **Locale APIs**                 | `lib/utils.ts` `formatDateTime` uses `toLocaleString("en-GB", …)`. **313** matches for `toLocale*` across TS/TSX (includes various APIs).                                                                                                                                                                                         |
| **Numbers**                     | **873** `.toFixed(` occurrences across **193** files. Only **2** files use `Intl.NumberFormat` (`components/trading/predictions/helpers.ts`, `components/trading/sports/helpers.ts`), with **mixed** hardcoded locales (`en-US` vs `en-GB`) and currencies (USD vs GBP).                                                          |
| **Shared “currency” helpers**   | `lib/reference-data.ts` `formatCurrency` / `formatPercent` use `toFixed` and ASCII suffixes `B`/`M`/`K` / `%` — not `Intl` (lines 1358–1368). `predictions/helpers.ts` `fmtVolume` builds `$…B/M/K` with `toFixed` (lines 40–44).                                                                                                 |
| **Relative time (custom)**      | `components/trading/sports/helpers.ts` `fmtRelativeTime` returns hardcoded English (`Xs ago`, `Xm ago`, `Xh ago`) (lines 129–136).                                                                                                                                                                                                |
| **User-visible status strings** | Same file: `getStatusLabel` returns English labels (`"Upcoming"`, `"Live"`, `"Penalties"`, etc.) (lines 71–93).                                                                                                                                                                                                                   |
| **RTL-oriented layout**         | **~1,055** class matches for `ml-` / `mr-` / `pl-` / `pr-` in TSX; **0** for `ms-` / `me-` / `ps-` / `pe-`. **148** `left-` / `right-` utility matches vs **18** `start-` / `end-` (Tailwind logical properties underused).                                                                                                       |
| **A11y / form copy**            | Rough counts (TSX): **~33** `aria-label=` with string literals, **~166** `title=`, **~258** `placeholder=` — all candidates for translation keys.                                                                                                                                                                                 |

Overall: the UI is **English-only by construction**, with **no message catalog**, **no runtime locale**, and **inconsistent** locale/currency assumptions between modules.

## 2. Findings

### 2.1 Hardcoded user-visible strings (systemic)

| Severity    | Scope                      | Evidence                                                                                                                                  | What to use instead                                                                                            |
| ----------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 🔴 Critical | Entire product surface     | No i18n library; **574** TSX files under `app/` + `components/` alone                                                                     | Adopt a single strategy (e.g. `next-intl` for App Router) with namespaces per route group; externalize strings |
| 🔴 Critical | Sports / predictions UX    | `getStatusLabel`, `fmtRelativeTime` — `components/trading/sports/helpers.ts`                                                              | Move strings to messages; use `Intl.RelativeTimeFormat` or `date-fns` with `locale`                            |
| 🟡 High     | Research / execution lists | `formatDistanceToNow(…, { addSuffix: true })` without locale — e.g. `components/research/execution/execution-list-panel.tsx` **L128–130** | Pass `locale` from `date-fns/locale` tied to user locale                                                       |
| 🟡 High     | Filter bar / calendars     | `format` from `date-fns` in `components/platform/filter-bar.tsx` **L33**; `components/ui/date-picker.tsx` **PPP** pattern                 | Same: locale-aware `format`; consider `Intl.DateTimeFormat` wrapper                                            |

### 2.2 Date/time formatting

| File                                           | Line(s)                                       | Issue                                         | Replacement                                                            |
| ---------------------------------------------- | --------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------- |
| `lib/utils.ts`                                 | 8–16                                          | Hardcoded `"en-GB"` in `formatDateTime`       | User locale from i18n or `navigator.language` via a single date facade |
| `components/ui/date-picker.tsx`                | (display uses `format(value, "PPP")`)         | English pattern, no locale                    | `format` with locale or `Intl`                                         |
| `components/trading/as-of-datetime-picker.tsx` | (e.g. `format(selectedDate, "MMM d, HH:mm")`) | Fixed English order                           | Locale-aware formatting                                                |
| Multiple research pages                        | Various                                       | `formatDistanceToNow` without `locale` option | `{ locale: … }` from shared locale resolver                            |

### 2.3 Number & currency formatting

| File                                        | Line(s)             | Issue                                                                                 | Replacement                                                                                         |
| ------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `components/trading/predictions/helpers.ts` | 21–36, 40–44, 61–62 | `Intl.NumberFormat("en-US", …)` plus manual `$`/`¢`/`B`/`M`/`K`                       | One `Intl.NumberFormat` / `Intl.CompactNumberFormat` (where supported) per user locale and currency |
| `components/trading/sports/helpers.ts`      | 107–127             | `toFixed` for odds; `Intl.NumberFormat("en-GB", GBP)`; English-only `fmtRelativeTime` | Shared `formatOdds` / `formatCurrency` with locale; translate relative time                         |
| `lib/reference-data.ts`                     | 1358–1368           | `formatCurrency` / `formatPercent` use `toFixed` + suffixes, not `Intl`               | `Intl.NumberFormat` with `notation: "compact"` and proper `currency` / `signDisplay`                |

**Occurrence scale:** `.toFixed(` — **873** hits, **193** files (includes mocks and archive; still indicates pervasive non-locale-aware number rendering).

### 2.4 Pluralization

| Severity | Finding                    | Example pattern                                                                         | Replacement                                                      |
| -------- | -------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 🟡 High  | No ICU / i18n plural rules | Many UI strings embed counts with fixed English grammar across `app/` and `components/` | Message catalogs with plural forms (`next-intl` rich text / ICU) |

_(No dedicated plural helper found; audits should treat any `"1 foo"` / `"N foos"` JSX as debt once catalogs exist.)_

### 2.5 RTL readiness

| Metric                                                         | Count / note           | Severity                         |
| -------------------------------------------------------------- | ---------------------- | -------------------------------- |
| Physical margin/padding utilities (`ml-`, `mr-`, `pl-`, `pr-`) | **~1,055** TSX matches | 🟡 High for RTL                  |
| Logical equivalents (`ms-`, `me-`, `ps-`, `pe-`)               | **0**                  | 🔴 Critical gap if RTL is a goal |
| `left-` / `right-` vs `start-` / `end-`                        | **148** vs **18**      | 🟡 High                          |

**Recommendation:** Prefer logical properties in new code; plan a phased pass on shell, nav, and data tables.

## 3. Worst Offenders

Top files by `.toFixed(` frequency (indicative; full list from `rg … -c | sort -k2 -nr`):

| Rank | File                                                                       | ~Count |
| ---- | -------------------------------------------------------------------------- | ------ |
| 1    | `components/trading/options-futures-panel.tsx`                             | 51     |
| 2    | `components/research/execution/execution-detail-view.tsx`                  | 28     |
| 3    | `archive/ml/validation/page.tsx`                                           | 26     |
| 4    | `app/(platform)/services/research/ml/components/run-analysis-sections.tsx` | 21     |
| 5    | `lib/api/mock-handler.ts`                                                  | 17     |
| 6    | `components/widgets/markets/markets-latency-detail-widget.tsx`             | 17     |
| 7    | `app/(platform)/services/research/strategy/results/page.tsx`               | 17     |
| 8    | `components/trading/manual-trading-panel.tsx`                              | 14     |
| 9    | `components/ops/deployment/DataStatusTab.tsx`                              | 14     |
| 10   | `components/trading/predictions/trade-tab.tsx`                             | 11     |

**Cross-cutting:** `lib/reference-data.ts` compact currency helpers and `sports/helpers.ts` / `predictions/helpers.ts` split on **USD vs GBP** and **en-US vs en-GB** — P&L and sports views will disagree on formatting until unified.

## 4. Recommended Fixes

1. **Choose stack** — For Next.js App Router, `next-intl` (or equivalent) with `middleware` locale detection and message JSON per locale; avoid multiple string sources.
2. **Locale facade** — Single module exporting:
   - `formatDate`, `formatTime`, `formatDateTime` (wrap `Intl` or locale-aware `date-fns`)
   - `formatNumber`, `formatCurrency`, `formatCompact`, `formatPercent`
   - `formatRelativeTime` (ICU or `Intl.RelativeTimeFormat`)
3. **Unify trading formats** — Replace `formatCurrency` in `lib/reference-data.ts` and ad hoc `$`/`K`/`M`/`B` with one policy: display currency from instrument/account context + user locale.
4. **Migrate `getStatusLabel` / sports copy** — Keys per `FixtureStatus`; translate minute strings (`1st Half`, etc.).
5. **RTL** — Document Tailwind rule: use `ms-`/`me-`/`ps-`/`pe-` and `start`/`end` for new layout; backlog refactor for high-traffic shells.
6. **QA** — Add smoke tests or Playwright checks for a second locale once the pipeline exists (number grouping, date order, RTL mirror on one page).

## 5. Remediation Priority

| Phase  | Focus                                                                           | Effort (indicative)        | Outcome                                          |
| ------ | ------------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------ |
| **P0** | Decision + scaffolding (library, locale routing, message file layout)           | 2–4 dev-days               | Strings can be extracted; locale switch works    |
| **P1** | Facade + replace `formatDateTime`, `formatCurrency`, sports/predictions helpers | 3–5 dev-days               | Consistent date/number/currency under one locale |
| **P2** | Bulk string extraction — `app/(platform)/` then `components/`                   | 2–4 weeks (parallelizable) | Most UX in catalogs                              |
| **P3** | RTL pass (logical Tailwind, icon mirroring where needed)                        | 1–2 weeks                  | RTL-safe layout                                  |

**Overall:** Enterprise i18n is a **multi-sprint** effort; immediate risk is not “missing translations” alone but **inconsistent en-US vs en-GB** and **non-localizable** numeric/date paths that will multiply rework when catalogs land.
