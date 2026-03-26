"use client";

import { GovernanceTab } from "@/components/promote/governance-tab";
import { PromoteLifecycleStagePage } from "@/components/promote/promote-lifecycle-stage-page";

export default function PromoteGovernancePage() {
  return (
    <PromoteLifecycleStagePage gateStage="governance">
      {(strategy) => <GovernanceTab strategy={strategy} />}
    </PromoteLifecycleStagePage>
  );
}
