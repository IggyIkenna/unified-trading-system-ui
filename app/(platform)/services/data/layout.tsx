"use client";

import { ServiceTabs, DATA_TABS } from "@/components/shell/service-tabs";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { EntitlementGate } from "@/components/platform/entitlement-gate";
import { useAuth } from "@/hooks/use-auth";

export default function DataServiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  return (
    <>
      <ServiceTabs tabs={DATA_TABS} entitlements={user?.entitlements} />
      <EntitlementGate entitlement="data-basic" serviceName="Data">
        <ErrorBoundary>{children}</ErrorBoundary>
      </EntitlementGate>
    </>
  );
}
