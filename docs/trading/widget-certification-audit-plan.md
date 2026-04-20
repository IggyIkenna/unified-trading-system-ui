# DeFi Widget Audit — Per-Strategy Plan

## Purpose

Verify the UI can be used to **execute, monitor, support and exit** every DeFi strategy end-to-end. Most trades will run automatically in production, but the UI must support manual flow for:

- **Execute** — place the strategy's trade(s) manually (stake, swap, lend, borrow, flash-loan, transfer)
- **Monitor** — see positions, P&L decomposition, kill-switch state, benchmark-vs-realised
- **Support** — wallet balances, fund transfers across venues + accounts + chains, bridge status, reward claim/sell, rebalance
- **Exit** — unwind cleanly (market unwind, protocol withdrawal, unbonding queue, emergency exit)

Running every strategy through the UI is the most thorough test that our backend infra (execution-service, transfer-rebalance service, features-onchain, pnl-attribution, event bus) is complete. Missing UI controls = missing or untested backend path.

## Output

Three artifacts kept in sync:

1. **Per-archetype audit doc** — evidence + reasoning, written during the audit
2. **Central tracker** — one row per widget (cumulative updates needed) + one row per gap (new widgets needed). Updated after each archetype pass
3. **Codex updates (optional, minimal)** — only when the archetype doc doesn't describe a capability the UI genuinely needs; use same structure and small diffs, no rewrites

**Status legend:**

- ✅ covered — capability fully satisfied by a widget, verified against code
- 🟡 partial — capability partially satisfied; needs enhancement
- ❌ missing — capability not served by any widget
- ➖ N/A — capability does not apply to this archetype

---

## 1. Inputs per archetype (read before auditing widgets)

Per [MIGRATION.md §2 + §8](../../../unified-trading-pm/codex/09-strategy/architecture-v2/MIGRATION.md) and the cross-cutting list.

| #   | Archetype                    | v2 archetype doc                                     | Concrete strategy docs (legacy)                                                                                         | Extra cross-cutting to re-read                              |
| --- | ---------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 1   | `YIELD_STAKING_SIMPLE`       | `architecture-v2/archetypes/yield-staking-simple.md` | _none_                                                                                                                  | reward-lifecycle                                            |
| 2   | `YIELD_ROTATION_LENDING`     | `…/yield-rotation-lending.md`                        | `_archived_pre_v2/defi/aave-lending.md`, `btc-lending-yield.md`, `multi-chain-lending-yield.md`, `sol-lending-yield.md` | rate-impact-model, transfer-rebalance, instrument-filtering |
| 3   | `CARRY_BASIS_PERP`           | `…/carry-basis-perp.md`                              | `basis-trade.md`, `btc-basis-trade.md`, `l2-basis-trade.md`, `sol-basis-trade.md`, `ethena-benchmark.md`                | benchmark-fills, execution-policies                         |
| 4   | `CARRY_STAKED_BASIS`         | `…/carry-staked-basis.md`                            | `staked-basis.md`, `sol-staked-basis.md`                                                                                | reward-lifecycle, rate-impact-model                         |
| 5   | `CARRY_RECURSIVE_STAKED`     | `…/carry-recursive-staked.md`                        | `recursive-staked-basis.md`                                                                                             | rate-impact-model                                           |
| 6   | `ARBITRAGE_PRICE_DISPERSION` | `…/arbitrage-price-dispersion.md`                    | `cross-chain-yield-arb.md` (partial) + strategy-service `lending_protocol_arb.py` code                                  | mev-protection, execution-policies                          |
| 7   | `LIQUIDATION_CAPTURE`        | `…/liquidation-capture.md`                           | _none_ (strategy-service `liquidation_capture.py` code only)                                                            | mev-protection                                              |
| 8   | `CARRY_BASIS_DATED`          | `…/carry-basis-dated.md`                             | _none_ (mostly TradFi)                                                                                                  | futures-roll-and-combos                                     |

**Read rule:** v2 archetype doc ALWAYS. Concrete docs ONLY where listed. Cross-cutting ONLY if the archetype references a capability we haven't mapped yet. No speculative pre-reading.

---

## 2. Widget candidate list per archetype (from Phase A1)

Pre-computed from [widget-certification-context.md](widget-certification-context.md) §A.3.
Order: primary widgets first (direct action/monitor), then supporting widgets (transfer, wallet-summary, trade-history).

