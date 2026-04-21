"use client";

/**
 * Strategy Catalogue — Tier-3 client view.
 *
 * Per plans/active/strategy_catalogue_3tier_surface_2026_04_21.plan.md Phase 3.
 * Two-tab surface: "Your Subscriptions" (Reality) + "Explore" (FOMO).
 *
 * Route /services/strategy-catalogue remains mounted (was a DART sub-route
 * chip, now the Tier-3 client view — orphan-audit compliant). Inner sub-routes
 * (/coverage, /coverage/blocked, /coverage/by-combination, /admin/lock-state,
 * /strategies/[archetype]/[slot]) still exist and are reachable via the
 * existing ServiceTabs in layout.tsx.
 *
 * Admin tiers (Tier 1 / Tier 2) land at /services/admin/strategy-universe +
 * /services/admin/strategy-lifecycle-editor once Plan A Phase 3 PATCH ships.
 * Scaffolded separately in a future commit.
 */

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  StrategyCatalogueSurface,
  type StrategyCatalogueViewMode,
} from "@/components/strategy-catalogue/StrategyCatalogueSurface";
import {
  EMPTY_CATALOGUE_FILTER,
  type StrategyCatalogueFilter,
} from "@/lib/architecture-v2/catalogue-filter";
import { STRATEGY_INSTANCES } from "@/lib/mocks/fixtures/strategy-instances";
import { useAuth } from "@/hooks/use-auth";

type CatalogueTab = "reality" | "explore";

// Placeholder mapping from the logged-in user / persona to a set of clientIds
// this org is subscribed to. Until Plan A Phase 2 propagates the real
// org-subscription state, we mock it by mapping admin → everything and
// non-admin → a deterministic subset so both tabs render something.
function subscribedClientIdsFor(role: string | undefined): readonly string[] {
  if (role === "admin") {
    return Array.from(new Set(STRATEGY_INSTANCES.map((i) => i.clientId)));
  }
  return ["quant-fund"];
}

export default function StrategyCataloguePage() {
  const { user } = useAuth();
  const subscribedClientIds = useMemo(
    () => subscribedClientIdsFor(user?.role),
    [user?.role],
  );

  const hasSubscriptions = useMemo(() => {
    const subs = new Set(subscribedClientIds);
    return STRATEGY_INSTANCES.some((i) => subs.has(i.clientId));
  }, [subscribedClientIds]);

  const [tab, setTab] = useState<CatalogueTab>(
    hasSubscriptions ? "reality" : "explore",
  );
  const [filter, setFilter] = useState<StrategyCatalogueFilter>(
    EMPTY_CATALOGUE_FILTER,
  );

  const viewModeFor = (t: CatalogueTab): StrategyCatalogueViewMode =>
    t === "reality" ? "client-reality" : "client-fomo";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="platform-page-width space-y-6 p-6">
        <header className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-page-title font-semibold tracking-tight">
              Strategy Catalogue
            </h1>
            <Badge variant="outline" className="font-mono text-xs">
              Tier 3 · client view
            </Badge>
          </div>
          <p className="text-body text-muted-foreground max-w-3xl">
            Your active subscriptions sit in{" "}
            <span className="font-semibold">Your Subscriptions</span>. Explore
            shows strategies we can enable for you, rendered with the Odum
            backtest / paper / live performance overlay so you can see alpha
            decay and slippage realism before allocating.
          </p>
        </header>

        <Tabs
          value={tab}
          onValueChange={(next) => setTab(next as CatalogueTab)}
          data-testid="strategy-catalogue-tabs"
        >
          <TabsList>
            <TabsTrigger value="reality" data-testid="tab-reality">
              Your Subscriptions
            </TabsTrigger>
            <TabsTrigger value="explore" data-testid="tab-explore">
              Explore
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reality" className="pt-4">
            <StrategyCatalogueSurface
              viewMode={viewModeFor("reality")}
              filter={filter}
              onFilterChange={setFilter}
              subscribedClientIds={subscribedClientIds}
            />
          </TabsContent>
          <TabsContent value="explore" className="pt-4">
            <StrategyCatalogueSurface
              viewMode={viewModeFor("explore")}
              filter={filter}
              onFilterChange={setFilter}
              subscribedClientIds={subscribedClientIds}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
