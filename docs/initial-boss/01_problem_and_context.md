# 01 — Problem & Context

**Status:** DISCUSSING
**Last updated:** 2026-04-15

---

## The problem in one paragraph [DISCUSSING]

Harsh is iterating on `unified-trading-system-ui` with multiple AI agents (Cursor, Claude Code, Codex, Gemini). Agents work fast but occasionally break things in ways the developer doesn't notice for hours. On 2026-04-14, an agent edited a shared data context and broke widgets that consumed it; Harsh discovered the breakage manually much later. The codebase has good test infrastructure but **none of it gates anything** — `lint` and `typecheck` are stubbed in `package.json`, and there's no pre-merge / pre-push / pre-"agent-done" verification step.

## Who is affected [DISCUSSING]

- **Harsh** — primary developer, backend-focused, has used many trading UIs and has strong intuition about what _should_ exist, but is not a seasoned frontend dev. Coordinates multiple agents in parallel sessions.
- **Other developers / agents** — currently same workflow; whatever solution we pick has to be agent-friendly (they will run the gate, not just humans).
- **Future clients of the UI** — the system is being built first for internal use (Odum Capital), then for other client orgs via the subscription model. Quality bar matters because external clients will see this.

## The development context [DISCUSSING]

- **Backend not ready.** Everything runs against mock data right now.
- **Two mock layers:** local fixtures/generators in [lib/mocks/](../../lib/mocks/) AND a FastAPI mock backend in `unified-trading-api` that Playwright spins up on port 8030 with `CLOUD_MOCK_MODE=true`.
- **Subscription model is in flux** — schemas are still being shaped. Any test that locks down schema details too tightly will become noisy.
- **Six lifecycle tabs** (data, research, promote, terminal, reporting, health, backoffice). Three (data, research, promote) are "pretty good" and stable. Trading terminal is current focus. Others not yet started.
- **Harsh's working pattern:** focuses on ONE lifecycle tab at a time. Within that tab, multiple agents may iterate on different widgets in parallel. So parallel work happens _within_ a tab, not across tabs.
- **Currently working on:** trading terminal, ~130 widgets across 17 domain folders, upgrading them.

## The yesterday's incident (2026-04-14) [TENTATIVE]

What we know so far:

- A modified file is currently in the working tree: [components/widgets/orders/orders-data-context.tsx](../../components/widgets/orders/orders-data-context.tsx) (539 lines)
- This file is a shared React context provider that wraps multiple orders widgets and exposes a typed shape (`OrdersDataContextShape`) consumed by `OrdersKpiStripWidget`, `OrdersTableWidget`, and likely others
- Hypothesis: an agent edited this context (renamed/removed a field, changed a hook, changed the consumed shape), and downstream widget consumers silently broke at runtime
- Hours later, Harsh noticed manually
- **Open question:** is this hypothesis confirmed, or is the actual breakage in a different file? Need to confirm with Harsh.

## What "good" looks like [DISCUSSING]

Defining the success criteria so we can evaluate options against them:

1. **Agents cannot declare "done" without a gate confirming the work doesn't break anything.** This is the load-bearing requirement.
2. **The gate runs in <3 minutes** on Harsh's local machine. Slower than that and it gets skipped.
3. **The gate catches the yesterday-class of bug** specifically — shared context refactor breaks consuming widgets.
4. **The gate catches "I broke a widget I wasn't even touching"** — the silent regression problem.
5. **The gate works against mock data only** — we cannot wait for the real backend to start testing.
6. **Existing test infrastructure is reused** wherever possible — we are NOT replacing Vitest, NOT replacing Playwright, NOT introducing a second build system.
7. **Repo is not split.** (See `05_repo_structure_question.md` for rationale.) The widget registry already provides isolation; splitting solves a problem we don't have.
8. **Visual regression is deferred.** Functionality matters first. Visual polish can be eyeballed manually for now.

## What's NOT in scope [DISCUSSING]

- Visual regression testing (Chromatic, Percy) — deferred
- Splitting the repo into Nx/Turborepo packages — rejected
- Performance benchmarking — separate concern
- Backend integration tests — backend isn't ready
- Full code coverage targets (e.g. 80% line coverage) — the goal is _catching the regression class_, not hitting a coverage number

## Open questions for Harsh

1. Is the orders-data-context hypothesis correct, or was yesterday's bug somewhere else? If somewhere else, where?
2. How many agents are typically running in parallel? 2-3? 5-10?
3. When you say "broke other things", what was the symptom — runtime crash, blank widget, wrong data, layout issue?
4. How long is acceptable for the gate? 3 min is my guess — what's your real tolerance?
5. Are there any tabs / widgets you'd consider "locked, never touch again" today, or is everything still in motion?

## Decisions log

- _(empty — nothing finalized yet)_