| #   | Archetype                    | Primary widgets to verify                                                                              | Supporting (spot-check)                                             |
| --- | ---------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| 1   | `YIELD_STAKING_SIMPLE`       | defi-staking, defi-yield-chart, defi-rates-overview                                                    | defi-wallet-summary, defi-transfer, defi-health-factor (depeg fit?) |
| 2   | `YIELD_ROTATION_LENDING`     | defi-lending, defi-rates-overview, defi-waterfall-weights, defi-transfer, defi-staking-rewards         | defi-trade-history, defi-yield-chart                                |
| 3   | `CARRY_BASIS_PERP`           | enhanced-basis-dashboard, defi-funding-matrix, defi-swap, defi-waterfall-weights, defi-strategy-config | defi-trade-history, defi-wallet-summary                             |
| 4   | `CARRY_STAKED_BASIS`         | defi-staking, defi-lending, defi-health-factor, defi-funding-matrix, defi-reward-pnl                   | defi-yield-chart, defi-trade-history                                |
| 5   | `CARRY_RECURSIVE_STAKED`     | defi-health-factor, defi-flash-loans, defi-reward-pnl, defi-strategy-config                            | defi-lending, defi-staking                                          |
| 6   | `ARBITRAGE_PRICE_DISPERSION` | defi-flash-loans, defi-strategy-config, defi-trade-history                                             | defi-swap, defi-rates-overview                                      |
| 7   | `LIQUIDATION_CAPTURE`        | defi-flash-loans, defi-strategy-config, defi-yield-chart                                               | defi-trade-history                                                  |
| 8   | `CARRY_BASIS_DATED`          | enhanced-basis-dashboard, defi-strategy-config                                                         | defi-trade-history                                                  |

**Primary = open the .tsx file and verify every capability. Supporting = confirm the integration point works for this archetype, no deep verification.**

---

## 3. Per-archetype audit doc template

One file per archetype at `docs/audits/strategy-widget-findings/<archetype>.md`.
Skeleton (≤400 lines total):

```markdown
---
archetype: <ARCHETYPE_NAME>
status: orientation | in-progress | complete
---

# <Archetype> — Widget Audit

## 1. Archetype summary (≤150 words)

- **Thesis:** one-line edge source
- **Position shape:** what legs across which venues
- **P&L drivers:** what we earn, what we pay
- **Kill switches:** what triggers forced exit
- **UI-visible config knobs:** comma list
- **Sources:** links to archetype doc + concrete instance docs

## 2. Concrete strategies in this archetype

Short table — one row per deployed instance.

| Instance ID   | Venue(s) | Asset | Distinguishing config | Doc ref |
| ------------- | -------- | ----- | --------------------- | ------- |
| @example-prod | …        | ETH   | target_leverage=2.5   | …       |

## 3. UI capability requirements (execute · monitor · support · exit)

Four sections, bullet list each. Every UI-relevant need derived from codex read.

### 3a. Execute

- Place STAKE on protocol X
- Emit CLAIM_REWARD when accrued > threshold
- …

### 3b. Monitor

- APY time series per protocol
- Depeg bps (kill-switch threshold)
- …

### 3c. Support

- Wallet balance per chain for asset X
- Cross-chain bridge (ETH → ARB)
- Reward token claim + sell
- Allocator-driven equity change → rebalance preview
- …

### 3d. Exit

- UNSTAKE (market swap) vs protocol withdrawal
- Unbonding-queue visibility
- Emergency-exit trigger
- …

## 4. Widget-by-widget verification

For each primary widget:

### widget-id

- **File:** [components/widgets/defi/<file>.tsx](...)
- **What it does now:** 2–3 lines, cite file:line
- **Capability coverage (this archetype):** table (Capability | Bucket | Status | Evidence file:line)
- **Gap:** one line
- **Proposed action:** update X field / no-op / blocked on Y

## 5. Codex updates needed (minimal)

- If any UI capability isn't covered by codex: one-line description + suggested codex-doc location + small diff sketch. Keep structure, don't rewrite.
- If none: "none".

## 6. Gaps summary

- **Updates needed on existing widgets:** bullet list (widget → change, with capability bucket)
- **New widget candidates:** bullet list (name → purpose + which bucket it serves)
- **Cross-archetype (may also appear in others):** flag for consolidation

## 7. Verified-in-browser checklist

- [ ] Loaded on `/defi` tab, widget renders
- [ ] Golden-path interaction works (execute path)
- [ ] Monitor fields populate from DeFi context
- [ ] Support path reachable (transfer / bridge / claim)
- [ ] Exit path reachable (unwind / withdraw / emergency)
- [ ] Scope filters (org / strategy) work

## 8. Open questions for user review

Numbered list — anything where I need a decision before the next archetype.
```

**Discipline per [feedback_audit_doc_discipline.md](../../../../.claude/projects/-home-hk-unified-trading-system-repos-unified-trading-system-ui/memory/feedback_audit_doc_discipline.md):**
Write this doc _as I verify_, not after. Sections 1–2 (archetype summary + strategies) before any widget verification — show to user for orientation check. Section 3 (capability requirements) next. Section 4 (widget verification) as I read each .tsx. Section 5–8 last. If something's unknown: `TBD: <question>` inline.

