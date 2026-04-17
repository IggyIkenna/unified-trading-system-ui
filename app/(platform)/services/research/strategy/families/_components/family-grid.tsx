"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Activity,
  Brain,
  Calendar,
  Coins,
  GitCompare,
  LineChart,
  ListChecks,
  Shuffle,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { FAMILY_METADATA, STRATEGY_FAMILIES_V2 } from "@/lib/architecture-v2";
import { groupCatalogByFamily } from "./aggregation";

const ICON_MAP: Record<string, LucideIcon> = {
  Brain,
  ListChecks,
  Coins,
  GitCompare,
  LineChart,
  Calendar,
  Activity,
  Shuffle,
};

export function FamilyGridClient() {
  const aggregates = groupCatalogByFamily();
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {STRATEGY_FAMILIES_V2.map((family) => {
        const meta = FAMILY_METADATA[family];
        const agg = aggregates.find((a) => a.family === family);
        const Icon = ICON_MAP[meta.iconName] ?? Activity;
        return (
          <Link
            key={family}
            href={`/services/research/strategy/families/${meta.slug}`}
            data-testid={`family-card-${meta.slug}`}
          >
            <Card className="group h-full cursor-pointer border-border/50 transition-all duration-200 hover:border-border hover:shadow-lg">
              <CardContent className="flex h-full flex-col gap-3 pt-5">
                <div className="flex items-start justify-between gap-2">
                  <div
                    className={cn(
                      "flex size-9 items-center justify-center rounded-lg border",
                      meta.accentClass,
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {agg?.total ?? 0} instances
                  </Badge>
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold leading-tight text-foreground group-hover:text-primary transition-colors">
                    {meta.label}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {meta.shortDescription}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-border/50 pt-3 text-xs">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Archetypes
                    </p>
                    <p className="font-mono text-sm font-semibold">{meta.archetypes.length}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Live / Paper
                    </p>
                    <p className="font-mono text-sm font-semibold">
                      {agg?.live ?? 0} / {agg?.paper ?? 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Avg Sharpe
                    </p>
                    <p className="font-mono text-sm font-semibold">
                      {(agg?.avgSharpe ?? 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      APY mid
                    </p>
                    <p className="font-mono text-sm font-semibold">
                      {(agg?.avgTargetApy ?? 0).toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {(agg?.categories ?? []).map((c) => (
                    <Badge key={c} variant="outline" className="text-[10px] px-1.5 py-0">
                      {c}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
