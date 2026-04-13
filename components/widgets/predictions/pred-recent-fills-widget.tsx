"use client";

import { LiveFeedWidget, useLiveFeed } from "@/components/shared/live-feed-widget";
import { fmtRelativeTime } from "@/components/trading/predictions/helpers";
import { VenueChip } from "@/components/trading/predictions/shared";
import { Badge } from "@/components/ui/badge";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils/formatters";
import { usePredictionsData } from "./predictions-data-context";

export function PredRecentFillsWidget(_props: WidgetComponentProps) {
  const { recentFills } = usePredictionsData();
  const fills = useLiveFeed(recentFills, 500);

  return (
    <LiveFeedWidget isEmpty={fills.length === 0} emptyMessage="No recent fills yet">
      <div className="divide-y divide-border/30">
        {fills.map((fill) => (
          <div key={fill.id} className="flex items-center justify-between px-2 py-2 text-xs">
            <div className="min-w-0">
              <p className="font-medium truncate leading-snug">{fill.marketQuestion}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <VenueChip venue={fill.venue} />
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[9px] font-bold",
                    fill.side === "yes" ? "border-emerald-500/40 text-emerald-400" : "border-red-500/40 text-red-400",
                  )}
                >
                  {fill.side.toUpperCase()}
                </Badge>
              </div>
            </div>
            <div className="text-right shrink-0 ml-2">
              <p className="tabular-nums font-semibold">${formatNumber(fill.total, 0)}</p>
              <p className="text-[10px] text-muted-foreground tabular-nums">
                {fill.pricePerShare}¢ · {fill.shares.toLocaleString()} sh
              </p>
              <p className="text-[10px] text-muted-foreground">{fmtRelativeTime(fill.filledAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </LiveFeedWidget>
  );
}
