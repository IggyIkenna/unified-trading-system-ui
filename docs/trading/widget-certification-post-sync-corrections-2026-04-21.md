---
title: Post-sync corrections — BP-3 DeFi widget work vs codex SSOT (2026-04-21)
status: active
scope: Corrections to the BP-3 DeFi widget-certification work after the codex SSOT rewrite in unified-trading-pm@83a2f95
context_commits:
  ui:
    - 1e456a0 # §3.1 strategy_id fix — 7 widgets + useActiveStrategyId hook + asDeFiStrategyId narrower
    - de14cf2 # §3.3/§3.4/§3.6 bundle — reward-PNL reshape, HF generalization, LIQ registry
    - 71fdfbf # §1.1 of this doc — LIQ target_protocols aligned with coverage matrix §12
  pm:
    - 4cc6b1d # DROPPED (reset before pull) — was pre-sync edits to now-deleted archetype tables
    - 8d8e66e # §1.2 of this doc — Chainlink tiers + depeg default re-landed post-sync
reads: [widget-certification-codex-sync-2026-04-20.md, widget-certification-tracker.md, category-instrument-coverage.md]
writes: [this doc, 1 UI correction commit, 1 PM re-landed commit]
created: 2026-04-21
---

# Post-sync corrections

The sync doc ([widget-certification-codex-sync-2026-04-20.md](./widget-certification-codex-sync-2026-04-20.md))
catalogued what the incoming codex commit resolves / changes / adds. This doc is the **response**: per-item, it lists
(a) what I corrected in this session, (b) what I deferred as a follow-up ticket, and (c) why. Keep it read alongside
the sync doc — the sync doc is the _input_, this doc is the _output_.

## 1. Landed corrections (this session)

### 1.1 UI — LIQ `target_protocols` aligned with coverage matrix §12

Incoming [category-instrument-coverage.md §12 LIQUIDATION_CAPTURE](../../../unified-trading-pm/codex/09-strategy/architecture-v2/category-instrument-coverage.md)
lists the authoritative protocol set:

- **SUPPORTED:** Aave V3 (Ethereum + Arbitrum / Optimism / Polygon / Base L2s), Kamino (Solana)
- **PARTIAL:** Compound V3, Euler, Morpho (per-protocol deployments in flight), GMX V2 (perp liquidator role),
  Hyperliquid (CeFi near-liquidation bid-laddering)

My `de14cf2` LIQ schema (`lib/config/strategy-config-schemas/options.ts` L55) had
`["AAVE_V3", "COMPOUND_V3", "MORPHO", "SPARK", "EULER_V2"]`. Diffs against codex:

