"use client";

import type { ReactNode } from "react";
import { ServiceTabs, PROMOTE_TABS } from "@/components/shell/service-tabs";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { EntitlementGate } from "@/components/platform/entitlement-gate";
import { PromoteWorkflowBridge } from "@/components/promote/promote-workflow-bridge";
import { useAuth } from "@/hooks/use-auth";

export default function PromoteServiceLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = useAuth();

  return (
    <>
      <ServiceTabs tabs={PROMOTE_TABS} entitlements={user?.entitlements} />
      <EntitlementGate
        entitlement="execution-basic"
        serviceName="Strategy Promotion"
      >
        <ErrorBoundary>
          <PromoteWorkflowBridge>{children}</PromoteWorkflowBridge>
        </ErrorBoundary>
      </EntitlementGate>
    </>
  );
}
