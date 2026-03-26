"use client";

import * as React from "react";
import { PromoteListFiltersProvider } from "@/components/promote/promote-list-filters-context";
import { PromoteLifecycleFrame } from "@/components/promote/promote-lifecycle-frame";
import { PromoteLifecycleSubTabs } from "@/components/promote/promote-lifecycle-sub-tabs";
import { PromoteStrategyListPanel } from "@/components/promote/promote-strategy-list-panel";
import { cn } from "@/lib/utils";

const SPLIT_H =
  "min-h-[min(70vh,520px)] lg:h-[calc(100vh-9.25rem)] lg:max-h-[calc(100vh-9.25rem)]";

/**
 * ML Training–style split: `lg:grid-cols-3` with list in column 1 (~1/3) and
 * detail in `lg:col-span-2` (~2/3). Lifecycle sub-tabs sit in the detail column,
 * right-aligned, above scrollable content.
 */
export function PromoteSplitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PromoteListFiltersProvider>
      <div className="grid min-h-0 flex-1 grid-cols-1 content-start gap-5 lg:grid-cols-3 lg:items-stretch">
        <div className={cn("flex min-h-0 min-w-0 flex-col", SPLIT_H)}>
          <PromoteStrategyListPanel className="min-h-0 flex-1" />
        </div>
        <div
          className={cn("flex min-h-0 min-w-0 flex-col lg:col-span-2", SPLIT_H)}
        >
          <div className="sticky top-0 z-20 shrink-0">
            <PromoteLifecycleSubTabs />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="space-y-4 pb-2 pt-2">
              <PromoteLifecycleFrame>{children}</PromoteLifecycleFrame>
            </div>
          </div>
        </div>
      </div>
    </PromoteListFiltersProvider>
  );
}
