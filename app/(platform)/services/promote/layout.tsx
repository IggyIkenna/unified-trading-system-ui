"use client";

import type { ReactNode } from "react";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { EntitlementGate } from "@/components/platform/entitlement-gate";
import { PromoteWorkflowBridge } from "@/components/promote/promote-workflow-bridge";

export default function PromoteServiceLayout({ children }: { children: ReactNode }) {
  return (
    <EntitlementGate entitlement="execution-basic" serviceName="Strategy Promotion">
      <ErrorBoundary>
        <PromoteWorkflowBridge>{children}</PromoteWorkflowBridge>
      </ErrorBoundary>
    </EntitlementGate>
  );
}
