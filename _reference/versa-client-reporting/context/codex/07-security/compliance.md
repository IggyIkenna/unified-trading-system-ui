# MiFID II / FCA Compliance Event Logging

## Regulatory Status

The company operating this system is **FCA-regulated** (UK Financial Conduct Authority). The following are already
established and do not require setup:

- **Legal entity**: UK-incorporated entity with active FCA authorisation
- **LEI (Legal Entity Identifier)**: Registered and active — required for MiFID II RTS 22 trade reporting
- **ARM relationship**: Approved Reporting Mechanism relationship established for MiFID II Article 26 / FCA SUP 17
  transaction reporting submission
- **Trade repository**: Relationship established for EMIR derivatives reporting

For CI/CD and deployment purposes: regulatory reporting submission infrastructure (ARM submission, trade repository
connectivity) is **outside the CI/CD pipeline**. The CI/CD pipeline is responsible for ensuring compliance events are
correctly emitted, persisted with WORM retention, and routed to the compliance subscriber in `uts-compliance-ikenna`.
The ARM/trade repository submission layer is a separate operational concern handled by the compliance team.

### Change Approval Process

Given a 6-person team, formal four-eyes approval is implemented as **developer handoff review**: before any major plan
or production deployment is actioned, at minimum two developers (one being the plan author) must review the change. This
is documented in commit messages and plan status updates. Fully automated CI/CD changes (those not touching
execution/risk/strategy services in production) do not require handoff review.

---

## Overview

The unified trading system emits structured compliance events via `log_event()` from `unified_events_interface` at key
checkpoints in the order and trade lifecycle. These events satisfy the minimum audit-trail requirements for MiFID II
(EU) and FCA (UK) regulated activity.

---

## MiFID II Requirements

### Article 26 — Trade Reporting

Every executed trade must be reported to a competent authority via an Approved Reporting Mechanism (ARM). The system
captures a `TRADE_REPORTED_MIFID` event immediately after each fill is confirmed. Required fields: instrument ID, venue,
quantity, price, trade timestamp, and counterparty LEI (when known).

### Article 27 — Best Execution Obligation

Investment firms must take all sufficient steps to achieve the best possible result for clients. The system emits:

- `ORDER_SUBMITTED_MIFID` — before each order is sent to a venue (pre-trade record).
- `BEST_EXECUTION_CHECKED` — after the pre-trade best-execution assessment completes. Severity is `INFO` when the check
  passes; `WARNING` when the selected venue does not offer best execution.

### Article 57 — Position Limit Checking

Commodity derivative position limits must be enforced. The system emits `POSITION_LIMIT_CHECKED` whenever the position
limit gate runs.

---

## FCA Requirements

### SUP 17 — Transaction Reporting

UK investment firms must report transactions to the FCA via an Approved Reporting Mechanism. The
`TRANSACTION_REPORTED_FCA` event is the hook point for this obligation. The `regulatory_jurisdiction` field in the
payload must be set to `"UK_FCA"`.

---

## Event Types

| Constant                   | Value                        | Article / Rule      |
| -------------------------- | ---------------------------- | ------------------- |
| `TRADE_REPORTED_MIFID`     | `"TRADE_REPORTED_MIFID"`     | MiFID II Article 26 |
| `ORDER_SUBMITTED_MIFID`    | `"ORDER_SUBMITTED_MIFID"`    | MiFID II Article 27 |
| `BEST_EXECUTION_CHECKED`   | `"BEST_EXECUTION_CHECKED"`   | MiFID II Article 27 |
| `TRANSACTION_REPORTED_FCA` | `"TRANSACTION_REPORTED_FCA"` | FCA SUP 17          |
| `POSITION_LIMIT_CHECKED`   | `"POSITION_LIMIT_CHECKED"`   | MiFID II Article 57 |

All constants are exported from `unified_events_interface` and defined in `unified_events_interface/schemas.py`.

---

## When Events Are Fired

```
Order received
    │
    ├─► BEST_EXECUTION_CHECKED  (pre-trade assessment)
    │
    ├─► ORDER_SUBMITTED_MIFID   (immediately before sending to venue)
    │
    │   [venue execution]
    │
    ├─► TRADE_REPORTED_MIFID    (per fill, on confirmation)
    │
    └─► TRANSACTION_REPORTED_FCA  (UK-jurisdiction trades only)

Position gate runs
    └─► POSITION_LIMIT_CHECKED
```

---

## Implementation Location

### Shared Schema (Tier 0)

- **Event types + payload schema**: `unified-events-interface/unified_events_interface/schemas.py`
  - `TRADE_REPORTED_MIFID`, `ORDER_SUBMITTED_MIFID`, `BEST_EXECUTION_CHECKED`, `TRANSACTION_REPORTED_FCA`,
    `POSITION_LIMIT_CHECKED` constants
  - `ComplianceEventPayload` dataclass with `to_dict() -> JSONDict` for use as `log_event()` details

### Execution Service

