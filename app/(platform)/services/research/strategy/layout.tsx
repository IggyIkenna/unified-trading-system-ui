"use client";

import {
  ServiceTabs,
  STRATEGY_SUB_TABS,
} from "@/components/shell/service-tabs";

export default function StrategySectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ServiceTabs
        tabs={STRATEGY_SUB_TABS}
        className="bg-muted/20 border-b-0"
      />
      {children}
    </>
  );
}
