"use client";

import * as React from "react";
import { PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PromoteListFiltersProvider } from "@/components/promote/promote-list-filters-context";
import { PromoteStrategyListPanel } from "@/components/promote/promote-strategy-list-panel";
import { PromoteLifecycleFrame } from "@/components/promote/promote-lifecycle-frame";
import {
  selectPromoteSelectedStrategy,
  usePromoteLifecycleStore,
} from "@/lib/stores/promote-lifecycle-store";
import { cn } from "@/lib/utils";

export function PromoteSplitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileListOpen, setMobileListOpen] = React.useState(false);
  const selected = usePromoteLifecycleStore(selectPromoteSelectedStrategy);

  return (
    <PromoteListFiltersProvider>
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="flex lg:hidden items-center gap-2 border-b border-border bg-card/30 px-3 py-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 shrink-0"
            onClick={() => setMobileListOpen(true)}
          >
            <PanelLeft className="size-4" />
            Strategies
          </Button>
          {selected ? (
            <span className="text-xs text-muted-foreground truncate min-w-0">
              {selected.name}{" "}
              <span className="font-mono">v{selected.version}</span>
            </span>
          ) : null}
        </div>

        <Sheet open={mobileListOpen} onOpenChange={setMobileListOpen}>
          <SheetContent
            side="left"
            className={cn(
              "w-[min(100vw,380px)] p-0 flex flex-col gap-0",
              "sm:max-w-[380px]",
            )}
          >
            <SheetHeader className="px-4 py-3 border-b border-border text-left space-y-0">
              <SheetTitle className="text-base">Strategies</SheetTitle>
            </SheetHeader>
            <div className="flex-1 min-h-0 overflow-hidden">
              <PromoteStrategyListPanel
                onStrategySelect={() => setMobileListOpen(false)}
                className="h-full"
              />
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[minmax(280px,380px)_1fr] xl:grid-cols-[minmax(300px,380px)_1fr] gap-0 overflow-hidden">
          <aside className="hidden lg:flex flex-col min-h-0 min-w-0 border-r border-border bg-card/20">
            <PromoteStrategyListPanel className="h-full" />
          </aside>
          <div className="flex flex-col min-h-0 min-w-0 overflow-y-auto border-l border-border lg:border-l-0">
            <div className="flex-1 p-4 space-y-4">
              <PromoteLifecycleFrame>{children}</PromoteLifecycleFrame>
            </div>
          </div>
        </div>
      </div>
    </PromoteListFiltersProvider>
  );
}
