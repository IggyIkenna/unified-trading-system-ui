"use client";

import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { InstructionDetailGrid } from "./instruction-detail-grid";
import { useInstructionsData } from "./instructions-data-context";

export function InstructionsDetailPanelWidget(_props: WidgetComponentProps) {
  const { selectedInstruction } = useInstructionsData();

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto p-3 text-xs">
      {selectedInstruction ? (
        <InstructionDetailGrid inst={selectedInstruction} />
      ) : (
        <p className="text-muted-foreground text-sm py-6 text-center">
          Select a row in the instruction pipeline table to view detail here.
        </p>
      )}
    </div>
  );
}
