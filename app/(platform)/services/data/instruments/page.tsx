"use client";

/**
 * /services/data/instruments — Instrument catalogue and discovery.
 * FinderBrowser layout: Category → Venue → Instrument Type → Instrument
 */

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FinderBrowser } from "@/components/shared/finder";
import type { FinderSelections } from "@/components/shared/finder";
import {
  INSTRUMENTS_COLUMNS,
  getInstrumentsContextStats,
} from "@/components/data/instruments-finder-config";
import type { DataCategory, InstrumentEntry } from "@/lib/data-service-types";
import {
  DATA_CATEGORY_LABELS,
  FOLDERS_BY_CATEGORY,
} from "@/lib/data-service-types";
import {
  MOCK_INSTRUMENT_COUNTS,
  MOCK_ALERTS,
} from "@/lib/data-service-mock-data";
import { useScopedCategories } from "@/hooks/use-scoped-categories";

// ─── Instrument detail panel ──────────────────────────────────────────────────

function InstrumentDetail({ selections }: { selections: FinderSelections }) {
  const instItem = selections["instrument"];
  const venueData = selections["venue"]?.data as
    | { venue: string; cat: DataCategory }
    | undefined;
  const catData = selections["category"]?.data as DataCategory | undefined;

  if (instItem) {
    const inst = instItem.data as InstrumentEntry | null;
    if (!inst || !inst.symbol) {
      return (
        <div className="p-4 space-y-3">
          <p className="text-xs font-mono font-semibold">{instItem.label}</p>
          <p className="text-xs text-muted-foreground">
            Instrument details not available in mock data.
          </p>
        </div>
      );
    }
    return (
      <div className="p-4 space-y-4">
        <div className="space-y-1.5">
          <p className="text-xs font-mono font-bold text-foreground">
            {inst.symbol}
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            {inst.instrumentKey}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-muted-foreground">Venue</p>
            <p className="font-medium capitalize">
              {inst.venue.replace(/_/g, " ")}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Category</p>
            <p className="font-medium">{DATA_CATEGORY_LABELS[inst.category]}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Type</p>
            <p className="font-medium capitalize">
              {inst.folder.replace(/_/g, " ")}
            </p>
          </div>
          {inst.baseCurrency && (
            <div>
              <p className="text-muted-foreground">Base / Quote</p>
              <p className="font-mono font-medium">
                {inst.baseCurrency}
                {inst.quoteCurrency ? ` / ${inst.quoteCurrency}` : ""}
              </p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground">Available from</p>
            <p className="font-mono font-medium">{inst.availableFrom}</p>
          </div>
          {inst.availableTo && (
            <div>
              <p className="text-muted-foreground">Delisted</p>
              <p className="font-mono font-medium text-red-400">
                {inst.availableTo}
              </p>
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Data Types
          </p>
          <div className="flex flex-wrap gap-1">
            {inst.dataTypes.map((dt) => (
              <Badge key={dt} variant="secondary" className="text-xs font-mono">
                {dt.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (venueData) {
    const counts = MOCK_INSTRUMENT_COUNTS[venueData.venue];
    const folders = FOLDERS_BY_CATEGORY[venueData.cat] ?? [];
    return (
      <div className="p-4 space-y-3">
        <p className="text-sm font-semibold capitalize">
          {venueData.venue.replace(/_/g, " ")}
        </p>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-muted-foreground">Total instruments</p>
            <p className="font-mono font-bold text-foreground">
              {counts?.total.toLocaleString() ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Active</p>
            <p className="font-mono font-bold text-emerald-400">
              {counts?.active.toLocaleString() ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Delisted</p>
            <p className="font-mono text-muted-foreground">
              {counts ? (counts.total - counts.active).toLocaleString() : "—"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Instrument types</p>
            <p className="font-mono">{folders.length}</p>
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Types
          </p>
          <div className="flex flex-wrap gap-1">
            {folders.map((f) => (
              <Badge key={f} variant="secondary" className="text-xs capitalize">
                {f.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (catData) {
    const venues = Object.entries(MOCK_INSTRUMENT_COUNTS).filter(
      ([, v]) => v.category === catData,
    );
    const total = venues.reduce((s, [, v]) => s + v.total, 0);
    return (
      <div className="p-4 space-y-3">
        <p className="text-sm font-semibold">{DATA_CATEGORY_LABELS[catData]}</p>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-muted-foreground">Total instruments</p>
            <p className="font-mono font-bold text-foreground">
              {total.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Venues</p>
            <p className="font-mono">{venues.length}</p>
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Select a venue to drill down
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      <p className="text-sm font-medium text-muted-foreground">
        No instrument selected
      </p>
      <p className="text-xs text-muted-foreground/60 mt-1">
        Drill down to browse instruments and their data types
      </p>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function InstrumentsPage() {
  const newInstrumentAlerts = MOCK_ALERTS.filter(
    (a) => a.type === "new_instruments",
  );

  const totalAll = Object.values(MOCK_INSTRUMENT_COUNTS).reduce(
    (s, v) => s + v.total,
    0,
  );
  const totalActive = Object.values(MOCK_INSTRUMENT_COUNTS).reduce(
    (s, v) => s + v.active,
    0,
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-border/50">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Instruments</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalAll.toLocaleString()} instruments ·{" "}
            {totalActive.toLocaleString()} active ·{" "}
            {Object.keys(MOCK_INSTRUMENT_COUNTS).length} venues
          </p>
        </div>
        <div className="flex items-center gap-2">
          {newInstrumentAlerts.length > 0 && (
            <Badge
              variant="outline"
              className="text-xs gap-1.5 border-sky-400/30 text-sky-400"
            >
              <Bell className="size-3" />
              {newInstrumentAlerts.length} new alerts
            </Badge>
          )}
          <Button variant="outline" size="sm">
            <RefreshCw className="size-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* FinderBrowser */}
      <FinderBrowser
        columns={INSTRUMENTS_COLUMNS}
        detailPanel={(selections) => (
          <InstrumentDetail selections={selections} />
        )}
        contextStats={getInstrumentsContextStats}
        detailPanelTitle="Instrument Detail"
        emptyState={
          <div className="text-center">
            <p className="text-sm font-medium">Select a category</p>
            <p className="text-xs opacity-60 mt-1">
              Browse instruments by asset class
            </p>
          </div>
        }
      />
    </div>
  );
}
