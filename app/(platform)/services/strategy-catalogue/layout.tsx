"use client";

import {
  ServiceTabs,
  STRATEGY_CATALOGUE_SUB_TABS,
} from "@/components/shell/service-tabs";
import { ResearchFamilyShell } from "@/components/platform/research-family-shell";
import { AvailabilityStoreProvider } from "@/lib/architecture-v2";

export default function StrategyCatalogueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AvailabilityStoreProvider>
      <ResearchFamilyShell
        platform="strategy"
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
