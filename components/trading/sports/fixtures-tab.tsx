"use client";

import * as React from "react";
import type { Fixture } from "./types";
import { isLive, isCompleted, isUpcoming } from "./helpers";
import { SectionHeader, EmptyState } from "./shared";
import { FixturesMatchCard } from "./fixtures-match-card";
import { FixturesDetailDrawer } from "./fixtures-detail-drawer";

// ─── Fixture Grouping ─────────────────────────────────────────────────────────

interface FixtureGroups {
  live: Fixture[];
  halftime: Fixture[];
  suspended: Fixture[];
  upcomingToday: Fixture[];
  upcomingLater: Fixture[];
  completed: Fixture[];
}

function groupFixtures(fixtures: Fixture[]): FixtureGroups {
  const now = new Date();
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const groups: FixtureGroups = {
    live: [],
    halftime: [],
    suspended: [],
    upcomingToday: [],
    upcomingLater: [],
    completed: [],
  };

  for (const f of fixtures) {
    if (isLive(f.status)) {
      groups.live.push(f);
    } else if (f.status === "HT") {
      groups.halftime.push(f);
    } else if (f.status === "SUSP") {
      groups.suspended.push(f);
    } else if (isCompleted(f.status)) {
      groups.completed.push(f);
    } else if (isUpcoming(f.status)) {
      const kickoff = new Date(f.kickoff);
      if (kickoff <= todayEnd) {
        groups.upcomingToday.push(f);
      } else {
        groups.upcomingLater.push(f);
      }
    }
  }

  // Sort upcoming by kickoff ascending, completed descending
  groups.upcomingToday.sort(
    (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime(),
  );
  groups.upcomingLater.sort(
    (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime(),
  );
  groups.completed.sort(
    (a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime(),
  );

  return groups;
}

// ─── Fixture Section ──────────────────────────────────────────────────────────

interface FixtureSectionProps {
  title: string;
  fixtures: Fixture[];
  onViewArb?: (fixtureId: string) => void;
  onOpenDetail: (
    fixture: Fixture,
    tab?: "stats" | "odds-history" | "replay",
  ) => void;
}

function FixtureSection({
  title,
  fixtures,
  onViewArb,
  onOpenDetail,
}: FixtureSectionProps) {
  if (fixtures.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <SectionHeader title={title} count={fixtures.length} />
      {fixtures.map((f) => (
        <FixturesMatchCard
          key={f.id}
          fixture={f}
          onViewArb={onViewArb}
          onOpenDetail={onOpenDetail}
        />
      ))}
    </div>
  );
}

// ─── Fixtures Tab ─────────────────────────────────────────────────────────────

interface FixturesTabProps {
  fixtures: Fixture[];
  onViewArb?: (fixtureId: string) => void;
}

export function FixturesTab({ fixtures, onViewArb }: FixturesTabProps) {
  const [drawerFixture, setDrawerFixture] = React.useState<Fixture | null>(
    null,
  );
  const [drawerTab, setDrawerTab] = React.useState<
    "stats" | "odds-history" | "replay"
  >("stats");

  function openDetail(
    fixture: Fixture,
    tab: "stats" | "odds-history" | "replay" = "stats",
  ) {
    setDrawerFixture(fixture);
    setDrawerTab(tab);
  }

  const groups = React.useMemo(() => groupFixtures(fixtures), [fixtures]);
  const totalCount = fixtures.length;

  return (
    <>
      <div className="flex flex-col gap-3 p-3">
        {totalCount === 0 ? (
          <EmptyState message="No fixtures match the current filters" />
        ) : (
          <>
            <FixtureSection
              title="Suspended"
              fixtures={groups.suspended}
              onViewArb={onViewArb}
              onOpenDetail={openDetail}
            />
            <FixtureSection
              title="Live Now"
              fixtures={[...groups.live, ...groups.halftime]}
              onViewArb={onViewArb}
              onOpenDetail={openDetail}
            />
            <FixtureSection
              title="Upcoming Today"
              fixtures={groups.upcomingToday}
              onViewArb={onViewArb}
              onOpenDetail={openDetail}
            />
            <FixtureSection
              title="Upcoming"
              fixtures={groups.upcomingLater}
              onViewArb={onViewArb}
              onOpenDetail={openDetail}
            />
            <FixtureSection
              title="Recently Completed"
              fixtures={groups.completed}
              onViewArb={onViewArb}
              onOpenDetail={openDetail}
            />
          </>
        )}
      </div>

      <FixturesDetailDrawer
        fixture={drawerFixture}
        initialTab={drawerTab}
        open={drawerFixture !== null}
        onClose={() => setDrawerFixture(null)}
      />
    </>
  );
}
