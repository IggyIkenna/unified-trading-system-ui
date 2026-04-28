"use client";

import { ASSET_GROUP_LABELS, ASSET_GROUP_ROUTE_TAB, type WidgetAssetGroup } from "@/lib/types/asset-group";
import { useGlobalScope } from "@/lib/stores/global-scope-store";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";
import * as React from "react";

const PILL_GROUPS: readonly WidgetAssetGroup[] = ["CEFI", "DEFI", "TRADFI", "SPORTS", "PREDICTION"];

const PILL_TONE: Record<WidgetAssetGroup, string> = {
  CEFI: "border-blue-500/40 bg-blue-500/15 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.15)]",
  DEFI: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)]",
  TRADFI: "border-violet-500/40 bg-violet-500/15 text-violet-300 shadow-[0_0_10px_rgba(139,92,246,0.15)]",
  SPORTS: "border-orange-500/40 bg-orange-500/15 text-orange-300 shadow-[0_0_10px_rgba(249,115,22,0.15)]",
  PREDICTION: "border-pink-500/40 bg-pink-500/15 text-pink-300 shadow-[0_0_10px_rgba(236,72,153,0.15)]",
  PLATFORM: "",
};

/**
 * Asset-group switcher pill for the DART trading shell.
 *
 * Reads/writes `assetGroupIds` on the global scope store; clicking a pill
 * routes to the corresponding `/services/trading/<tab>` surface AND updates
 * the global filter so widget grids on every page respect the active set.
 *
 * The pill is the "no orphans, all in DART" entry point per the DART
 * cross-asset-group market-data terminal plan — every borrowed market-data
 * view (CoinMarketCap / Coinglass / Deribit / DefiLlama / Polymarket style)
 * is reachable through this pill.
 */
export function AssetGroupPill({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname() || "";
  const assetGroupIds = useGlobalScope((s) => s.scope.assetGroupIds);
  const setAssetGroupIds = useGlobalScope((s) => s.setAssetGroupIds);

  const handleClick = React.useCallback(
    (group: WidgetAssetGroup) => {
      setAssetGroupIds([group]);
      const tab = ASSET_GROUP_ROUTE_TAB[group];
      if (tab && !pathname.includes(`/services/trading/${tab}`)) {
        router.push(`/services/trading/${tab}`);
      }
    },
    [pathname, router, setAssetGroupIds],
  );

  return (
    <div
      className={cn("flex items-center rounded-full border border-border/60 bg-muted/30 p-0.5", className)}
      role="tablist"
      aria-label="Asset group"
    >
      {PILL_GROUPS.map((group) => {
        const isActive = assetGroupIds.includes(group);
        return (
          <button
            key={group}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => handleClick(group)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-medium transition-all",
              isActive ? cn("border", PILL_TONE[group]) : "text-muted-foreground/70 hover:text-muted-foreground",
            )}
          >
            {ASSET_GROUP_LABELS[group]}
          </button>
        );
      })}
    </div>
  );
}
