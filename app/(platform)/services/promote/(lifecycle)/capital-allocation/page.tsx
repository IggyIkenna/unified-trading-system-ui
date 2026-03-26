"use client";

import { CapitalAllocationTab } from "@/components/promote/capital-allocation-tab";
import { PromoteLifecycleStagePage } from "@/components/promote/promote-lifecycle-stage-page";

export default function PromoteCapitalAllocationPage() {
  return (
    <PromoteLifecycleStagePage gateStage="capital_allocation">
      {(strategy) => <CapitalAllocationTab strategy={strategy} />}
    </PromoteLifecycleStagePage>
  );
}
