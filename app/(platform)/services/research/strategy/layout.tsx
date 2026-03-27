"use client";

import {
  ServiceTabs,
  STRATEGY_SUB_TABS,
} from "@/components/shell/service-tabs";
import { ResearchFamilyShell } from "@/components/platform/research-family-shell";

export default function StrategySectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ResearchFamilyShell
      platform="strategy"
      tabs={
        <ServiceTabs
          tabs={STRATEGY_SUB_TABS}
          className="bg-muted/20 border-b-0"
        />
      }
    >
      {children}
    </ResearchFamilyShell>
  );
}
