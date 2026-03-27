import { registerWidget } from "../widget-registry";
import { registerPresets } from "../preset-registry";
import { Activity, FileText, Filter, Trophy, Wallet, Zap } from "lucide-react";
import { SportsFilterBarWidget } from "./sports-filter-bar-widget";
import { SportsFixturesWidget } from "./sports-fixtures-widget";
import { SportsFixtureDetailWidget } from "./sports-fixture-detail-widget";
import { SportsArbWidget } from "./sports-arb-widget";
import { SportsMyBetsWidget } from "./sports-my-bets-widget";
import { SportsLiveScoresWidget } from "./sports-live-scores-widget";

registerPresets("sports", [
  {
    id: "sports-default",
    name: "Default",
    tab: "sports",
    isPreset: true,
    layouts: [
      { widgetId: "sports-filter-bar", instanceId: "sports-filter-bar-1", x: 0, y: 0, w: 12, h: 2 },
      { widgetId: "sports-fixtures", instanceId: "sports-fixtures-1", x: 0, y: 2, w: 8, h: 8 },
      { widgetId: "sports-fixture-detail", instanceId: "sports-fixture-detail-1", x: 8, y: 2, w: 4, h: 8 },
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
      { widgetId: "sports-filter-bar", instanceId: "sports-filter-bar-1", x: 0, y: 0, w: 12, h: 2 },
      { widgetId: "sports-arb", instanceId: "sports-arb-1", x: 0, y: 2, w: 6, h: 7 },
      { widgetId: "sports-fixtures", instanceId: "sports-fixtures-1", x: 6, y: 2, w: 6, h: 7 },
      { widgetId: "sports-live-scores", instanceId: "sports-live-scores-1", x: 0, y: 9, w: 12, h: 1 },
      { widgetId: "sports-my-bets", instanceId: "sports-my-bets-1", x: 0, y: 10, w: 12, h: 4 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
]);

registerWidget({
  id: "sports-filter-bar",
  label: "Sports Filters",
  description: "Date range, status, league pills, and team search.",
  icon: Filter,
  minW: 6,
  minH: 1,
  defaultW: 12,
  defaultH: 2,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["sports"],
  singleton: true,
  component: SportsFilterBarWidget,
});

registerWidget({
  id: "sports-fixtures",
  label: "Fixtures",
  description: "Fixture list with live pulse, scores, and selection for detail.",
  icon: Trophy,
  minW: 4,
  minH: 4,
  defaultW: 8,
  defaultH: 8,
  requiredEntitlements: ["execution-basic", "execution-full"],
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
  availableOn: ["sports"],
  singleton: false,
  component: SportsLiveScoresWidget,
});
