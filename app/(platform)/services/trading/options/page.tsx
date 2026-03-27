"use client";

import { OptionsFuturesPanel } from "@/components/trading/options-futures-panel";

export default function OptionsFuturesPage() {
  return (
    <div className="flex flex-col h-full p-3">
      <OptionsFuturesPanel className="flex-1 min-h-0" />
    </div>
  );
}
