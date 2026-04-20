export interface StrategySignal {
  direction: string;
  confidence: number;
  timestamp: string;
}

export interface StrategyInstructionDetail {
  operationType: string;
  side: string;
  quantity: number;
  price: number;
  venue: string;
}

export interface StrategyFill {
  fillPrice: number;
  fillQty: number;
  slippageBps: number;
  status: string;
}

/**
 * Extended execution-layer fields sourced from the Python contracts.
 *
 * All fields are optional so UI can adopt them incrementally as the
 * backend payload grows richer. Field names mirror the Python contracts
 * verbatim (snake_case → camelCase) so the mapping stays obvious:
 *
 * - `unified_internal_contracts/execution.py :: ManualInstruction`
 * - `unified_internal_contracts/domain/execution_service/types.py :: ExecutionInstruction`
 * - `unified_internal_contracts/domain/execution_service/multi_leg.py :: MultiLegInstruction`
 * - `unified_internal_contracts/domain/execution_service/execution_result.py :: ExecutionResult`
 *
 * These extra fields are consumed by the instructions detail-panel widget
 * redesign (see findings doc issue #6 + plan
 * `unified-trading-pm/plans/ai/instructions-detail-pane-redesign.md`).
 */

/** Lifecycle / audit metadata from ManualInstruction. */
export interface InstructionAudit {
  /** UUID of this instruction (idempotency + audit). */
  instructionId?: string;
  /** Operator identity (OAuth sub claim). */
  submittedBy?: string;
  /** UTC ISO timestamp of submission. */
  submittedAt?: string;
  /** Human-readable reason (audit log). */
  reason?: string;
  /** EXECUTE (route to venue) or RECORD_ONLY (direct fill recording). */
  executionMode?: "EXECUTE" | "RECORD_ONLY" | (string & {});
  /** External trade id / broker confirmation reference. */
  sourceReference?: string;
  /** OTC counterparty identifier. */
  counterparty?: string;
}

/** Org-hierarchy breadcrumb (client → portfolio → strategy). */
export interface InstructionOrgContext {
  clientId?: string;
  strategyId?: string;
  portfolioId?: string;
  accountId?: string;
  category?: string;
}

/** Cross-venue routing (from_venue → to_venue). Single-venue callers can omit `toVenue`. */
export interface InstructionRouting {
  fromVenue?: string;
  toVenue?: string;
  tokenIn?: string;
  tokenOut?: string;
  amount?: number;
}

/** Guardrails + benchmark snapshot from ExecutionInstruction. */
export interface InstructionGuardrails {
  orderType?: string;
  limitPrice?: number;
  maxSlippageBps?: number;
  benchmarkPrice?: number;
  benchmarkType?: "ORACLE" | "TWAP" | "ARRIVAL" | "VWAP" | "CLOSE" | (string & {});
}

/** On-chain execution parameters (populated when `requiresOnChain`). */
export interface InstructionOnChain {
  gasLimit?: number;
  priorityFeeGwei?: number;
  /** Unix ms deadline for on-chain tx. */
  deadlineTimestamp?: string;
  /** Populated after execution: transaction hash / block number. */
  transactionHash?: string;
  blockNumber?: number;
  gasUsed?: number;
  gasPriceGwei?: number;
}

/** A single leg in a multi-leg (spread / combo / pair) instruction. */
export interface InstructionLeg {
  legId: string;
  instrumentId: string;
  venue: string;
  side: string;
  quantity: number;
  orderType?: string;
  price?: number;
  /** Leg result once executed. */
  status?: "PENDING" | "SUBMITTED" | "PARTIALLY_FILLED" | "FILLED" | "CANCELLED" | "FAILED" | (string & {});
  filledQuantity?: number;
  averagePrice?: number;
}

/** One event in the ACK → partial → final → settlement timeline. */
export interface InstructionTimelineEvent {
  /** ISO timestamp. */
  at: string;
  /** e.g. "SUBMITTED", "ACK", "PARTIAL_FILL", "FILLED", "SETTLED", "FAILED". */
  kind: string;
  /** Optional delta payload (qty filled, price, etc.). */
  detail?: Record<string, unknown>;
}

export interface StrategyInstruction {
  id: string;
  strategyId: string;
  strategyType: string;
  signal: StrategySignal;
  instruction: StrategyInstructionDetail;
  fill: StrategyFill | null;

  // ── Extended fields (all optional — incremental backend adoption) ──────────
  /** Audit / lifecycle metadata from ManualInstruction. */
  audit?: InstructionAudit;
  /** Client / strategy / portfolio / account breadcrumb. */
  org?: InstructionOrgContext;
  /** Cross-venue routing (from_venue → to_venue + swap pair). */
  routing?: InstructionRouting;
  /** Limit price, max slippage, benchmark. */
  guardrails?: InstructionGuardrails;
  /** On-chain gas / deadline / tx hash (when `requiresOnChain`). */
  onChain?: InstructionOnChain;
  /** Populated only for MultiLegInstruction. */
  legs?: InstructionLeg[];
  /** ACK → partials → final → settlement timeline. */
  timeline?: InstructionTimelineEvent[];
  /** Strategy-specific metadata dict. */
  metadata?: Record<string, unknown>;
}

export interface InstructionsSummary {
  total: number;
  filled: number;
  partial: number;
  pending: number;
  avgSlippage: number;
}
