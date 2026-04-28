"use client";

import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_CLV_RECORDS, MOCK_FIXTURES, MOCK_PREDICTIONS, MOCK_STANDINGS } from "@/lib/mocks/fixtures/sports-data";
import { cn } from "@/lib/utils";

interface ModelFamilySummary {
  id: string;
  name: string;
  targetType: string;
  accuracy: number;
  clvBps: number;
  fixtures: number;
  status: "active" | "training" | "stale";
}

const MODEL_FAMILIES: ModelFamilySummary[] = [
  {
    id: "pregame_fundamental",
    name: "Pre-Game xG",
    targetType: "xG regression",
    accuracy: 0.684,
    clvBps: 3.1,
    fixtures: 2840,
    status: "active",
  },
  {
    id: "pregame_market",
    name: "Pre-Game CLV",
    targetType: "CLV classification",
    accuracy: 0.627,
    clvBps: 2.4,
    fixtures: 2840,
    status: "active",
  },
  {
    id: "ht_fundamental",
    name: "Half-Time xG",
    targetType: "2H xG regression",
    accuracy: 0.591,
    clvBps: 1.8,
    fixtures: 1420,
    status: "stale",
  },
  {
    id: "ht_market",
    name: "HT Market CLV",
    targetType: "HT CLV bps",
    accuracy: 0.553,
    clvBps: 1.2,
    fixtures: 1420,
    status: "stale",
  },
  {
    id: "meta",
    name: "Bet Quality",
    targetType: "ROI flag",
    accuracy: 0.715,
    clvBps: 4.2,
    fixtures: 2840,
    status: "active",
  },
];

interface LeagueResearchRow {
  league: string;
  seasons: number;
  fixtures: number;
  features: number;
  modelAccuracy: number;
  avgClvBps: number;
  roiPct: number;
  edgeDecay: string;
}

const LEAGUE_RESEARCH: LeagueResearchRow[] = [
  {
    league: "EPL",
    seasons: 7,
    fixtures: 2660,
    features: 635,
    modelAccuracy: 0.68,
    avgClvBps: 3.1,
    roiPct: 7.2,
    edgeDecay: "42d",
  },
  {
    league: "La Liga",
    seasons: 7,
    fixtures: 2660,
    features: 612,
    modelAccuracy: 0.65,
    avgClvBps: 2.2,
    roiPct: 5.8,
    edgeDecay: "38d",
  },
  {
    league: "Bundesliga",
    seasons: 7,
    fixtures: 2142,
    features: 608,
    modelAccuracy: 0.64,
    avgClvBps: 1.8,
    roiPct: 4.9,
    edgeDecay: "35d",
  },
  {
    league: "Serie A",
    seasons: 7,
    fixtures: 2660,
    features: 618,
    modelAccuracy: 0.63,
    avgClvBps: 1.9,
    roiPct: 5.1,
    edgeDecay: "36d",
  },
  {
    league: "Ligue 1",
    seasons: 7,
    fixtures: 2660,
    features: 595,
    modelAccuracy: 0.61,
    avgClvBps: 1.1,
    roiPct: 3.2,
    edgeDecay: "30d",
  },
  {
    league: "UCL",
    seasons: 7,
    fixtures: 875,
    features: 635,
    modelAccuracy: 0.66,
    avgClvBps: 4.2,
    roiPct: 8.4,
    edgeDecay: "48d",
  },
  {
    league: "UEL",
    seasons: 7,
    fixtures: 665,
    features: 620,
    modelAccuracy: 0.62,
    avgClvBps: 2.8,
    roiPct: 6.1,
    edgeDecay: "40d",
  },
];

const statusColor: Record<string, string> = {
  active: "bg-emerald-500",
  training: "bg-blue-500 animate-pulse",
  stale: "bg-amber-500",
};

