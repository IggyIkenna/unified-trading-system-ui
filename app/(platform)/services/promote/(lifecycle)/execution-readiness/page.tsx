"use client";

import { ExecutionReadinessTab } from "@/components/promote/execution-readiness-tab";
import { PromoteLifecycleStagePage } from "@/components/promote/promote-lifecycle-stage-page";

export default function PromoteExecutionReadinessPage() {
  return (
    <PromoteLifecycleStagePage gateStage="execution_readiness">
      {(strategy) => <ExecutionReadinessTab strategy={strategy} />}
    </PromoteLifecycleStagePage>
  );
}
