"use client";

import { Rocket } from "lucide-react";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { PROMOTE_PIPELINE_HREF } from "@/lib/config/services/promote.config";
import { usePromoteLifecycleStore } from "@/lib/stores/promote-lifecycle-store";
import { PromoteStrategyContextBar } from "@/components/promote/promote-strategy-context-bar";

export function PromoteLifecycleFrame({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "";
  const candidates = usePromoteLifecycleStore((s) => s.candidates);
  const onPipeline =
    pathname === PROMOTE_PIPELINE_HREF ||
    pathname === `${PROMOTE_PIPELINE_HREF}/`;

  return (
    <div className="h-full bg-background flex flex-col">
      <main className="flex-1 p-4 space-y-4 overflow-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-3 py-2 bg-secondary/30 rounded-lg border border-border">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-9 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
              <Rocket className="size-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold tracking-tight">
                Strategy Promotion
              </h1>
              <p className="text-xs text-muted-foreground truncate">
                Review, assess, and approve strategies for live deployment —{" "}
                {candidates.length} in pipeline
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant="outline"
              className="text-[10px] bg-amber-500/15 text-amber-400 border-amber-500/30"
            >
              {candidates.filter((c) => c.currentStage === "governance").length}{" "}
              awaiting approval
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              AUM: $108M
            </Badge>
          </div>
        </div>

        {!onPipeline && <PromoteStrategyContextBar />}

        {children}
      </main>
    </div>
  );
}
