"use client";

import { Button } from "@/components/ui/button";
import { EntityLink } from "@/components/trading/entity-link";
import { PnLChange, PnLValue } from "@/components/trading/pnl-value";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { ArrowRight } from "lucide-react";
import { usePnLData } from "./pnl-data-context";

export function PnlByClientWidget(_props: WidgetComponentProps) {
  const { clientPnL } = usePnLData();

  return (
    <div className="flex flex-col h-full min-h-0 p-2 gap-2">
      <div className="space-y-2 flex-1 min-h-0 overflow-auto">
        {clientPnL.length > 0 ? (
          clientPnL.map((client) => (
            <div
              key={client.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="min-w-0">
                  <EntityLink type="client" id={client.id} label={client.name} className="font-medium text-sm" />
                  <p className="text-xs text-muted-foreground truncate">
                    {client.strategies} strategies • {client.org}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <PnLValue value={client.pnl} size="sm" showSign />
                <PnLChange value={client.change} size="sm" className="justify-end" />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-sm text-muted-foreground">No clients match current filters</div>
        )}
      </div>
      <Button variant="ghost" className="w-full gap-2 shrink-0" size="sm">
        View All Clients
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}
