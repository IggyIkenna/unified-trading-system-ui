/**
 * DART mock fixtures (~150 lines) for the 4 DART API endpoints.
 *
 * Wired into `mock-handler.ts` so widgets render against fixtures when
 * `VITE_MOCK_API=true` / `NEXT_PUBLIC_MOCK_API=true`.
 *
 * Routes handled:
 *   POST /api/archetypes/:archetypeId/preview
 *   POST /api/manual/submit
 *   GET  /api/instructions/:instructionId/status
 *   POST /api/archetypes/:archetypeId/operational-mode
 *
 * Reference plan:
 *   unified-trading-pm/plans/active/dart_manual_trade_ux_refactor_2026_05_13.md
 *   Phase C.3.
 */

import type {
  ApproveRejectResponse,
  InstructionStatusResponse,
  ManualInstructionStatus,
  ModeTransitionResponse,
  OperationalMode,
  PendingInstruction,
  PreviewResponse,
  RiskCheckResult,
  SubmitResponse,
} from "@/lib/api/dart-client";

// ─── In-memory state ─────────────────────────────────────────────────────────

/** Tracks operational mode per archetypeId across the session. */
const _operationalModes: Map<string, OperationalMode> = new Map();

/** Tracks in-flight instruction status per instructionId. */
const _instructionStore: Map<string, InstructionStatusResponse> = new Map();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nowIso(): string {
  return new Date().toISOString();
}

function generateCorrelationId(): string {
  return `corr-${Math.random().toString(16).slice(2, 14)}`;
}

function generateInstructionId(): string {
  return `instr-${Math.random().toString(16).slice(2, 14)}`;
}

// ─── Preview fixture ─────────────────────────────────────────────────────────

const ALL_PASS_CHECKS: readonly RiskCheckResult[] = [
  { rule: "Position Limit", passed: true },
  { rule: "Capital Allocation Cap", passed: true },
  { rule: "Max Drawdown Impact", passed: true },
  { rule: "Venue Eligibility", passed: true },
];

const RISK_BLOCK_CHECKS: readonly RiskCheckResult[] = [
  { rule: "Position Limit", passed: false, reason: "Size exceeds 15% NAV limit for this archetype" },
  { rule: "Capital Allocation Cap", passed: true },
];

export function mockPreviewResponse(
  archetypeId: string,
  request: { side?: string; size_pct_nav?: number; venue?: string },
): PreviewResponse {
  const sizePct = request.size_pct_nav ?? 5;
  const isOversized = sizePct > 15;

  const correlationId = generateCorrelationId();
  const riskChecks = isOversized ? RISK_BLOCK_CHECKS : ALL_PASS_CHECKS;
  const passed = riskChecks.every((c) => c.passed);

  return {
    correlation_id: correlationId,
    archetype: archetypeId,
    venue: request.venue ?? "BINANCE-FUTURES",
    side: request.side ?? "buy",
    projected_fill_price: isOversized ? null : 42_350.5,
    slippage_bps: isOversized ? null : 3.2,
    collateral_required_usd: isOversized ? null : sizePct * 1_000,
    max_drawdown_impact_pct: isOversized ? null : 0.4,
    risk_checks: riskChecks,
    risk_check_passed: passed,
    estimated_at: nowIso(),
  };
}

// ─── Submit fixture ───────────────────────────────────────────────────────────

export function mockSubmitResponse(
  archetypeId: string,
  request: { correlation_id: string; venue?: string; side?: string; strategy_id?: string },
): SubmitResponse {
  const instructionId = generateInstructionId();

  // Seed a pending status in the store so subsequent status polls work.
  _instructionStore.set(instructionId, {
    instruction_id: instructionId,
    status: "pending",
    filled_qty: 0,
    avg_fill_price: null,
    unrealized_pnl: null,
    last_update_ts: nowIso(),
    venue: request.venue ?? "BINANCE-FUTURES",
    instrument: "BTC-PERP",
  });

  return {
    instruction_id: instructionId,
    archetype: archetypeId,
    venue: request.venue ?? "BINANCE-FUTURES",
    status: "pending",
    submitted_at: nowIso(),
    strategy_id: request.strategy_id,
  };
}

// ─── Status fixture ───────────────────────────────────────────────────────────

/** Progress the status lifecycle on each poll for a realistic mock. */
const _pollCounts: Map<string, number> = new Map();

const STATUS_PROGRESSION: readonly ManualInstructionStatus[] = [
  "pending",
  "pending",
  "partial",
  "partial",
  "filled",
];

export function mockInstructionStatus(instructionId: string): InstructionStatusResponse {
  const existing = _instructionStore.get(instructionId);
  const pollCount = (_pollCounts.get(instructionId) ?? 0) + 1;
  _pollCounts.set(instructionId, pollCount);

  const statusIndex = Math.min(pollCount - 1, STATUS_PROGRESSION.length - 1);
  const status = STATUS_PROGRESSION[statusIndex] ?? "pending";
  const filledQty = status === "filled" ? 0.05 : status === "partial" ? 0.025 : 0;
  const avgFillPrice = status === "pending" ? null : 42_360.0;
  const unrealizedPnl = status === "filled" ? 12.50 : status === "partial" ? 5.0 : null;

  const updated: InstructionStatusResponse = {
    instruction_id: instructionId,
    status,
    filled_qty: filledQty,
    avg_fill_price: avgFillPrice,
    unrealized_pnl: unrealizedPnl,
    last_update_ts: nowIso(),
    venue: existing?.venue ?? "BINANCE-FUTURES",
    instrument: existing?.instrument ?? "BTC-PERP",
  };

  _instructionStore.set(instructionId, updated);
  return updated;
}

