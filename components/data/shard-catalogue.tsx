"use client";

// ShardCatalogue — Browse instruments grouped by sharding dimensions
// Hierarchy: Category → Venue → Folder → Data Type → Instrument
// Used in /services/data (public, demo mode), /services/data/overview (client), /admin/data (admin)

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, ChevronDown, Search, CheckCircle2, Lock, Plus, Database, Zap, Cloud } from "lucide-react";
import { VENUES_BY_CATEGORY, DATA_CATEGORY_LABELS, FOLDERS_BY_CATEGORY } from "@/lib/types/data-service";
import type {
  DataCategory,
  DataFolder,
  DataType,
  OrgMode,
  CatalogueEntry,
  DataSubscription,
} from "@/lib/types/data-service";
import { MOCK_CATALOGUE, VENUE_DISPLAY } from "@/lib/mocks/fixtures/data-service";

// Category accent colours
export const CATEGORY_COLORS: Record<DataCategory, string> = {
  cefi: "text-sky-400 bg-sky-400/10 border-sky-400/30",
  tradfi: "text-violet-400 bg-violet-400/10 border-violet-400/30",
  defi: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  onchain_perps: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  prediction_market: "text-rose-400 bg-rose-400/10 border-rose-400/30",
  sports: "text-teal-400 bg-teal-400/10 border-teal-400/30",
};

interface ShardCatalogueProps {
  orgMode: OrgMode;
  activeSubscriptions?: DataSubscription[];
  onSubscribeClick?: (entry: CatalogueEntry) => void;
  className?: string;
}

