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

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const job = JOBS.find((j) => j.id === id) ?? JOBS[0];
  const pct = Math.round((job.shardsCompleted / job.shardsTotal) * 100);

  return (
    <div className="p-6 space-y-6">
      <div className="detail-page-header">
        <Button variant="outline" size="icon" onClick={() => navigate("/jobs")}>
          <ArrowLeft size={16} />
        </Button>
        <div style={{ flex: 1 }}>
          <div className="detail-page-title">{job.name}</div>
          <div className="detail-page-subtitle">
            {job.id} · {job.service}
          </div>
        </div>
        <Badge variant={statusVariant(job.status)}>{job.status}</Badge>
      </div>

      {job.error && (
        <div className="alert-banner alert-banner-error">
          <AlertTriangle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>Job Failed</div>
            <div style={{ fontFamily: "var(--font-mono)", opacity: 0.85 }}>
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
          <CardContent>
            <div className="detail-row">
              <span className="detail-label">Completed</span>
              <span
                className="detail-value"
                style={{ color: "var(--color-success)" }}
              >
                {job.shardsCompleted}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Failed</span>
              <span
                className="detail-value"
                style={{
                  color:
                    job.shardsFailed > 0
                      ? "var(--color-error)"
                      : "var(--color-text-muted)",
                }}
              >
                {job.shardsFailed}
              </span>
            </div>
            <div className="detail-row" style={{ borderBottom: "none" }}>
              <span className="detail-label">Total</span>
              <span
                className="detail-value"
                style={{ color: "var(--color-text-primary)" }}
              >
                {job.shardsTotal}
              </span>
            </div>
            <div style={{ marginTop: 16 }}>
              <div className="progress-legend">
                <span className="progress-legend-label">Progress</span>
                <span className="progress-legend-value">{pct}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
          </CardHeader>
          <CardContent>
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
              <div key={m.label} className="detail-row">
                <span className="detail-label">{m.label}</span>
                <span className="detail-value">{m.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
