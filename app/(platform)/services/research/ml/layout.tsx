"use client";

import { ServiceTabs, ML_SUB_TABS } from "@/components/shell/service-tabs";
import { ResearchFamilyShell } from "@/components/platform/research-family-shell";
import { PageEntitlementGate } from "@/components/platform/page-entitlement-gate";

export default function MLSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageEntitlementGate entitlement="ml-full" featureName="ML Models & Signals">
      <ResearchFamilyShell
        platform="ml"
        tabs={
          <ServiceTabs tabs={ML_SUB_TABS} className="bg-muted/20 border-b-0" />
        }
      >
        {children}
      </ResearchFamilyShell>
    </PageEntitlementGate>
  );
}
