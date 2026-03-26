"use client";

import * as React from "react";
import { PromoteListFiltersProvider } from "@/components/promote/promote-list-filters-context";
import { PromoteStrategyListPanel } from "@/components/promote/promote-strategy-list-panel";
import { PromoteLifecycleFrame } from "@/components/promote/promote-lifecycle-frame";

/**
 * ML Training–style split: `lg:grid-cols-3` with list in column 1 (~1/3) and
 * detail in `lg:col-span-2` (~2/3). Below `lg`, list stacks above detail like ML.
 */
export function PromoteSplitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PromoteListFiltersProvider>
      <div className="grid min-h-0 flex-1 grid-cols-1 content-start gap-5 lg:grid-cols-3 lg:items-start">
        <div className="min-h-0 min-w-0 space-y-3">
          <PromoteStrategyListPanel />
        </div>
        <div className="flex min-h-0 min-w-0 flex-col lg:col-span-2">
          <div className="flex-1 space-y-4">
            <PromoteLifecycleFrame>{children}</PromoteLifecycleFrame>
          </div>
        </div>
      </div>
    </PromoteListFiltersProvider>
  );
}
