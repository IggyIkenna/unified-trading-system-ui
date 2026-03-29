"use client";

import * as React from "react";
import { Activity, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Zap, Clock } from "lucide-react";
import { PageHeader } from "@/components/platform/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/utils/formatters";
import { MOCK_SIGNALS, type Signal, type SignalStatus } from "@/lib/mocks/fixtures/research-pages";

function getStatusBadge(status: SignalStatus) {
  switch (status) {
    case "active":
      return (
        <Badge variant="outline" className="text-[var(--status-live)] border-[var(--status-live)]/40 gap-1">
          <CheckCircle2 className="size-3" />
          Active
        </Badge>
      );
    case "inactive":
      return (
        <Badge variant="outline" className="text-muted-foreground border-muted-foreground/40 gap-1">
          <Clock className="size-3" />
          Inactive
        </Badge>
      );
    case "error":
      return (
        <Badge variant="outline" className="text-[var(--status-error)] border-[var(--status-error)]/40 gap-1">
          <XCircle className="size-3" />
          Error
        </Badge>
      );
  }
}

function getDirectionBadge(direction: Signal["direction"]) {
  switch (direction) {
    case "long":
      return (
        <Badge variant="outline" className="text-emerald-400 border-emerald-400/40">
          Long
        </Badge>
      );
    case "short":
      return (
        <Badge variant="outline" className="text-red-400 border-red-400/40">
          Short
        </Badge>
      );
    case "flat":
      return (
        <Badge variant="outline" className="text-muted-foreground border-muted-foreground/40">
          Flat
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

export default function SignalsPage() {
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const activeCount = MOCK_SIGNALS.filter((s) => s.status === "active").length;
  const totalFires = MOCK_SIGNALS.reduce((sum, s) => sum + s.fire_count_24h, 0);

  return (
    <div className="p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <PageHeader
          title={
            <span className="flex items-center gap-2">
              <Zap className="size-6 text-primary" />
              Signals
            </span>
          }
          description="Live strategy signal output, direction, and firing frequency"
        >
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
        </PageHeader>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Total Signals</div>
              <div className="text-3xl font-semibold font-mono">{MOCK_SIGNALS.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Active</div>
              <div className="text-3xl font-semibold font-mono text-[var(--status-live)]">{activeCount}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Fires (24h)</div>
              <div className="text-3xl font-semibold font-mono">{totalFires}</div>
            </CardContent>
          </Card>
        </div>

        {/* Signal Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Signal Monitor</CardTitle>
            <CardDescription>All registered strategy signals with real-time status</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Signal Name</TableHead>
                      <TableHead>Strategy</TableHead>
                      <TableHead className="text-center">Direction</TableHead>
                      <TableHead className="text-right">Strength</TableHead>
                      <TableHead className="text-right">Last Fired</TableHead>
                      <TableHead className="text-right">Fires (24h)</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_SIGNALS.map((s) => (
                      <TableRow key={s.name}>
                        <TableCell className="font-medium font-mono text-sm">{s.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{s.strategy}</TableCell>
                        <TableCell className="text-center">{getDirectionBadge(s.direction)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {s.strength > 0 ? formatNumber(s.strength, 2) : "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatTimestamp(s.last_fired)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{s.fire_count_24h}</TableCell>
                        <TableCell className="text-center">{getStatusBadge(s.status)}</TableCell>
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
