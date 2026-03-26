"use client";

import { PaperTradingTab } from "@/components/promote/paper-trading-tab";
import { PromoteLifecycleStagePage } from "@/components/promote/promote-lifecycle-stage-page";

export default function PromotePaperTradingPage() {
  return (
    <PromoteLifecycleStagePage gateStage="paper_trading">
      {(strategy) => <PaperTradingTab strategy={strategy} />}
    </PromoteLifecycleStagePage>
  );
}
