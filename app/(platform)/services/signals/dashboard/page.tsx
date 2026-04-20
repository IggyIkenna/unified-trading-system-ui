"use client";

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
  MOCK_COUNTERPARTY,
  useBacktestPaperLive,
  useDeliveryHealth,
  usePnlAttribution,
  useSignalEmissions,
} from "@/lib/signal-broadcast";

/**
 * Counterparty observability dashboard.
 *
 * Tenant-scoped view for institutional quant shops (QRT-style) integrated
 * primarily via webhook. Observability only — NO catalogue / execution /
 * research / reporting surface.
 *
 * Data source: `useSignalEmissions` / `useBacktestPaperLive` /
 * `useDeliveryHealth` / `usePnlAttribution` hooks, which transparently
 * serve mock fixtures in demo/tier-0 (`NEXT_PUBLIC_MOCK_API=true`) and
 * live strategy-service REST-pull responses in staging/prod.
 *
 * Plan SSOT: signal_leasing_broadcast_architecture 2026-04-20 § Phase 5 + 9.
 */
export default function CounterpartyDashboardPage() {
  const cp = MOCK_COUNTERPARTY;
  const emissions = useSignalEmissions(cp.id);
  const backtest = useBacktestPaperLive(cp.id);
  const health = useDeliveryHealth(cp.id);
  const pnl = usePnlAttribution(cp.id);

  const anyMock =
    emissions.isMock || backtest.isMock || health.isMock || pnl.isMock;

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
            {anyMock && (
              <Badge
                variant="outline"
                className="border-amber-500/40 font-mono text-xs text-amber-600"
                data-testid="signal-dashboard-mock-badge"
              >
                demo / mock data
              </Badge>
            )}
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
            this dashboard is a delivery-audit surface plus a backtest-paper-live
            parity view. The full signal payload flows only through your HTTPS
            endpoint.
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

        {health.data !== null && <DeliveryHealthPanel health={health.data} />}
        {health.error !== null && (
          <FetchErrorBanner label="delivery health" detail={health.error} />
        )}

        {emissions.data !== null && (
          <SignalHistoryTable
            emissions={emissions.data}
            entitledSlots={cp.allowed_slots}
          />
        )}
        {emissions.error !== null && (
          <FetchErrorBanner label="signal history" detail={emissions.error} />
        )}

        {backtest.data !== null && (
          <BacktestComparisonPanel rows={backtest.data} />
        )}
        {backtest.error !== null && (
          <FetchErrorBanner
            label="backtest vs paper vs live"
            detail={backtest.error}
          />
        )}

        <PnlAttributionPanel
          enabled={cp.pnl_reporting_enabled}
          rows={pnl.data ?? []}
        />
        {pnl.error !== null && cp.pnl_reporting_enabled && (
          <FetchErrorBanner label="P&L attribution" detail={pnl.error} />
        )}

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

function FetchErrorBanner({
  label,
  detail,
}: {
  readonly label: string;
  readonly detail: string;
}) {
  return (
    <div
      className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm"
      data-testid={`signal-dashboard-fetch-error-${label.replace(/\s+/g, "-").toLowerCase()}`}
    >
      <span className="font-medium text-red-600">Fetch failed:</span>{" "}
      <span className="text-muted-foreground">{label}</span>{" "}
      <span className="font-mono text-xs">({detail})</span>
    </div>
  );
}
