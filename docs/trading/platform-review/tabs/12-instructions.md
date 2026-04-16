# Tab: Instructions

**Route:** `/services/trading/instructions`
**Page file:** `app/(platform)/services/trading/instructions/page.tsx`
**Lines:** 19 | **Status:** Placeholder — thin wrapper around `StrategyInstructionViewer`

---

## Current State

A thin page file that renders a title and `StrategyInstructionViewer` component. All actual logic lives inside the component.

**What it renders:**

- Page title "Instructions" / "Trading Instructions"
- `StrategyInstructionViewer` — shows the signal → instruction → fill pipeline

**Data sources:** None in the page file. Whatever `StrategyInstructionViewer` uses internally.

**Filtering/scoping:** None at page level.

The `StrategyInstructionViewer` component needs to be read separately to understand what it shows, but based on naming and context, it visualises the instruction pipeline: how strategy signals translate into execution instructions and eventually fills.

---

## Meeting Review Items

From the meeting context (DeFi Ops discussion):

- Instructions are mentioned as one of the tabs that appears within each asset-class context: "bundles, instruments, predictions, instructions, all those alerts."
- This suggests Instructions is a "configuring"-type tab (see activity dots doc) — it's where you configure how strategies execute, not where you monitor results.

---

## Improvements Needed

1. **Understand the component:** Read `StrategyInstructionViewer` to document what it actually shows before planning improvements. The page is a placeholder — the component may be substantial or may also be a placeholder.
2. **Likely needed content:**
   - Strategy instruction list: which strategies are active, what their current instruction state is (running, paused, error)
   - Per-strategy instruction detail: signal → target position → instruction → execution → fill chain
   - Override controls: manually pause, resume, or modify an instruction
   - Instruction log / audit trail: history of all instructions sent
3. **Global scope integration:** Should filter to instructions for the currently scoped strategies.
4. **Link from positions/orders:** When investigating a position or order, there should be a "View instruction" link that brings you here filtered to that strategy.
5. **Asset-class context:** Instructions look different per asset class — DeFi instructions include on-chain transaction details; sports instructions include bet slip details; TradFi options include multi-leg instruction chains.

---

## Asset-Class Relevance

**Common** — all strategies generate instructions. Display adapts per asset class:

- **CeFi/TradFi:** Exchange order instructions (price, qty, venue routing)
- **DeFi:** On-chain transaction instructions (contract address, function call, gas limit)
- **Sports+Predictions:** Bet slip instructions (selection, stake, odds target, bookmaker)

---

## Action

**Rebuild** — placeholder page with likely incomplete component. Needs a full specification of the instruction viewer before implementation. Read `StrategyInstructionViewer` component before creating the plan for this tab.
