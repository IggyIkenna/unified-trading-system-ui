"use client";

import * as React from "react";
import {
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Database,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface FeaturePipelineRow {
  feature_name: string;
  source_service: string;
  last_published: string;
  sla_target: string;
  subscribed_strategies: number;
  status: "live" | "stale" | "offline";
}

const MOCK_FEATURES: FeaturePipelineRow[] = [
  {
    feature_name: "order_imbalance",
    source_service: "features-service",
    last_published: new Date(Date.now() - 8000).toISOString(),
    sla_target: "30s",
    subscribed_strategies: 5,
    status: "live",
  },
  {
    feature_name: "funding_rate",
    source_service: "features-service",
    last_published: new Date(Date.now() - 12000).toISOString(),
    sla_target: "30s",
    subscribed_strategies: 3,
    status: "live",
  },
  {
    feature_name: "volatility_regime",
    source_service: "features-service",
    last_published: new Date(Date.now() - 300000).toISOString(),
    sla_target: "60s",
    subscribed_strategies: 7,
    status: "stale",
  },
  {
    feature_name: "spread_zscore",
    source_service: "features-service",
    last_published: new Date(Date.now() - 5000).toISOString(),
    sla_target: "10s",
    subscribed_strategies: 4,
    status: "live",
  },
  {
    feature_name: "gas_price_gwei",
    source_service: "features-onchain-service",
    last_published: new Date(Date.now() - 25000).toISOString(),
    sla_target: "30s",
    subscribed_strategies: 2,
    status: "live",
  },
  {
    feature_name: "aave_utilization_rate",
    source_service: "features-onchain-service",
    last_published: new Date(Date.now() - 60000).toISOString(),
    sla_target: "60s",
    subscribed_strategies: 1,
    status: "live",
  },
  {
    feature_name: "dex_volume_ratio",
    source_service: "features-onchain-service",
    last_published: new Date(Date.now() - 900000).toISOString(),
    sla_target: "120s",
    subscribed_strategies: 2,
    status: "stale",
  },
  {
    feature_name: "market_microstructure",
    source_service: "features-service",
    last_published: new Date(Date.now() - 15000).toISOString(),
    sla_target: "30s",
    subscribed_strategies: 6,
    status: "live",
  },
  {
    feature_name: "cross_venue_arb_spread",
    source_service: "features-service",
    last_published: new Date(Date.now() - 3000).toISOString(),
    sla_target: "5s",
    subscribed_strategies: 3,
    status: "live",
  },
  {
    feature_name: "liquidation_heatmap",
    source_service: "features-onchain-service",
    last_published: "—",
    sla_target: "300s",
    subscribed_strategies: 1,
    status: "offline",
  },
];

function getStatusBadge(status: FeaturePipelineRow["status"]) {
  switch (status) {
    case "live":
      return (
        <Badge
          variant="outline"
          className="text-[var(--status-live)] border-[var(--status-live)]/40 gap-1"
        >
          <CheckCircle2 className="size-3" />
          Live
        </Badge>
      );
    case "stale":
      return (
        <Badge
          variant="outline"
          className="text-[var(--status-warning)] border-[var(--status-warning)]/40 gap-1"
        >
          <AlertTriangle className="size-3" />
          Stale
        </Badge>
      );
    case "offline":
      return (
        <Badge
          variant="outline"
          className="text-[var(--status-error)] border-[var(--status-error)]/40 gap-1"
        >
          <XCircle className="size-3" />
          Offline
        </Badge>
      );
  }
}

function formatTimestamp(iso: string): string {
  if (iso === "—") return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function FeaturePipelinePage() {
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const liveCount = MOCK_FEATURES.filter((f) => f.status === "live").length;
  const staleCount = MOCK_FEATURES.filter((f) => f.status === "stale").length;
  const offlineCount = MOCK_FEATURES.filter(
    (f) => f.status === "offline",
  ).length;

  return (
    <div className="p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Database className="size-6 text-primary" />
              Feature Pipeline
            </h1>
            <p className="text-sm text-muted-foreground">
              Real-time feature publishing status, SLA tracking, and strategy
              subscriptions
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setIsLoading(true);
              setTimeout(() => setIsLoading(false), 400);
            }}
          >
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Live</div>
              <div className="text-3xl font-semibold font-mono text-[var(--status-live)]">
                {liveCount}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Stale</div>
              <div className="text-3xl font-semibold font-mono text-[var(--status-warning)]">
                {staleCount}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Offline</div>
              <div className="text-3xl font-semibold font-mono text-[var(--status-error)]">
                {offlineCount}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Published Features</CardTitle>
            <CardDescription>
              All features in the pipeline with SLA targets and downstream
              strategy counts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Feature Name</TableHead>
                      <TableHead>Source Service</TableHead>
                      <TableHead className="text-right">
                        Last Published
                      </TableHead>
                      <TableHead className="text-right">SLA Target</TableHead>
                      <TableHead className="text-right">
                        Subscribed Strategies
                      </TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_FEATURES.map((f) => (
                      <TableRow key={f.feature_name}>
                        <TableCell className="font-medium font-mono text-sm">
                          {f.feature_name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {f.source_service}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatTimestamp(f.last_published)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {f.sla_target}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {f.subscribed_strategies}
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(f.status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
