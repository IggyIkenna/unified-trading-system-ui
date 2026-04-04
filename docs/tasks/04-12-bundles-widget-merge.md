# 4.12 Bundles — Widget Audit & Merge Plan

> **Status:** DRAFT — awaiting user review
> **Page route:** `/services/trading/bundles`

---

## Current Widget Inventory

| widgetId | Label | Component | Singleton | Default Preset |
|----------|-------|-----------|-----------|----------------|
| `bundle-templates` | Bundle Templates | `BundleTemplatesWidget` | yes | 4x5 at (0,0) |
| `bundle-steps` | Execution Steps | `BundleStepsWidget` | yes | 8x7 at (4,0) |
| `bundle-pnl` | P&L Estimate | `BundlePnlWidget` | yes | 4x3 at (0,5) |
| `bundle-actions` | Bundle Actions | `BundleActionsWidget` | yes | 4x1 at (0,8) |
| `defi-atomic-bundle` | DeFi Atomic Bundles | `DefiAtomicBundleWidget` | yes | 8x8 at (4,7) |

**Total: 5 widgets.**

**Data provider:** `BundlesDataProvider` wraps the page.

**Presets:** 2 presets ("Default", "Compact") — both include all 5 widgets in different arrangements.

---

## What Each Widget Does

### bundle-templates
- Gallery of pre-built bundle templates with category badges, estimated cost/profit, step preview.
- Clicking a template loads its steps into the builder.

### bundle-steps
- Step list editor: reorder, duplicate, fields, dependency links, visual flow.
- The main builder surface for constructing multi-step execution bundles.

### bundle-pnl
- KPI strip + collapsible breakdown: buy/sell notional, gas estimate, net P&L.

### bundle-actions
- Two buttons: Simulate (dry run) and Submit, with leg count badge.
- Compact — only 1 row height.

### defi-atomic-bundle
- DeFi-specific atomic bundle builder with operation selector, pre-built templates (Flash Loan Arb, Leverage Long, Yield Harvest), gas estimation, Tenderly simulation.

---

## Testing Checklist

- [ ] **Templates:** Gallery renders with category badges and step previews
- [ ] **Steps:** Step list renders; reorder, duplicate, edit fields work
- [ ] **P&L:** Buy/sell notional and gas estimate show values
- [ ] **Actions:** Simulate and Submit buttons present
- [ ] **DeFi Atomic:** Operation selector, templates, gas estimation render

---

## Merge Proposal

### Option A — Merge templates + pnl + actions into a sidebar (recommended)
- Left sidebar: Templates (top) + P&L (middle) + Actions (bottom) → single widget.
- Keep Steps and DeFi Atomic as separate widgets (they're the main content surfaces).
- **Result:** 3 widgets (bundle-sidebar, bundle-steps, defi-atomic-bundle).

### Option B — Merge pnl + actions only
- These are tightly related (P&L estimate → submit/simulate decision).
- **Result:** 4 widgets.

### Option C — No merge
- Current layout with 2 presets handles arrangements well.

---

## Questions for User

1. **Merge?** A (sidebar), B (pnl+actions), or C (no merge)?
2. **DeFi Atomic Bundles vs regular Bundles:** Are these two distinct workflows or should they be more integrated?
3. **Any broken data?** Do templates and steps render properly?
