"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle } from "lucide-react";

type PathStatus = "present" | "missing" | "stale";

const MOCK_HEALTH: {
  date: string;
  overall_health: string;
  services: Record<
    string,
    {
      paths: {
        path: string;
        status: PathStatus;
        size_mb: number | null;
        updated_at: string | null;
      }[];
    }
  >;
  missing_paths: string[];
  stale_paths: string[];
} = {
  date: "2026-03-10",
  overall_health: "degraded",
  missing_paths: [
    "gs://features-delta-one-bucket/batch/2026-03-10/features.parquet",
    "gs://features-onchain-bucket/batch/2026-03-10/onchain_features.parquet",
  ],
  stale_paths: ["gs://ml-inference-bucket/live/events/2026-03-10/ml-inference-service/"],
  services: {
    "ml-inference-service": {
      paths: [
        {
          path: "batch/2026-03-10/signals.parquet",
          status: "present",
          size_mb: 12.4,
          updated_at: "2026-03-10T06:42:17Z",
        },
        {
          path: "live/events/2026-03-10/ml-inference-service/",
          status: "stale",
          size_mb: 0.8,
          updated_at: "2026-03-09T23:55:00Z",
        },
        {
          path: "t1-recon/ml/2026-03-10/signals.parquet",
          status: "present",
          size_mb: 11.9,
          updated_at: "2026-03-10T07:14:22Z",
        },
      ],
    },
    "features-delta-one-service": {
      paths: [
        {
          path: "batch/2026-03-10/features.parquet",
          status: "missing",
          size_mb: null,
          updated_at: null,
        },
        {
          path: "batch/2026-03-09/features.parquet",
          status: "present",
          size_mb: 34.1,
          updated_at: "2026-03-09T09:15:00Z",
        },
      ],
    },
    "features-volatility-service": {
      paths: [
        {
          path: "batch/2026-03-10/volatility_features.parquet",
          status: "present",
          size_mb: 8.2,
          updated_at: "2026-03-10T09:15:00Z",
        },
        {
          path: "t1-recon/features/volatility/2026-03-10/",
          status: "present",
          size_mb: 7.9,
          updated_at: "2026-03-10T09:20:00Z",
        },
      ],
    },
    "strategy-service": {
      paths: [
        {
          path: "batch/2026-03-10/instructions.parquet",
          status: "present",
          size_mb: 2.1,
          updated_at: "2026-03-10T08:30:00Z",
        },
        {
          path: "t1-recon/strategy/2026-03-10/instructions.parquet",
          status: "present",
          size_mb: 2.0,
          updated_at: "2026-03-10T08:45:00Z",
        },
      ],
    },
  },
};

const pathStatusVariant = (s: PathStatus): "success" | "error" | "warning" =>
  s === "present" ? "success" : s === "missing" ? "error" : "warning";

const healthVariant = (h: string): "success" | "error" | "warning" | "default" =>
  (({ healthy: "success", degraded: "warning", critical: "error" }) as Record<string, "success" | "error" | "warning">)[
    h
  ] ?? "default";

export default function DataCompletenessPage() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const totalPaths = Object.values(MOCK_HEALTH.services).flatMap((s) => s.paths);
  const presentCount = totalPaths.filter((p) => p.status === "present").length;
  const missingCount = MOCK_HEALTH.missing_paths.length;
  const staleCount = MOCK_HEALTH.stale_paths.length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-[var(--color-text-primary)]">Data Completeness</h1>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">GCS path presence grid: {MOCK_HEALTH.date}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={healthVariant(MOCK_HEALTH.overall_health)}>{MOCK_HEALTH.overall_health}</Badge>
          <Button variant="outline" size="sm">
            <RefreshCw size={14} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-semibold font-mono text-[var(--color-text-primary)]">{totalPaths.length}</div>
            <div className="text-xs text-[var(--color-text-secondary)] mt-1">Total Paths</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-semibold font-mono text-[var(--color-success)]">{presentCount}</div>
            <div className="text-xs text-[var(--color-text-secondary)] mt-1">Present</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-semibold font-mono text-[var(--color-error)]">{missingCount}</div>
            <div className="text-xs text-[var(--color-text-secondary)] mt-1">Missing</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-semibold font-mono text-[var(--color-warning)]">{staleCount}</div>
            <div className="text-xs text-[var(--color-text-secondary)] mt-1">Stale</div>
          </CardContent>
        </Card>
      </div>

      {(missingCount > 0 || staleCount > 0) && (
        <Card className="border-[var(--color-warning)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle size={14} className="text-[var(--color-warning)]" />
              Issues Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            {MOCK_HEALTH.missing_paths.map((p) => (
              <div key={p} className="flex items-center gap-2 py-1">
                <Badge variant="error">missing</Badge>
                <span className="text-xs font-mono text-[var(--color-text-secondary)]">{p}</span>
              </div>
            ))}
            {MOCK_HEALTH.stale_paths.map((p) => (
              <div key={p} className="flex items-center gap-2 py-1">
                <Badge variant="warning">stale</Badge>
                <span className="text-xs font-mono text-[var(--color-text-secondary)]">{p}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {Object.entries(MOCK_HEALTH.services).map(([service, data]) => {
          const isExpanded = expanded === service;
          const hasIssues = data.paths.some((p) => p.status !== "present");
          return (
            <Card key={service} className={hasIssues ? "border-[var(--color-warning)]" : ""}>
              <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : service)}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-mono">{service}</CardTitle>
                  <div className="flex items-center gap-2">
                    {data.paths.map((p) => (
                      <Badge key={p.path} variant={pathStatusVariant(p.status)}>
                        {p.status}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardHeader>
              {isExpanded && (
                <CardContent>
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="table-header-cell">Path</th>
                        <th className="table-header-cell">Status</th>
                        <th className="table-header-cell">Size</th>
                        <th className="table-header-cell">Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.paths.map((p) => (
                        <tr key={p.path} className="table-row">
                          <td className="table-cell font-mono text-xs">{p.path}</td>
                          <td className="table-cell">
                            <Badge variant={pathStatusVariant(p.status)}>{p.status}</Badge>
                          </td>
                          <td className="table-cell font-mono text-xs text-[var(--color-text-muted)]">
                            {p.size_mb !== null ? `${p.size_mb} MB` : "\u2014"}
                          </td>
                          <td className="table-cell text-xs text-[var(--color-text-muted)]">
                            {p.updated_at ? new Date(p.updated_at).toLocaleString() : "\u2014"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
