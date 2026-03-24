"use client";

import {
  ServiceTabs,
  OBSERVE_TABS,
  LIVE_ASOF_VISIBLE,
} from "@/components/shell/service-tabs";
import { LiveAsOfToggle } from "@/components/platform/live-asof-toggle";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { EntitlementGate } from "@/components/platform/entitlement-gate";
import { useAuth } from "@/hooks/use-auth";

export default function ObserveServiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  return (
    <>
      <ServiceTabs
        tabs={OBSERVE_TABS}
        entitlements={user?.entitlements}
        rightSlot={LIVE_ASOF_VISIBLE.observe ? <LiveAsOfToggle /> : undefined}
      />
      <EntitlementGate entitlement="execution-basic" serviceName="Observe">
        <ErrorBoundary>{children}</ErrorBoundary>
      </EntitlementGate>
    </>
  );
}
