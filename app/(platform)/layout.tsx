"use client";

import { RequireAuth } from "@/components/shell/require-auth";
import { UnifiedShell } from "@/components/shell/unified-shell";
import { PersonaGate } from "@/components/platform/persona-gate";
import { DemoBanner } from "@/components/platform/DemoBanner";
import { RuntimeModeBadge } from "@/components/runtime-mode-badge";
import { useAuth } from "@/hooks/use-auth";
import { useRiskAlertNotifications } from "@/hooks/api/use-risk-alert-notifications";
import { DashboardFilterProvider } from "@/lib/context/dashboard-filter-context";

/**
 * Platform shell — THE product. Auth required.
 * Same layout for internal AND client users — data scoping is API-driven.
 */
export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RequireAuth>
        <PlatformShellInner>{children}</PlatformShellInner>
      </RequireAuth>
      <RuntimeModeBadge />
      <DemoBanner />
    </>
  );
}

function PlatformShellInner({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  // Subscribe globally so risk alerts fire toast notifications on every platform page
  useRiskAlertNotifications();

  return (
    <DashboardFilterProvider userId={user?.id ?? null}>
      <UnifiedShell
        orgName={user?.org?.name ?? "Odum Internal"}
        orgId={user?.org?.id ?? "odum-internal"}
        userName={user?.email?.split("@")[0] ?? "Trader"}
        userRole={user?.role ?? "internal"}
      >
        <PersonaGate>{children}</PersonaGate>
      </UnifiedShell>
    </DashboardFilterProvider>
  );
}
