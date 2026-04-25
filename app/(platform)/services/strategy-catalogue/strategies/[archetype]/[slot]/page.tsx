"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ArrowUpRight, Code2, GitBranch, ListChecks, Settings2, Users } from "lucide-react";

import {
  CategoryChip,
  InstrumentTypeChip,
  LockStateBadge,
  MaturityBadge,
  RollModeBadge,
  SignalVariantBadge,
  StatusBadge,
} from "@/components/architecture-v2";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CoverageCell, StrategyArchetype } from "@/lib/architecture-v2";
import {
  ARCHETYPE_COVERAGE,
  ARCHETYPE_METADATA,
  FAMILY_METADATA,
  coverageForArchetype,
  getFamilyForArchetype,
  useAvailabilityEntry,
} from "@/lib/architecture-v2";

const CODEX_BASE_URL =
  "https://github.com/IggyIkenna/unified-trading-pm/blob/main/codex/09-strategy/architecture-v2/archetypes";

// ---------------------------------------------------------------------------
// Static mock data — stands in for ArchetypeBuildRegistry + PromotionDecisionLedger
// until the strategy-service read API lands. Mirrors the shape a real response
// would take so the page body is stable across the eventual swap.
// ---------------------------------------------------------------------------

interface PromotionLedgerRow {
  readonly decision: "PROMOTE" | "EXTEND" | "REJECT" | "ROLLBACK";
  readonly buildVersion: number;
  readonly decidedAtUtc: string;
  readonly rationale: string;
}

interface BuildEntry {
  readonly buildVersion: number;
  readonly status: "SHADOW" | "PROD" | "ARCHIVED" | "ROLLED_BACK";
  readonly registeredAtUtc: string;
}

interface LiveVsBacktestDelta {
  readonly pnlShadowBps: number;
  readonly pnlProdBps: number;
  readonly dispersionBps: number;
  readonly tradeCount: number;
}

const MOCK_BUILD_LEDGER: Readonly<Record<string, readonly BuildEntry[]>> = {};
const MOCK_PROMOTION_LEDGER: Readonly<Record<string, readonly PromotionLedgerRow[]>> = {};
const MOCK_LIVE_DELTA: Readonly<Record<string, LiveVsBacktestDelta>> = {};

function mockBuildsFor(archetype: string): readonly BuildEntry[] {
  return (
    MOCK_BUILD_LEDGER[archetype] ?? [
      {
        buildVersion: 2,
        status: "PROD",
        registeredAtUtc: "2026-04-14T00:00:00Z",
      },
      {
        buildVersion: 3,
        status: "SHADOW",
        registeredAtUtc: "2026-04-18T00:00:00Z",
      },
    ]
  );
}

function mockPromotionLedger(archetype: string): readonly PromotionLedgerRow[] {
  return (
    MOCK_PROMOTION_LEDGER[archetype] ?? [
      {
        decision: "EXTEND",
        buildVersion: 3,
        decidedAtUtc: "2026-04-15T12:00:00Z",
        rationale: "shadow trade-count 72 < 100 threshold",
      },
      {
        decision: "EXTEND",
        buildVersion: 3,
        decidedAtUtc: "2026-04-17T12:00:00Z",
        rationale: "shadow trade-count 114; dispersion 47 bps (< 50 bps)",
      },
    ]
  );
}

function mockLiveDelta(slot: string): LiveVsBacktestDelta {
  return (
    MOCK_LIVE_DELTA[slot] ?? {
      pnlShadowBps: 38,
      pnlProdBps: 41,
      dispersionBps: 47,
      tradeCount: 114,
    }
  );
}

function findCell(archetype: StrategyArchetype, slotLabel: string): CoverageCell | null {
  const coverage = coverageForArchetype(archetype);
  return coverage.cells.find((cell) => cell.representativeSlotLabels.includes(slotLabel)) ?? null;
}