---

## 4. Folder + file layout

- **This plan doc:** `docs/trading/widget-certification-audit-plan.md`
- **Per-archetype audit:** `docs/audits/strategy-widget-findings/<archetype>.md`
  - 8 files total: `yield-staking-simple.md`, `yield-rotation-lending.md`, `carry-basis-perp.md`, `carry-staked-basis.md`, `carry-recursive-staked.md`, `arbitrage-price-dispersion.md`, `liquidation-capture.md`, `carry-basis-dated.md`
- **Central tracker (NEW):** `docs/trading/widget-certification-tracker.md` — one row per widget (cumulative updates list) + one section for new-widget candidates. Updated after every archetype audit lands. This is the rolling state-of-the-world doc.
- **Phase-A context (already exists):** `docs/trading/widget-certification-context.md` — doc index + Phase-A1 scoping; its §A.4 becomes historical once the tracker is populated
- **Widget certification JSON updates (BP-3):** `docs/widget-certification/*.json` — written only AFTER consolidation in §6 below
- **Codex doc updates (if any):** in-place edits under `unified-trading-pm/codex/09-strategy/`; tracked in each archetype audit §5

---

## 5. Execution order (simplest → compound)

1. `YIELD_STAKING_SIMPLE` (no concrete docs; shortest audit; calibrates template)
2. `YIELD_ROTATION_LENDING` (4 concrete docs — tests multi-source synthesis)
3. `CARRY_BASIS_PERP` (5 concrete docs + core widget mass)
4. `CARRY_STAKED_BASIS` (2 concrete docs; compound of above)
5. `CARRY_RECURSIVE_STAKED` (1 concrete doc; leveraged variant)
6. `ARBITRAGE_PRICE_DISPERSION` (cross-domain; may drive most new widgets)
7. `LIQUIDATION_CAPTURE` (specialised; flash-loan-heavy)
8. `CARRY_BASIS_DATED` (park — mostly TradFi; placeholder doc only)

## 5a. Per-archetype interaction protocol (checkpoints)

Each archetype cycle:

1. **Orient** — I read the archetype doc + concrete instance docs. Write sections 1 (archetype summary) + 2 (strategies table) of the audit doc. **Surface to user.** User verifies the summary is accurate / redirects if I misread.
2. **Capability extraction** — I write section 3 (execute / monitor / support / exit). **Surface to user.** Quick check the capability list isn't missing something obvious before I start opening widget files.
3. **Widget verification** — I read each widget's .tsx + fill section 4 with file:line evidence. Write sections 5–8 inline.
4. **Findings surface** — I report findings summary to user. User approves / amends. On approval, I update the central tracker (§4).
5. **Move to next archetype.**

The three surface points (after §1–2, after §3, after §4–8) are small and fast — each is a ≤10-line message summary, not a re-post of the whole doc. User reads the doc directly for detail.

---

## 6. Consolidation (after all 8)

1. Read all 8 audit docs.
2. De-duplicate missing-widget candidates (e.g. "inflight-bridge tracker" appears in rotation-lending + staked-basis — one candidate, multiple consumers).
3. Merge widget-update items by widget (e.g. `defi-health-factor` may accumulate 4 updates across archetypes).
4. Produce single authoritative list in [widget-certification-context.md §A.4](widget-certification-context.md) — replaces the Phase-A1 guesses.
5. For each widget update, write a BP-3 patch to its `docs/widget-certification/<widget>.json` `coverage.gaps` field. Wrap as L3 plan.

---

## 7. Rules / guard-rails

- **Evidence first.** Every capability → widget claim must cite file:line, not "I think it does X". If I can't find evidence in 2 min, mark `🟡 TBD: verify <what>` and keep moving.
- **Don't duplicate codex.** Per-archetype audit uses ≤150-word strategy recap + links. Full thesis lives in the codex.
- **Don't over-read.** Read only docs listed in §1; defer cross-cutting docs unless a gap forces it.
- **No widget JSON edits during audit.** Consolidation phase (§6) is the only place JSONs are touched.
- **No widget .tsx edits during audit.** Audit is read-only. Updates happen in L3 execution.
- **Write audit doc as I go.** No "I'll come back and fill that in" — context will be lost to compaction.

---

## 8. Deliverables timeline

| Step                | Output                                                                   | Done-criteria                                  |
| ------------------- | ------------------------------------------------------------------------ | ---------------------------------------------- |
| Audit archetype N   | `docs/audits/strategy-widget-findings/<archetype>.md` (status: complete) | Sections 1–5 of template filled; user reviewed |
| After 8 audits done | `widget-certification-context.md` §A.4 rewritten                         | All gaps consolidated, deduped                 |
| L3 plan             | BP-3 JSON patches + widget .tsx update tickets                           | One ticket per widget update / new widget      |
