import { Card, CardContent, Badge, Button } from "@unified-trading/ui-kit";
import { Download, Send } from "lucide-react";

const REPORTS = [
  {
    id: "rpt-001",
    name: "Apex Capital — February 2026",
    client: "Apex Capital",
    type: "monthly",
    status: "delivered",
    period: "2026-02",
    generatedAt: "2026-03-01T09:00:00Z",
  },
  {
    id: "rpt-002",
    name: "Meridian Fund — February 2026",
    client: "Meridian Fund",
    type: "monthly",
    status: "pending",
    period: "2026-02",
    generatedAt: "2026-03-01T09:15:00Z",
  },
  {
    id: "rpt-003",
    name: "QuantEdge Q4 2025",
    client: "QuantEdge HK",
    type: "quarterly",
    status: "delivered",
    period: "2025-Q4",
    generatedAt: "2026-01-15T09:00:00Z",
  },
];

const statusVariant = (s: string): "success" | "warning" | "default" =>
  (
    ({ delivered: "success", pending: "warning" }) as Record<
      string,
      "success" | "warning"
    >
  )[s] ?? "default";

export function ReportsTab() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
            Client Reports
          </h2>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
            {REPORTS.length} reports
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-semibold font-mono">
              {REPORTS.length}
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] mt-1">
              Total Reports
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-semibold font-mono text-[var(--color-success)]">
              {REPORTS.filter((r) => r.status === "delivered").length}
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] mt-1">
              Delivered
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-semibold font-mono text-[var(--color-warning)]">
              {REPORTS.filter((r) => r.status === "pending").length}
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] mt-1">
              Pending
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header-cell">Report</th>
                <th className="table-header-cell">Client</th>
                <th className="table-header-cell">Type</th>
                <th className="table-header-cell">Period</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Generated</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {REPORTS.map((r) => (
                <tr key={r.id} className="table-row">
                  <td className="table-cell font-medium text-[var(--color-text-primary)]">
                    {r.name}
                  </td>
                  <td className="table-cell">{r.client}</td>
                  <td className="table-cell capitalize">{r.type}</td>
                  <td className="table-cell font-mono">{r.period}</td>
                  <td className="table-cell">
                    <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                  </td>
                  <td className="table-cell text-[var(--color-text-muted)]">
                    {new Date(r.generatedAt).toLocaleDateString()}
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-1.5">
                      <Button variant="ghost" size="icon">
                        <Download size={13} />
                      </Button>
                      {r.status !== "delivered" && (
                        <Button variant="ghost" size="icon">
                          <Send size={13} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
