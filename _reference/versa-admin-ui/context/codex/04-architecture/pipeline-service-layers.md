# Pipeline Service Layers

Canonical 7-layer service execution order for the unified trading system. This is the machine-readable source of truth —
edit this file, regenerate the diagram.

## Mermaid Source

> Render with: `mmdc -i pipeline-service-layers.md -o pipeline-service-layers.svg` Or view inline in VS Code / GitHub
> with the Mermaid extension.

```mermaid
flowchart TD
    subgraph L1["Layer 1 — Reference Data"]
        instr[instruments-service]
        cal[features-calendar-service]
    end

    subgraph L2["Layer 2 — Raw Market Data"]
        ticks[market-tick-data-service]
        corp[instruments-service (corporate-actions domain) — deprecated]
    end

    subgraph L3["Layer 3 — Market Data Processing"]
        mdp["market-data-processing-service\nticks → OHLCV candles"]
    end

    subgraph L4["Layer 4 — Feature Engineering"]
        d1[features-delta-one-service\ntechnical indicators]
        vol[features-volatility-service\nvolatility surfaces]
        oc[features-onchain-service\non-chain signals]
    end

    subgraph L5["Layer 5 — Machine Learning"]
        train[ml-training-service]
        infer[ml-inference-service]
    end

    subgraph L6["Layer 6 — Strategy & Execution"]
        strat[strategy-service]
        exec[execution-service]
    end

    subgraph L7["Layer 7 — Post-Trade"]
        pbm[position-balance-monitor-service]
        risk[risk-and-exposure-service]
        pnl[pnl-attribution-service]
    end

    L1 --> L2
    L2 --> L3
    L3 --> L4
    L4 --> L5
    L5 --> L6
    L6 --> L7
```

## Layer Summary

| Layer                    | Services                                                                             | Input                          | Output                                        |
| ------------------------ | ------------------------------------------------------------------------------------ | ------------------------------ | --------------------------------------------- |
| 1 — Reference Data       | instruments-service, features-calendar-service                                       | External APIs, exchange feeds  | Instrument universe, trading calendars        |
| 2 — Raw Market Data      | market-tick-data-service, instruments-service (corporate-actions domain, deprecated) | Exchange websockets, REST APIs | Raw ticks, corporate action events            |
| 3 — Processing           | market-data-processing-service                                                       | Raw ticks                      | OHLCV candles (15s, 1m, 5m, 15m, 1h, 4h, 24h) |
| 4 — Features             | features-delta-one-service, features-volatility-service, features-onchain-service    | OHLCV candles                  | Feature vectors                               |
| 5 — ML                   | ml-training-service, ml-inference-service                                            | Feature vectors                | Trained models, predictions                   |
| 6 — Strategy & Execution | strategy-service, execution-service                                                  | Predictions                    | Orders, fills                                 |
| 7 — Post-Trade           | position-balance-monitor-service, risk-and-exposure-service, pnl-attribution-service | Fills                          | P&L, risk metrics, position state             |

## Testing implications

Run tests layer by layer; lower layers depend on upstream artifacts. Do not run Layer 4 tests without Layer 3 output.
See `unified-trading-codex/06-coding-standards/integration-testing-layers.md` for the integration test strategy.

## Cross-references

| Topic                                      | Location                                                                  |
| ------------------------------------------ | ------------------------------------------------------------------------- |
| Tier architecture (T0–T3 dependency rules) | `unified-trading-codex/04-architecture/TIER-ARCHITECTURE.md`              |
| Integration testing layers (0–3)           | `unified-trading-codex/06-coding-standards/integration-testing-layers.md` |
| Deploy-shards CLI reference                | `deployment-service/docs/cli.md`                                          |
| Workspace topology DAG (all 63 repos)      | `unified-trading-pm/WORKSPACE_MANIFEST_DAG.svg`                           |
