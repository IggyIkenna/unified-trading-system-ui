"use client";

import { KpiSummaryWidget, type KpiMetric } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useTierZeroScenario } from "@/lib/cockpit/use-tier-zero-scenario";
import { formatCurrency } from "@/lib/reference-data";
import { useAccountsData } from "./accounts-data-context";

export function AccountsKpiWidget(_props: WidgetComponentProps) {
  const legacy = useAccountsData();
  // 2026-05-01 migration — Tier Zero Interaction Exhaustiveness pass:
  // Inside the cockpit shell, NAV/Free/Locked totals reshape with every
  // scope chip toggle (asset_group / family / archetype / share_class /
  // venue). Outside the cockpit (legacy `/services/trading/*` routes),
  // the legacy `useAccountsData` provider is still authoritative — this
  // is a phased migration, not a hard cutover.
  const tierZero = useTierZeroScenario();
  const useTierZero = tierZero.status === "match" && tierZero.strategies.length > 0;

  const totalNAV = useTierZero ? tierZero.strategies.reduce((sum, s) => sum + s.nav, 0) : legacy.totalNAV;
  // Locked = sum of open-position notionals across the scope.
  // Free = NAV - locked (clamped at 0).
  const totalLocked = useTierZero ? tierZero.positions.reduce((sum, p) => sum + p.notional, 0) : legacy.totalLocked;
  const totalFree = useTierZero ? Math.max(0, totalNAV - totalLocked) : legacy.totalFree;

  if (legacy.isLoading) {
    return (
      <div className="flex h-full items-center gap-2 p-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 flex-1 rounded-md" />
        ))}
      </div>
    );
  }

  if (legacy.error && !useTierZero) {
    return (
      <p className="text-xs text-destructive text-center py-4">
        Failed to load account balances: {legacy.error.message}
      </p>
    );
  }

  // Tier-zero match overrides the legacy "no balances" empty state — if the
  // user has chips set that produce no scope match, the cockpit's
  // `<ScopeStatusBanner />` already surfaces the unsupported / empty story.
  if (!useTierZero && legacy.balances.length === 0) {
    return <p className="text-xs text-muted-foreground text-center py-4">No balance data for connected venues.</p>;
  }

  const metrics: KpiMetric[] = [
    {
      label: "Total NAV",
      value: `$${formatCurrency(totalNAV)}`,
      sentiment: "neutral",
    },
    {
      label: "Available (Free)",
      value: `$${formatCurrency(totalFree)}`,
      sentiment: "positive",
    },
    {
      label: "Locked (In Use)",
      value: `$${formatCurrency(totalLocked)}`,
      sentiment: "neutral",
    },
  ];

  return (
    <div data-testid="accounts-kpi-widget" data-source={useTierZero ? "tier-zero" : "legacy"} className="h-full">
      <KpiSummaryWidget metrics={metrics} storageKey="uts-accounts-kpi-layout" />
    </div>
  );
}
