"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, ChevronRight, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  PROMOTE_PIPELINE_HREF,
  promoteHrefForStage,
} from "@/lib/config/services/promote.config";
import {
  selectPromoteSelectedStrategy,
  usePromoteLifecycleStore,
} from "@/lib/stores/promote-lifecycle-store";
import { isPromoteStageLocked } from "@/components/promote/promote-stage-access";
import { STAGE_META } from "@/components/promote/stage-meta";
import type { PromotionStage } from "@/components/promote/types";
import { STAGE_ORDER } from "@/components/promote/types";

export function PromoteStrategyContextBar() {
  const pathname = usePathname() || "";
  const selected = usePromoteLifecycleStore(selectPromoteSelectedStrategy);

  if (!selected) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-1 overflow-x-auto border-b border-border/60 pb-3 mb-1">
      <div className="flex items-center gap-2 shrink-0 min-w-0">
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
          <Link href={PROMOTE_PIPELINE_HREF}>Pipeline</Link>
        </Button>
        <ChevronRight className="size-3 text-muted-foreground shrink-0" />
        <span className="text-sm font-semibold truncate">{selected.name}</span>
        <Badge variant="outline" className="text-xs font-mono shrink-0">
          v{selected.version}
        </Badge>
      </div>
      <div className="flex-1 min-w-[120px]" />
      <div className="flex items-center gap-1 shrink-0 pb-1 sm:pb-0">
        {STAGE_ORDER.map((stage, idx) => {
          const s = selected.stages[stage];
          const locked = isPromoteStageLocked(selected, stage);
          const href = promoteHrefForStage(stage);
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const commonClass = cn(
            "size-5 shrink-0 rounded-full flex items-center justify-center transition-all text-[10px]",
            s.status === "passed" && "bg-emerald-500 text-white",
            s.status === "pending" && "bg-amber-500 text-white",
            s.status === "not_started" && "bg-muted text-muted-foreground",
            s.status === "failed" && "bg-rose-500 text-white",
            s.status === "warning" && "bg-orange-500 text-white",
            active &&
              "ring-2 ring-primary ring-offset-2 ring-offset-background",
            locked && "opacity-40 pointer-events-none",
          );
          const title = locked
            ? `${STAGE_META[stage].label} (locked)`
            : STAGE_META[stage].label;
          const inner = locked ? (
            <Lock className="size-2.5" />
          ) : s.status === "passed" ? (
            <Check className="size-3" />
          ) : s.status === "not_started" ? (
            <Lock className="size-2.5" />
          ) : (
            <span className="text-xs font-bold">{idx + 1}</span>
          );

          return (
            <React.Fragment key={stage}>
              {locked ? (
                <span className={commonClass} title={title}>
                  {inner}
                </span>
              ) : (
                <Link href={href} className={commonClass} title={title}>
                  {inner}
                </Link>
              )}
              {idx < STAGE_ORDER.length - 1 && (
                <div
                  className={cn(
                    "w-2.5 h-0.5 shrink-0 sm:w-3",
                    s.status === "passed" ? "bg-emerald-500" : "bg-border",
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
