import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
} from "@unified-trading/ui-kit";
import { ArrowLeft, AlertTriangle } from "lucide-react";

const JOBS = [
  {
    id: "job-001",
    name: "instruments-service daily",
    service: "instruments-service",
    status: "completed",
    startedAt: "2026-03-10T02:00:00Z",
    completedAt: "2026-03-10T02:45:00Z",
    shardsTotal: 48,
    shardsCompleted: 48,
    shardsFailed: 0,
    category: "equity",
    date: "2026-03-09",
    error: null,
  },
  {
    id: "job-002",
    name: "market-tick-data batch",
    service: "market-tick-data-service",
    status: "running",
    startedAt: "2026-03-10T09:30:00Z",
    completedAt: null,
    shardsTotal: 126,
    shardsCompleted: 78,
    shardsFailed: 0,
    category: "crypto",
    date: "2026-03-09",
    error: null,
  },
  {
    id: "job-003",
    name: "features-delta-one",
    service: "features-delta-one-service",
    status: "failed",
    startedAt: "2026-03-10T07:00:00Z",
    completedAt: "2026-03-10T07:22:00Z",
    shardsTotal: 72,
    shardsCompleted: 31,
    shardsFailed: 8,
    category: "equity",
    date: "2026-03-09",
    error: "Quota exceeded: VM instance quota in asia-northeast1-c",
  },
];

const statusVariant = (
  s: string,
): "success" | "running" | "error" | "default" =>
  (
    ({ completed: "success", running: "running", failed: "error" }) as Record<
      string,
      "success" | "running" | "error"
    >
  )[s] ?? "default";

export function JobDetailPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const job = JOBS.find((j) => j.id === id) ?? JOBS[0];
  const pct = Math.round((job.shardsCompleted / job.shardsTotal) * 100);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/jobs")}>
          <ArrowLeft size={16} />
        </Button>
        <div>
          <h1 className="text-base font-semibold text-[var(--color-text-primary)]">
            {job.name}
          </h1>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
            {job.id} · {job.service}
          </p>
        </div>
        <Badge variant={statusVariant(job.status)}>{job.status}</Badge>
      </div>

      {job.error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--color-error-dim)] border border-[rgba(248,113,113,0.3)]">
          <AlertTriangle
            size={14}
            className="text-[var(--color-error)] mt-0.5 shrink-0"
          />
          <div>
            <div className="text-xs font-semibold text-[var(--color-error)]">
              Job Failed
            </div>
            <div className="text-xs text-[var(--color-error)] opacity-80 mt-0.5 font-mono">
              {job.error}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Shard Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">
                Completed
              </span>
              <span className="font-mono text-[var(--color-success)]">
                {job.shardsCompleted}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Failed</span>
              <span className="font-mono text-[var(--color-error)]">
                {job.shardsFailed}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Total</span>
              <span className="font-mono text-[var(--color-text-primary)]">
                {job.shardsTotal}
              </span>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[var(--color-text-muted)]">Progress</span>
                <span className="font-mono text-[var(--color-text-secondary)]">
                  {pct}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--color-success)]"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Service", value: job.service },
              { label: "Category", value: job.category },
              { label: "Date", value: job.date },
              {
                label: "Started",
                value: new Date(job.startedAt).toLocaleString(),
              },
              {
                label: "Completed",
                value: job.completedAt
                  ? new Date(job.completedAt).toLocaleString()
                  : "—",
              },
            ].map((m) => (
              <div key={m.label} className="flex items-center justify-between">
                <span className="text-xs text-[var(--color-text-tertiary)]">
                  {m.label}
                </span>
                <span className="text-sm font-mono text-[var(--color-text-secondary)]">
                  {m.value}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
