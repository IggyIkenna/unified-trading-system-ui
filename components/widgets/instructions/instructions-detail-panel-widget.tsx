"use client";

import { CollapsibleSection } from "@/components/shared/collapsible-section";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { InstructionDetailGrid } from "./instruction-detail-grid";
import { useInstructionsData } from "./instructions-data-context";

export function InstructionsDetailPanelWidget(_props: WidgetComponentProps) {
  const { selectedInstruction } = useInstructionsData();

  return (
    <CollapsibleSection title="Instruction detail" defaultOpen className="h-full min-h-0 flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto text-xs p-1">
        {selectedInstruction ? (
          <InstructionDetailGrid inst={selectedInstruction} />
        ) : (
          <p className="text-muted-foreground text-sm py-6 text-center">
            Select a row in the instruction pipeline table to view detail here.
          </p>
        )}
      </div>
    </CollapsibleSection>
  );
}
