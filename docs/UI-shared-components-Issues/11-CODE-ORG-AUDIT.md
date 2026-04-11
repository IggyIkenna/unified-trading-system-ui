# K — Code Organization & File Structure Audit

**Date:** 2026-03-28  
**Scope:** `app/`, `components/`, `hooks/`, `lib/` (TypeScript / TSX)  
**Previous audit:** First audit (Module K)

## 1. Current State

- **Path alias:** `@/` is the dominant import style; a smaller set of files still use relative `../` chains (sample: **612** files under `app|components|hooks|lib` match `@/`, **46** match `../` — scoped `rg -l` counts, not mutually exclusive).
- **Config barrel:** `lib/config/index.ts` re-exports API, branding, auth, services, and promote/trading-nav helpers in one place (coherent surface).
- **`lib/types/`:** Multiple domain files plus **`api-generated.ts`** (~18k+ lines) and a `.bak` sibling — generated / vendor-scale artifacts; not hand-maintained UI modules.
- **`archive/`:** Repo root contains `archive/`; **no** `archive/` import paths were found under `app/`, `components/`, `hooks/`, or `lib/` (search for `archive/` in those trees returned no matches).
- **Largest hotspots:** Several dashboards, ops deployment tabs, trading panels, mock-data modules, and a few platform pages exceed **900** lines; **`lib/types/api-generated.ts`** and **`lib/strategy-registry.ts`** dwarf normal modules (generated / registry data — treat as exceptions for “split the file” rules).

## 2. Findings

| Area                                                 | Severity    | Evidence / metric                                                                                                                                        | Recommendation                                                                                                                                           |
| ---------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Files **> 900** lines (must split per quality gates) | 🔴 Critical | **37** files under `app                                                                                                                                  | components                                                                                                                                               | hooks | lib`with`wc -l`> 900 (includes generated`lib/types/api-generated.ts` and large registry/mock files) | Split hand-written UI by feature/section; exclude or codegen-split generated assets; track progress file-by-file in WORK_TRACKER |
| Files **501–900** lines (should split)               | 🟡 High     | **73** files in band                                                                                                                                     | Extract subcomponents, hooks, and pure helpers; align with single-responsibility                                                                         |
| Ops deployment & trading mega-components             | 🔴 Critical | Examples: `components/ops/deployment/DataStatusTab.tsx` (~4054), `DeploymentDetails.tsx` (~3709), `components/trading/options-futures-panel.tsx` (~3280) | Phase splits: presentation vs data hooks vs table columns                                                                                                |
| Mock / fixture monoliths                             | 🟡 High     | e.g. `lib/ml-mock-data.ts` (~2907), `lib/build-mock-data.ts` (~2595), `lib/data-service-mock-data.ts` (~2452), `components/promote/mock-data.ts` (~1684) | Move toward `lib/mocks/` fixtures + MSW handlers per `.cursorrules`; split by domain                                                                     |
| Dashboard pages                                      | 🟡 High     | e.g. `quant-dashboard.tsx` (~1416), `risk-dashboard.tsx` (~1294), `devops-dashboard.tsx` (~1164)                                                         | Shared dashboard shell + widget composition                                                                                                              |
| Mixed concerns in large `page.tsx` files             | 🟡 High     | e.g. `app/(platform)/services/trading/strategies/[id]/page.tsx` (~1527), `investor-relations/board-presentation/page.tsx` (~1888)                        | Extract client sections, data hooks (`hooks/api/`), and presentational components                                                                        |
| No `lib/types/index.ts` barrel                       | 🟢 Medium   | Directory lists per-file modules only                                                                                                                    | Optional: add explicit barrel for **non-generated** types only, or document “import from concrete modules” to avoid pulling `api-generated` accidentally |
| Circular dependency graph                            | 🟢 Medium   | Not machine-verified in this pass                                                                                                                        | Run `madge --circular` (or `dependency-cruiser`) on `app/components/hooks/lib` in CI or locally and fix cycles                                           |
| Dead exports                                         | 🟢 Medium   | Not enumerated (needs `ts-prune` / knip)                                                                                                                 | Add a one-off knip/ts-prune report; remove unused public exports                                                                                         |

**Generated / data exceptions (do not apply naive line-count splits):**

- `lib/types/api-generated.ts` — OpenAPI/SDK scale; splitting is a codegen concern.
- `lib/strategy-registry.ts` — large static registry; consider codegen or lazy-loaded chunks if load time matters.

## 3. Worst Offenders (by line count)

Top hand-written TS/TSX under `app|components|hooks|lib` (excluding only obvious generated filename if desired — listed for remediation priority):

| Lines | File                                                            |
| ----- | --------------------------------------------------------------- |
| 4459  | `lib/api/mock-handler.ts`                                       |
| 4054  | `components/ops/deployment/DataStatusTab.tsx`                   |
| 3709  | `components/ops/deployment/DeploymentDetails.tsx`               |
| 3280  | `components/trading/options-futures-panel.tsx`                  |
| 2907  | `lib/ml-mock-data.ts`                                           |
| 2595  | `lib/build-mock-data.ts`                                        |
| 2452  | `lib/data-service-mock-data.ts`                                 |
| 2139  | `app/(public)/signup/page.tsx`                                  |
| 1888  | `app/(platform)/investor-relations/board-presentation/page.tsx` |
| 1783  | `components/ops/deployment/DeployForm.tsx`                      |

_(Full `wc -l` ordering available via `find … | xargs wc -l | sort -n`.)_

## 4. Recommended Fixes

1. **Enforce file-size budget:** Treat **>900** as merge-blocking for new code; schedule splits for the **37** existing oversize files, prioritizing ops deployment and trading panels.
2. **Mock consolidation:** Align large `*-mock-data.ts` files with centralized `lib/mocks/` policy; split by domain and wire MSW.
3. **Page decomposition:** For large `page.tsx`, move to `components/<feature>/` + `hooks/api/*` + URL state; keep pages as composition only.
4. **Import consistency:** Prefer `@/` everywhere; replace long `../../` paths in the **46** relative-import files when touched.
5. **Tooling:** Add optional CI steps: `madge --circular`, `knip` or `ts-prune` (report-only at first).

## 5. Remediation Priority

| Phase | Focus                                                     | Effort (rough) |
| ----- | --------------------------------------------------------- | -------------- |
| P0    | Split or justify top 5 deployment + options/trading files | 3–5 dev-days   |
| P1    | Dashboard + large `page.tsx` extractions                  | 4–6 dev-days   |
| P2    | Mock-data migration to `lib/mocks/` + file splits         | 3–5 dev-days   |
| P3    | Barrel / dead-code / circular-dep tooling                 | 1–2 dev-days   |

**Top finding (summary):** There are **37** files over **900** lines and **73** between **501–900** under `app|components|hooks|lib`, concentrated in ops deployment, trading panels, dashboards, and mock data — structural splits and mock centralization are the highest-impact follow-ups.
