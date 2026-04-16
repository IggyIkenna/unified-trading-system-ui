# Cross-Tab Provider Strategy — Decision Record

**Date:** 2026-04-16
**Status:** DEFERRED — hooks extracted, global mounting reverted
**Related:** BP-2 (widget foundation), BP-6 (mock data / real API wiring)

---

## Problem

Three domain providers — `OverviewDataProvider`, `TerminalDataProvider`, `RiskDataProvider` — require a `value` prop. They are mounted only by their respective page components. Widgets from these domains show a `WidgetContextGuard` placeholder when placed on other tabs (including custom workspace panels).

## What Was Tried

Extracted data construction from the three page components into reusable hooks:

| Hook                  | File                                                    | Lines extracted |
| --------------------- | ------------------------------------------------------- | --------------- |
| `useRiskPageData`     | `components/widgets/risk/use-risk-page-data.ts`         | ~310            |
| `useTerminalPageData` | `components/widgets/terminal/use-terminal-page-data.ts` | ~530            |
| `useOverviewPageData` | `components/widgets/overview/use-overview-page-data.ts` | ~310            |

Then added self-fetching wrappers in `AllWidgetProviders` so all 17 providers would be globally available. **This was reverted** due to performance concerns.

## Why It Was Reverted

Mounting all three hooks globally in `AllWidgetProviders` means:

- **Terminal's 500ms price simulation interval** runs on every tab (Overview, Risk, DeFi, etc.)
- **Terminal's WebSocket connection** stays open on every tab
- **Risk's 10+ API queries** fire on every tab
- **Overview's WebSocket + 10 API queries** fire on every tab
- **On native pages**, two hook instances run (page's + AllWidgetProviders'), duplicating local state

This is an unacceptable performance trade-off for a feature that only matters for audit review panels.

## What Was Kept

- **Hook extractions** — all three hooks remain. The page components now use them instead of inline data construction. This is a strict improvement (thinner pages, reusable logic, testable hooks).
- **Bespoke panel** added to audit profile (Risk/Terminal/Overview widgets there will show context guard placeholders — acceptable for now).

## Right Solution (Deferred to BP-6)

When the real API/WebSocket wiring lands, implement **lazy provider activation**:

1. Each self-fetching wrapper checks whether any widget from its domain is actually mounted on the current tab (via the workspace store's layout data).
2. If no widgets from that domain exist on the current tab, the provider renders children with a null context (widgets would show placeholders).
3. If widgets ARE present, the hook activates and provides real data.

This gives traders the ability to put Terminal widgets on custom panels without paying the cost on tabs that don't need them.

### Implementation sketch

```tsx
function LazyRiskProvider({ children }: { children: React.ReactNode }) {
  const hasRiskWidgets = useHasWidgetsForDomain("risk"); // reads workspace store
  if (!hasRiskWidgets) return <>{children}</>;
  return <SelfFetchingRiskProvider>{children}</SelfFetchingRiskProvider>;
}
```

The `useHasWidgetsForDomain` hook would check the current tab's layout placements against the widget registry's `availableOn` or domain prefix.

## Files Changed in This Session

| File                                                    | Change                                          |
| ------------------------------------------------------- | ----------------------------------------------- |
| `components/widgets/risk/use-risk-page-data.ts`         | NEW — extracted hook                            |
| `components/widgets/terminal/use-terminal-page-data.ts` | NEW — extracted hook                            |
| `components/widgets/overview/use-overview-page-data.ts` | NEW — extracted hook                            |
| `app/(platform)/services/trading/risk/page.tsx`         | Simplified — uses hook                          |
| `app/(platform)/services/trading/terminal/page.tsx`     | Simplified — uses hook                          |
| `app/(platform)/services/trading/overview/page.tsx`     | Simplified — uses hook                          |
| `components/widgets/all-widget-providers.tsx`           | Updated TODO comment (reverted global mounting) |
| `docs/audits/bp2-audit-profile.json`                    | Added bespoke panel                             |
