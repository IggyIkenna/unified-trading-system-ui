"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { deriveClientTier, CLIENT_TIER_FEATURES, type ClientTier, type EntitlementOrWildcard } from "@/lib/config/auth";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Color map per tier
// ---------------------------------------------------------------------------

const TIER_COLORS: Record<ClientTier, string> = {
  "Client Full": "bg-emerald-500/10 text-emerald-400 border-emerald-400/30",
  "Client Premium": "bg-violet-500/10 text-violet-400 border-violet-400/30",
  "DeFi Client": "bg-blue-500/10 text-blue-400 border-blue-400/30",
  "Data Pro": "bg-amber-500/10 text-amber-400 border-amber-400/30",
  "Data Basic": "bg-muted text-muted-foreground",
  "Custom": "bg-muted text-muted-foreground",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ClientTierBadgeProps {
  /** If provided, derive tier from this entitlement list instead of current user */
  entitlements?: readonly string[];
  className?: string;
  showTooltip?: boolean;
}

/**
 * ClientTierBadge — shows the user's subscription tier (Client Full / Client Premium / etc.)
 * with a tooltip listing what the tier includes.
 *
 * Usage in settings page, debug footer, user admin pages.
 */
export function ClientTierBadge({ entitlements, className, showTooltip = true }: ClientTierBadgeProps) {
  const { user } = useAuth();

  const rawEnts = entitlements ?? user?.entitlements ?? [];
  const ents = rawEnts as readonly EntitlementOrWildcard[];
  const tier = deriveClientTier(ents);
  const features = CLIENT_TIER_FEATURES[tier];
  const colorClass = TIER_COLORS[tier];

  const badge = (
    <Badge
      variant="outline"
      className={cn("text-[10px] font-medium", colorClass, className)}
    >
      {tier}
    </Badge>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[240px]">
          <div className="space-y-1">
            <p className="font-medium text-xs">{tier} includes:</p>
            <ul className="text-[10px] text-muted-foreground space-y-0.5 list-disc list-inside">
              {features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
