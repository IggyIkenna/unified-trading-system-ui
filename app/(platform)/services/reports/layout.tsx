"use client";

import { DartScopeBar } from "@/components/shell/dart-scope-bar";
import { ServiceTabs, REPORTS_TABS } from "@/components/shell/service-tabs";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { EntitlementGate } from "@/components/platform/entitlement-gate";
import { useAuth } from "@/hooks/use-auth";

export default function ReportsServiceLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <>
      <div className="px-4 pt-3">
        <DartScopeBar />
      </div>
      <ServiceTabs tabs={REPORTS_TABS} entitlements={user?.entitlements} />
      <EntitlementGate entitlement="reporting" serviceName="Reports">
        <ErrorBoundary>{children}</ErrorBoundary>
      </EntitlementGate>
    </>
  );
}
