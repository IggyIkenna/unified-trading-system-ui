"use client";

import type { WidgetComponentProps } from "../widget-registry";
import { ScopeSummary } from "@/components/trading/scope-summary";
import { InterventionControls } from "@/components/trading/intervention-controls";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useGlobalScope } from "@/lib/stores/global-scope-store";
import { useOverviewDataSafe } from "./overview-data-context";
import type { TradingOrganization, TradingClient } from "@/lib/types/trading";

export function ScopeSummaryWidget(_props: WidgetComponentProps) {
  const ctx = useOverviewDataSafe();
  const { scope: context, setOrganizationIds, setClientIds, setStrategyIds } = useGlobalScope();
  if (!ctx)
    return (
      <div className="flex h-full items-center justify-center p-3 text-xs text-muted-foreground">
        Navigate to Overview tab
      </div>
    );
  const { organizations, clients, filteredSortedStrategies, totalNav, totalExposure } = ctx;

  const scopeOrgs = context.organizationIds
    .map((id) => organizations.find((o) => o.id === id))
    .filter((o): o is TradingOrganization => !!o);
  const scopeClients = context.clientIds
    .map((id) => clients.find((c) => c.id === id))
    .filter((c): c is TradingClient => !!c);

  const kpiStrategies = filteredSortedStrategies;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 h-full">
      <ScopeSummary
        organizations={scopeOrgs}
        clients={scopeClients}
        strategies={kpiStrategies.map((s: Record<string, unknown>) => ({
          id: String(s.id ?? ""),
          name: String(s.name ?? ""),
          status: String(s.status ?? ""),
        }))}
        selectedStrategyIds={context.strategyIds}
        totalStrategies={kpiStrategies.length}
        totalOrganizations={organizations.length}
        totalClients={clients.length}
        totalCapital={totalNav}
        totalExposure={totalExposure}
        mode={context.mode}
        asOfDatetime={context.asOfDatetime}
        onClearScope={() => {
          setOrganizationIds([]);
          setClientIds([]);
          setStrategyIds([]);
        }}
      />
      <div className="flex items-center gap-2">
        <InterventionControls
          scope={{
            strategyCount: kpiStrategies.length,
            totalExposure,
            scopeLabel:
              context.organizationIds.length > 0 || context.clientIds.length > 0 ? "Filtered" : "All Strategies",
          }}
        />
        <Link href="/services/trading/terminal">
          <Button variant="default" size="sm" className="h-8 gap-1.5">
            Open Trading Terminal
            <ArrowRight className="size-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
