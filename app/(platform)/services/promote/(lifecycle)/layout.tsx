"use client";

import type { ReactNode } from "react";
import { PromoteLifecycleSubTabs } from "@/components/promote/promote-lifecycle-sub-tabs";
import { PromoteSplitLayout } from "@/components/promote/promote-split-layout";

export default function PromoteLifecycleSectionLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <PromoteLifecycleSubTabs />
      <PromoteSplitLayout>{children}</PromoteSplitLayout>
    </div>
  );
}
