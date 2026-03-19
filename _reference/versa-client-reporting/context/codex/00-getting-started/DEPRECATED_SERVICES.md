# Deprecated Services (2026)

The following services have been removed or consolidated as part of the post-trade infrastructure refactor.

## Removed Services

### reconciliation-service

**Status**: REMOVED  
**Reason**: Functionality integrated into `position-balance-monitor-service`  
**Date**: Feb 2026

`position-balance-monitor-service` is now the **source of truth** for positions and handles:

- Position tracking from fills
- Account query integration (via `unified-order-interface`)
- Exchange reconciliation (fetch + compare positions)
- Position state API (for strategy queries)

**Migration**:

- All reconciliation logic → `position-balance-monitor-service`
- API endpoints → Query `position-balance-monitor-service` position state API
- Reconciliation events → Standard lifecycle events in `position-balance-monitor-service`

---

### risk-monitor-service + exposure-monitor-service

**Status**: MERGED  
**Reason**: Consolidated into `risk-and-exposure-service`  
**Date**: Feb 2026

`risk-and-exposure-service` provides:

- **Pre-trade risk checks** (reject instructions violating limits)
- **Real-time risk monitoring** (exposure aggregation, limit monitoring)
- **Breach alerting** (alert on limit violations)

**Migration**:

- Risk monitoring logic → `risk-and-exposure-service` pre-trade checks + monitoring
- Exposure tracking → `risk-and-exposure-service` exposure aggregation
- Risk metrics → `risk-and-exposure-service` unified metrics

---

## Archived Documentation

Archived documentation for these services can be found in:

- `01-domain/batch/per-service/_archived/`
- `02-data/batch/per-service/_archived/`
- `03-observability/batch/per-service/_archived/`
- `04-architecture/batch/per-service/_archived/`
- `05-infrastructure/batch/per-service/_archived/`

---

## Current Post-Trade Services

| Service                            | Purpose                                        | Priority    |
| ---------------------------------- | ---------------------------------------------- | ----------- |
| `position-balance-monitor-service` | Source of truth for positions + reconciliation | P0-critical |
| `risk-and-exposure-service`        | Pre-trade risk checks + real-time monitoring   | P0-critical |
| `pnl-attribution-service`          | P&L attribution (unchanged)                    | P2-medium   |

---

**See Also**:

- `11-project-management/epics/post-trade-and-execution-epic.md`
- `10-audit/_service-pipeline-post-trade.yaml`
- `11-project-management/service-registry.yaml`
