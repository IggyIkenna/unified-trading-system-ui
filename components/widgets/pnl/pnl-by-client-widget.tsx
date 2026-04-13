"use client";

import { Button } from "@/components/ui/button";
import { EntityLink } from "@/components/trading/entity-link";
import { PnLChange, PnLValue } from "@/components/trading/pnl-value";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { usePnLData } from "./pnl-data-context";
import { useRouter } from "next/navigation";

export function PnlByClientWidget(_props: WidgetComponentProps) {
  const { clientPnL, netPnL } = usePnLData();
  const router = useRouter();

  const totalClientPnL = clientPnL.reduce((sum, c) => sum + c.pnl, 0);
  const topClient = clientPnL.reduce(
    (best, c) => (c.pnl > (best?.pnl ?? -Infinity) ? c : best),
    null as (typeof clientPnL)[0] | null,
  );

  return (
    <div className="flex flex-col h-full min-h-0 p-2 gap-2">
      {/* Summary header */}
      {clientPnL.length > 0 && (
        <div className="flex items-center justify-between shrink-0 px-1">
          <span className="text-[10px] text-muted-foreground">{clientPnL.length} clients</span>
          <div className="flex items-center gap-1">
            {topClient && (
              <span className="text-[10px] text-muted-foreground">
                Top: <span className="text-foreground font-medium">{topClient.name}</span>
              </span>
            )}
          </div>
        </div>
      )}

      <div className="space-y-1.5 flex-1 min-h-0 overflow-auto">
        {clientPnL.length > 0 ? (
          clientPnL.map((client) => (
            <div
              key={client.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => router.push(`/services/trading/clients/${client.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && router.push(`/services/trading/clients/${client.id}`)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  {client.change >= 0 ? (
                    <TrendingUp className="size-3.5 text-[var(--pnl-positive)]" />
                  ) : (
                    <TrendingDown className="size-3.5 text-[var(--pnl-negative)]" />
                  )}
                </div>
                <div className="min-w-0">
                  <EntityLink type="client" id={client.id} label={client.name} className="font-medium text-sm" />
                  <p className="text-xs text-muted-foreground truncate">
                    {client.strategies} {client.strategies === 1 ? "strategy" : "strategies"} · {client.org}
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

      {/* Footer: total + navigation */}
      {clientPnL.length > 0 && (
        <div className="shrink-0 border-t border-border/60 pt-2 space-y-1">
          <div className="flex items-center justify-between px-1 text-xs">
            <span className="text-muted-foreground">Shown total</span>
            <PnLValue value={totalClientPnL} size="sm" showSign />
          </div>
          <Button
            variant="ghost"
            className="w-full gap-2"
            size="sm"
            onClick={() => router.push("/services/trading/clients")}
          >
            View All Clients
            <ArrowRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
