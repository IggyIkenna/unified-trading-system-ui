"use client";

import { ServiceTabs, EXECUTE_TABS, LIVE_ASOF_VISIBLE } from "@/components/shell/service-tabs";
import { LiveAsOfToggle } from "@/components/platform/live-asof-toggle";
import { ResearchFamilyShell } from "@/components/platform/research-family-shell";
import { ErrorBoundary } from "@/components/shared/error-boundary";

export default function ExecutionServiceLayout({ children }: { children: React.ReactNode }) {
  return (
    <ResearchFamilyShell
      platform="execution"
      tabs={<ServiceTabs tabs={EXECUTE_TABS} rightSlot={LIVE_ASOF_VISIBLE.execute ? <LiveAsOfToggle /> : undefined} />}
    >
      <ErrorBoundary>{children}</ErrorBoundary>
    </ResearchFamilyShell>
  );
}