// ─── Mode transition fixture ──────────────────────────────────────────────────

const ALLOWED_TRANSITIONS: Record<OperationalMode, readonly OperationalMode[]> = {
  MANUAL: ["PAPER"],
  PAPER: ["LIVE", "MANUAL"],
  LIVE: ["MANUAL"],
  BACKTEST: [],
};

export function mockModeTransition(
  archetypeId: string,
  targetMode: OperationalMode,
): ModeTransitionResponse | { detail: string; status: 409 } {
  const current = _operationalModes.get(archetypeId) ?? "MANUAL";
  const allowed = ALLOWED_TRANSITIONS[current] ?? [];

  if (!allowed.includes(targetMode)) {
    return {
      detail: `Transition ${current} → ${targetMode} not allowed. Allowed targets from ${current}: [${allowed.join(", ") || "none"}]`,
      status: 409 as const,
    };
  }

  _operationalModes.set(archetypeId, targetMode);
  return {
    archetype_id: archetypeId,
    operational_mode: targetMode,
    transitioned_at: nowIso(),
  };
}

// ─── Pending queue fixtures (pvl-p23c) ───────────────────────────────────────

const _pendingQueue: Map<string, PendingInstruction> = new Map();

/** Seed queue with two realistic strategy-originated pending instructions. */
function _seedPendingQueue(): void {
  const now = Date.now();
  const items: PendingInstruction[] = [
    {
      instruction_id: "pending-carry-001",
      strategy_id: "carry_staked_basis_v1",
      archetype: "carry_staked_basis",
      venue: "BYBIT",
      instrument_id: "ETH-PERP",
      side: "SELL",
      quantity: 1.5,
      price: null,
      algo: "MARKET",
      enqueued_at: new Date(now - 45_000).toISOString(),
      timeout_at: new Date(now + 255_000).toISOString(),
      seconds_remaining: 255,
      pre_trade_preview: {
        margin_usd: 3_200,
        position_limit_pct: 0.12,
        worst_case_loss_usd: 480,
      },
    },
    {
      instruction_id: "pending-arb-002",
      strategy_id: "arb_price_dispersion_v2",
      archetype: "arbitrage_price_dispersion",
      venue: "BINANCE",
      instrument_id: "BTC-USDT-PERP",
      side: "BUY",
      quantity: 0.05,
      price: 62_400,
      algo: "TWAP",
      enqueued_at: new Date(now - 20_000).toISOString(),
      timeout_at: new Date(now + 280_000).toISOString(),
      seconds_remaining: 280,
      pre_trade_preview: {
        margin_usd: 1_560,
        position_limit_pct: 0.06,
        worst_case_loss_usd: 94,
      },
    },
  ];
  for (const item of items) {
    _pendingQueue.set(item.instruction_id, item);
  }
}

_seedPendingQueue();

export function mockListPendingInstructions(): readonly PendingInstruction[] {
  const now = Date.now();
  const live: PendingInstruction[] = [];
  for (const item of _pendingQueue.values()) {
    const remaining = Math.max(0, Math.floor((new Date(item.timeout_at).getTime() - now) / 1_000));
    if (remaining > 0) {
      live.push({ ...item, seconds_remaining: remaining });
    } else {
      _pendingQueue.delete(item.instruction_id);
    }
  }
  return live.sort(
    (a, b) => new Date(a.enqueued_at).getTime() - new Date(b.enqueued_at).getTime(),
  );
}

export function mockApproveInstruction(instructionId: string): ApproveRejectResponse | { detail: string; status: 404 } {
  if (!_pendingQueue.has(instructionId)) {
    return { detail: `No pending instruction with id=${instructionId}`, status: 404 as const };
  }
  _pendingQueue.delete(instructionId);
  return {
    instruction_id: instructionId,
    action: "approved",
    message: `Instruction ${instructionId} approved and routed to execution.`,
  };
}

export function mockRejectInstruction(
  instructionId: string,
  _reason: string,
): ApproveRejectResponse | { detail: string; status: 404 } {
  if (!_pendingQueue.has(instructionId)) {
    return { detail: `No pending instruction with id=${instructionId}`, status: 404 as const };
  }
  _pendingQueue.delete(instructionId);
  return {
    instruction_id: instructionId,
    action: "rejected",
    message: `Instruction ${instructionId} rejected.`,
  };
}

// ─── Store reset (for tests) ──────────────────────────────────────────────────

export function resetDartMockStore(): void {
  _operationalModes.clear();
  _instructionStore.clear();
  _pollCounts.clear();
  _pendingQueue.clear();
  _seedPendingQueue();
}
