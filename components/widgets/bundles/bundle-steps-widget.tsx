"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { getOperationBadgeClass, getOperationColor } from "@/lib/utils/bundles";
import { ArrowRight, ChevronDown, ChevronUp, Copy, GripVertical, Layers, Plus, Trash2 } from "lucide-react";
import { useBundlesData } from "./bundles-data-context";

export function BundleStepsWidget(_props: WidgetComponentProps) {
  const {
    steps,
    addStep,
    removeStep,
    moveStep,
    duplicateStep,
    updateStep,
    operationTypes,
    venues,
    instruments,
    clearSteps,
    setShowTemplates,
    readOnly,
  } = useBundlesData();

  if (steps.length === 0) {
    return (
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
    );
  }

  return (
    <div className="p-2 space-y-3 h-full min-h-0 overflow-auto">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Visual order</p>

      <div className="flex items-center gap-1 px-1 py-2 overflow-x-auto">
        {steps.map((step, i) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-0.5 shrink-0">
              <div
                className={cn(
                  "w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-mono font-bold",
                  getOperationBadgeClass(step.operationType),
                )}
              >
                {i + 1}
              </div>
              <span className={cn("text-[8px] truncate max-w-[60px]", getOperationColor(step.operationType))}>
                {step.operationType}
              </span>
            </div>
            {i < steps.length - 1 && <ArrowRight className="size-3 text-muted-foreground shrink-0 mt-[-12px]" />}
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
                className={cn("text-[10px] px-1.5 py-0 shrink-0", getOperationBadgeClass(step.operationType))}
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
              >
                <ChevronUp className="size-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => moveStep(step.id, "down")}
                disabled={index === steps.length - 1}
              >
                <ChevronDown className="size-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => duplicateStep(step.id)}>
                <Copy className="size-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:text-rose-400"
                onClick={() => removeStep(step.id)}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">Operation</label>
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
              <label className="text-[10px] text-muted-foreground">Instrument</label>
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
              <label className="text-[10px] text-muted-foreground">Venue</label>
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
              <label className="text-[10px] text-muted-foreground">Side</label>
              <div className="grid grid-cols-2 gap-0.5">
                <Button
                  variant={step.side === "BUY" ? "default" : "outline"}
                  size="sm"
                  className={cn("h-7 text-[10px]", step.side === "BUY" && "bg-emerald-600 hover:bg-emerald-700")}
                  onClick={() => updateStep(step.id, "side", "BUY")}
                >
                  BUY
                </Button>
                <Button
                  variant={step.side === "SELL" ? "default" : "outline"}
                  size="sm"
                  className={cn("h-7 text-[10px]", step.side === "SELL" && "bg-rose-600 hover:bg-rose-700")}
                  onClick={() => updateStep(step.id, "side", "SELL")}
                >
                  SELL
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">Depends on</label>
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
              <label className="text-[10px] text-muted-foreground">Quantity</label>
              <Input
                type="number"
                placeholder="0.00"
                value={step.quantity}
                onChange={(e) => updateStep(step.id, "quantity", e.target.value)}
                className="h-7 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">Price</label>
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
            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
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
        <Button variant="ghost" size="sm" className="text-xs" onClick={clearSteps} disabled={readOnly}>
          Clear all
        </Button>
      </div>
    </div>
  );
}
