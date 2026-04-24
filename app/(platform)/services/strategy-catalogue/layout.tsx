"use client";

import {
  ServiceTabs,
  STRATEGY_CATALOGUE_SUB_TABS,
} from "@/components/shell/service-tabs";
import { AvailabilityStoreProvider } from "@/lib/architecture-v2";
import { useAuth } from "@/hooks/use-auth";

export default function StrategyCatalogueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Admin users see the full matrix regardless of persona filters — see
  // plans/active/ui_unification_v2_sanitisation_2026_04_20.plan.md
  // `p6-admin-sees-full-catalogue`.
  //
  // Do NOT wrap in ResearchFamilyShell — this is the Tier-3 client surface
  // (Reality + FOMO + admin-universe + admin-editor view modes). Signals-In
  // clients lack strategy-full but still need to see the FOMO feed + their
  // subscriptions. The StrategyCatalogueSurface applies persona-aware
  // visibility per view mode.
  const { user } = useAuth();
  const adminBypass = user?.role === "admin";
  return (
    <AvailabilityStoreProvider adminBypass={adminBypass}>
      <div className="flex flex-col h-full">
        <ServiceTabs
          tabs={STRATEGY_CATALOGUE_SUB_TABS}
          className="bg-muted/20 border-b-0"
        />
        <div className="flex-1 min-h-0 overflow-auto">{children}</div>
      </div>
    </AvailabilityStoreProvider>
  );
}
