/**
 * G1.1 Phase unification — closed Phase enum.
 *
 * Stage 3E §1.1 mandates that research, paper, and live trading views share
 * one component tree; only the data-source binding branches per phase. This
 * module exposes the closed 3-value enum plus a narrowing predicate.
 *
 * Paper-phase URL convention (approved 2026-04-20): `?phase=paper` query
 * param on `/services/trading/**`. Research phase = `/services/research/**`
 * prefix; live phase = `/services/trading/**` or `/services/execution/**`
 * prefix without the paper query param.
 *
 * DO NOT add new phases beyond research / paper / live — the enum is closed.
 */

export const PHASES = ["research", "paper", "live"] as const;

export type Phase = (typeof PHASES)[number];

export function isPhase(value: unknown): value is Phase {
  return typeof value === "string" && (PHASES as readonly string[]).includes(value);
}
