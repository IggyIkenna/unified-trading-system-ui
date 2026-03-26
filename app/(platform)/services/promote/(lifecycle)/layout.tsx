"use client";

import type { ReactNode } from "react";
import { PromoteLifecycleSubTabs } from "@/components/promote/promote-lifecycle-sub-tabs";

export default function PromoteLifecycleSectionLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <PromoteLifecycleSubTabs />
      {children}
    </>
  );
}
