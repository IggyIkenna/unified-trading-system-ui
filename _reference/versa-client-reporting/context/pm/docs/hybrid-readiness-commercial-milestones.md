# Hybrid Milestone Framework: Readiness + Commercialization

This framework combines technical readiness gates with commercialization stages.

---

## Track A - Technical Readiness

Stages:

1. `smoke_tested` (1-day end-to-end proof)
2. `scale_tested` (1-month replay or equivalent)
3. `history_validated` (historical depth confidence)
4. `live_stability_validated` (continuous stable run)
5. `uat_accepted` (workflow acceptance)

Mandatory technical gate categories:

- audit compliance status,
- observability and alerting,
- security/auth controls,
- deployment rollback/DR readiness,
- dual-cloud criteria (where required by service tier).

---

## Track B - Commercialization

Stages:

1. `signal_candidate`
2. `signal_commercial_ready`
3. `strategy_candidate`
4. `strategy_commercial_ready`

Domain notes:

- ML signal can be commercialized before full end-to-end strategy if predictive/profitable and tradeable.
- End-to-end strategy commercialization requires execution-validated profitability and sustained live behavior.
- DeFi commissioned strategies may have contractual milestones (for example fixed payment release date gates).
- Commercial signaling follows two tiers:
  - preliminary commercialization after paper-stage evidence,
  - full commercialization after live evidence window.

---

## Cross-Gate Rule

No commercialization stage is marked complete if required technical readiness stage is missing.

Example:

- `signal_commercial_ready` requires at least `scale_tested` + baseline UAT.
- `strategy_commercial_ready` requires `live_stability_validated` + UAT acceptance.

---

## Status Mapping

Operational status remains:

`pending -> in_progress -> ready_for_testing -> uat_accepted -> done`

Readiness/commercial stages are orthogonal fields and must be visible in Projects v2.

---

## PM Synchronization Targets

For each milestone item:

- codex standards/docs updated,
- GitHub milestone/issue/subtask fields updated,
- deployment checklist YAML gates updated (if operational),
- owner default assigned with override support.
