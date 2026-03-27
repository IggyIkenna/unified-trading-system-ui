"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { Fixture } from "./types";
import { isLive, isCompleted, isUpcoming } from "./helpers";
import { SectionHeader, EmptyState } from "./shared";
import { FixturesMatchCard } from "./fixtures-match-card";
import { FixtureDetailPanel } from "./fixtures-detail-panel";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// ─── Fixture grouping ─────────────────────────────────────────────────────────

interface FixtureGroups {
  live: Fixture[];
  halftime: Fixture[];
  suspended: Fixture[];
  upcomingToday: Fixture[];
  upcomingLater: Fixture[];
  completed: Fixture[];
}

export function groupFixtures(fixtures: Fixture[]): FixtureGroups {
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

  groups.upcomingToday.sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());
  groups.upcomingLater.sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());
  groups.completed.sort((a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime());

  return groups;
}

function useIsLargeScreen() {
  const [lg, setLg] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const fn = () => setLg(mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return lg;
}

// ─── Sections ───────────────────────────────────────────────────────────────────

export interface FixtureSectionProps {
  title: string;
  fixtures: Fixture[];
  selectedId: string | null;
  onSelect: (f: Fixture) => void;
  onViewArb?: (fixtureId: string) => void;
  onOpenDetail: (f: Fixture, tab?: "stats" | "odds-history" | "replay") => void;
}

export function FixtureSection({
  title,
  fixtures,
  selectedId,
  onSelect,
  onViewArb,
  onOpenDetail,
}: FixtureSectionProps) {
  if (fixtures.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <SectionHeader title={title} count={fixtures.length} />
      {fixtures.map((f) => (
        <FixturesMatchCard
          key={f.id}
          fixture={f}
          selected={selectedId === f.id}
          onSelect={onSelect}
          onViewArb={onViewArb}
          onOpenDetail={onOpenDetail}
        />
      ))}
    </div>
  );
}

// ─── Fixtures tab ─────────────────────────────────────────────────────────────

interface FixturesTabProps {
  fixtures: Fixture[];
  onViewArb?: (fixtureId: string) => void;
}

export function FixturesTab({ fixtures, onViewArb }: FixturesTabProps) {
  const isLg = useIsLargeScreen();
  const [selected, setSelected] = React.useState<Fixture | null>(null);
  const [detailTab, setDetailTab] = React.useState<"stats" | "odds-history" | "replay">("stats");

  function selectFixture(f: Fixture) {
    setSelected(f);
    setDetailTab("stats");
  }

  function openDetail(f: Fixture, tab: "stats" | "odds-history" | "replay" = "stats") {
    setSelected(f);
    setDetailTab(tab);
  }

  const groups = React.useMemo(() => groupFixtures(fixtures), [fixtures]);
  const totalCount = fixtures.length;

  const showDialog = Boolean(selected && !isLg);

  return (
    <div className="flex flex-col lg:flex-row flex-1 min-h-0 lg:min-h-[min(520px,calc(100vh-14rem))]">
      {/* Fixture list — primary column */}
      <div className="flex-1 min-w-0 min-h-0 overflow-auto p-3 lg:pr-2">
        {totalCount === 0 ? (
          <EmptyState message="No fixtures match the current filters" />
        ) : (
          <div className="flex flex-col gap-4 max-w-4xl">
            <FixtureSection
              title="Suspended"
              fixtures={groups.suspended}
              selectedId={selected?.id ?? null}
              onSelect={selectFixture}
              onViewArb={onViewArb}
              onOpenDetail={openDetail}
            />
            <FixtureSection
              title="Live now"
              fixtures={[...groups.live, ...groups.halftime]}
              selectedId={selected?.id ?? null}
              onSelect={selectFixture}
              onViewArb={onViewArb}
              onOpenDetail={openDetail}
            />
            <FixtureSection
              title="Upcoming today"
              fixtures={groups.upcomingToday}
              selectedId={selected?.id ?? null}
              onSelect={selectFixture}
              onViewArb={onViewArb}
              onOpenDetail={openDetail}
            />
            <FixtureSection
              title="Upcoming"
              fixtures={groups.upcomingLater}
              selectedId={selected?.id ?? null}
              onSelect={selectFixture}
              onViewArb={onViewArb}
              onOpenDetail={openDetail}
            />
            <FixtureSection
              title="Recently completed"
              fixtures={groups.completed}
              selectedId={selected?.id ?? null}
              onSelect={selectFixture}
              onViewArb={onViewArb}
              onOpenDetail={openDetail}
            />
          </div>
        )}
      </div>

      {/* Desktop: fixed-width detail column — does not cover nav or quick view */}
      <aside
        className={cn(
          "hidden lg:flex flex-col w-[min(420px,36vw)] shrink-0 border-l border-zinc-800 bg-[#080808] min-h-0",
        )}
      >
        {selected ? (
          <FixtureDetailPanel
            fixture={selected}
            initialTab={detailTab}
            onClose={() => setSelected(null)}
            className="border-l-0"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center min-h-[200px]">
            <p className="text-base font-semibold text-zinc-400">Select a match</p>
            <p className="text-sm text-zinc-600 mt-2 max-w-[240px]">
              Click a fixture for full stats, lineups, and odds history. The list stays visible.
            </p>
          </div>
        )}
      </aside>

      {/* Mobile / tablet: centered dialog — limited size, not a full-screen sheet */}
      <Dialog open={showDialog} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent
          showCloseButton
          className="w-[calc(100vw-1.5rem)] max-w-lg sm:max-w-xl p-0 gap-0 max-h-[min(88vh,820px)] flex flex-col overflow-hidden border-zinc-800 bg-[#0a0a0b]"
        >
          {selected && (
            <FixtureDetailPanel
              fixture={selected}
              initialTab={detailTab}
              onClose={() => setSelected(null)}
              showHeaderClose={false}
              className="border-0 rounded-lg overflow-hidden min-h-0 flex-1"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
