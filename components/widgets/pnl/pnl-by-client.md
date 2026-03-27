# Widget: P&L by Client

- **ID:** `pnl-by-client`
- **Data:** `usePnLData()` — `clientPnL` (mock-generated from orgs/strategies APIs).
- **Shared UI:** `EntityLink` (client), `PnLValue`, `PnLChange`.
- **Behavior:** Lists top clients with strategy count, org label, P&L and change; empty state when filters exclude all clients.