export default function StrategyDetailPage() {
  const params = useParams<{ archetype: string; slot: string }>();
  const archetype = params.archetype as StrategyArchetype;
  const slotLabel = decodeURIComponent(params.slot);
  const availability = useAvailabilityEntry(slotLabel);

  if (!(archetype in ARCHETYPE_COVERAGE)) {
    notFound();
  }
  const meta = ARCHETYPE_METADATA[archetype];
  const cell = findCell(archetype, slotLabel);
  const family = FAMILY_METADATA[getFamilyForArchetype(archetype)];
  const builds = mockBuildsFor(archetype);
  const ledger = mockPromotionLedger(archetype);
  const delta = mockLiveDelta(slotLabel);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="platform-page-width space-y-6 p-6">
        <PageHeader title={meta.label} description={meta.shortDescription}>
          <Badge variant="outline" className="font-mono text-xs">
            {family?.label ?? getFamilyForArchetype(archetype)}
          </Badge>
          <LockStateBadge
            state={availability.lockState}
            clientId={availability.exclusiveClientId}
            reservingBusinessUnitId={availability.reservingBusinessUnitId}
            expiresAtUtc={availability.expiresAtUtc}
          />
          <MaturityBadge maturity={availability.maturity} />
        </PageHeader>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card data-testid="detail-identity">
            <CardHeader className="pb-2">
              <CardDescription>Slot label</CardDescription>
              <CardTitle className="break-all font-mono text-sm">{slotLabel}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Archetype: <span className="font-mono text-foreground">{archetype}</span>
              {cell ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  <CategoryChip category={cell.assetGroup} />
                  <InstrumentTypeChip instrumentType={cell.instrumentType} />
                  <StatusBadge status={cell.status} />
                  {cell.rollMode !== "n/a" ? <RollModeBadge rollMode={cell.rollMode} /> : null}
                </div>
              ) : (
                <p className="mt-2 italic">Slot not found in coverage matrix — showing default availability.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Availability</CardDescription>
              <CardTitle className="text-base">
                {availability.lockState} · {availability.maturity}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-xs text-muted-foreground">
              {availability.changedAtUtc ? (
                <div>Changed at: {availability.changedAtUtc}</div>
              ) : (
                <div>No explicit admin override recorded.</div>
              )}
              {availability.reason ? <div>Reason: {availability.reason}</div> : null}
              {availability.exclusiveClientId ? <div>Exclusive client: {availability.exclusiveClientId}</div> : null}
              {availability.reservingBusinessUnitId ? (
                <div>Reserving BU: {availability.reservingBusinessUnitId}</div>
              ) : null}
              <Link
                href="/services/strategy-catalogue/admin/lock-state"
                className="mt-2 inline-flex items-center gap-1 text-primary hover:underline"
              >
                Change lock / maturity
                <ArrowUpRight className="size-3" aria-hidden />
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Live vs. backtest</CardDescription>
              <CardTitle className="text-base">{Math.abs(delta.pnlShadowBps - delta.pnlProdBps)} bps delta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0.5 text-xs text-muted-foreground">
              <div>Shadow P&amp;L: {delta.pnlShadowBps} bps</div>
              <div>Prod P&amp;L: {delta.pnlProdBps} bps</div>
              <div>Dispersion: {delta.dispersionBps} bps</div>
              <div>Trades: {delta.tradeCount}</div>
              <Badge variant="secondary" className="mt-2 font-mono text-[0.6rem]">
                MOCK
              </Badge>
            </CardContent>
          </Card>
        </div>

        {cell ? (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Venues + signal variants</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div>
                  <div className="text-muted-foreground">Representative venues</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {cell.representativeVenueIds.map((venue) => (
                      <Badge key={venue} variant="outline" className="font-mono text-[0.6rem]">
                        {venue}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Signal variants</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {cell.signalVariants.map((variant) => (
                      <SignalVariantBadge key={variant} variant={variant} />
                    ))}
                  </div>
                </div>
                {cell.notes ? (
                  <div>
                    <div className="text-muted-foreground">Notes</div>
                    <p className="mt-1 text-foreground">{cell.notes}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">All representative slots for this cell</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <ul className="space-y-1 font-mono text-[0.65rem]">
                  {cell.representativeSlotLabels.map((other) => (
                    <li key={other}>
                      <Link
                        href={`/services/strategy-catalogue/strategies/${archetype}/${encodeURIComponent(other)}`}
                        className={
                          other === slotLabel ? "font-semibold text-foreground" : "text-primary hover:underline"
                        }
                      >
                        {other}
                      </Link>
                      {other === slotLabel ? (
                        <span className="ml-2 text-[0.55rem] uppercase text-muted-foreground">current</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>
        ) : null}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <GitBranch className="size-4" aria-hidden />
                Build registry (mock)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-xs">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="text-left">Build</th>
                    <th className="text-left">Status</th>
                    <th className="text-left">Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {builds.map((build) => (
                    <tr key={build.buildVersion} className="border-t border-border/40">
                      <td className="py-1 font-mono">v{build.buildVersion}</td>
                      <td>
                        <Badge variant="secondary" className="text-[0.6rem]">
                          {build.status}
                        </Badge>
                      </td>
                      <td className="text-muted-foreground">{build.registeredAtUtc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <ListChecks className="size-4" aria-hidden />
                Promotion ledger (mock)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-xs">
                {ledger.map((row, idx) => (
                  <li key={idx} className="border-l-2 border-primary/50 pl-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-[0.6rem]">
                        {row.decision}
                      </Badge>
                      <span className="font-mono text-muted-foreground">v{row.buildVersion}</span>
                      <span className="text-[0.6rem] text-muted-foreground">{row.decidedAtUtc}</span>
                    </div>
                    <p className="text-muted-foreground">{row.rationale}</p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Code2 className="size-4" aria-hidden />
                Codex doc
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs">
              <Link
                href={`${CODEX_BASE_URL}/${archetype.toLowerCase().replaceAll("_", "-")}.md`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-primary hover:underline"
              >
                codex/09-strategy/architecture-v2/archetypes/{archetype.toLowerCase().replaceAll("_", "-")}.md
                <ArrowUpRight className="size-3" aria-hidden />
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Settings2 className="size-4" aria-hidden />
                Config knobs
              </CardTitle>
              <CardDescription className="text-[0.65rem]">
                ConfigRegistry surface — tunable parameters within this slot.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Pending wiring to the strategy-service config API. In the meantime see the archetype codex doc above for
              the authoritative knob list.
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Users className="size-4" aria-hidden />
                Allocation status (mock)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Pending wiring to portfolio-allocator. The fail-loud gate in strategy-service Phase 10.5 enforces lock +
              maturity on every AllocationDirective — this panel will surface the most recent directive + the clients
              currently subscribed to this slot.
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
