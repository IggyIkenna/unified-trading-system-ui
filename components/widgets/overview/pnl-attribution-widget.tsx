"use client";

import { PnLAttributionPanel } from "@/components/trading/pnl-attribution-panel";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/shared/spinner";
import type { WidgetComponentProps } from "../widget-registry";

import Link from "next/link";
import { useOverviewDataSafe } from "./overview-data-context";

export function PnLAttributionWidget(_props: WidgetComponentProps) {
  const ctx = useOverviewDataSafe();
  if (!ctx)
    return (
      <div className="flex h-full items-center justify-center p-3 text-xs text-muted-foreground">
        Navigate to Overview tab
      </div>
    );
  const { pnlComponents, totalPnl, coreLoading } = ctx;
  return (
    <div className="p-3">
      <div className="flex justify-end mb-2">
        <Link href="/services/workspace?surface=terminal&tm=explain">
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            View All
          </Button>
        </Link>
      </div>
      {coreLoading ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Spinner className="size-4 mr-2" />
        </div>
      ) : pnlComponents.length === 0 ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground text-xs">
          No P&amp;L attribution data
        </div>
      ) : (
        <PnLAttributionPanel components={pnlComponents} totalPnl={totalPnl} />
      )}
    </div>
  );
}
