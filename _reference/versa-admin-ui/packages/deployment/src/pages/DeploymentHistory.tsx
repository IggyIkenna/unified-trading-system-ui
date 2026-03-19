import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  fetchDeploymentHistory,
  rollbackDeployment,
} from "../api/deploymentApi";
import type { DeployJob, DeployJobStatus } from "../types/deploymentTypes";

const STATUS_COLORS: Record<DeployJobStatus, string> = {
  QUEUED: "#6B7280",
  RUNNING: "#2563EB",
  SUCCESS: "#16A34A",
  FAILED: "#DC2626",
  CANCELLED: "#D97706",
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
        style={{ padding: "24px", color: "#6B7280", fontFamily: "monospace" }}
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
        <button
          onClick={load}
          style={{
            padding: "6px 12px",
            background: "#1F2937",
            color: "#E5E7EB",
            border: "1px solid #374151",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          Refresh
        </button>
      </div>

      {error && (
        <div style={{ color: "#DC2626", marginBottom: "12px" }}>
          Error: {error}
        </div>
      )}

      {jobs.length === 0 ? (
        <p style={{ color: "#6B7280" }}>No deployment history found.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #333" }}>
              <th style={{ textAlign: "left", padding: "8px" }}>Service</th>
              <th style={{ textAlign: "left", padding: "8px" }}>Version</th>
              <th style={{ textAlign: "left", padding: "8px" }}>Env</th>
              <th style={{ textAlign: "left", padding: "8px" }}>Status</th>
              <th style={{ textAlign: "left", padding: "8px" }}>
                Triggered By
              </th>
              <th style={{ textAlign: "left", padding: "8px" }}>
                Triggered At
              </th>
              <th style={{ padding: "8px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.job_id} style={{ borderBottom: "1px solid #222" }}>
                <td style={{ padding: "8px", fontWeight: 600 }}>
                  {job.service_name}
                </td>
                <td style={{ padding: "8px", color: "#9CA3AF" }}>
                  {job.version}
                </td>
                <td style={{ padding: "8px", color: "#9CA3AF" }}>
                  {job.environment}
                </td>
                <td style={{ padding: "8px" }}>
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
                  style={{ padding: "8px", color: "#9CA3AF", fontSize: "12px" }}
                >
                  {job.triggered_by}
                </td>
                <td
                  style={{ padding: "8px", color: "#9CA3AF", fontSize: "12px" }}
                >
                  {new Date(job.triggered_at).toLocaleString()}
                </td>
                <td
                  style={{
                    padding: "8px",
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                  }}
                >
                  {job.logs_url && (
                    <a
                      href={job.logs_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#2563EB",
                        textDecoration: "none",
                        fontSize: "12px",
                      }}
                    >
                      Logs ↗
                    </a>
                  )}
                  {job.status === "SUCCESS" && (
                    <button
                      onClick={() => void handleRollback(job.job_id)}
                      disabled={rollingBack === job.job_id}
                      style={{
                        padding: "3px 8px",
                        background:
                          rollingBack === job.job_id ? "#374151" : "#7F1D1D",
                        color: "#FCA5A5",
                        border: "none",
                        borderRadius: "4px",
                        cursor:
                          rollingBack === job.job_id
                            ? "not-allowed"
                            : "pointer",
                        fontSize: "11px",
                      }}
                    >
                      {rollingBack === job.job_id
                        ? "Rolling back..."
                        : "Rollback"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
