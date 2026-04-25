"use client";

/**
 * Plan D — Admin "Strategy Versions" approval queue.
 *
 * REVISED PATH (2026-04-25 placement audit): nested under /(ops)/approvals/
 * rather than a top-level /admin/strategy-version-approvals route. Reuses
 * the onboarding-approvals tree.
 *
 * Polling cadence: 30s. Optimistic row updates on Approve / Reject /
 * Rollout.
 */

import * as React from "react";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VersionLineageBadge } from "@/components/strategy-catalogue/VersionLineageBadge";
import {
  ApprovalBelowFloorError,
  approveVersion,
  rejectVersion,
  rolloutVersion,
  type StrategyMaturityPhase,
  type VersionRecord,
} from "@/lib/api/strategy-versions";
import { listPendingApprovalVersions, mockTransitionStatus } from "@/lib/api/mocks/strategy-versions.mock";

const POLL_INTERVAL_MS = 30_000;

// In mock mode we read from the in-memory store; in real mode an UTA
// list endpoint will provide this (deferred follow-up — Phase D Phase 6).
function useVersionsQueue(): VersionRecord[] {
  const [rows, setRows] = React.useState<VersionRecord[]>([]);
  React.useEffect(() => {
    const tick = () => setRows(listPendingApprovalVersions() as VersionRecord[]);
    tick();
    const id = setInterval(tick, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);
  return rows;
}

function MaturityBadge({ phase }: { phase: string }): React.JSX.Element {
  const eligible = [
    "backtest_1yr",
    "backtest_multi_year",
    "paper_1d",
    "paper_14d",
    "paper_stable",
    "live_early",
    "live_stable",
  ].includes(phase);
  return (
    <Badge variant={eligible ? "default" : "destructive"} title={phase}>
      {phase}
    </Badge>
  );
}

export default function StrategyVersionApprovalsPage(): React.JSX.Element {
  const versions = useVersionsQueue();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleApprove = async (v: VersionRecord) => {
    setBusy(v.version_id);
    setError(null);
    try {
      await approveVersion({
        versionId: v.version_id,
        approvedBy: "admin_session",
        backtestSeriesRef: `gs://strategy-store/strategy-versions/${v.version_id}/backtest.parquet`,
        backtestMaturity: v.maturity_phase as StrategyMaturityPhase,
      });
      mockTransitionStatus({
        versionId: v.version_id,
        status: "approved",
        approvedBy: "admin_session",
        backtestMaturity: v.maturity_phase as StrategyMaturityPhase,
      });
    } catch (err) {
      if (err instanceof ApprovalBelowFloorError) {
        setError(`v=${v.version_id}: ${err.message}`);
      } else {
        setError((err as Error).message);
      }
    } finally {
      setBusy(null);
    }
  };

  const handleReject = async (v: VersionRecord) => {
    const reason = window.prompt(`Reject ${v.version_id}? Reason:`);
    if (!reason) return;
    setBusy(v.version_id);
    try {
      await rejectVersion({ versionId: v.version_id, rejectedBy: "admin_session", rejectionReason: reason });
      mockTransitionStatus({ versionId: v.version_id, status: "rejected", rejectionReason: reason });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const handleRollout = async (v: VersionRecord) => {
    setBusy(v.version_id);
    try {
      await rolloutVersion(v.version_id);
      mockTransitionStatus({ versionId: v.version_id, status: "rolled_out" });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Approvals" description="Plan D — Strategy Version approval queue." />
      <Tabs defaultValue="strategy-versions">
        <TabsList>
          <TabsTrigger value="onboarding" asChild>
            <Link href="/approvals">Onboarding</Link>
          </TabsTrigger>
          <TabsTrigger value="strategy-versions">Strategy Versions</TabsTrigger>
        </TabsList>
      </Tabs>

      {error && (
        <Card data-testid="approvals-error">
          <CardContent className="text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Pending strategy-version approvals</CardTitle>
        </CardHeader>
        <CardContent>
          {versions.length === 0 ? (
            <p className="text-sm text-muted-foreground" data-testid="empty-queue">
              No pending strategy-version approvals.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th>Version</th>
                  <th>Parent instance</th>
                  <th>Author</th>
                  <th>Maturity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {versions.map((v) => (
                  <tr key={v.version_id} data-testid={`row-${v.version_id}`}>
                    <td>
                      <VersionLineageBadge versionIndex={1} parentVersionIndex={0} />
                      <span className="ml-2 font-mono text-xs">{v.version_id}</span>
                    </td>
                    <td className="font-mono text-xs">{v.parent_instance_id}</td>
                    <td>{v.authored_by}</td>
                    <td>
                      <MaturityBadge phase={v.maturity_phase} />
                    </td>
                    <td className="space-x-2">
                      <Button
                        size="sm"
                        disabled={busy === v.version_id}
                        onClick={() => handleApprove(v)}
                        data-testid={`approve-${v.version_id}`}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy === v.version_id}
                        onClick={() => handleReject(v)}
                        data-testid={`reject-${v.version_id}`}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busy === v.version_id}
                        onClick={() => handleRollout(v)}
                        data-testid={`rollout-${v.version_id}`}
                      >
                        Rollout
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
