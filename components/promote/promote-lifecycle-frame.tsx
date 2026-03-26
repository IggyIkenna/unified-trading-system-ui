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
    <>
      {!onPipeline && <PromoteStrategyContextBar />}
      {children}
    </>
  );
}
