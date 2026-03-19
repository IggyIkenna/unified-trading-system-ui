import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchServices } from "../api/deploymentApi";
import type { ServiceStatus, ServiceHealth } from "../types/deploymentTypes";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
} from "@unified-trading/ui-kit";

const HEALTH_VARIANT: Record<
  ServiceHealth,
  "success" | "warning" | "error" | "default"
> = {
  HEALTHY: "success",
  DEGRADED: "warning",
  UNHEALTHY: "error",
  UNKNOWN: "default",
};

function formatTimestamp(): string {
  return new Date().toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function DeploymentsList() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState(formatTimestamp());

  const load = () => {
    setLoading(true);
    fetchServices()
      .then((data) => {
        setServices(data);
        setLastRefreshed(formatTimestamp());
      })
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
  const degraded = services.filter((s) => s.health === "DEGRADED").length;
  const lastDeploy =
    services.length > 0
      ? new Date(
          Math.max(
            ...services.map((s) => new Date(s.last_deployed_at).getTime()),
          ),
        ).toLocaleString([], {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "--";

  if (loading)
    return (
      <div className="p-6 text-[var(--color-text-muted)] font-mono">
        Loading services...
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      {/* Header with timestamp */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-[var(--color-text-primary)]">
            Deployments
          </h1>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
            Service health, versions & deployment history
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            data-testid="deploy-timestamp"
            className="text-xs text-[var(--color-text-muted)]"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {lastRefreshed}
          </span>
          <Button variant="outline" size="sm" onClick={load}>
            Refresh
          </Button>
          <Link
            to="/deploy"
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-accent-blue)] text-white hover:opacity-90 transition-opacity"
          >
            + Deploy
          </Link>
        </div>
      </div>

      {error && (
        <div className="text-[var(--color-error)] text-sm py-2">
          Error: {error}
        </div>
      )}

      {/* KPI Cards */}
      <div
        data-testid="kpi-grid"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
      >
        {[
          {
            label: "Total Services",
            value: String(total),
            accent: "var(--color-accent-blue, #3b82f6)",
          },
          {
            label: "Healthy",
            value: `${healthy}/${total}`,
            accent:
              healthy === total
                ? "var(--color-success, #22c55e)"
                : "var(--color-warning, #f59e0b)",
          },
          {
            label: "Degraded",
            value: String(degraded),
            accent:
              degraded > 0
                ? "var(--color-error, #ef4444)"
                : "var(--color-success, #22c55e)",
          },
          {
            label: "Last Deploy",
            value: lastDeploy,
            accent: "var(--color-accent-purple, #a78bfa)",
          },
        ].map(({ label, value, accent }) => (
          <Card
            key={label}
            data-testid={`kpi-card-${label.toLowerCase().replace(/\s+/g, "-")}`}
            className="rounded-lg"
          >
            <CardContent className="pt-4 pb-4">
              <div className="flex items-stretch gap-3">
                <div
                  className="w-1 rounded-full flex-shrink-0"
                  style={{ backgroundColor: accent }}
                />
                <div>
                  <div className="text-xs text-[var(--color-text-muted)] mb-1">
                    {label}
                  </div>
                  <div
                    className="text-xl font-semibold font-mono text-[var(--color-text-primary)]"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {value}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Services Table */}
      {services.length === 0 ? (
        <p className="text-[var(--color-text-muted)] text-sm">
          No services found.
        </p>
      ) : (
        <Card className="rounded-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Services</CardTitle>
              <Badge variant="info">{total}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header-cell">Service</th>
                    <th className="table-header-cell">Health</th>
                    <th className="table-header-cell text-right">Version</th>
                    <th className="table-header-cell">Env</th>
                    <th className="table-header-cell text-right">Replicas</th>
                    <th className="table-header-cell">Last Deploy</th>
                    <th className="table-header-cell"></th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((svc) => (
                    <tr key={svc.service_id} className="table-row">
                      <td className="table-cell font-semibold">{svc.name}</td>
                      <td className="table-cell">
                        <Badge variant={HEALTH_VARIANT[svc.health]}>
                          {svc.health}
                        </Badge>
                      </td>
                      <td
                        className="table-cell text-right font-mono text-[var(--color-text-muted)]"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {svc.current_version}
                      </td>
                      <td className="table-cell text-[var(--color-text-muted)]">
                        {svc.environment}
                      </td>
                      <td
                        className="table-cell text-right font-mono"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        <span
                          className={
                            svc.replicas_ready < svc.replicas_total
                              ? "text-[var(--color-warning)]"
                              : "text-[var(--color-success)]"
                          }
                        >
                          {svc.replicas_ready}/{svc.replicas_total}
                        </span>
                      </td>
                      <td
                        className="table-cell text-xs text-[var(--color-text-muted)]"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {new Date(svc.last_deployed_at).toLocaleString()}
                      </td>
                      <td className="table-cell">
                        <Link
                          to={`/history?service=${svc.service_id}`}
                          className="text-xs text-[var(--color-accent-blue)] hover:underline"
                        >
                          History
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
