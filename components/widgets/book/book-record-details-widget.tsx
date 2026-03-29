"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { CollapsibleSection } from "@/components/shared/collapsible-section";
import { useBookTradeData } from "./book-data-context";

export function BookRecordDetailsWidget(_props: WidgetComponentProps) {
  const { executionMode, counterparty, setCounterparty, sourceReference, setSourceReference, fee, setFee } =
    useBookTradeData();

  if (executionMode !== "record_only") {
    return (
      <div className="p-2 text-[11px] text-muted-foreground">
        Switch to Record Only mode for counterparty and fee fields.
      </div>
    );
  }

  return (
    <div className="p-2">
      <CollapsibleSection title="Off-book reference & fees" defaultOpen>
        <Card className="border-0 shadow-none">
          <CardContent className="space-y-3 pt-1 px-2 pb-2">
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">Counterparty</label>
              <Input
                value={counterparty}
                onChange={(e) => setCounterparty(e.target.value)}
                placeholder="e.g. Goldman Sachs, Jump Trading"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">Source Reference</label>
              <Input
                value={sourceReference}
                onChange={(e) => setSourceReference(e.target.value)}
                placeholder="e.g. Bloomberg ticket ID, chat reference"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">Fee</label>
              <Input
                type="number"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                placeholder="0.00"
                className="h-8 font-mono text-xs"
              />
            </div>
          </CardContent>
        </Card>
      </CollapsibleSection>
    </div>
  );
}