export default function SportsResearchPage() {
  const predictionCount = Object.keys(MOCK_PREDICTIONS).length;
  const clvRecords = MOCK_CLV_RECORDS;
  const totalClvBets = clvRecords.reduce((s, r) => s + r.totalBets, 0);
  const avgClv = clvRecords.reduce((s, r) => s + r.meanClvPct, 0) / clvRecords.length;
  const totalPnl = clvRecords.reduce((s, r) => s + r.totalPnl, 0);
  const standingsLeagues = Object.keys(MOCK_STANDINGS).length;
  const upcomingFixtures = MOCK_FIXTURES.filter((f) => f.status === "NS").length;
  const liveFixtures = MOCK_FIXTURES.filter((f) => ["1H", "2H", "HT"].includes(f.status)).length;

  return (
    <div className="space-y-6 p-4">
      <PageHeader
        title="Sports Research"
        description="Fixture-based sports strategy research: model families, league coverage, CLV analysis, and feature pipeline."
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        <MetricCard tone="grid" density="compact" label="Model Families" primary={`${MODEL_FAMILIES.length}`} />
        <MetricCard
          tone="grid"
          density="compact"
          label="Active Models"
          primary={`${MODEL_FAMILIES.filter((m) => m.status === "active").length}`}
          primaryClassName="text-emerald-400"
        />
        <MetricCard tone="grid" density="compact" label="Leagues" primary={`${LEAGUE_RESEARCH.length}`} />
        <MetricCard tone="grid" density="compact" label="Predictions" primary={`${predictionCount}`} />
        <MetricCard tone="grid" density="compact" label="CLV Bets" primary={`${totalClvBets}`} />
        <MetricCard
          tone="grid"
          density="compact"
          label="Avg CLV"
          primary={`${avgClv.toFixed(1)}%`}
          primaryClassName="text-emerald-400"
        />
        <MetricCard
          tone="grid"
          density="compact"
          label="Total P&L"
          primary={`$${(totalPnl / 1000).toFixed(1)}k`}
          primaryClassName="text-emerald-400"
        />
        <MetricCard tone="grid" density="compact" label="Live / NS" primary={`${liveFixtures} / ${upcomingFixtures}`} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Model Families */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Model Families</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {MODEL_FAMILIES.map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-md bg-muted/50 px-3 py-2">
                  <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", statusColor[m.status])} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.targetType}</div>
                  </div>
                  <div className="text-right shrink-0 space-y-0.5">
                    <div className="text-sm font-mono font-semibold">{(m.accuracy * 100).toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">{m.clvBps} bps CLV</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-muted-foreground">{m.fixtures} fix</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* League Coverage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">League Coverage & Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <WidgetScroll axes="horizontal" scrollbarSize="thin">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b">
                    <th className="text-left py-1.5 font-medium">League</th>
                    <th className="text-right py-1.5 font-medium">Seasons</th>
                    <th className="text-right py-1.5 font-medium">Fixtures</th>
                    <th className="text-right py-1.5 font-medium">Accuracy</th>
                    <th className="text-right py-1.5 font-medium">CLV bps</th>
                    <th className="text-right py-1.5 font-medium">ROI</th>
                    <th className="text-right py-1.5 font-medium">Edge Decay</th>
                  </tr>
                </thead>
                <tbody>
                  {LEAGUE_RESEARCH.map((l) => (
                    <tr key={l.league} className="border-b border-muted/30 hover:bg-muted/30">
                      <td className="py-1.5 font-medium">{l.league}</td>
                      <td className="text-right py-1.5">{l.seasons}</td>
                      <td className="text-right py-1.5 font-mono">{l.fixtures.toLocaleString()}</td>
                      <td
                        className={cn(
                          "text-right py-1.5 font-mono",
                          l.modelAccuracy >= 0.65 ? "text-emerald-500" : "text-amber-500",
                        )}
                      >
                        {(l.modelAccuracy * 100).toFixed(1)}%
                      </td>
                      <td
                        className={cn(
                          "text-right py-1.5 font-mono",
                          l.avgClvBps >= 2 ? "text-emerald-500" : "text-amber-500",
                        )}
                      >
                        {l.avgClvBps}
                      </td>
                      <td
                        className={cn(
                          "text-right py-1.5 font-mono",
                          l.roiPct >= 5 ? "text-emerald-500" : l.roiPct >= 0 ? "text-amber-500" : "text-rose-500",
                        )}
                      >
                        {l.roiPct}%
                      </td>
                      <td className="text-right py-1.5 text-muted-foreground">{l.edgeDecay}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </WidgetScroll>
          </CardContent>
        </Card>
      </div>

      {/* Standings leagues loaded */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Feature Pipeline Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {[
              { label: "Calculator Groups", value: "22" },
              { label: "Derived Features", value: "635+" },
              { label: "Odds Features", value: "120+" },
              { label: "Standings Leagues", value: `${standingsLeagues}` },
              { label: "Feature Freshness", value: "< 30m" },
              { label: "GCS Sharding", value: "fixture-based" },
            ].map((item) => (
              <div key={item.label} className="rounded-md bg-muted/50 p-3 text-center">
                <div className="text-lg font-mono font-bold">{item.value}</div>
                <div className="text-xs text-muted-foreground">{item.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CLV by market */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">CLV Performance by Market & Bookmaker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {clvRecords.map((r, i) => (
              <div key={i} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{r.marketType}</span>
                  <span className="text-xs text-muted-foreground">via {r.bookmakerKey}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span>{r.totalBets} bets</span>
                  <span className="text-emerald-500 font-mono">
                    {r.clvHitRate > 0 ? (r.clvHitRate * 100).toFixed(1) : 0}% hit
                  </span>
                  <span className="font-mono">{r.meanClvPct}% avg CLV</span>
                  <span className={cn("font-mono font-bold", r.totalPnl >= 0 ? "text-emerald-500" : "text-rose-500")}>
                    ${r.totalPnl.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
