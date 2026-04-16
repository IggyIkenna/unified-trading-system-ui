import { Activity, BarChart3, Brain, FileText, Table2, Target, Trophy, Wallet, Zap } from "lucide-react";
import { registerPresets } from "../preset-registry";
import { registerWidget } from "../widget-registry";
import { SportsArbWidget } from "./sports-arb-widget";
import { SportsCLVWidget } from "./sports-clv-widget";
import { SportsFixtureDetailWidget } from "./sports-fixture-detail-widget";
import { SportsFixturesWidget } from "./sports-fixtures-widget";
import { SportsLiveScoresWidget } from "./sports-live-scores-widget";
import { SportsMLStatusWidget } from "./sports-ml-status-widget";
import { SportsMyBetsWidget } from "./sports-my-bets-widget";
import { SportsPredictionsWidget } from "./sports-predictions-widget";
import { SportsStandingsWidget } from "./sports-standings-widget";

registerPresets("sports", [
  {
    id: "sports-default",
    name: "Default",
    tab: "sports",
    isPreset: true,
    layouts: [
      { widgetId: "sports-fixtures", instanceId: "sports-fixtures-1", x: 0, y: 0, w: 8, h: 10 },
      { widgetId: "sports-fixture-detail", instanceId: "sports-fixture-detail-1", x: 8, y: 0, w: 4, h: 10 },
      { widgetId: "sports-my-bets", instanceId: "sports-my-bets-1", x: 0, y: 10, w: 12, h: 4 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "sports-arb-focus",
    name: "Arb focus",
    tab: "sports",
    isPreset: true,
    layouts: [
      { widgetId: "sports-arb", instanceId: "sports-arb-1", x: 0, y: 0, w: 6, h: 7 },
      { widgetId: "sports-fixtures", instanceId: "sports-fixtures-1", x: 6, y: 0, w: 6, h: 7 },
      { widgetId: "sports-live-scores", instanceId: "sports-live-scores-1", x: 0, y: 7, w: 12, h: 1 },
      { widgetId: "sports-my-bets", instanceId: "sports-my-bets-1", x: 0, y: 8, w: 12, h: 4 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "sports-full",
    name: "Full",
    tab: "sports",
    isPreset: true,
    layouts: [
      { widgetId: "sports-live-scores", instanceId: "sports-live-scores-full", x: 0, y: 0, w: 12, h: 1 },
      { widgetId: "sports-fixtures", instanceId: "sports-fixtures-full", x: 0, y: 1, w: 8, h: 10 },
      { widgetId: "sports-fixture-detail", instanceId: "sports-fixture-detail-full", x: 8, y: 1, w: 4, h: 8 },
      { widgetId: "sports-standings", instanceId: "sports-standings-full", x: 8, y: 9, w: 4, h: 6 },
      { widgetId: "sports-predictions", instanceId: "sports-predictions-full", x: 8, y: 15, w: 4, h: 8 },
      { widgetId: "sports-arb", instanceId: "sports-arb-full", x: 0, y: 11, w: 8, h: 6 },
      { widgetId: "sports-clv", instanceId: "sports-clv-full", x: 0, y: 17, w: 8, h: 4 },
      { widgetId: "sports-ml-status", instanceId: "sports-ml-status-full", x: 0, y: 23, w: 12, h: 6 },
      { widgetId: "sports-my-bets", instanceId: "sports-my-bets-full", x: 0, y: 29, w: 12, h: 5 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
]);

registerWidget({
  id: "sports-fixtures",
  label: "Fixtures",
  description: "Fixture list with integrated filters, live pulse, scores, and selection for detail.",
  icon: Trophy,
  minW: 4,
  minH: 6,
  defaultW: 8,
  defaultH: 10,
  requiredEntitlements: ["execution-basic", "execution-full"],
  category: "Sports",
  availableOn: ["sports"],
  singleton: true,
  component: SportsFixturesWidget,
});

registerWidget({
  id: "sports-fixture-detail",
  label: "Fixture Detail",
  description: "Stats, timeline, odds movement, and trade panel for the selected match.",
  icon: FileText,
  minW: 4,
  minH: 5,
  defaultW: 4,
  defaultH: 8,
  requiredEntitlements: ["execution-basic", "execution-full"],
  category: "Sports",
  availableOn: ["sports"],
  singleton: true,
  component: SportsFixtureDetailWidget,
});

registerWidget({
  id: "sports-arb",
  label: "Arb Scanner",
  description: "Odds grid and live arb stream with minimum arb threshold.",
  icon: Zap,
  minW: 4,
  minH: 4,
  defaultW: 6,
  defaultH: 6,
  requiredEntitlements: ["execution-basic", "execution-full"],
  category: "Sports",
  availableOn: ["sports"],
  singleton: true,
  component: SportsArbWidget,
});

registerWidget({
  id: "sports-my-bets",
  label: "My Bets",
  description: "KPI strip, open/settled tables, and accumulators.",
  icon: Wallet,
  minW: 4,
  minH: 3,
  defaultW: 12,
  defaultH: 5,
  requiredEntitlements: ["execution-basic", "execution-full"],
  category: "Sports",
  availableOn: ["sports"],
  singleton: true,
  component: SportsMyBetsWidget,
});

registerWidget({
  id: "sports-live-scores",
  label: "Live Scores",
  description: "Compact horizontal ticker of live and suspended fixtures.",
  icon: Activity,
  minW: 3,
  minH: 1,
  defaultW: 12,
  defaultH: 1,
  requiredEntitlements: ["execution-basic", "execution-full"],
  category: "Sports",
  availableOn: ["sports"],
  singleton: false,
  component: SportsLiveScoresWidget,
});

registerWidget({
  id: "sports-standings",
  label: "Standings",
  description: "League table with form, goal difference, and qualification zones.",
  icon: Table2,
  minW: 4,
  minH: 5,
  defaultW: 4,
  defaultH: 8,
  requiredEntitlements: ["sports-trading"],
  category: "Sports",
  availableOn: ["sports"],
  singleton: true,
  component: SportsStandingsWidget,
});

registerWidget({
  id: "sports-clv",
  label: "CLV Performance",
  description: "Closing line value tracking — hit rate, mean CLV, P&L by market and bookmaker.",
  icon: BarChart3,
  minW: 4,
  minH: 3,
  defaultW: 12,
  defaultH: 4,
  requiredEntitlements: ["sports-trading"],
  category: "Sports",
  availableOn: ["sports"],
  singleton: true,
  component: SportsCLVWidget,
});

registerWidget({
  id: "sports-predictions",
  label: "Model Predictions",
  description: "ML model predictions for upcoming fixtures — 1X2, xG, BTTS, O/U probabilities.",
  icon: Target,
  minW: 4,
  minH: 5,
  defaultW: 4,
  defaultH: 8,
  requiredEntitlements: ["sports-trading"],
  category: "Sports",
  availableOn: ["sports"],
  singleton: true,
  component: SportsPredictionsWidget,
});

registerWidget({
  id: "sports-ml-status",
  label: "ML Pipeline",
  description: "Training status, model families, feature freshness, and accuracy metrics.",
  icon: Brain,
  minW: 4,
  minH: 4,
  defaultW: 12,
  defaultH: 6,
  requiredEntitlements: ["sports-trading"],
  category: "Sports",
  availableOn: ["sports"],
  singleton: true,
  component: SportsMLStatusWidget,
});
