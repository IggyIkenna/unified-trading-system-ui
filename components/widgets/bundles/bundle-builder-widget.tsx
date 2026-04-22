"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CollapsibleSection } from "@/components/shared/collapsible-section";
import { KpiStrip, type KpiMetric } from "@/components/shared/kpi-strip";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { getOperationBadgeClass, getOperationColor } from "@/lib/utils/bundles";
import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Copy,
  FileText,
  GripVertical,
  Layers,
  Play,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useBundlesData } from "./bundles-data-context";
import { formatNumber } from "@/lib/utils/formatters";

export function BundleBuilderWidget(_props: WidgetComponentProps) {
  const {
    steps,
    addStep,
    removeStep,
    moveStep,
    duplicateStep,
    updateStep,
    templates,
    showTemplates,
    setShowTemplates,
    loadTemplate,
    clearSteps,
    totalCost,
    totalRevenue,
    estimatedGas,
    netPnl,
    operationTypes,
    venues,
    instruments,
    readOnly,
  } = useBundlesData();

  const hasSteps = steps.length > 0;

  const pnlMetrics: KpiMetric[] = [
    {
      label: "Buy notional",
      value: `-$${totalCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      sentiment: "negative",
    },
    {
      label: "Sell notional",
      value: `+$${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      sentiment: "positive",
    },
    {
      label: `Gas est. (${steps.length} txns)`,
      value: `-$${formatNumber(estimatedGas, 2)}`,
      sentiment: "negative",
    },
    {
      label: "Net P&L",
      value: `${netPnl >= 0 ? "+" : ""}$${netPnl.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      sentiment: netPnl >= 0 ? "positive" : "negative",
    },
  ];

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-2 pt-2 pb-1 flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">Bundle Builder</h3>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setShowTemplates(!showTemplates)}>
            <FileText className="size-3 mr-1.5" />
            {showTemplates ? "Hide templates" : "Load template"}
          </Button>
          {hasSteps && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={clearSteps} disabled={readOnly}>
              Clear all
            </Button>
          )}
        </div>
      </div>

      <WidgetScroll className="flex-1 min-h-0" viewportClassName="px-2 pb-2 space-y-3">
        {showTemplates && <TemplateGallery templates={templates} loadTemplate={loadTemplate} readOnly={readOnly} />}

        {hasSteps ? (
          <StepsSection
            steps={steps}
            addStep={addStep}
            removeStep={removeStep}
            moveStep={moveStep}
            duplicateStep={duplicateStep}
            updateStep={updateStep}
            operationTypes={operationTypes}
            venues={venues}
            instruments={instruments}
            readOnly={readOnly}
          />
        ) : (
          !showTemplates && (
            <div className="p-2 flex flex-col items-center justify-center gap-3 text-muted-foreground min-h-[120px]">
              <Layers className="size-8 opacity-30" />
              <p className="text-sm text-center">No legs in this bundle yet</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button variant="outline" size="sm" className="text-xs" onClick={addStep} disabled={readOnly}>
                  <Plus className="size-3 mr-1.5" />
                  Add leg
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setShowTemplates(true)}
                  disabled={readOnly}
                >
                  Use a template
                </Button>
              </div>
            </div>
          )
        )}

        {hasSteps && (
          <div className="space-y-2">
            <KpiStrip metrics={pnlMetrics} columns={4} className="rounded-md" />
            <CollapsibleSection title="Line breakdown" defaultOpen={false}>
              <div className="px-2 pb-2 space-y-1 text-xs">
                <div className="grid grid-cols-2 gap-1">
                  <span className="text-muted-foreground">Buy notional</span>
                  <span className="font-mono text-rose-400 text-right">
                    -${totalCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-muted-foreground">Sell notional</span>
                  <span className="font-mono text-emerald-400 text-right">
                    +${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-muted-foreground">Est. gas</span>
                  <span className="font-mono text-rose-400 text-right">-${formatNumber(estimatedGas, 2)}</span>
                  <Separator className="col-span-2 my-1" />
                  <span className="font-medium">Net P&amp;L</span>
                  <span
                    className={cn("font-mono font-bold text-right", netPnl >= 0 ? "text-emerald-400" : "text-rose-400")}
                  >
                    {netPnl >= 0 ? "+" : ""}${netPnl.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
                {netPnl < 0 && (
                  <div className="flex items-center gap-1.5 text-micro text-amber-400 pt-1">
                    <AlertTriangle className="size-3 shrink-0" />
                    Bundle shows negative expected P&amp;L
                  </div>
                )}
              </div>
            </CollapsibleSection>
          </div>
        )}
      </WidgetScroll>

      {hasSteps && (
        <div className="px-2 py-2 border-t bg-background/95 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-micro font-mono">
            {steps.length} leg{steps.length === 1 ? "" : "s"}
          </Badge>
          <div className="flex flex-1 gap-2 min-w-[200px]">
            <Button
              variant="outline"
              className="text-xs h-9 flex-1"
              type="button"
              disabled={readOnly}
              onClick={() =>
                toast.info("Simulating bundle", { description: `Running dry-run for ${steps.length} leg(s)` })
              }
            >
              <Play className="size-3.5 mr-1.5 shrink-0" />
              Simulate (dry run)
            </Button>
            <Button
              className="text-xs h-9 flex-1"
              type="button"
              disabled={readOnly}
              onClick={() =>
                toast.success("Bundle submitted", { description: `Submitted ${steps.length} leg(s) for execution` })
              }
            >
              <Send className="size-3.5 mr-1.5 shrink-0" />
              Submit bundle
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

type TemplateGalleryProps = {
  templates: ReturnType<typeof useBundlesData>["templates"];
  loadTemplate: ReturnType<typeof useBundlesData>["loadTemplate"];
  readOnly: boolean | undefined;
};

function TemplateGallery({ templates, loadTemplate, readOnly }: TemplateGalleryProps) {
  if (templates.length === 0) {
    return (
      <div className="p-2 flex flex-col items-center justify-center gap-2 text-muted-foreground min-h-[80px]">
        <FileText className="size-6 opacity-30" />
        <p className="text-xs text-center">No templates available for the current scope.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border p-2 space-y-2">
      <p className="text-micro text-muted-foreground uppercase tracking-wider">Pick a starting point</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {templates.map((template) => (
          <button
            key={template.name}
            type="button"
            className="w-full p-2.5 rounded-lg border text-left hover:bg-muted/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => loadTemplate(template)}
            disabled={readOnly}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-medium truncate">{template.name}</span>
                <Badge variant="secondary" className="text-nano px-1 py-0 shrink-0">
                  {template.category}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-micro shrink-0">
                <span className="text-rose-400 font-mono">-${formatNumber(template.estimatedCost, 0)}</span>
                {template.estimatedProfit > 0 && (
                  <span className="text-emerald-400 font-mono">+${formatNumber(template.estimatedProfit, 0)}</span>
                )}
              </div>
            </div>
            <p className="text-micro text-muted-foreground mt-0.5 line-clamp-2">{template.description}</p>
            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
              {template.steps.map((s, i) => (
                <React.Fragment key={i}>
                  <Badge
                    variant="outline"
                    className={cn("text-pico px-1 py-0", getOperationBadgeClass(s.operationType))}
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
    </div>
  );
}

type StepsSectionProps = {
  steps: ReturnType<typeof useBundlesData>["steps"];
  addStep: ReturnType<typeof useBundlesData>["addStep"];
  removeStep: ReturnType<typeof useBundlesData>["removeStep"];
  moveStep: ReturnType<typeof useBundlesData>["moveStep"];
  duplicateStep: ReturnType<typeof useBundlesData>["duplicateStep"];
  updateStep: ReturnType<typeof useBundlesData>["updateStep"];
  operationTypes: ReturnType<typeof useBundlesData>["operationTypes"];
  venues: ReturnType<typeof useBundlesData>["venues"];
  instruments: ReturnType<typeof useBundlesData>["instruments"];
  readOnly: boolean | undefined;
};

function StepsSection({
  steps,
  addStep,
  removeStep,
  moveStep,
  duplicateStep,
  updateStep,
  operationTypes,
  venues,
  instruments,
  readOnly,
}: StepsSectionProps) {
  return (
    <div className="space-y-3">
      <p className="text-micro text-muted-foreground uppercase tracking-wider">Visual order</p>

      <div className="flex items-center gap-1 px-1 py-2 overflow-x-auto">
        {steps.map((step, i) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-0.5 shrink-0">
              <div
                className={cn(
                  "w-7 h-7 rounded-full border-2 flex items-center justify-center text-micro font-mono font-bold",
                  getOperationBadgeClass(step.operationType),
                )}
              >
                {i + 1}
              </div>
              <span className={cn("text-pico truncate max-w-[60px]", getOperationColor(step.operationType))}>
                {step.operationType}
              </span>
            </div>
            {i < steps.length - 1 && <ArrowRight className="size-3 text-muted-foreground shrink-0 -mt-3" />}
          </React.Fragment>
        ))}
      </div>

      {steps.map((step, index) => (
        <div key={step.id} className="p-3 rounded-lg border space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <GripVertical className="size-3.5 text-muted-foreground cursor-grab shrink-0" />
              <Badge
                variant="outline"
                className={cn("text-micro px-1.5 py-0 shrink-0", getOperationBadgeClass(step.operationType))}
              >
                Leg {index + 1}
              </Badge>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => moveStep(step.id, "up")}
                disabled={index === 0}
                aria-label={`Move leg ${index + 1} up`}
              >
                <ChevronUp className="size-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => moveStep(step.id, "down")}
                disabled={index === steps.length - 1}
                aria-label={`Move leg ${index + 1} down`}
              >
                <ChevronDown className="size-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => duplicateStep(step.id)}
                aria-label={`Duplicate leg ${index + 1}`}
              >
                <Copy className="size-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:text-rose-400"
                onClick={() => removeStep(step.id)}
                aria-label={`Remove leg ${index + 1}`}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-micro text-muted-foreground">Operation</label>
              <Select value={step.operationType} onValueChange={(v) => updateStep(step.id, "operationType", v)}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {operationTypes.map((op) => (
                    <SelectItem key={op} value={op}>
                      <span className={getOperationColor(op)}>{op}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-micro text-muted-foreground">Instrument</label>
              <Select value={step.instrument} onValueChange={(v) => updateStep(step.id, "instrument", v)}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {instruments.map((inst) => (
                    <SelectItem key={inst} value={inst}>
                      <span className="font-mono">{inst}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-micro text-muted-foreground">Venue</label>
              <Select value={step.venue} onValueChange={(v) => updateStep(step.id, "venue", v)}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {venues.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-micro text-muted-foreground">Side</label>
              <div className="grid grid-cols-2 gap-0.5">
                <Button
                  variant={step.side === "BUY" ? "default" : "outline"}
                  size="sm"
                  className={cn("h-7 text-micro", step.side === "BUY" && "bg-emerald-600 hover:bg-emerald-700")}
                  onClick={() => updateStep(step.id, "side", "BUY")}
                >
                  BUY
                </Button>
                <Button
                  variant={step.side === "SELL" ? "default" : "outline"}
                  size="sm"
                  className={cn("h-7 text-micro", step.side === "SELL" && "bg-rose-600 hover:bg-rose-700")}
                  onClick={() => updateStep(step.id, "side", "SELL")}
                >
                  SELL
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-micro text-muted-foreground">Depends on</label>
              <Select
                value={step.dependsOn ?? "none"}
                onValueChange={(v) => updateStep(step.id, "dependsOn", v === "none" ? null : v)}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (parallel)</SelectItem>
                  {steps
                    .filter((s) => s.id !== step.id)
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        Leg {steps.indexOf(s) + 1}: {s.operationType}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-micro text-muted-foreground">Quantity</label>
              <Input
                type="number"
                placeholder="0.00"
                value={step.quantity}
                onChange={(e) => updateStep(step.id, "quantity", e.target.value)}
                className="h-7 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-micro text-muted-foreground">Price</label>
              <Input
                type="number"
                placeholder="0.00"
                value={step.price}
                onChange={(e) => updateStep(step.id, "price", e.target.value)}
                className="h-7 text-xs font-mono"
              />
            </div>
          </div>

          {(parseFloat(step.quantity) || 0) > 0 && (parseFloat(step.price) || 0) > 0 && (
            <div className="flex items-center justify-between text-micro text-muted-foreground pt-1">
              <span>Notional</span>
              <span className={cn("font-mono", step.side === "BUY" ? "text-rose-400" : "text-emerald-400")}>
                {step.side === "BUY" ? "-" : "+"}$
                {((parseFloat(step.quantity) || 0) * (parseFloat(step.price) || 0)).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          )}
        </div>
      ))}

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="text-xs flex-1 min-w-[120px]"
          onClick={addStep}
          disabled={readOnly}
        >
          <Plus className="size-3 mr-1.5" />
          Add leg
        </Button>
      </div>
    </div>
  );
}
