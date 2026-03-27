"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap } from "lucide-react";
import { InstructionsDataProvider } from "@/components/widgets/instructions/instructions-data-context";
import { InstructionsFilterWidget } from "@/components/widgets/instructions/instructions-filter-widget";
import { InstructionsSummaryWidget } from "@/components/widgets/instructions/instructions-summary-widget";
import { InstructionsPipelineTableWidget } from "@/components/widgets/instructions/instructions-pipeline-table-widget";

/** Standalone card layout using the same widgets as the instructions workspace tab. */
export function StrategyInstructionViewer({ className }: { className?: string }) {
  return (
    <InstructionsDataProvider>
      <Card className={cn("overflow-hidden flex flex-col min-h-[520px]", className)}>
        <CardHeader className="pb-2 shrink-0">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="size-4" />
            Strategy Instruction Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0 flex flex-col flex-1 min-h-0">
          <InstructionsFilterWidget instanceId="standalone-filter" />
          <InstructionsSummaryWidget instanceId="standalone-summary" />
          <div className="flex-1 min-h-0 flex flex-col">
            <InstructionsPipelineTableWidget instanceId="standalone-pipeline" />
          </div>
        </CardContent>
      </Card>
    </InstructionsDataProvider>
  );
}
