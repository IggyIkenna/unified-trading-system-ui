"use client";

import { TerminalModeTabs } from "@/components/cockpit/terminal-mode-tabs";
import { DartScopeBar } from "@/components/shell/dart-scope-bar";
import { ServiceTabs, OBSERVE_TABS, LIVE_ASOF_VISIBLE } from "@/components/shell/service-tabs";
import { LiveAsOfToggle } from "@/components/platform/live-asof-toggle";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { EntitlementGate } from "@/components/platform/entitlement-gate";
import { useAuth } from "@/hooks/use-auth";

export default function ObserveServiceLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <>
      <div className="px-4 pt-3">
        <DartScopeBar />
      </div>
      {/* TerminalModeTabs — Observe routes anchor the Explain + Ops modes
          per dart_ux_cockpit_refactor §5.2 + §17 Phase 3. Active-mode
          resolution is route-driven (terminalModeForPath). */}
      <TerminalModeTabs />
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
