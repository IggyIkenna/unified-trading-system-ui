"use client";

import { StrategyInstructionViewer } from "@/components/trading/strategy-instruction-viewer";

export default function InstructionsPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Strategy Instructions</h1>
          <p className="text-sm text-muted-foreground">
            Signal → Instruction → Fill pipeline — what strategies want vs what
            executed
          </p>
        </div>
      </div>
      <StrategyInstructionViewer />
    </div>
  );
}