- **Class-based reporter**: `execution-service/execution_service/compliance/compliance_reporter.py` —
  `ComplianceReporter` with:
  - `report_order_submission()` — Article 27, called in `LiveExecutionOrchestrator.execute_order()` before venue send
  - `report_trade_execution()` — Article 26, called after order status is `SUBMITTED`/`FILLED`
  - `report_best_execution_check()` — Article 27, called after router selects venue
- **Function-based reporter**: `execution-service/execution_service/compliance/mifid_reporter.py` —
  `log_order_submitted_mifid()` and `log_trade_reported_mifid()` standalone functions.
- **Wire-up**: `execution-service/execution_service/engine/live/orchestrator.py` — `LiveExecutionOrchestrator` accepts
  an optional `compliance_reporter` parameter and calls it at the correct points.
- **Tests**:
  - `execution-service/tests/unit/compliance/test_mifid_reporter.py`
  - `execution-service/tests/unit/test_compliance_events.py`

### Strategy Service

- **Reporter**: `strategy-service/strategy_service/compliance/compliance_reporter.py` — `StrategyComplianceReporter`
  with:
  - `report_signal_generation()` — pre-order audit trail for best-execution monitoring
  - `report_position_limit_check()` — Article 57 position limit check with `WARNING` severity on breach
- **Wire-up**: `strategy-service/strategy_service/engine/core/signal_publisher.py` — `SignalPublisher` calls
  `report_signal_generation()` on every signal emission.
- **Tests**: `strategy-service/tests/unit/test_compliance_events.py`

---

## Usage Examples

### Execution Service (class-based)

```python
from execution_service.compliance import ComplianceReporter

reporter = ComplianceReporter(jurisdiction="EU_MIFID_II")

# Before order send (Article 27)
reporter.report_order_submission(
    order_id="ord-123",
    instrument_id="NASDAQ:AAPL",
    venue_id="NASDAQ",
    quantity=100.0,
    price=175.50,
)

# After fill confirmation (Article 26)
reporter.report_trade_execution(
    order_id="ord-123",
    instrument_id="NASDAQ:AAPL",
    venue_id="NASDAQ",
    quantity=100.0,
    price=175.75,
)
```

### Strategy Service (signal generation)

```python
from strategy_service.compliance import StrategyComplianceReporter

reporter = StrategyComplianceReporter()
reporter.report_signal_generation(
    strategy_id="cefi_momentum_v1",
    instrument_id="BINANCE:BTC-USDT",
    signal_direction="LONG",
    conviction_pct=75.0,
)

# Position limit check (Article 57)
reporter.report_position_limit_check(
    strategy_id="cefi_momentum_v1",
    instrument_id="BINANCE:BTC-USDT",
    current_position=50.0,
    position_limit=100.0,
    within_limit=True,
)
```

---

## Correlation ID in Compliance Events

Every compliance event must carry the request `correlation_id` in its `details` dict so that the compliance event can be
linked to the originating API call, PubSub message, and storage write. See `06-coding-standards/correlation-id.md` for
the full propagation contract.

```python
reporter.report_order_submission(
    order_id="ord-123",
    instrument_id="NASDAQ:AAPL",
    venue_id="NASDAQ",
    quantity=100.0,
    price=175.50,
    correlation_id=correlation_id,   # required — link to originating request
)
```

---

## Observability Wiring (obs-compliance-reporting-wiring)

Phase 3 wires compliance reporting through the full observability stack:

| Step                     | Owner                                | Mechanism                                         |
| ------------------------ | ------------------------------------ | ------------------------------------------------- |
| Event emission           | execution-service / strategy-service | `log_event()` via `unified_events_interface`      |
| PubSub propagation       | alerting-service                     | Subscribes to compliance event topic              |
| Prometheus counter       | execution-service                    | `compliance_events_emitted_total{event_type=...}` |
| Audit log retention      | GCS (via DataSink)                   | 7-year retention bucket policy                    |
| ARM integration (future) | compliance-reporting-service         | Dedicated service (not yet built)                 |

---

## Future Work

- **ARM integration**: Wire `TRADE_REPORTED_MIFID` and `TRANSACTION_REPORTED_FCA` events to an actual Approved Reporting
  Mechanism via a dedicated compliance-reporting-service.
- **EMIR**: Add `EMIR_TRADE_REPORTED` event type for derivatives reporting obligations.
- **Retention**: Compliance events persisted to GCS must have a minimum 7-year retention policy applied (see
  `07-security/audit-logging.md`).
- **UK FCA SUP 17**: Implement `TRANSACTION_REPORTED_FCA` emission path for UK-jurisdiction trades.

---

## Related

- `06-coding-standards/correlation-id.md` — correlation ID propagation through compliance events
- `06-coding-standards/prometheus-metrics.md` — `compliance_events_emitted_total` counter pattern
- `07-security/audit-logging.md` — GCS retention policy for compliance audit trail
- Phase 3 plan: `obs-compliance-reporting-wiring` (MiFID/FCA reporting)
