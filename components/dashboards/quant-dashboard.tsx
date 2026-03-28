"use client";

import type { QuantDashboardProps } from "./quant/quant-types";
import { BacktestPage } from "./quant/backtest-page";
import { ConfigGridPage } from "./quant/config-grid-page";
import { FeaturesPage } from "./quant/features-page";
import { QuantOverview } from "./quant/quant-overview";
import { ResultsPage } from "./quant/results-page";
import { TrainingPage } from "./quant/training-page";

export type { QuantDashboardProps } from "./quant/quant-types";

export function QuantDashboard({ currentPage }: QuantDashboardProps) {
  switch (currentPage) {
    case "backtest":
      return <BacktestPage />;
    case "config":
      return <ConfigGridPage />;
    case "training":
      return <TrainingPage />;
    case "features":
      return <FeaturesPage />;
    case "results":
      return <ResultsPage />;
    case "dashboard":
    default:
      return <QuantOverview />;
  }
}