export function ShardCatalogue({
  orgMode,
  activeSubscriptions = [],
  onSubscribeClick,
  className,
}: ShardCatalogueProps) {
  const [expandedCategories, setExpandedCategories] = React.useState<Set<DataCategory>>(new Set(["cefi"]));
  const [expandedVenues, setExpandedVenues] = React.useState<Set<string>>(new Set());
  const [search, setSearch] = React.useState("");
  const [filterCategory, setFilterCategory] = React.useState<DataCategory | "all">("all");

  const categories = Object.keys(DATA_CATEGORY_LABELS) as DataCategory[];

  function toggleCategory(cat: DataCategory) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  function toggleVenue(venueKey: string) {
    setExpandedVenues((prev) => {
      const next = new Set(prev);
      next.has(venueKey) ? next.delete(venueKey) : next.add(venueKey);
      return next;
    });
  }

  function isSubscribed(entry: CatalogueEntry): boolean {
    return activeSubscriptions.some(
      (sub) =>
        sub.shardFilters.categories.includes(entry.instrument.category) &&
        sub.shardFilters.venues.includes(entry.instrument.venue),
    );
  }

  const filteredCatalogue = MOCK_CATALOGUE.filter((entry) => {
    const matchesSearch =
      search === "" ||
      entry.instrument.symbol.toLowerCase().includes(search.toLowerCase()) ||
      entry.instrument.venue.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === "all" || entry.instrument.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search instruments, venues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <Button
            variant={filterCategory === "all" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilterCategory("all")}
            className="h-7 text-xs"
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={filterCategory === cat ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilterCategory(cat === filterCategory ? "all" : cat)}
              className={cn("h-7 text-xs", filterCategory === cat && CATEGORY_COLORS[cat])}
            >
              {DATA_CATEGORY_LABELS[cat]}
            </Button>
          ))}
        </div>
      </div>

      {/* Category accordions */}
      {categories
        .filter((cat) => filterCategory === "all" || cat === filterCategory)
        .map((cat) => {
          const catEntries = filteredCatalogue.filter((e) => e.instrument.category === cat);

          const allVenues = VENUES_BY_CATEGORY[cat];
          // Filter venues by search — only show venues matching the search term
          const venueList =
            search === ""
              ? allVenues
              : allVenues.filter(
                  (v) =>
                    v.toLowerCase().includes(search.toLowerCase()) ||
                    (VENUE_DISPLAY[v]?.label ?? "").toLowerCase().includes(search.toLowerCase()) ||
                    catEntries.some((e) => e.instrument.venue === v),
                );

          if (catEntries.length === 0 && venueList.length === 0 && search !== "") return null;
          const catAvgCompleteness =
            catEntries.length > 0
              ? Math.round(catEntries.reduce((sum, e) => sum + e.freshnessPct, 0) / catEntries.length)
              : 0;

          return (
            <Card key={cat} className="overflow-hidden">
              {/* Category header */}
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {expandedCategories.has(cat) ? (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="size-4 text-muted-foreground" />
                  )}
                  <Badge variant="outline" className={cn("text-xs", CATEGORY_COLORS[cat])}>
                    {DATA_CATEGORY_LABELS[cat]}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {venueList.length} venues · {catEntries.length || "?"} instruments
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {catAvgCompleteness > 0 && (
                    <div className="flex items-center gap-2">
                      <Progress value={catAvgCompleteness} className="h-1.5 w-20" />
                      <span className="text-xs text-muted-foreground">{catAvgCompleteness}%</span>
                    </div>
                  )}
                </div>
              </button>

              {/* Venue list */}
              {expandedCategories.has(cat) && (
                <CardContent className="pt-0 pb-2 px-0">
                  <div className="divide-y divide-border/50">
                    {venueList.map((venue) => {
                      const venueKey = `${cat}:${venue}`;
                      const venueEntries = catEntries.filter((e) => e.instrument.venue === venue);
                      const venueDisplay = VENUE_DISPLAY[venue];
                      const venueCompleteness =
                        venueEntries.length > 0
                          ? Math.round(venueEntries.reduce((sum, e) => sum + e.freshnessPct, 0) / venueEntries.length)
                          : null;

                      return (
                        <div key={venue}>
                          {/* Venue row */}
                          <button
                            onClick={() => toggleVenue(venueKey)}
                            className="w-full flex items-center justify-between px-6 py-2.5 hover:bg-accent/30 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {expandedVenues.has(venueKey) ? (
                                <ChevronDown className="size-3.5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="size-3.5 text-muted-foreground" />
                              )}
                              <span className="text-sm font-medium">{venueDisplay?.label ?? venue}</span>
                              {venueDisplay?.dataHistory && (
                                <span className="text-xs text-muted-foreground">since {venueDisplay.dataHistory}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              {venueCompleteness !== null && (
                                <div className="flex items-center gap-2">
                                  <div
                                    className={cn(
                                      "size-1.5 rounded-full",
                                      venueCompleteness >= 95
                                        ? "bg-emerald-500"
                                        : venueCompleteness >= 80
                                          ? "bg-yellow-500"
                                          : "bg-red-500",
                                    )}
                                  />
                                  <span className="text-xs text-muted-foreground font-mono">{venueCompleteness}%</span>
                                </div>
                              )}
                              <div className="flex gap-1">
                                {FOLDERS_BY_CATEGORY[cat].map((folder) => (
                                  <Badge key={folder} variant="secondary" className="text-[10px] h-4 px-1">
                                    {folder}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </button>

                          {/* Instrument rows */}
                          {expandedVenues.has(venueKey) &&
                            venueEntries.map((entry) => {
                              const subscribed = isSubscribed(entry);
                              return (
                                <div
                                  key={entry.instrument.instrumentKey}
                                  className="flex items-center justify-between px-10 py-2 bg-accent/20 border-t border-border/30"
                                >
                                  <div className="flex items-center gap-3">
                                    <Database className="size-3.5 text-muted-foreground" />
                                    <span className="text-sm font-mono">{entry.instrument.symbol}</span>
                                    <div className="flex gap-1 flex-wrap">
                                      {entry.instrument.dataTypes.slice(0, 3).map((dt) => (
                                        <Badge key={dt} variant="outline" className="text-[10px] h-4 px-1">
                                          {dt}
                                        </Badge>
                                      ))}
                                      {entry.instrument.dataTypes.length > 3 && (
                                        <Badge variant="outline" className="text-[10px] h-4 px-1">
                                          +{entry.instrument.dataTypes.length - 3}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 text-xs">
                                      <Cloud className="size-3 text-blue-400" />
                                      <span className="font-mono text-muted-foreground">
                                        GCP {entry.gcpCompleteness}%
                                      </span>
                                      {entry.awsCompleteness > 0 && (
                                        <>
                                          <span className="text-muted-foreground/40">|</span>
                                          <Cloud className="size-3 text-orange-400" />
                                          <span className="font-mono text-muted-foreground">
                                            AWS {entry.awsCompleteness}%
                                          </span>
                                        </>
                                      )}
                                    </div>
                                    <span className="text-xs text-muted-foreground font-mono">
                                      {entry.sizeGb.toLocaleString()} GB
                                    </span>
                                    {orgMode === "demo" ? (
                                      <Button size="sm" variant="outline" className="h-7 text-xs" disabled>
                                        <Lock className="mr-1 size-3" />
                                        Sign in
                                      </Button>
                                    ) : subscribed ? (
                                      <Badge
                                        variant="outline"
                                        className="text-emerald-500 border-emerald-500/30 text-xs"
                                      >
                                        <CheckCircle2 className="mr-1 size-3" />
                                        Active
                                      </Badge>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs"
                                        onClick={() => onSubscribeClick?.(entry)}
                                      >
                                        <Plus className="mr-1 size-3" />
                                        Add
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
    </div>
  );
}
