"use client";

import { PromoteLifecycleStagePage } from "@/components/promote/promote-lifecycle-stage-page";
import { RiskStressTab } from "@/components/promote/risk-stress-tab";

export default function PromoteRiskStressPage() {
  return (
    <PromoteLifecycleStagePage>
      {(strategy) => <RiskStressTab strategy={strategy} />}
    </PromoteLifecycleStagePage>
  );
}
