"use client";

import { useAuth } from "@/hooks/use-auth";
import { checkTradingEntitlement, type TradingEntitlement } from "@/lib/config/auth";
import { useGlobalScope } from "@/lib/stores/global-scope-store";
import { ASSET_GROUP_LABELS, ASSET_GROUP_ROUTE_TAB, type WidgetAssetGroup } from "@/lib/types/asset-group";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
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
 * Per-asset-group entitlement requirement. CeFi + TradFi share the
 * `trading-common` domain (per existing entitlement model in
 * components/platform/global-scope-filters.tsx); DeFi / Sports / Prediction
 * have dedicated domains.
 */
const PILL_ENTITLEMENT: Record<WidgetAssetGroup, TradingEntitlement | null> = {
  CEFI: { domain: "trading-common", tier: "basic" },
  TRADFI: { domain: "trading-common", tier: "basic" },
  DEFI: { domain: "trading-defi", tier: "basic" },
  SPORTS: { domain: "trading-sports", tier: "basic" },
  PREDICTION: { domain: "trading-predictions", tier: "basic" },
  PLATFORM: null,
};

/**
 * Asset-group switcher pill for the DART trading shell.
 *
 * Reads/writes `assetGroupIds` on the global scope store; clicking a pill
 * routes to the corresponding `/services/trading/<tab>` surface AND updates
 * the global filter so widget grids on every page respect the active set.
 *
 * Persona-aware: pills the user lacks entitlements for render in a locked
 * (FOMO) state — visible but greyed out, with a lock icon — matching the
 * existing ServiceTabs locking pattern. Internal users (wildcard `*`) and
 * users with the relevant `trading-*` domain see the pill as enabled.
 *
 * The pill is the "no orphans, all in DART" entry point per the DART
 * cross-asset-group market-data terminal plan — every borrowed market-data
 * view (CoinMarketCap / Coinglass / Deribit / DefiLlama / Polymarket style)
 * is reachable through this pill for the personas entitled to that asset
 * group.
 */
export function AssetGroupPill({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname() || "";
  const { user } = useAuth();
  const assetGroupIds = useGlobalScope((s) => s.scope.assetGroupIds);
  const setAssetGroupIds = useGlobalScope((s) => s.setAssetGroupIds);

  const userEnts = React.useMemo(() => user?.entitlements ?? [], [user?.entitlements]);
  const hasWildcard = (userEnts as readonly unknown[]).includes("*");

  const isUnlocked = React.useCallback(
    (group: WidgetAssetGroup): boolean => {
      if (hasWildcard) return true;
      const required = PILL_ENTITLEMENT[group];
      if (!required) return true;
      return checkTradingEntitlement(userEnts, required);
    },
    [userEnts, hasWildcard],
  );

  const handleClick = React.useCallback(
    (group: WidgetAssetGroup) => {
      if (!isUnlocked(group)) return;
      setAssetGroupIds([group]);
      const tab = ASSET_GROUP_ROUTE_TAB[group];
      if (tab && !pathname.includes(`/services/trading/${tab}`)) {
        router.push(`/services/trading/${tab}`);
      }
    },
    [pathname, router, setAssetGroupIds, isUnlocked],
  );

  return (
    <div
      className={cn("flex items-center rounded-full border border-border/60 bg-muted/30 p-0.5", className)}
      role="tablist"
      aria-label="Asset group"
    >
      {PILL_GROUPS.map((group) => {
        const isActive = assetGroupIds.includes(group);
        const unlocked = isUnlocked(group);
        const requiredDomain = PILL_ENTITLEMENT[group]?.domain ?? "";
        return (
          <button
            key={group}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-disabled={!unlocked}
            onClick={() => handleClick(group)}
            title={unlocked ? ASSET_GROUP_LABELS[group] : `${ASSET_GROUP_LABELS[group]} — requires ${requiredDomain}`}
            className={cn(
              "flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all",
              !unlocked && "cursor-not-allowed text-muted-foreground/40 hover:text-muted-foreground/40",
              unlocked && isActive && cn("border", PILL_TONE[group]),
              unlocked && !isActive && "text-muted-foreground/70 hover:text-muted-foreground",
            )}
          >
            {!unlocked && <Lock className="size-2.5" aria-hidden />}
            {ASSET_GROUP_LABELS[group]}
          </button>
        );
      })}
    </div>
  );
}
