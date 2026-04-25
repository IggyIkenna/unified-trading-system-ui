/**
 * Plan D — in-memory mock for strategy-version Firestore behaviour.
 *
 * Mirrors the UTA in-memory ``_VersionStore`` shape — versions live as
 * frozen records keyed by ``version_id``; transitions write a new record
 * (no in-place mutation).
 */

import type { StrategyMaturityPhase, VersionRecord, VersionStatus } from "../strategy-versions";

interface MockVersion extends VersionRecord {
  readonly created_at: string;
  readonly approved_by?: string;
  readonly review_notes?: string;
  readonly rejection_reason?: string;
  readonly rolled_out_at?: string;
  readonly supersedes_version_id?: string;
  readonly backtest_series_ref?: string;
  readonly backtest_maturity?: StrategyMaturityPhase;
}

const _store: Map<string, MockVersion> = new Map();

export function listVersionsForInstance(instanceId: string): MockVersion[] {
  return Array.from(_store.values())
    .filter((v) => v.parent_instance_id === instanceId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function listPendingApprovalVersions(): MockVersion[] {
  return Array.from(_store.values()).filter((v) => v.status === "pending_approval");
}

export function getMockVersion(versionId: string): MockVersion | null {
  return _store.get(versionId) ?? null;
}

export function seedGenesisVersion(instanceId: string): MockVersion {
  const versionId = `v_genesis_${instanceId.slice(0, 16)}`;
  const now = new Date().toISOString();
  const v: MockVersion = {
    version_id: versionId,
    parent_instance_id: instanceId,
    parent_version_id: null,
    maturity_phase: "live_stable",
    status: "rolled_out",
    authored_by: "system_seed",
    created_at: now,
    rolled_out_at: now,
    approved_by: "system_seed",
    backtest_series_ref: "seed://genesis",
    backtest_maturity: "live_stable",
  };
  _store.set(versionId, v);
  return v;
}

export function mockForkVersion(args: {
  parentInstanceId: string;
  parentVersionId: string;
  authoredBy: string;
}): MockVersion {
  const versionId = `v_${Math.random().toString(16).slice(2, 14)}`;
  const now = new Date().toISOString();
  const v: MockVersion = {
    version_id: versionId,
    parent_instance_id: args.parentInstanceId,
    parent_version_id: args.parentVersionId,
    maturity_phase: "smoke",
    status: "draft",
    authored_by: args.authoredBy,
    created_at: now,
  };
  _store.set(versionId, v);
  return v;
}

export function mockTransitionStatus(args: {
  versionId: string;
  status: VersionStatus;
  approvedBy?: string;
  backtestMaturity?: StrategyMaturityPhase;
  backtestSeriesRef?: string;
  reviewNotes?: string;
  rejectionReason?: string;
}): MockVersion | null {
  const existing = _store.get(args.versionId);
  if (!existing) return null;
  const updated: MockVersion = {
    ...existing,
    status: args.status,
    approved_by: args.approvedBy ?? existing.approved_by,
    backtest_maturity: args.backtestMaturity ?? existing.backtest_maturity,
    backtest_series_ref: args.backtestSeriesRef ?? existing.backtest_series_ref,
    review_notes: args.reviewNotes ?? existing.review_notes,
    rejection_reason: args.rejectionReason ?? existing.rejection_reason,
    rolled_out_at: args.status === "rolled_out" ? new Date().toISOString() : existing.rolled_out_at,
  };
  _store.set(args.versionId, updated);
  return updated;
}

export function resetMockVersionStore(): void {
  _store.clear();
}
