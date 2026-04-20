import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BacktestComparisonPanel,
  DeliveryHealthPanel,
  PnlAttributionPanel,
  SignalHistoryTable,
} from "@/components/signal-broadcast";
import {
  MOCK_BACKTEST_COMPARISON,
  MOCK_COUNTERPARTY,
  MOCK_DELIVERY_HEALTH,
  MOCK_PNL_ATTRIBUTION,
  MOCK_SIGNAL_EMISSIONS,
} from "@/lib/signal-broadcast";

export const metadata: Metadata = {
  title: "Signals dashboard — Odum Research",
  description:
    "Counterparty-scoped observability for signal-leasing deliveries: signal history, backtest comparison, delivery health, optional P&L attribution.",
};

/**
 * Counterparty observability dashboard.
 *
 * Tenant-scoped view for institutional quant shops (QRT-style) integrated
 * primarily via webhook. Observability only — NO catalogue / execution /
 * research / reporting surface. Plan SSOT: signal_leasing_broadcast_architecture
 * 2026-04-20 § Phase 5.
 */
export default function CounterpartyDashboardPage() {
  const cp = MOCK_COUNTERPARTY;

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      data-testid="signal-broadcast-dashboard-page"
    >
      <div className="platform-page-width space-y-6 p-6">
        <header className="space-y-3">
          <div className="flex items-center gap-2">
            <h1 className="text-page-title font-semibold tracking-tight">
              Signals dashboard
            </h1>
            <Badge variant="outline" className="font-mono text-xs">
              counterparty view
            </Badge>
            {!cp.active && (
              <Badge
                variant="outline"
                className="border-red-500/40 text-red-500"
              >
                inactive
              </Badge>
            )}
          </div>
          <p className="text-body text-muted-foreground max-w-3xl">
            Observability for the signals Odum delivers to your webhook
            endpoint. Odum does not see your fills, positions, or P&amp;L —
            this dashboard is a delivery-audit surface. The full signal payload
            flows only through your HTTPS endpoint.
          </p>
        </header>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Counterparty profile</CardDescription>
            <CardTitle className="text-xl">{cp.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-3 text-sm md:grid-cols-4">
              <div>
                <dt className="text-xs text-muted-foreground">ID</dt>
                <dd
                  className="font-mono text-xs"
                  data-testid="counterparty-profile-id"
                >
                  {cp.id}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Schema depth</dt>
                <dd className="font-mono text-xs">{cp.schema_depth}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  Entitled slots
                </dt>
                <dd
                  className="font-mono text-xs"
                  data-testid="counterparty-profile-slot-count"
                >
                  {cp.allowed_slots.length}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  Rate limit (per strategy)
                </dt>
                <dd className="font-mono text-xs">
                  {cp.rate_limit_per_strategy_per_sec}/s
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <DeliveryHealthPanel health={MOCK_DELIVERY_HEALTH} />

        <SignalHistoryTable
          emissions={MOCK_SIGNAL_EMISSIONS}
          entitledSlots={cp.allowed_slots}
        />

        <BacktestComparisonPanel rows={MOCK_BACKTEST_COMPARISON} />

        <PnlAttributionPanel
          enabled={cp.pnl_reporting_enabled}
          rows={MOCK_PNL_ATTRIBUTION}
        />

        <section className="rounded-lg border border-dashed border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Not seeing recent data?</p>
          <p className="mt-1">
            Delivery state is refreshed on page load. If deliveries appear to
            be failing, verify that your webhook endpoint is reachable and that
            the HMAC signature validation in your consumer matches the
            shared-secret rotation window. Contact Odum operations to rotate a
            compromised secret.
          </p>
        </section>
      </div>
    </div>
  );
}
