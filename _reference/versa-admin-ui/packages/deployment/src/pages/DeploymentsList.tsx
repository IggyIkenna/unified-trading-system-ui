import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchServices } from "../api/deploymentApi";
import type { ServiceStatus, ServiceHealth } from "../types/deploymentTypes";

const HEALTH_COLORS: Record<ServiceHealth, string> = {
  HEALTHY: "#16A34A",
  DEGRADED: "#D97706",
  UNHEALTHY: "#DC2626",
  UNKNOWN: "#6B7280",
};

const HEALTH_ICONS: Record<ServiceHealth, string> = {
  HEALTHY: "●",
  DEGRADED: "◐",
  UNHEALTHY: "○",
  UNKNOWN: "?",
};

export function DeploymentsList() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetchServices()
      .then(setServices)
      .catch((err: unknown) =>
        setError(
          err instanceof Error ? err.message : "Failed to load services",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const healthy = services.filter((s) => s.health === "HEALTHY").length;
  const total = services.length;

  if (loading)
    return (
      <div
        style={{ padding: "24px", color: "#6B7280", fontFamily: "monospace" }}
      >
        Loading services...
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
        <h2 style={{ margin: 0 }}>Services</h2>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <span
            style={{
              color: healthy === total ? "#16A34A" : "#D97706",
              fontSize: "14px",
            }}
          >
            {healthy}/{total} healthy
          </span>
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
          <Link
            to="/deploy"
            style={{
              padding: "6px 12px",
              background: "#2563EB",
              color: "white",
              borderRadius: "4px",
              textDecoration: "none",
              fontSize: "13px",
            }}
          >
            + Deploy
          </Link>
        </div>
      </div>

      {error && (
        <div style={{ color: "#DC2626", marginBottom: "12px" }}>
          Error: {error}
        </div>
      )}

      {services.length === 0 ? (
        <p style={{ color: "#6B7280" }}>No services found.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #333" }}>
              <th style={{ textAlign: "left", padding: "8px" }}>Service</th>
              <th style={{ textAlign: "left", padding: "8px" }}>Health</th>
              <th style={{ textAlign: "left", padding: "8px" }}>Version</th>
              <th style={{ textAlign: "left", padding: "8px" }}>Env</th>
              <th style={{ textAlign: "right", padding: "8px" }}>Replicas</th>
              <th style={{ textAlign: "left", padding: "8px" }}>Last Deploy</th>
              <th style={{ padding: "8px" }}></th>
            </tr>
          </thead>
          <tbody>
            {services.map((svc) => (
              <tr
                key={svc.service_id}
                style={{ borderBottom: "1px solid #222" }}
              >
                <td style={{ padding: "8px", fontWeight: 600 }}>{svc.name}</td>
                <td style={{ padding: "8px" }}>
                  <span style={{ color: HEALTH_COLORS[svc.health] }}>
                    {HEALTH_ICONS[svc.health]} {svc.health}
                  </span>
                </td>
                <td style={{ padding: "8px", color: "#9CA3AF" }}>
                  {svc.current_version}
                </td>
                <td style={{ padding: "8px", color: "#9CA3AF" }}>
                  {svc.environment}
                </td>
                <td style={{ padding: "8px", textAlign: "right" }}>
                  <span
                    style={{
                      color:
                        svc.replicas_ready < svc.replicas_total
                          ? "#D97706"
                          : "#16A34A",
                    }}
                  >
                    {svc.replicas_ready}/{svc.replicas_total}
                  </span>
                </td>
                <td
                  style={{ padding: "8px", color: "#9CA3AF", fontSize: "12px" }}
                >
                  {new Date(svc.last_deployed_at).toLocaleString()}
                </td>
                <td style={{ padding: "8px" }}>
                  <Link
                    to={`/history?service=${svc.service_id}`}
                    style={{
                      color: "#2563EB",
                      textDecoration: "none",
                      fontSize: "12px",
                    }}
                  >
                    History
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
