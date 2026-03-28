# UI Codebase Audit — Modular Agent Instructions

**Purpose:** Hand any section of this document (or a linked sub-document) to an AI agent to conduct a targeted audit.
**Last updated:** 2026-03-28
**Output location:** `docs/UI-shared-components-Issues/`

---

## How This Is Organized

The audit is split into **independent modules**. Each module lives in its own file under `docs/UI-shared-components-Issues/audit-scripts/` and can be run standalone. This file is the **master index**.

| Module | File                                   | What It Audits                                                | Maps to WORK_TRACKER |
| ------ | -------------------------------------- | ------------------------------------------------------------- | -------------------- |
| A      | `audit-scripts/A-typography.md`        | Font sizes, type scale, heading hierarchy                     | §2.2                 |
| B      | `audit-scripts/B-color-tokens.md`      | Hardcoded colors, token compliance, branding drift            | §2.2                 |
| C      | `audit-scripts/C-spacing-layout.md`    | Page padding, gaps, container patterns                        | §2.2, §3.4           |
| D      | `audit-scripts/D-shared-components.md` | Component reuse, duplication, centralization gaps             | §3.x                 |
| E      | `audit-scripts/E-mock-data.md`         | Inline mock data, placement, duplication, schema alignment    | §5.x, §6.x           |
| F      | `audit-scripts/F-widget-audit.md`      | Widget registry, merge candidates, preset coverage            | §4.x                 |
| G      | `audit-scripts/G-nav-shell.md`         | Route mapping, active states, breadcrumbs, filter propagation | §1.x, §7.x           |
| H      | `audit-scripts/H-accessibility.md`     | a11y: labels, focus, contrast, keyboard nav                   | —                    |
| I      | `audit-scripts/I-responsive.md`        | Breakpoints, mobile, touch targets, overflow                  | —                    |
| J      | `audit-scripts/J-performance.md`       | Large files, use-client, re-renders, code splitting           | —                    |
| K      | `audit-scripts/K-code-org.md`          | File sizes, dead code, barrel exports, circular deps          | —                    |
| L      | `audit-scripts/L-error-handling.md`    | Loading/error/empty states, Suspense, validation              | —                    |
| M      | `audit-scripts/M-naming.md`            | Component, file, hook, type, constant naming                  | —                    |
| N      | `audit-scripts/N-i18n.md`              | Hardcoded strings, date/number formatting, currency           | —                    |
| O      | `audit-scripts/O-security.md`          | XSS, secrets, auth tokens, external URLs                      | —                    |

---

## Design System SSOT Principle (Applies to ALL Modules)

Every visual primitive in the platform must be changeable from **one single place**:

| Primitive             | SSOT Location                                  | Tailwind Usage                                          |
| --------------------- | ---------------------------------------------- | ------------------------------------------------------- |
| Colors (all semantic) | `globals.css` `:root` (light) + `.dark` (dark) | `text-foreground`, `bg-card`, `text-pnl-positive`, etc. |
| Typography scale      | `globals.css` `@theme` block                   | `text-page-title`, `text-body`, `text-label`, etc.      |
| Spacing scale         | `globals.css` `@theme` block                   | `p-page`, `gap-section`, `p-card`, etc.                 |
| Shadows               | `globals.css` `:root` + `.dark`                | `shadow-sm`, `shadow-md`, `shadow-lg`                   |
| Border radii          | `globals.css` `@theme` block                   | `rounded-sm`, `rounded-md`, `rounded-lg`                |
| Font families         | `globals.css` `@theme` block                   | `font-sans`, `font-mono`                                |
| Component styling     | `components/ui/*.tsx` (shadcn)                 | Import from `@/components/ui/`                          |
| Surface hierarchy     | `globals.css` `:root` + `.dark`                | `bg-surface-1` through `bg-surface-4`                   |

**Audit rule:** If a component uses a raw value (hardcoded hex, raw Tailwind palette color, arbitrary `text-[Npx]`) instead of the token, that is a **violation**. The audit must flag it with file/line, the raw value, and the correct token replacement.

**Theme-readiness rule:** Any color that doesn't go through the `:root`/`.dark` token system will break when switching themes. Module B specifically checks this, but all modules should flag hardcoded colors they encounter.

