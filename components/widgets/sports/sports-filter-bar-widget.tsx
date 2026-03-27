"use client";

import * as React from "react";
import { FilterBar } from "@/components/platform/filter-bar";
import { cn } from "@/lib/utils";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import type { FilterDefinition } from "@/components/platform/filter-bar";
import { FOOTBALL_LEAGUES } from "@/components/trading/sports/mock-fixtures";
import { LeagueBadge } from "@/components/trading/sports/shared";
import type { FootballLeague } from "@/components/trading/sports/types";
import { useSportsData, type GlobalFilters } from "./sports-data-context";

export function SportsFilterBarWidget(_props: WidgetComponentProps) {
  const { filters, setFilters } = useSportsData();

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
      { key: "search", label: "Search", type: "search", placeholder: "Search teams…" },
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

  return (
    <div className="flex flex-col gap-2 h-full border-b border-border bg-card/40 px-2 py-2">
      <FilterBar
        filters={filterDefs}
        values={filterValues}
        onChange={handleFilterChange}
        onReset={resetFilters}
        className="border-b-0 px-1 py-0"
      />
      <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto pb-0.5">
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
  );
}
