# Tab: Alerts

**Route:** `/services/trading/alerts`
**Page file:** `app/(platform)/services/trading/alerts/page.tsx`
**Lines:** 967 | **Status:** Full implementation

---

## Current State

Full alert management and incident response page.

**What it renders:**

- Stats cards: total alerts, critical/high/medium/low counts, acknowledged, resolved
- Main alerts table: severity badge, entity (strategy/venue/instrument), message, status, timestamp
- Per-row sheet detail: full alert context, escalation history, action buttons
- Alert actions: Acknowledge, Escalate, Resolve (with `BatchGuardButton` — actions disabled in batch/as-of mode)
- Kill-switch sheet: emergency strategy halt via a dedicated dangerous-action flow
- `FilterBar`: search, status, severity
- CSV/XLS export

**Data sources:** `useAlerts`, `useAcknowledgeAlert`, `useEscalateAlert`, `useResolveAlert`, `useGlobalScope`

**Filtering/scoping:** When `scope.strategyIds` is set, filters alerts to only those whose `entity` matches a scoped strategy ID. Status / severity / search filters.

---

## Meeting Review Items

From `cross-cutting-quickview-news-liveasof.md`:

- **Quick View:** The critical items from this alerts tab should be surfaced in a persistent Quick View panel available on every tab. Users should not need to navigate here just to check if something is on fire.

From `trading-accounts-risk-pnl-reconciliation.md`:

- **Position health alerts:** Alerts should fire when a position's reconciliation status is unhealthy (not just when an execution or risk limit event occurs).
- **P&L residual alert:** Alert when unexplained P&L residual exceeds a configurable threshold (e.g., >10% of total P&L unexplained).

---

## Improvements Needed

1. **Quick View feed:** Extract a minimal `AlertsFeed` component (top N critical/high alerts) for use in the shell-level Quick View panel. The full alerts page remains, but key alerts travel with the user across all tabs.
2. **Reconciliation alerts:** Add alert types for position health mismatch (our position ≠ exchange position). These should link directly to the reconcile flow.
3. **P&L residual alerts:** Alert type for when unexplained P&L residual exceeds threshold. Should link to the P&L breakdown page.
4. **Alert categories by asset class:** Currently alerts are generic. Tagging alerts with an asset-class dimension (CeFi / DeFi / TradFi / Sports) would let users filter to what's relevant to their book.
5. **News-driven alerts:** High-severity news events (from the News feed) should optionally generate alerts or at least be cross-linked. Currently news and alerts are entirely separate.

---

## Asset-Class Relevance

**Common** — all asset classes generate alerts. Asset-class tags on alerts would allow scoped views without requiring separate alert pages per asset class.

---

## Action

**Enhance** — extract Quick View feed component, add reconciliation and P&L residual alert types, add asset-class tagging.
