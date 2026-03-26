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
    <div className="flex min-h-0 flex-1 flex-col">
      <PromoteLifecycleSubTabs />
      <div className="platform-page-width mx-auto flex min-h-0 w-full flex-1 flex-col px-6 pb-6 pt-2">
        <PromoteSplitLayout>{children}</PromoteSplitLayout>
      </div>
    </div>
  );
}
