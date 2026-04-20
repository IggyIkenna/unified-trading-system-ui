"use client";

import { Activity, CheckCircle2, Clock, RefreshCcw } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DeliveryHealth } from "@/lib/signal-broadcast";

interface DeliveryHealthPanelProps {
  readonly health: DeliveryHealth;
}

function fmtPct(x: number): string {
  return `${(x * 100).toFixed(1)}%`;
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return `${d.toISOString().slice(0, 10)} ${d.toISOString().slice(11, 19)}Z`;
}

export function DeliveryHealthPanel({ health }: DeliveryHealthPanelProps) {
  return (
    <Card data-testid="signal-broadcast-delivery-health-panel">
      <CardHeader>
        <CardTitle className="text-lg">Delivery health</CardTitle>
        <CardDescription>
          Webhook success rate, retry counts, and latency across the last 24
          hours.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiTile
            icon={<CheckCircle2 className="size-4 text-green-500" />}
            label="Success rate (24h)"
            value={fmtPct(health.success_rate)}
            testId="delivery-health-success-rate"
          />
          <KpiTile
            icon={<RefreshCcw className="size-4 text-amber-500" />}
            label="Retries (24h)"
            value={health.retries_24h.toString()}
            testId="delivery-health-retries"
          />
          <KpiTile
            icon={<Clock className="size-4 text-sky-500" />}
            label="Avg latency"
            value={`${health.avg_latency_ms}ms`}
            testId="delivery-health-latency"
          />
          <KpiTile
            icon={<Activity className="size-4 text-muted-foreground" />}
            label="Total deliveries (24h)"
            value={health.total_deliveries_24h.toString()}
            testId="delivery-health-total"
          />
        </div>
        <div className="mt-4 rounded-md border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
          Last successful delivery:{" "}
          <span
            className="font-mono text-foreground"
            data-testid="delivery-health-last-delivery"
          >
            {fmtTime(health.last_delivery_at)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

interface KpiTileProps {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly value: string;
  readonly testId: string;
}

function KpiTile({ icon, label, value, testId }: KpiTileProps) {
  return (
    <div
      data-testid={testId}
      className="rounded-lg border border-border/60 bg-card p-3"
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 font-mono text-2xl font-semibold text-foreground">
        {value}
      </div>
    </div>
  );
}
