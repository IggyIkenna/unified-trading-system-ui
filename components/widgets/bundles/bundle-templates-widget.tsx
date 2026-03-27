"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CollapsibleSection } from "@/components/widgets/shared";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { getOperationBadgeClass } from "@/lib/utils/bundles";
import { ArrowRight, FileText } from "lucide-react";
import { useBundlesData } from "./bundles-data-context";

export function BundleTemplatesWidget(_props: WidgetComponentProps) {
  const { templates, loadTemplate, showTemplates, setShowTemplates, steps } = useBundlesData();

  if (!showTemplates) {
    return (
      <div className="p-2 flex flex-col gap-2 h-full min-h-0">
        <p className="text-[10px] text-muted-foreground">
          {steps.length > 0
            ? "Templates stay tucked away while you edit legs."
            : "Template gallery is hidden. Open it to load a pre-built flow, or add legs from Execution Steps."}
        </p>
        <Button variant="outline" size="sm" className="text-xs w-fit" onClick={() => setShowTemplates(true)}>
          <FileText className="size-3 mr-1.5" />
          Show pre-built gallery
        </Button>
      </div>
    );
  }

  return (
    <div className="p-2 flex flex-col gap-2 h-full min-h-0 overflow-auto">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pick a starting point</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {templates.map((template) => (
          <button
            key={template.name}
            type="button"
            className="w-full p-2.5 rounded-lg border text-left hover:bg-muted/20 transition-colors"
            onClick={() => loadTemplate(template)}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-medium truncate">{template.name}</span>
                <Badge variant="secondary" className="text-[9px] px-1 py-0 shrink-0">
                  {template.category}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-[10px] shrink-0">
                <span className="text-rose-400 font-mono">-${template.estimatedCost.toFixed(0)}</span>
                {template.estimatedProfit > 0 && (
                  <span className="text-emerald-400 font-mono">+${template.estimatedProfit.toFixed(0)}</span>
                )}
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{template.description}</p>
            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
              {template.steps.map((s, i) => (
                <React.Fragment key={i}>
                  <Badge
                    variant="outline"
                    className={cn("text-[8px] px-1 py-0", getOperationBadgeClass(s.operationType))}
                  >
                    {s.operationType}
                  </Badge>
                  {i < template.steps.length - 1 && <ArrowRight className="size-2.5 text-muted-foreground shrink-0" />}
                </React.Fragment>
              ))}
            </div>
          </button>
        ))}
      </div>
      <CollapsibleSection title="Why templates?" defaultOpen={false}>
        <p className="text-[10px] text-muted-foreground px-2 pb-2">
          Each template loads a realistic multi-leg flow. You can still add, remove, or reorder legs afterward.
        </p>
      </CollapsibleSection>
      <Separator />
      <Button variant="ghost" size="sm" className="text-xs h-8 w-fit" onClick={() => setShowTemplates(false)}>
        Hide gallery
      </Button>
    </div>
  );
}
