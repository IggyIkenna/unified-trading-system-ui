"use client";

import type { FilterDefinition } from "@/components/platform/filter-bar";
import { FilterBar } from "@/components/platform/filter-bar";
import { FixtureSection, groupFixtures } from "@/components/trading/sports/fixtures-tab";
import { FOOTBALL_LEAGUES } from "@/components/trading/sports/mock-fixtures";
import { LeagueBadge } from "@/components/trading/sports/shared";
import type { Fixture, FootballLeague } from "@/components/trading/sports/types";
import { EmptyState } from "@/components/ui/empty-state";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { cn } from "@/lib/utils";
import { Filter } from "lucide-react";
import * as React from "react";
import { useSportsData, type GlobalFilters } from "./sports-data-context";

export function SportsFixturesWidget(_props: WidgetComponentProps) {
  const { filteredFixtures, selectedFixtureId, setSelectedFixtureId, handleViewArb, filters, setFilters } =
    useSportsData();
  const [showFilters, setShowFilters] = React.useState(true);

  const filterDefs = React.useMemo<FilterDefinition[]>(
    () => [
      {
        key: "dateRange",
        label: "Date",
        type: "select",
        options: [
          { value: "today", label: "Today" },
          { value: "week", label: "This Week" },
          { value: "all", label: "All" },
        ],
      },
      {
        key: "statusFilter",
        label: "Status",
        type: "select",
        options: [
          { value: "all", label: "All" },
          { value: "live", label: "Live" },
          { value: "upcoming", label: "Upcoming" },
          { value: "completed", label: "Completed" },
        ],
      },
      { key: "search", label: "Search", type: "search", placeholder: "Search teams..." },
    ],
    [],
  );

  const filterValues = React.useMemo(
    () => ({
      dateRange: filters.dateRange,
      statusFilter: filters.statusFilter,
      search: filters.search || undefined,
    }),
    [filters.dateRange, filters.statusFilter, filters.search],
  );

  const handleFilterChange = React.useCallback(
    (key: string, value: unknown) => {
      setFilters((prev: GlobalFilters) => {
        switch (key) {
          case "dateRange":
            return { ...prev, dateRange: value as string as GlobalFilters["dateRange"] };
          case "statusFilter":
            return { ...prev, statusFilter: value as string as GlobalFilters["statusFilter"] };
          case "search":
            return { ...prev, search: (value as string) || "" };
          default:
            return prev;
        }
      });
    },
    [setFilters],
  );

  const resetFilters = React.useCallback(() => {
    setFilters({
      leagues: [],
      dateRange: "today",
      statusFilter: "all",
      search: "",
    });
  }, [setFilters]);

  function toggleLeague(league: FootballLeague) {
    setFilters((prev) => {
      const next = prev.leagues.includes(league) ? prev.leagues.filter((l) => l !== league) : [...prev.leagues, league];
      return { ...prev, leagues: next };
    });
  }

  function selectFixture(f: Fixture) {
    setSelectedFixtureId(f.id);
  }

  function openDetail(f: Fixture, _tab?: "stats" | "odds-history" | "replay") {
    setSelectedFixtureId(f.id);
  }

  const groups = React.useMemo(() => groupFixtures(filteredFixtures), [filteredFixtures]);
  const totalCount = filteredFixtures.length;

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full overflow-auto">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/40">
        <button
          onClick={() => setShowFilters((f) => !f)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <Filter className="size-3" />
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
      </div>
      {showFilters && (
        <div className="px-3 py-2 border-b border-border/30 bg-muted/20">
          <FilterBar
            filters={filterDefs}
            values={filterValues}
            onChange={handleFilterChange}
            onReset={resetFilters}
            className="border-b-0 px-1 py-0"
          />
          <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto pb-0.5 mt-1.5">
            <button
              type="button"
              onClick={() => setFilters((p) => ({ ...p, leagues: [] }))}
              className={cn(
                "px-2.5 py-1 text-xs font-bold rounded-sm border transition-colors uppercase tracking-wide shrink-0",
                filters.leagues.length === 0
                  ? "bg-muted text-foreground border-border"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              All Leagues
            </button>
            {FOOTBALL_LEAGUES.map((league) => (
              <button key={league} type="button" onClick={() => toggleLeague(league)} className="shrink-0">
                <LeagueBadge
                  league={league}
                  className={cn(
                    "cursor-pointer transition-opacity",
                    filters.leagues.length > 0 && !filters.leagues.includes(league) && "opacity-40",
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="p-2">
        {totalCount === 0 ? (
          <EmptyState variant="inline" title="No fixtures match the current filters" />
        ) : (
          <div className="flex flex-col gap-3 max-w-4xl">
            <FixtureSection
              title="Suspended"
              fixtures={groups.suspended}
              selectedId={selectedFixtureId}
              onSelect={selectFixture}
              onViewArb={handleViewArb}
              onOpenDetail={openDetail}
            />
            <FixtureSection
              title="Live now"
              fixtures={[...groups.live, ...groups.halftime]}
              selectedId={selectedFixtureId}
              onSelect={selectFixture}
              onViewArb={handleViewArb}
              onOpenDetail={openDetail}
            />
            <FixtureSection
              title="Upcoming today"
              fixtures={groups.upcomingToday}
              selectedId={selectedFixtureId}
              onSelect={selectFixture}
              onViewArb={handleViewArb}
              onOpenDetail={openDetail}
            />
            <FixtureSection
              title="Upcoming"
              fixtures={groups.upcomingLater}
              selectedId={selectedFixtureId}
              onSelect={selectFixture}
              onViewArb={handleViewArb}
              onOpenDetail={openDetail}
            />
            <FixtureSection
              title="Recently completed"
              fixtures={groups.completed}
              selectedId={selectedFixtureId}
              onSelect={selectFixture}
              onViewArb={handleViewArb}
              onOpenDetail={openDetail}
            />
          </div>
        )}
      </div>
    </div>
  );
}
