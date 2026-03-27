"use client";

import * as React from "react";
import type { Fixture } from "@/components/trading/sports/types";
import { EmptyState } from "@/components/trading/sports/shared";
import { groupFixtures, FixtureSection } from "@/components/trading/sports/fixtures-tab";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useSportsData } from "./sports-data-context";

export function SportsFixturesWidget(_props: WidgetComponentProps) {
  const { filteredFixtures, selectedFixtureId, setSelectedFixtureId, handleViewArb } = useSportsData();

  function selectFixture(f: Fixture) {
    setSelectedFixtureId(f.id);
  }

  function openDetail(f: Fixture, _tab?: "stats" | "odds-history" | "replay") {
    setSelectedFixtureId(f.id);
  }

  const groups = React.useMemo(() => groupFixtures(filteredFixtures), [filteredFixtures]);
  const totalCount = filteredFixtures.length;

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full overflow-auto p-2">
      {totalCount === 0 ? (
        <EmptyState message="No fixtures match the current filters" />
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
  );
}
