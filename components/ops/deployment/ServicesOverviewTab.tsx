"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/shared/spinner";
import * as api from "@/hooks/deployment/_api-stub";
import type { ServicesOverview } from "@/lib/types/deployment";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Server,
  XCircle,
} from "lucide-react";
import { useState } from "react";

interface ServicesOverviewTabProps {
  onSelectService?: (service: string) => void;
}

export function ServicesOverviewTab({ onSelectService }: ServicesOverviewTabProps) {
  const [overview, setOverview] = useState<ServicesOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getServicesOverview();
      setOverview(result);
      setHasLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch services overview");
    } finally {
      setLoading(false);
    }
  };

  // NOTE: Removed auto-fetch on mount for faster startup
  // The overview endpoint makes GCS calls for all 12 services and can take 1-2 minutes
  // Users can click "Load Status" when they want to see the full status

  const formatTimestamp = (ts: string | null) => {
    if (!ts) return "Never";
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}m ago`;
    } else if (diffDays < 1) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case "healthy":
        return "var(--color-accent-green)";
      case "warning":
        return "var(--color-accent-amber)";
      case "error":
        return "var(--color-accent-red)";
      case "build_failed":
        return "var(--color-accent-red)";
      default:
        return "var(--color-text-muted)";
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case "healthy":
        return <CheckCircle2 className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "error":
        return <XCircle className="h-4 w-4" />;
      case "build_failed":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-[var(--color-accent-cyan)]" />
              <CardTitle className="text-xl font-mono">All Services Overview</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={fetchOverview} disabled={loading}>
              {loading ? <Spinner className="h-4 w-4 mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Refresh
            </Button>
          </div>
          <CardDescription>Health status of all services at a glance. Click a service to view details.</CardDescription>
        </CardHeader>
      </Card>

      {/* Not Yet Loaded State - Prompt to load */}
      {!hasLoaded && !loading && !error && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <Server className="h-12 w-12 text-[var(--color-text-muted)]" />
              <div className="text-center">
                <p className="text-[var(--color-text-primary)] font-medium">Select a service from the left panel</p>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">
                  Or load the full status overview (may take 1-2 minutes)
                </p>
              </div>
              <Button variant="outline" onClick={fetchOverview}>
                <Activity className="h-4 w-4 mr-2" />
                Load Status Overview
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && !overview && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-3">
              <Spinner size="lg" className="h-8 w-8 text-[var(--color-accent-cyan)]" />
              <p className="text-sm text-[var(--color-text-muted)]">
                Loading services status... (this can take 1-2 minutes)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center gap-3 text-[var(--color-accent-red)]">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Display */}
      {overview && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[var(--color-text-primary)] font-mono">{overview.count}</div>
                  <div className="text-xs text-[var(--color-text-muted)] mt-1 flex items-center justify-center gap-1">
                    <Server className="h-3 w-3" />
                    Total Services
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[var(--color-accent-green)] font-mono">
                    {overview.healthy}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)] mt-1 flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-[var(--color-accent-green)]" />
                    Healthy
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[var(--color-accent-amber)] font-mono">
                    {overview.warnings}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)] mt-1 flex items-center justify-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-[var(--color-accent-amber)]" />
                    Warnings
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[var(--color-accent-red)] font-mono">{overview.errors}</div>
                  <div className="text-xs text-[var(--color-text-muted)] mt-1 flex items-center justify-center gap-1">
                    <XCircle className="h-3 w-3 text-[var(--color-accent-red)]" />
                    Errors
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Services Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border-subtle)]">
                      <th className="text-left py-3 px-4 font-medium text-[var(--color-text-muted)]">Service</th>
                      <th className="text-left py-3 px-4 font-medium text-[var(--color-text-muted)]">Health</th>
                      <th className="text-left py-3 px-4 font-medium text-[var(--color-text-muted)]">Last Data</th>
                      <th className="text-left py-3 px-4 font-medium text-[var(--color-text-muted)]">Last Deploy</th>
                      <th className="text-left py-3 px-4 font-medium text-[var(--color-text-muted)]">Last Build</th>
                      <th className="text-left py-3 px-4 font-medium text-[var(--color-text-muted)]">Issues</th>
                      <th className="text-right py-3 px-4 font-medium text-[var(--color-text-muted)]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.services.map((service) => (
                      <tr
                        key={service.service}
                        className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-secondary)] cursor-pointer transition-colors"
                        onClick={() => onSelectService?.(service.service)}
                      >
                        <td className="py-3 px-4">
                          <span className="font-mono font-medium text-[var(--color-text-primary)]">
                            {service.service}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span style={{ color: getHealthColor(service.health) }}>
                              {getHealthIcon(service.health)}
                            </span>
                            <Badge
                              variant="outline"
                              className="capitalize"
                              style={{
                                color: getHealthColor(service.health),
                                borderColor: getHealthColor(service.health),
                              }}
                            >
                              {service.health}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[var(--color-text-secondary)] font-mono text-xs">
                            {formatTimestamp(service.last_data_update)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[var(--color-text-secondary)] font-mono text-xs">
                            {formatTimestamp(service.last_deployment)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[var(--color-text-secondary)] font-mono text-xs">
                            {formatTimestamp(service.last_build)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {service.anomaly_count > 0 ? (
                            <Badge
                              variant="outline"
                              className="text-xs"
                              style={{
                                color: "var(--color-accent-amber)",
                                borderColor: "var(--color-accent-amber)",
                              }}
                            >
                              {service.anomaly_count} issue
                              {service.anomaly_count > 1 ? "s" : ""}
                            </Badge>
                          ) : (
                            <span className="text-[var(--color-text-muted)] text-xs">None</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)] inline" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
