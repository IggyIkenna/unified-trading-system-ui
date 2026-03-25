"use client";

import { ServiceTabs, ML_SUB_TABS } from "@/components/shell/service-tabs";

export default function MLSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ServiceTabs tabs={ML_SUB_TABS} className="bg-muted/20 border-b-0" />
      {children}
    </>
  );
}
