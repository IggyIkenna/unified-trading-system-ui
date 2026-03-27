"use client";

import { ServiceTabs, ML_SUB_TABS } from "@/components/shell/service-tabs";
import { ResearchFamilyShell } from "@/components/platform/research-family-shell";

export default function MLSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ResearchFamilyShell
      platform="ml"
      tabs={
        <ServiceTabs tabs={ML_SUB_TABS} className="bg-muted/20 border-b-0" />
      }
    >
      {children}
    </ResearchFamilyShell>
  );
}
