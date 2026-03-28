"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Shared 2-panel layout for research pages (Strategy + Execution backtests).
 *
 * Left: scrollable list panel (340px when detail open, else fluid)
 * Right: detail or compare panel (appears when selection active)
 */
export function ResearchListDetailLayout({
  listPanel,
  detailPanel,
  hasDetail,
  className,
}: {
  listPanel: React.ReactNode;
  detailPanel?: React.ReactNode;
  hasDetail: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex-1 flex min-h-0 px-6 pb-6 gap-4", className)}>
      {/* Left: List */}
      <div
        className={cn(
          "flex flex-col gap-2 overflow-y-auto pr-1",
          hasDetail ? "w-[340px] shrink-0" : "flex-1",
        )}
      >
        {listPanel}
      </div>

      {/* Right: Detail / Compare */}
      {hasDetail && detailPanel && (
        <div className="flex-1 border rounded-lg overflow-hidden bg-card min-w-0">
          {detailPanel}
        </div>
      )}
    </div>
  );
}
