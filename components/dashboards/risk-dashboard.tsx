"use client";

import { BreachesPage } from "./risk/risk-breaches-page";
import { GreeksPage } from "./risk/risk-greeks-page";
import { LimitsPage } from "./risk/risk-limits-page";
import { RiskOverview } from "./risk/risk-overview";
import { StressTestsPage } from "./risk/risk-stress-page";
import { VaRPage } from "./risk/risk-var-page";
import { WhatIfPage } from "./risk/risk-whatif-page";

interface RiskDashboardProps {
  currentPage: string;
}

export function RiskDashboard({ currentPage }: RiskDashboardProps) {
  switch (currentPage) {
    case "greeks":
      return <GreeksPage />;
    case "var":
      return <VaRPage />;
    case "stress":
      return <StressTestsPage />;
    case "whatif":
      return <WhatIfPage />;
    case "limits":
      return <LimitsPage />;
    case "breaches":
      return <BreachesPage />;
    case "dashboard":
    default:
      return <RiskOverview />;
  }
}
