"use client";

/**
 * /services/data/instruments — Instrument catalogue and discovery.
 * Shows instruments grouped by category → venue, with counts and new instrument alerts.
 * Corporate actions have moved to the Events tab.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { useScopedCategories } from "@/hooks/use-scoped-categories";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronRight,
  ChevronDown,
  Bell,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import {
  DATA_CATEGORY_LABELS,
  VENUES_BY_CATEGORY,
  FOLDERS_BY_CATEGORY,
  type DataCategory,
} from "@/lib/data-service-types";
import {
  MOCK_INSTRUMENT_COUNTS,
  MOCK_ALERTS,
} from "@/lib/data-service-mock-data";
import { CATEGORY_COLORS } from "@/components/data/shard-catalogue";

// Sparkline component (simple inline bars representing growth)
function GrowthSparkline({ value }: { value: number }) {
  // Simulate last 8 weeks of growth using the value as seed
  const bars = React.useMemo(() => {
    const base = Math.max(1, value);
    return Array.from({ length: 8 }, (_, i) => {
      const variation = 0.85 + ((base * (i + 1)) % 31) / 100;
      return Math.max(0.3, Math.min(1, variation));
    });
  }, [value]);

  return (
    <div className="flex items-end gap-0.5 h-6">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-1 rounded-sm bg-primary/40"
          style={{ height: `${Math.round(h * 24)}px` }}
        />
      ))}
      <div className="w-1 rounded-sm bg-primary" style={{ height: "24px" }} />
    </div>
  );
}

function VenueInstrumentRow({
  venue,
  category,
}: {
  venue: string;
  category: DataCategory;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const counts = MOCK_INSTRUMENT_COUNTS[venue];
  const folders = FOLDERS_BY_CATEGORY[category];

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-2.5 hover:bg-accent/30 transition-colors border-t border-border/30"
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="size-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-3.5 text-muted-foreground" />
          )}
          <span className="text-sm font-medium capitalize">
            {venue.replace(/_/g, " ")}
          </span>
          <div className="flex gap-1">
            {folders.map((f) => (
              <Badge
                key={f}
                variant="secondary"
                className="text-[10px] h-4 px-1"
              >
                {f}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-6">
          {counts ? (
            <>
              <GrowthSparkline value={counts.total} />
              <div className="text-right">
                <div className="text-sm font-mono font-semibold text-foreground">
                  {counts.total.toLocaleString()}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {counts.active.toLocaleString()} active
                </div>
              </div>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-10 py-3 bg-accent/10 border-t border-border/30 space-y-2">
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <div className="text-muted-foreground">Total</div>
              <div className="font-mono font-semibold text-foreground">
                {counts?.total.toLocaleString() ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Active</div>
              <div className="font-mono font-semibold text-emerald-400">
                {counts?.active.toLocaleString() ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Delisted</div>
              <div className="font-mono font-semibold text-muted-foreground">
                {counts ? (counts.total - counts.active).toLocaleString() : "—"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CategorySection({
  category,
  isLocked,
}: {
  category: DataCategory;
  isLocked: boolean;
}) {
  const [expanded, setExpanded] = React.useState(
    !isLocked && category === "cefi",
  );
  const venues = VENUES_BY_CATEGORY[category];
  const label = DATA_CATEGORY_LABELS[category];
  const colorClass = CATEGORY_COLORS[category];

  const totalInstruments = venues.reduce((sum, v) => {
    return sum + (MOCK_INSTRUMENT_COUNTS[v]?.total ?? 0);
  }, 0);

  return (
    <Card className={cn("overflow-hidden", isLocked && "opacity-60")}>
      <button
        type="button"
        onClick={() => !isLocked && setExpanded((v) => !v)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 transition-colors",
          isLocked ? "cursor-not-allowed" : "hover:bg-accent/50 cursor-pointer",
        )}
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground" />
          )}
          <Badge variant="outline" className={cn("text-xs", colorClass)}>
            {label}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {venues.length} venues
            {totalInstruments > 0 &&
              ` · ${totalInstruments.toLocaleString()} instruments`}
          </span>
          {isLocked && (
            <Badge
              variant="outline"
              className="text-[10px] text-muted-foreground border-muted-foreground/30"
            >
              Upgrade to access
            </Badge>
          )}
        </div>
        {!isLocked && (
          <div className="flex items-center gap-2">
            <TrendingUp className="size-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Growing</span>
          </div>
        )}
      </button>

      {expanded && !isLocked && (
        <CardContent className="pt-0 pb-2 px-0">
          {venues.map((venue) => (
            <VenueInstrumentRow key={venue} venue={venue} category={category} />
          ))}
        </CardContent>
      )}
    </Card>
  );
}

export default function InstrumentsPage() {
  const { subscribed, locked } = useScopedCategories();

  const newInstrumentAlerts = MOCK_ALERTS.filter(
    (a) => a.type === "new_instruments",
  );

  const accessibleCategories = subscribed;

  const totalAllInstruments = Object.values(MOCK_INSTRUMENT_COUNTS).reduce(
    (s, v) => s + v.total,
    0,
  );
  const totalActiveInstruments = Object.values(MOCK_INSTRUMENT_COUNTS).reduce(
    (s, v) => s + v.active,
    0,
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-8 md:px-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Instruments</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Instrument catalogue across all venues and asset classes
            </p>
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="size-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold font-mono text-sky-400">
                {totalAllInstruments.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                Total Instruments
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {totalActiveInstruments.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                Active Instruments
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold font-mono text-violet-400">
                {Object.values(MOCK_INSTRUMENT_COUNTS).length}
              </div>
              <div className="text-xs text-muted-foreground">
                Venues Covered
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold font-mono text-amber-400">
                {accessibleCategories.length}
              </div>
              <div className="text-xs text-muted-foreground">Asset Classes</div>
            </CardContent>
          </Card>
        </div>

        {/* New Instruments Alert Banner */}
        {newInstrumentAlerts.length > 0 && (
          <Card className="mb-6 border-sky-500/30 bg-sky-500/5">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <Bell className="size-4 text-sky-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  {newInstrumentAlerts.map((alert) => (
                    <div key={alert.id}>
                      <span className="text-sm font-medium text-sky-400">
                        {alert.title}
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {alert.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category Tree */}
        <div className="space-y-3">
          {/* Subscribed categories first */}
          {accessibleCategories.map((cat) => (
            <CategorySection key={cat} category={cat} isLocked={false} />
          ))}

          {/* Locked/unsubscribed categories below */}
          {locked.map((cat) => (
            <CategorySection key={cat} category={cat} isLocked={true} />
          ))}
        </div>
      </div>
    </div>
  );
}
