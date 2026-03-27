"use client";

import { Button } from "@/components/ui/button";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { FileText } from "lucide-react";

export function PnlReportButtonWidget(_props: WidgetComponentProps) {
  return (
    <div className="flex items-center justify-center h-full p-2">
      <Button variant="outline" size="sm" className="gap-2 w-full max-w-[200px]">
        <FileText className="size-4" />
        Generate Report
      </Button>
    </div>
  );
}
