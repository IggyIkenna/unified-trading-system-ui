"use client";

import {
  ServiceTabs,
  STRATEGY_CATALOGUE_SUB_TABS,
} from "@/components/shell/service-tabs";
import { ResearchFamilyShell } from "@/components/platform/research-family-shell";
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
  const { user } = useAuth();
  const adminBypass = user?.role === "admin";
  return (
    <AvailabilityStoreProvider adminBypass={adminBypass}>
      <ResearchFamilyShell
        platform="strategy"
        showBatchLiveRail={false}
        tabs={
          <ServiceTabs
            tabs={STRATEGY_CATALOGUE_SUB_TABS}
            className="bg-muted/20 border-b-0"
          />
        }
      >
        {children}
      </ResearchFamilyShell>
    </AvailabilityStoreProvider>
  );
}
