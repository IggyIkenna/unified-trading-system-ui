import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, Badge, Button } from "@unified-trading/ui-kit";
import { ChevronRight, RefreshCw } from "lucide-react";

/* ── Mock data ────────────────────────────────────────────────────────────── */

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
    error: "Quota exceeded: VM instance quota in asia-northeast1-c",
  },
  {
    id: "job-004",
    name: "ml-training weekly",
    service: "ml-training-service",
    status: "completed",
    startedAt: "2026-03-09T22:00:00Z",
    completedAt: "2026-03-09T23:40:00Z",
    shardsTotal: 12,
    shardsCompleted: 12,
    shardsFailed: 0,
    category: "all",
    error: null,
  },
  {
    id: "job-005",
    name: "features-volatility",
    service: "features-volatility-service",
    status: "completed",
    startedAt: "2026-03-10T08:00:00Z",
    completedAt: "2026-03-10T09:15:00Z",
    shardsTotal: 96,
    shardsCompleted: 96,
    shardsFailed: 0,
    category: "equity",
    error: null,
  },
];

/* ── Helpers ──────────────────────────────────────────────────────────────── */

type Status = "all" | "running" | "completed" | "failed";

const STATUS_LABELS: Record<Status, string> = {
  all: "All Jobs",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
};

const KPI_ACCENT: Record<Status, string> = {
  all: "var(--color-info, #3b82f6)",
  running: "var(--color-accent, #8b5cf6)",
  completed: "var(--color-success, #22c55e)",
  failed: "var(--color-error, #ef4444)",
};

const statusVariant = (
  s: string,
): "success" | "running" | "error" | "default" =>
  (
    ({ completed: "success", running: "running", failed: "error" }) as Record<
      string,
      "success" | "running" | "error"
    >
  )[s] ?? "default";

function duration(start: string, end: string | null): string {
  if (!end) return "running\u2026";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}m ${s}s`;
}

function utcNow(): string {
  return new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

function statusCount(status: Status): number {
  if (status === "all") return JOBS.length;
  return JOBS.filter((j) => j.status === status).length;
}

/* ── KPI Card ─────────────────────────────────────────────────────────────── */

function KpiCard({
  label,
  value,
  accent,
  active,
  onClick,
}: {
  label: string;
  value: number;
  accent: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
      className={`rounded-lg border bg-[var(--color-bg-secondary)] p-4 min-w-0 cursor-pointer transition-colors ${
        active
          ? "border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]"
          : "border-[var(--color-border-default)] hover:border-[var(--color-border-focus)]"
      }`}
      style={{ borderLeftWidth: "3px", borderLeftColor: accent }}
    >
      <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
        {label}
      </p>
      <p
        className="mt-1 text-xl font-semibold text-[var(--color-text-primary)]"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </p>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────────── */

export function BatchJobsPage(): React.JSX.Element {
  const [filter, setFilter] = useState<Status>("all");
  const [clock, setClock] = useState(utcNow);
  const navigate = useNavigate();

  useEffect(() => {
    const id = setInterval(() => setClock(utcNow()), 10_000);
    return () => clearInterval(id);
  }, []);

  const filtered =
    filter === "all" ? JOBS : JOBS.filter((j) => j.status === filter);

  const totalShards = JOBS.reduce((s, j) => s + j.shardsTotal, 0);
  const completedShards = JOBS.reduce((s, j) => s + j.shardsCompleted, 0);

  return (
    <div className="flex flex-col gap-5 p-6 max-w-full">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Batch Jobs
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            {JOBS.length} total jobs &middot; {completedShards}/{totalShards}{" "}
            shards
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-[11px] text-[var(--color-text-muted)]"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            as of {clock} UTC
          </span>
          <Button variant="outline" size="sm">
            <RefreshCw size={14} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── KPI row (responsive) ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(["all", "running", "completed", "failed"] as Status[]).map((s) => (
          <KpiCard
            key={s}
            label={STATUS_LABELS[s]}
            value={statusCount(s)}
            accent={KPI_ACCENT[s]}
            active={filter === s}
            onClick={() => setFilter(s)}
          />
        ))}
      </div>

      {/* ── Table ─────────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table
              className="w-full"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              <thead>
                <tr>
                  <th className="table-header-cell">Job</th>
                  <th className="table-header-cell">Service</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Progress</th>
                  <th
                    className="table-header-cell"
                    style={{ textAlign: "right" }}
                  >
                    Duration
                  </th>
                  <th
                    className="table-header-cell"
                    style={{ textAlign: "right" }}
                  >
                    Started
                  </th>
                  <th className="table-header-cell"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((job) => (
                  <tr
                    key={job.id}
                    className="table-row cursor-pointer"
                    onClick={() => navigate(`/jobs/${job.id}`)}
                  >
                    <td className="table-cell">
                      <div className="font-medium text-[var(--color-text-primary)] whitespace-nowrap">
                        {job.name}
                      </div>
                      <div className="text-xs text-[var(--color-text-muted)]">
                        {job.category}
                      </div>
                    </td>
                    <td className="table-cell font-mono text-xs">
                      {job.service}
                    </td>
                    <td className="table-cell">
                      <Badge variant={statusVariant(job.status)}>
                        {job.status}
                      </Badge>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden min-w-[60px]">
                          <div
                            className={`h-full rounded-full transition-all ${job.shardsFailed > 0 ? "bg-[var(--color-error)]" : "bg-[var(--color-success)]"}`}
                            style={{
                              width: `${(job.shardsCompleted / job.shardsTotal) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-mono text-[var(--color-text-muted)] whitespace-nowrap">
                          {job.shardsCompleted}/{job.shardsTotal}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell text-right font-mono text-xs">
                      {duration(job.startedAt, job.completedAt)}
                    </td>
                    <td className="table-cell text-right font-mono text-xs text-[var(--color-text-muted)]">
                      {new Date(job.startedAt).toLocaleTimeString()}
                    </td>
                    <td className="table-cell">
                      <ChevronRight
                        size={14}
                        className="text-[var(--color-text-muted)]"
                      />
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-sm text-[var(--color-text-muted)]"
                    >
                      No jobs match the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
