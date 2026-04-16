"use client";

import { cn } from "@/lib/utils";

interface ModelFamily {
  id: string;
  name: string;
  targets: string[];
  lastTrained: string;
  accuracy: number;
  status: "healthy" | "stale" | "training" | "failed";
  featureCount: number;
  trainingDuration: string;
  nextScheduled: string;
}

interface FeatureFreshness {
  group: string;
  columns: number;
  lastUpdated: string;
  staleness: "fresh" | "ok" | "stale";
  coverage: number;
}

const MOCK_MODEL_FAMILIES: ModelFamily[] = [
  {
    id: "pregame_fundamental",
    name: "Pre-Game Fundamental",
    targets: ["home_xg", "away_xg", "goal_diff", "total_goals", "home_win_flag"],
    lastTrained: "2026-04-15T06:00:00Z",
    accuracy: 0.684,
    status: "healthy",
    featureCount: 312,
    trainingDuration: "14m 22s",
    nextScheduled: "2026-04-16T06:00:00Z",
  },
  {
    id: "pregame_market",
    name: "Pre-Game Market (CLV)",
    targets: ["home_clv_bps", "draw_clv_bps", "away_clv_bps"],
    lastTrained: "2026-04-15T06:15:00Z",
    accuracy: 0.627,
    status: "healthy",
    featureCount: 285,
    trainingDuration: "11m 08s",
    nextScheduled: "2026-04-16T06:00:00Z",
  },
  {
    id: "ht_fundamental",
    name: "Half-Time Fundamental",
    targets: ["home_xg_2h", "away_xg_2h", "next_goal_team"],
    lastTrained: "2026-04-14T06:00:00Z",
    accuracy: 0.591,
    status: "stale",
    featureCount: 248,
    trainingDuration: "9m 45s",
    nextScheduled: "2026-04-15T18:00:00Z",
  },
  {
    id: "ht_market",
    name: "Half-Time Market (CLV)",
    targets: ["clv_bps", "move_direction_flag"],
    lastTrained: "2026-04-14T06:15:00Z",
    accuracy: 0.553,
    status: "stale",
    featureCount: 198,
    trainingDuration: "7m 33s",
    nextScheduled: "2026-04-15T18:00:00Z",
  },
  {
    id: "meta",
    name: "Meta (Bet Quality)",
    targets: ["bet_quality_score", "positive_roi_flag"],
    lastTrained: "2026-04-15T07:00:00Z",
    accuracy: 0.715,
    status: "healthy",
    featureCount: 635,
    trainingDuration: "18m 55s",
    nextScheduled: "2026-04-16T07:00:00Z",
  },
];

const MOCK_FEATURE_FRESHNESS: FeatureFreshness[] = [
  { group: "team_form", columns: 48, lastUpdated: "2026-04-15T05:30:00Z", staleness: "fresh", coverage: 1.0 },
  { group: "team_xg", columns: 36, lastUpdated: "2026-04-15T05:30:00Z", staleness: "fresh", coverage: 0.98 },
  { group: "odds_features", columns: 120, lastUpdated: "2026-04-15T08:00:00Z", staleness: "fresh", coverage: 0.95 },
  { group: "h2h", columns: 28, lastUpdated: "2026-04-14T06:00:00Z", staleness: "ok", coverage: 0.92 },
  { group: "injury_impact", columns: 18, lastUpdated: "2026-04-14T12:00:00Z", staleness: "ok", coverage: 0.88 },
  { group: "weather", columns: 12, lastUpdated: "2026-04-13T06:00:00Z", staleness: "stale", coverage: 0.75 },
  { group: "elo", columns: 8, lastUpdated: "2026-04-15T05:30:00Z", staleness: "fresh", coverage: 1.0 },
  { group: "poisson_xg", columns: 24, lastUpdated: "2026-04-15T05:30:00Z", staleness: "fresh", coverage: 0.97 },
];

const statusColors: Record<ModelFamily["status"], string> = {
  healthy: "bg-emerald-500",
  stale: "bg-amber-500",
  training: "bg-blue-500 animate-pulse",
  failed: "bg-red-500",
};

const stalenessColors: Record<FeatureFreshness["staleness"], string> = {
  fresh: "text-emerald-400",
  ok: "text-amber-400",
  stale: "text-red-400",
};

function timeSince(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 1) return `${Math.floor(ms / (1000 * 60))}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function SportsMLStatusWidget() {
  const healthyCount = MOCK_MODEL_FAMILIES.filter((m) => m.status === "healthy").length;
  const avgAccuracy = MOCK_MODEL_FAMILIES.reduce((s, m) => s + m.accuracy, 0) / MOCK_MODEL_FAMILIES.length;
  const freshCount = MOCK_FEATURE_FRESHNESS.filter((f) => f.staleness === "fresh").length;
  const totalFeatures = MOCK_FEATURE_FRESHNESS.reduce((s, f) => s + f.columns, 0);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800 shrink-0">
        <span className="text-xs font-black uppercase tracking-widest text-zinc-500">
          ML Pipeline Status
        </span>
        <span className="ml-auto text-[10px] text-zinc-600">
          {MOCK_MODEL_FAMILIES.length} families
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* KPI strip */}
        <div className="grid grid-cols-4 gap-2 p-3 border-b border-zinc-800">
          <div className="text-center">
            <div className="text-lg font-mono font-bold text-emerald-400">
              {healthyCount}/{MOCK_MODEL_FAMILIES.length}
            </div>
            <div className="text-[10px] text-zinc-500">Models Healthy</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-mono font-bold text-zinc-200">
              {(avgAccuracy * 100).toFixed(1)}%
            </div>
            <div className="text-[10px] text-zinc-500">Avg Accuracy</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-mono font-bold text-blue-400">
              {freshCount}/{MOCK_FEATURE_FRESHNESS.length}
            </div>
            <div className="text-[10px] text-zinc-500">Features Fresh</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-mono font-bold text-zinc-200">{totalFeatures}</div>
            <div className="text-[10px] text-zinc-500">Total Columns</div>
          </div>
        </div>

        {/* Model families */}
        <div className="p-2 space-y-1">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-1 py-1">
            Model Families
          </div>
          {MOCK_MODEL_FAMILIES.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded bg-zinc-900/40 hover:bg-zinc-800/60"
            >
              <div className={cn("w-2 h-2 rounded-full shrink-0", statusColors[m.status])} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-zinc-200 truncate">{m.name}</div>
                <div className="text-[10px] text-zinc-500 truncate">
                  {m.targets.slice(0, 3).join(", ")}
                  {m.targets.length > 3 && ` +${m.targets.length - 3}`}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-mono font-bold text-zinc-200">
                  {(m.accuracy * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] text-zinc-500">{timeSince(m.lastTrained)}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Feature freshness */}
        <div className="p-2 space-y-1 border-t border-zinc-800">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-1 py-1">
            Feature Freshness
          </div>
          <div className="grid grid-cols-2 gap-1">
            {MOCK_FEATURE_FRESHNESS.map((f) => (
              <div
                key={f.group}
                className="flex items-center justify-between px-2 py-1 rounded bg-zinc-900/40"
              >
                <div>
                  <div className="text-[10px] font-medium text-zinc-300">{f.group}</div>
                  <div className="text-[9px] text-zinc-600">{f.columns} cols</div>
                </div>
                <div className="text-right">
                  <div className={cn("text-[10px] font-mono font-bold", stalenessColors[f.staleness])}>
                    {(f.coverage * 100).toFixed(0)}%
                  </div>
                  <div className="text-[9px] text-zinc-600">{timeSince(f.lastUpdated)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