| Protocol      | My schema | Codex §12  | Action                                |
| ------------- | --------- | ---------- | ------------------------------------- |
| `AAVE_V3`     | ✓         | SUPPORTED  | Keep                                  |
| `COMPOUND_V3` | ✓         | PARTIAL    | Keep                                  |
| `EULER_V2`    | ✓         | PARTIAL    | Keep (rename `EULER_V2` → `EULER`)    |
| `MORPHO`      | ✓         | PARTIAL    | Keep                                  |
| `SPARK`       | ✓         | not listed | Remove                                |
| `KAMINO`      | ✗         | SUPPORTED  | Add                                   |
| `GMX_V2`      | ✗         | PARTIAL    | Add (perp liquidator — different econ |
| `HYPERLIQUID` | ✗         | PARTIAL    | Defer (bid-ladder ≠ flash-loan path)  |

**Landed:** `fix(defi-registry): align LIQUIDATION_CAPTURE target_protocols with coverage matrix §12`.

### 1.2 PM — re-land yield-rotation-lending + yield-staking-simple deltas post-merge

My `4cc6b1d` conflicts with incoming `83a2f95` on `yield-staking-simple.md` (table I edited was deleted); auto-merges
cleanly on `yield-rotation-lending.md` (my edits are in the Risk profile prose, not the table).

**Merge strategy:**

1. `git reset --soft HEAD~1` to unwind `4cc6b1d` (keeps working-tree deltas staged).
2. Stash staged deltas, `git merge origin/live-defi-rollout` — auto-merge resolves everything except the two codex
   files which are now un-modified (reset dropped them).
3. Re-apply the **still-valid** prose content on top of the post-merge tree:
   - `yield-rotation-lending.md`: tiered Chainlink kill-switch (1-2% warn / 2-3% reduce / >3% exit) +
     non-scope blockquote directing leveraged variants to `CARRY_RECURSIVE_STAKED`. Both land in Risk profile / Scope
     sections — both still relevant post-sync (coverage-matrix pointer does not carry risk-policy copy).
   - `yield-staking-simple.md`: 100 bps depeg kill-switch default bullet in Risk profile. Drop the `reward_model`
     column + wstETH / cbETH / MaticX rows — the table no longer exists, and those LSTs are codex over-reach
     (cross-referenced with sync doc §5 which flags Kelp / Renzo / Lombard in our fixture as the same class of gap).

**Landed:** `docs(codex): Chainlink divergence tiers + staking depeg default + non-scope note`.

The `reward_model` concept (rebase vs exchange-rate) does NOT land in this session — it's useful metadata, but it
belongs on either the coverage matrix table or the archetype prose, and adding columns to the SSOT coverage matrix
unilaterally is out of scope. Deferred to §2.4 below.

## 2. Deferred — follow-up tickets with acceptance criteria

### Dependency order

These tickets interact — pick them up in this order, or redo work:

1. **§2.1 slot-label shape** — redesigns the `strategy_id` fallback contract. Do this FIRST.
2. **§2.2 ETHENA_BENCHMARK** + **§2.3 AMM_LP → MMC** — both rewrite widget fallbacks. Do after §2.1 so you write the
   new shape once, not twice.
3. **§2.4 fixture over-reach** — gated on a product decision (keep LRT rows or drop). Starts with a Patrick-persona
   question, not a code change.
4. **§2.5 Solana chain support** — independent; can run in parallel with §2.2 / §2.3.
5. **§2.6 `coverage.gaps` sweep** — independent; mechanical pull from codex `notes/gap` column. Can run anytime.

Each ticket's files and line numbers are discoverable with `rg <literal>` in `unified-trading-system-ui/`. The
acceptance criteria below are the contract — don't treat them as an exhaustive file list.

### 2.1 `strategy_id` slot-label shape rewrite

Sync doc §2: canonical shape is `{ARCHETYPE}@{slot}-{env}` (e.g. `YIELD_STAKING_SIMPLE@lido-steth-ethereum-eth-prod`).
My `1e456a0` §3.1 fix landed venue-shaped literals as fallback (`"AAVE_LENDING"`, `"BASIS_TRADE"`, `"AMM_LP"`).

**Why not corrected in this session:** the fix requires a decision about where host context supplies the slot-label.
Currently `useActiveStrategyId()` reads a scalar string from `useGlobalScope().scope.strategyIds[]`. If slot-labels
supersede legacy IDs, the scope store shape changes — upstream decision needed.

**Acceptance criteria for the follow-up:**

- [`useActiveStrategyId`](../../hooks/use-active-strategy-id.ts) returns `{ archetype, slot, env } | undefined` or a
  full slot-label string
- Callers decode to whichever subset they need (most widgets only consume `archetype`)
- Fallback per widget becomes a placeholder slot-label from the codex `Representative slot_labels` block, not a
  venue-id
- `lib/types/defi.ts` gets a `parseSlotLabel()` helper + type guard
- Test coverage: round-trip `{archetype, slot, env} → slot-label → parsed` preserves fields
- Update `STRATEGY_ID_TO_ARCHETYPE` in `lib/mocks/fixtures/defi-walkthrough.ts` to key on archetype directly once
  slot-labels ship

### 2.2 `ETHENA_BENCHMARK` — benchmark surface, not strategy instance

Sync doc §4: `ethena-benchmark.md` is a benchmark reference, not a deployable strategy. My
`defi-staking-widget` L131 fallback `?? "ETHENA_BENCHMARK"` makes it read as a deployable `strategy_id`.

**Why not corrected:** fixing it well means wiring a benchmark-selector UI pattern (separate from `strategy_id`) and
possibly a `benchmark_ref` field on staking instances. The widget also hardcodes Ethena-specific copy in places that
should be benchmark-agnostic. Scope > one commit.

**Acceptance criteria:**

- `lib/types/defi.ts`: add `Benchmark` type (or union discriminator) separate from `DeFiStrategyId`
- `defi-staking-widget` fallback: drop `ETHENA_BENCHMARK`; render a "no staking instance selected" empty-state
- Benchmark comparison (if it surfaces at all) comes from a second context field, e.g. `useActiveBenchmark()` →
  `benchmark_ref` on the instance
- Remove `ETHENA_BENCHMARK` from `DEFI_STRATEGY_IDS` in `lib/types/defi.ts` (and follow-on: `STRATEGY_DISPLAY_NAMES`,
  `STRATEGY_ID_TO_ARCHETYPE`, `MOCK_TREASURY.per_strategy_balance`, `defi-risk.ts`)

### 2.3 `AMM_LP` → `MARKET_MAKING_CONTINUOUS` Sub-mode B regrouping

Sync doc §3 + coverage matrix §13: `AMM_LP` is not a standalone archetype — it's MMC Sub-mode B (`ACTIVE_LP`) or
Sub-mode C (`PASSIVE_LP`). My `de14cf2` keeps `AMM_LP` in `DEFI_STRATEGY_IDS` and `STRATEGY_ID_TO_ARCHETYPE["AMM_LP"]
= "AMM_LP"`.

**Why not corrected:** `DEFI_STRATEGY_FAMILIES` (lib/config/strategy-config-schemas/defi.ts L421+) groups strategies
for the dropdown. Restructuring to surface `MARKET_MAKING_CONTINUOUS` touches widget filtering, the Strategy Family
Browser widget, per-archetype audit docs, and the widget-cert JSON coverage metadata. Needs a dedicated session.

**Acceptance criteria:**

- `DEFI_STRATEGY_FAMILIES` gets an `MMC` group with `ACTIVE_LP` / `PASSIVE_LP` sub-ids (or drop the existing `AMM_LP`
  in favour of full MMC slot-labels)
- `STRATEGY_ID_TO_ARCHETYPE` maps the new ids to `"MARKET_MAKING_CONTINUOUS"` with a sub-mode hint
- `defi-liquidity-widget` fallback slot-label becomes an MMC literal (e.g.
  `MARKET_MAKING_CONTINUOUS@uniswap-v3-weth-usdc-ethereum-active-usdc-prod`)
- `active-lp-dashboard-widget` gains an audit doc under `docs/audits/strategy-widget-findings/` (currently missing
  from the 8-archetype set per sync doc §8)
- Tracker §1 row 9 flips: `AMM_LP_PROVISION` status → `resolved — covered by MMC Sub-mode B`

### 2.4 `defi-staking.ts` fixture — LST over-reach vs codex §10

Sync doc §5: fixture rows for Kelp / Renzo / Lombard are not in coverage matrix §10 YS. Same class of issue: the
`reward_model` column content I drafted (wstETH / cbETH / MaticX beyond the codex §10 set) is the same kind of
over-reach.

**Why not corrected:** the fixture rows may reflect a real business requirement (Patrick persona includes LRTs?) or
may be pure over-reach — needs a product call before deleting rows. The `reward_model` concept itself could land on
the coverage-matrix table as a new column, but that's a codex edit I should not do unilaterally.

**Unblock path:** this ticket starts with a question, not code. Ask the product owner of the Patrick persona
(check `plans/ai/patrick_persona_entitlement_lockdown_2026_04_14.plan.md` in PM repo for scope) whether Kelp / Renzo /
Lombard are in-scope for the persona. If yes → annotate-and-keep branch below. If no → trim branch. Only then start
editing fixtures.

**Acceptance criteria:**

- Decision captured: keep LRT rows (with `capability_declaration_pending` flag) or remove them
- If kept: each fixture row annotated with `coverage_status: "PENDING_UAC_CAPABILITY"` so widget JSON `coverage.gaps`
  pulls the right label per sync doc §6
- If removed: fixtures trimmed to match codex §10 exactly (5 LSTs: stETH, rETH, eETH, JitoSOL, mSOL)
- `reward_model` column: propose as a coverage-matrix addition in a separate PM PR, with `rebase` vs
  `exchange_rate` values populated for all 5 LSTs

### 2.5 LIQ Solana chain support

Coverage matrix §12 lists `Kamino (Solana)` as SUPPORTED. My LIQ schema consumes the shared `CHAIN_OPTIONS`
(`lib/config/strategy-config-schemas/options.ts` L13) which is `["ETHEREUM", "ARBITRUM", "BASE", "OPTIMISM",
"POLYGON"]` — no SOLANA.

**Why not corrected:** `CHAIN_OPTIONS` is used by every DeFi strategy config, not just LIQ. Adding SOLANA affects
`AAVE_LENDING`, `CROSS_CHAIN_SOR`, `MULTICHAIN_LENDING` defaults — needs coordinated check.

**Acceptance criteria:**

- Add `SOLANA` to `CHAIN_OPTIONS`
- Audit each strategy that consumes `CHAIN_OPTIONS` and decide whether SOLANA belongs in its default set or should be
  opt-in per strategy
- Regenerate fixtures (`defi-lending.ts`, `defi-walkthrough.ts`) with Solana rows for strategies where SOLANA is
  SUPPORTED per coverage matrix

### 2.6 Widget-cert JSON `coverage.gaps` population

Sync doc §6: widget-certification JSON coverage metadata should pull `notes/gap` column verbatim from coverage matrix
§5-§18. Currently `docs/widget-certification/defi-*.json` files have no `coverage.gaps` field.

**Acceptance criteria:**

- `coverage.gaps` field on every DeFi widget JSON under `docs/widget-certification/`
- Values quote coverage-matrix notes verbatim (not paraphrased) so a codex change propagates by grep
- Structure: `{ status: "SUPPORTED" | "PARTIAL" | "BLOCKED" | "N/A", notes: string }[]`

### Verification (applies to every deferred ticket)

- `npx tsc --noEmit` passes with no new errors in session-touched files (ignore pre-existing unrelated failures in
  `app/(platform)/services/strategy-catalogue/*` and `tests/unit/lib/architecture-v2/*`)
- `npx eslint` clean on session-touched files
- Run in browser: `npm run dev`, wait 8-10s, load the affected widget, verify the golden path and at least one edge
  case (per UI rules in `.claude/rules/ui.md`)
- Playwright smoke if the change crosses widget boundaries: `npm run smoketest`
- Commit per conventional-commits (HEREDOC format); no `git push`; let the user run quickmerge

## 3. Cross-alignment checks performed

Before landing §1.1 and §1.2, the following cross-references were verified:

- **Coverage matrix §12 protocol names** (`Aave V3`, `Compound V3`, `Euler`, `Morpho`, `Kamino`, `GMX V2`) — cross
  referenced against our existing `LENDING_PROTOCOL_OPTIONS` to ensure case / naming convention alignment
  (`EULER_V2` in our schema is `Euler` on codex — track the normalization)
- **MMC §13 `uniswap-v3-weth-usdc-ethereum-active-usdc-prod` slot-label pattern** — matches sync doc §2 grammar, used
  as the follow-up anchor for §2.3
- **YS §10 LST set** (stETH, rETH, eETH, JitoSOL, mSOL) — confirmed our fixture has additional rows that aren't in
  codex (Kelp / Renzo / Lombard per sync doc §5, plus my draft additions wstETH / cbETH / MaticX)
- **Merge-tree simulation** on PM repo (`git merge-tree --write-tree --name-only --merge-base=<base> HEAD
origin/live-defi-rollout`) confirmed exactly 1 conflict (`yield-staking-simple.md`) and 0 on UI repo
- **Incoming `83a2f95` commit stat** — 29 files, all under `codex/09-strategy/`; touches 18 archetype docs + 8 family
  docs + the new coverage matrix + prediction-markets-codification-gaps — only the two I edited overlap

## 4. Acceptance for this doc

- [x] UI correction commit landed (§1.1)
- [x] PM correction commit landed (§1.2)
- [ ] Follow-up tickets §2.1 – §2.6 opened in tracker or picked up by a sibling session
- [ ] Widget-cert JSON `coverage.gaps` sweep scheduled (§2.6 is the umbrella)