---

## Shared Rules (Apply to ALL Modules)

### Evidence Requirements

- Every finding must have **file path + line number** — no vague claims
- Count occurrences: "47 files, ~320 occurrences" not "many files"
- For each violation, state **what should be used instead**
- Rate severity: 🔴 Critical (systemic) · 🟡 High (widespread) · 🟢 Medium (localized)
- Estimate fix effort in developer-hours or developer-days

### Grouping

Group findings by directory:

- `app/(platform)/`
- `app/(ops)/`
- `app/(public)/`
- `components/`
- `lib/`
- `hooks/`

### Pre-Audit Files

Before any audit module, read these to understand the design system:

| File                         | Why                                                        |
| ---------------------------- | ---------------------------------------------------------- |
| `app/globals.css`            | SSOT for color tokens, CSS variables, font families, radii |
| `.cursorrules`               | Architecture rules, mock data policy, component placement  |
| `UI_STRUCTURE_MANIFEST.json` | Current structural state of the app                        |
| `lib/config/branding.ts`     | Branding constants — check for divergence from globals.css |

### Output Template

Each module produces a document following this structure:

```markdown
# [Module Letter] — [Module Name] Audit

**Date:** [auto]
**Scope:** [directories searched]
**Previous audit:** [date of last audit for this module, or "First audit"]

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

---

## Scope Presets

| Preset            | Modules       | Effort     | Use When                      |
| ----------------- | ------------- | ---------- | ----------------------------- |
| **Design System** | A, B, C, D    | ~2 hours   | Checking visual consistency   |
| **Mock Data**     | E             | ~1.5 hours | Before API wiring             |
| **Widget & Nav**  | F, G          | ~1.5 hours | Before trading panel refactor |
| **Quality**       | H, I, J, K, L | ~3 hours   | Before release                |
| **Compliance**    | M, N, O       | ~1.5 hours | Enterprise readiness          |
| **Quick**         | A–E           | ~3 hours   | Regular sprint audit          |
| **Standard**      | A–L           | ~5 hours   | Milestone audit               |
| **Full**          | A–O           | ~7 hours   | Major release audit           |

---

## How to Run

### Run a Single Module

```
Read docs/UI-shared-components-Issues/audit-scripts/[X]-[name].md
Execute the audit instructions in that file.
Output to: docs/UI-shared-components-Issues/[XX]-[NAME]-AUDIT.md
```

### Run a Preset

```
Read docs/UI-shared-components-Issues/AGENT-AUDIT-INSTRUCTIONS.md (this file).
Run a [Design System / Mock Data / Widget & Nav / Quality / Quick / Standard / Full] audit.

Steps:
1. Read the pre-audit files listed above.
2. For each module in the preset, read its audit-scripts/ file and execute.
3. Launch modules in parallel where possible (all are independent).
4. Produce one output document per module.
5. Produce 00-EXECUTIVE-SUMMARY.md with combined findings.
```

### Delta Audit (What Changed)

```
Read docs/UI-shared-components-Issues/AGENT-AUDIT-INSTRUCTIONS.md.
Run a DIFFERENTIAL audit using [preset name] scope.

Steps:
1. Read previous 00-EXECUTIVE-SUMMARY.md for baseline.
2. Get changed files: git diff --name-only <last-audit-date>..HEAD
3. Run [preset] modules but ONLY on changed files.
4. Flag findings as: 🆕 New · ✅ Fixed · 🔴 Regressed
5. Output: docs/UI-shared-components-Issues/DELTA-AUDIT-<YYYY-MM-DD>.md
```

### Audit + Fix (Single Session)

```
Read docs/UI-shared-components-Issues/audit-scripts/[X]-[name].md
Run the audit, then APPLY the Phase 1 fixes from the remediation section.
Do NOT commit — leave changes for review.
```

### Targeted (Specific Files/Directories)

```
Read docs/UI-shared-components-Issues/AGENT-AUDIT-INSTRUCTIONS.md.
Run modules [list] but restrict searches to:
- [path1]
- [path2]
Output: docs/UI-shared-components-Issues/TARGETED-AUDIT-<YYYY-MM-DD>.md
```
