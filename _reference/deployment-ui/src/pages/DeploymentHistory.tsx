import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  fetchDeploymentHistory,
  rollbackDeployment,
} from "../api/deploymentApi";
import type { DeployJob, DeployJobStatus } from "../types/deploymentTypes";
import { Button } from "@unified-trading/ui-kit";

const STATUS_COLORS: Record<DeployJobStatus, string> = {
  QUEUED: "var(--color-text-muted)",
  RUNNING: "var(--color-accent-blue)",
  SUCCESS: "var(--color-accent-green)",
  FAILED: "var(--color-accent-red)",
  CANCELLED: "var(--color-accent-amber)",
};

export function DeploymentHistory() {
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get("service") ?? undefined;
  const [jobs, setJobs] = useState<DeployJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rollingBack, setRollingBack] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchDeploymentHistory(serviceId)
      .then(setJobs)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load history"),
      )
      .finally(() => setLoading(false));
  }, [serviceId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRollback = async (jobId: string) => {
    setRollingBack(jobId);
    try {
      await rollbackDeployment(jobId);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Rollback failed");
    } finally {
      setRollingBack(null);
    }
  };

  if (loading)
    return (
      <div
        style={{
          padding: "24px",
          color: "var(--color-text-muted)",
          fontFamily: "monospace",
        }}
      >
        Loading deployment history...
      </div>
    );

  return (
    <div style={{ padding: "16px", fontFamily: "monospace" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <h2 style={{ margin: 0 }}>
          Deployment History {serviceId ? `— ${serviceId}` : "(All Services)"}
        </h2>
        <Button variant="outline" onClick={load}>
          Refresh
        </Button>
      </div>

      {error && (
        <div
          style={{
            color: "var(--color-accent-red)",
            marginBottom: "12px",
          }}
        >
          Error: {error}
        </div>
      )}

      {jobs.length === 0 ? (
        <p style={{ color: "var(--color-text-muted)" }}>
          No deployment history found.
        </p>
      ) : (
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-header-cell">Service</th>
              <th className="table-header-cell">Version</th>
              <th className="table-header-cell">Env</th>
              <th className="table-header-cell">Status</th>
              <th className="table-header-cell">Triggered By</th>
              <th className="table-header-cell">Triggered At</th>
              <th className="table-header-cell">Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.job_id} className="table-row">
                <td className="table-cell font-semibold">{job.service_name}</td>
                <td
                  className="table-cell"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {job.version}
                </td>
                <td
                  className="table-cell"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {job.environment}
                </td>
                <td className="table-cell">
                  <span
                    style={{
                      color: STATUS_COLORS[job.status],
                      fontWeight: 600,
                    }}
                  >
                    {job.status}
                  </span>
                </td>
                <td
                  className="table-cell text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {job.triggered_by}
                </td>
                <td
                  className="table-cell text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {new Date(job.triggered_at).toLocaleString()}
                </td>
                <td className="table-cell">
                  <div className="flex gap-2 items-center">
                    {job.logs_url && (
                      <a
                        href={job.logs_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "var(--color-accent-blue)",
                          textDecoration: "none",
                          fontSize: "12px",
                        }}
                      >
                        Logs ↗
                      </a>
                    )}
                    {job.status === "SUCCESS" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleRollback(job.job_id)}
                        disabled={rollingBack === job.job_id}
                      >
                        {rollingBack === job.job_id
                          ? "Rolling back..."
                          : "Rollback"}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
