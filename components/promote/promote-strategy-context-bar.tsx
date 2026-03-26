"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, ChevronDown, ChevronRight, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  const candidates = usePromoteLifecycleStore((s) => s.candidates);
  const setSelectedId = usePromoteLifecycleStore((s) => s.setSelectedId);
  const [switcherOpen, setSwitcherOpen] = React.useState(false);

  if (!selected) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-1 overflow-x-auto">
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
          <Link href={PROMOTE_PIPELINE_HREF}>Pipeline</Link>
        </Button>
        <ChevronRight className="size-3 text-muted-foreground" />

        <Popover open={switcherOpen} onOpenChange={setSwitcherOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-sm font-medium max-w-[280px]"
            >
              <span className="truncate">{selected.name}</span>
              <Badge
                variant="outline"
                className="text-xs font-mono shrink-0 ml-0.5"
              >
                v{selected.version}
              </Badge>
              <ChevronDown className="size-3 text-muted-foreground shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search strategies..." />
              <CommandList>
                <CommandEmpty>No strategies found.</CommandEmpty>
                <CommandGroup>
                  {candidates.map((c) => (
                    <CommandItem
                      key={c.id}
                      value={`${c.name} ${c.version} ${c.assetClass}`}
                      onSelect={() => {
                        setSelectedId(c.id);
                        setSwitcherOpen(false);
                      }}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {selected.id === c.id && (
                          <Check className="size-3 text-primary shrink-0" />
                        )}
                        <span className="truncate text-sm">{c.name}</span>
                        <span className="text-xs font-mono text-muted-foreground shrink-0">
                          v{c.version}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant="outline" className="text-xs">
                          {c.assetClass}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            c.stages[c.currentStage].status === "passed" &&
                              "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
                            c.stages[c.currentStage].status === "pending" &&
                              "bg-amber-500/15 text-amber-400 border-amber-500/30",
                            c.stages[c.currentStage].status === "failed" &&
                              "bg-rose-500/15 text-rose-400 border-rose-500/30",
                          )}
                        >
                          {STAGE_META[c.currentStage].label}
                        </Badge>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex-1 min-w-[200px]" />
      <div className="flex items-center gap-1 shrink-0 pb-1 sm:pb-0">
        {STAGE_ORDER.map((stage, idx) => {
          const s = selected.stages[stage];
          const locked = isPromoteStageLocked(selected, stage);
          const href = promoteHrefForStage(stage);
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const commonClass = cn(
            "size-6 rounded-full flex items-center justify-center transition-all",
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
                    "w-4 h-0.5 shrink-0",
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
