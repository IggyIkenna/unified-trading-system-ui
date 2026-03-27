"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { InstructionPipelineRows } from "./instruction-pipeline-rows";
import { useInstructionsData } from "./instructions-data-context";

export function InstructionsPipelineTableWidget(_props: WidgetComponentProps) {
  const { refresh } = useInstructionsData();

  return (
    <div className="flex flex-col h-full min-h-0 border border-border rounded-md overflow-hidden bg-card">
      <div className="flex items-center justify-end gap-2 px-2 py-1 border-b border-border shrink-0">
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1.5" type="button" onClick={refresh}>
          <RefreshCw className="size-3" />
          Refresh
        </Button>
      </div>
      <div className="flex flex-col flex-1 min-h-0">
        <InstructionPipelineRows fillHeight />
      </div>
    </div>
  );
}
