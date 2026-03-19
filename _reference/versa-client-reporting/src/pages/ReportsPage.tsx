import { useEffect, useState } from "react";
import { apiClient } from "../api/apiClient";
import { Card, CardContent, Badge, Button } from "@unified-trading/ui-kit";
import { Download, Send } from "lucide-react";

/* ── Types ────────────────────────────────────────────────────────────────── */

interface Report {
  id: string;
  name: string;
  client: string;
  type: string;
  status: string;
  period: string;
  generatedAt: string;
  deliveredAt: string | null;
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function statusVariant(status: string): "success" | "warning" | "pending" {
  if (status === "delivered") return "success";
  if (status === "pending") return "pending";
  return "warning";
}

function utcNow(): string {
  return new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

/* ── KPI Card ─────────────────────────────────────────────────────────────── */

function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub: string;
  accent: string;
}) {
  return (
    <div
      className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-4 min-w-0"
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
      <p className="mt-0.5 text-[10px] text-[var(--color-text-muted)]">{sub}</p>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────────── */

export function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [clock] = useState(utcNow);

  useEffect(() => {
    apiClient
      .get<Report[]>("/api/reports")
      .then((data) => setReports(Array.isArray(data) ? data : []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="p-6 text-[var(--color-text-muted)] text-sm">
        Loading reports...
      </div>
    );

  /* ── Derived KPIs ───────────────────────────────────────────────────── */
  const uniqueClients = new Set(reports.map((r) => r.client)).size;
  const deliveredCount = reports.filter((r) => r.status === "delivered").length;
  const pendingCount = reports.filter((r) => r.status === "pending").length;
  const periods = reports.map((r) => r.period).sort();
  const dateRange =
    periods.length > 0
      ? `${periods[0]} \u2013 ${periods[periods.length - 1]}`
      : "\u2014";

  return (
    <div className="flex flex-col gap-5 p-6 max-w-full">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Client Reports
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            {reports.length} reports &middot; {uniqueClients} clients
          </p>
        </div>
        <span
          className="text-[11px] text-[var(--color-text-muted)]"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          as of {clock} UTC
        </span>
      </div>

      {/* ── KPI row (responsive) ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Total Reports"
          value={reports.length}
          sub="in system"
          accent="var(--color-info, #3b82f6)"
        />
        <KpiCard
          label="Clients"
          value={uniqueClients}
          sub="unique"
          accent="var(--color-success, #22c55e)"
        />
        <KpiCard
          label="Delivered"
          value={deliveredCount}
          sub={`${pendingCount} pending`}
          accent="var(--color-accent, #8b5cf6)"
        />
        <KpiCard
          label="Date Range"
          value={dateRange}
          sub="report periods"
          accent="var(--color-text-muted, #6b7280)"
        />
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
                  <th className="table-header-cell">Report Name</th>
                  <th className="table-header-cell">Client</th>
                  <th className="table-header-cell">Period</th>
                  <th className="table-header-cell">Type</th>
                  <th className="table-header-cell">Status</th>
                  <th
                    className="table-header-cell"
                    style={{ textAlign: "right" }}
                  >
                    Generated
                  </th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-sm text-[var(--color-text-muted)]"
                    >
                      No reports found
                    </td>
                  </tr>
                ) : (
                  reports.map((r) => (
                    <tr key={r.id} className="table-row">
                      <td className="table-cell font-medium text-[var(--color-text-primary)] whitespace-nowrap">
                        {r.name}
                      </td>
                      <td className="table-cell text-xs">{r.client}</td>
                      <td className="table-cell font-mono text-xs">
                        {r.period}
                      </td>
                      <td className="table-cell">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)] capitalize">
                          {r.type}
                        </span>
                      </td>
                      <td className="table-cell">
                        <Badge variant={statusVariant(r.status)}>
                          {r.status}
                        </Badge>
                      </td>
                      <td className="table-cell text-right font-mono text-xs text-[var(--color-text-muted)]">
                        {new Date(r.generatedAt).toLocaleDateString()}
                      </td>
                      <td className="table-cell">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              window.open(
                                `/api/reports/${r.id}/download`,
                                "_blank",
                                "noreferrer",
                              )
                            }
                          >
                            <Download size={12} />
                          </Button>
                          {r.status === "pending" && (
                            <Button size="sm" variant="ghost">
                              <Send size={12} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
