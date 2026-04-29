"use client";

import { DartScopeBar } from "@/components/shell/dart-scope-bar";
import { ServiceTabs, BUILD_TABS, LIVE_ASOF_VISIBLE } from "@/components/shell/service-tabs";
import { LiveAsOfToggle } from "@/components/platform/live-asof-toggle";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { useAuth } from "@/hooks/use-auth";

export default function ResearchServiceLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <>
      <div className="px-4 pt-3">
        <DartScopeBar />
      </div>
      <ServiceTabs
        tabs={BUILD_TABS}
        entitlements={user?.entitlements}
        rightSlot={LIVE_ASOF_VISIBLE.build ? <LiveAsOfToggle /> : undefined}
      />
      <ErrorBoundary>{children}</ErrorBoundary>
    </>
  );
}
