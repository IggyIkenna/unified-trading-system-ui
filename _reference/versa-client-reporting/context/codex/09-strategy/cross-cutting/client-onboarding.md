# Client Onboarding — Cross-Cutting Concern

## Core Rule: One Strategy Instance Per Client

Every client gets their own strategy instance with a unique `(client_id, strategy_id)` tuple. The strategy **template**
is shared (same code, same logic), but each client has:

- **Separate positions** — execution timing causes drift (client A fills at 3500, client B at 3501)
- **Separate config** — same defaults, but per-client overrides possible (allocation %, max leverage)
- **Separate PnL** — attributed independently to each client's positions
- **Separate margin** — health factor / LTV tracked per client account

This is non-negotiable across ALL asset classes (DeFi, CeFi, TradFi, Sports).

## Onboarding Flow

### 1. Venue Account Setup

| Step                    | Who          | What                                                                            |
| ----------------------- | ------------ | ------------------------------------------------------------------------------- |
| Create venue accounts   | HUMAN        | Exchange accounts (Binance, Hyperliquid), DeFi wallets, sports betting accounts |
| Generate API keys       | HUMAN        | Per-client keys for each venue                                                  |
| Store in Secret Manager | HUMAN/SCRIPT | Pattern: `exec-{client_id}-{venue}-{account_type}`                              |
| Verify access           | SCRIPT       | `credential-audit.py --client {client_id} --check-access`                       |

### 2. Strategy Config

```yaml
# GCS: gs://config/{strategy_id}/clients/{client_id}.yaml
client_id: "odum"
strategy_template: "DEFI_ETH_STAKED_BASIS_SCE_1H"
initial_capital: 100000
allocation:
  spot_pct: 0.90
  margin_pct: 0.10
overrides:
  min_combined_apy: 0.05 # Can be client-specific
  max_leverage: 2.5
```

**Hot-reload?** YES — UCI config watcher picks up new client configs from GCS without restart.

### 3. Service Configuration

| Service                          | What Changes                                            | Restart Required? |
| -------------------------------- | ------------------------------------------------------- | ----------------- |
| strategy-service                 | New client config in GCS                                | No (hot-reload)   |
| execution-service                | New client routing rule (client → venue accounts)       | No (hot-reload)   |
| position-balance-monitor-service | Auto-discovers new positions                            | No                |
| risk-and-exposure-service        | Auto-aggregates new client                              | No                |
| alerting-service                 | No change (alert rules are strategy-level)              | No                |
| features-\* services             | No change (features are market-level, not client-level) | No                |

### 4. Verification

- [ ] Strategy instance starts for new client
- [ ] Positions initialised at 0
- [ ] Market data flowing (features fresh per SLA)
- [ ] Execution test: place and cancel a small test order
- [ ] PnL attribution: verify initial equity matches capital
- [ ] Margin health: verify HF/LTV baseline
- [ ] UI: client appears in dashboard

## Position Divergence

Even though all clients run the same strategy template, positions WILL diverge over time because:

1. **Execution timing** — fills happen at slightly different prices
2. **Slippage** — different for larger vs smaller accounts
3. **Gas timing** — DeFi transactions mine in different blocks
4. **Rebalancing** — triggered at different times due to position differences

This is expected and normal. The system handles it by tracking each client's positions independently.

## Removing a Client

1. Strategy instance generates EXIT signal → closes all positions
2. Verify all positions flat
3. Remove client config from GCS
4. Archive PnL history
5. Remove secrets from Secret Manager (or retain for audit trail)
