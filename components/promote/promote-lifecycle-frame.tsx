"use client";

import { usePathname } from "next/navigation";
import { PROMOTE_PIPELINE_HREF } from "@/lib/config/services/promote.config";
import { PromoteStrategyContextBar } from "@/components/promote/promote-strategy-context-bar";

export function PromoteLifecycleFrame({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "";
  const onPipeline =
    pathname === PROMOTE_PIPELINE_HREF ||
    pathname === `${PROMOTE_PIPELINE_HREF}/`;

  return (
    <div className="h-full bg-background flex flex-col">
      <main className="flex-1 p-4 space-y-4 overflow-auto">
        {!onPipeline && <PromoteStrategyContextBar />}
        {children}
      </main>
    </div>
  );
}
