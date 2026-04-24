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
 * /services/admin/strategy-lifecycle-editor — scaffolded Plan B Phase 2.
 */

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  StrategyCatalogueSurface,
  type StrategyCatalogueViewMode,
} from "@/components/strategy-catalogue/StrategyCatalogueSurface";
import {
  EMPTY_CATALOGUE_FILTER,
  parseCatalogueFilter,
  type StrategyCatalogueFilter,
} from "@/lib/architecture-v2/catalogue-filter";
import { loadStrategyCatalogue } from "@/lib/architecture-v2/lifecycle";
import { useAuth } from "@/hooks/use-auth";

type CatalogueTab = "reality" | "explore";

/**
 * Placeholder subscription mapping. Admin sees every instance as "subscribed"
 * so Reality tab demonstrates the layout; non-admin sees a deterministic
 * stable-maturity subset (first 4) so both tabs render content until the
 * real client-subscriptions service wires in.
 */
function subscribedInstanceIdsFor(role: string | undefined): readonly string[] {
  const catalogue = loadStrategyCatalogue();
  if (role === "admin") {
    return catalogue.map((i) => i.instanceId);
  }
  return catalogue.slice(0, 4).map((i) => i.instanceId);
}

export default function StrategyCataloguePage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const fromParam = searchParams?.get("from") ?? null;
  const tabParam = searchParams?.get("tab") ?? null;

  const subscribedInstanceIds = useMemo(
    () => subscribedInstanceIdsFor(user?.role),
    [user?.role],
  );

  const hasSubscriptions = subscribedInstanceIds.length > 0;

  // Initialise tab from URL ?tab= param, falling back to subscription-aware default.
  const [tab, setTab] = useState<CatalogueTab>(() => {
    if (tabParam === "explore") return "explore";
    if (tabParam === "reality") return "reality";
    return hasSubscriptions ? "reality" : "explore";
  });

  // Hydrate filter from URL params when arriving from questionnaire redirect.
  const [filter, setFilter] = useState<StrategyCatalogueFilter>(() => {
    if (!searchParams) return EMPTY_CATALOGUE_FILTER;
    const parsed = parseCatalogueFilter(new URLSearchParams(searchParams.toString()));
    // Only use parsed filter if it has at least one axis set.
    const hasFilter = Object.keys(parsed).some((k) => parsed[k as keyof StrategyCatalogueFilter] !== undefined);
    return hasFilter ? parsed : EMPTY_CATALOGUE_FILTER;
  });

  const fromQuestionnaire = fromParam === "questionnaire";

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

        {fromQuestionnaire && (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <span>
              Showing strategies that match your questionnaire profile.{" "}
              <Link href="/services/strategy-catalogue" className="underline underline-offset-2 hover:text-emerald-900">
                View all
              </Link>
            </span>
            <Link href="/questionnaire" className="text-xs text-emerald-700 hover:text-emerald-900 underline underline-offset-2 shrink-0">
              Edit preferences
            </Link>
          </div>
        )}

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
              subscribedInstanceIds={subscribedInstanceIds}
            />
          </TabsContent>
          <TabsContent value="explore" className="pt-4">
            <StrategyCatalogueSurface
              viewMode={viewModeFor("explore")}
              filter={filter}
              onFilterChange={setFilter}
              subscribedInstanceIds={subscribedInstanceIds}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
