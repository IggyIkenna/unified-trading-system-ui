"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { getOperationBadgeClass, getOperationColor } from "@/lib/utils/bundles";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Fuel,
  Layers,
  Play,
  Plus,
  Rocket,
  ShieldCheck,
  Trash2,
  Zap,
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils/formatters";
import {
  DEFI_OPERATIONS,
  DEFI_TOKENS,
  DEFI_TEMPLATES,
  GAS_ESTIMATES,
  gasToUsd,
  type DefiOp,
  type DefiTemplate,
} from "@/lib/config/services/defi-bundles.config";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DefiAtomicBundleWidget(_props: WidgetComponentProps) {
  const [operations, setOperations] = React.useState<DefiOp[]>([]);
  const [showTemplates, setShowTemplates] = React.useState(true);

  // Add a new blank operation
  const addOp = React.useCallback(() => {
    setOperations((prev) => [
      ...prev,
      {
        id: `defi-op-${Date.now()}`,
        operationType: "SWAP",
        token: "ETH",
        amount: "",
        estimatedGas: 185_000,
      },
    ]);
    setShowTemplates(false);
  }, []);

  const removeOp = React.useCallback((id: string) => {
    setOperations((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const moveOp = React.useCallback((id: string, dir: "up" | "down") => {
    setOperations((prev) => {
      const idx = prev.findIndex((o) => o.id === id);
      if (idx < 0) return prev;
      const newIdx = dir === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[newIdx];
      next[newIdx] = temp;
      return next;
    });
  }, []);

  const updateOp = React.useCallback((id: string, field: keyof DefiOp, value: string) => {
    setOperations((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        if (field === "operationType") {
          return {
            ...o,
            operationType: value,
            estimatedGas: GAS_ESTIMATES[value] ?? 185_000,
          };
        }
        return { ...o, [field]: value };
      }),
    );
  }, []);

  const loadTemplate = React.useCallback((template: DefiTemplate) => {
    setOperations(
      template.operations.map((o, i) => ({
        ...o,
        id: `defi-op-${Date.now()}-${i}`,
      })),
    );
    setShowTemplates(false);
  }, []);

  // Totals
  const totalGas = operations.reduce((sum, o) => sum + o.estimatedGas, 0);
  const totalGasUsd = gasToUsd(totalGas);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="p-2 space-y-3 h-full min-h-0 overflow-auto">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="size-4 text-amber-400" />
          <span className="text-xs font-semibold uppercase tracking-wider">DeFi Atomic Bundles</span>
        </div>
        <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-amber-500/50 text-amber-400">
          All-or-Nothing
        </Badge>
      </div>

      {/* Pre-built templates */}
      {showTemplates && operations.length === 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pre-built Templates</p>
          <div className="grid grid-cols-1 gap-1.5">
            {DEFI_TEMPLATES.map((t) => (
              <button
                key={t.name}
                type="button"
                className="w-full p-2.5 rounded-lg border text-left hover:bg-muted/20 transition-colors"
                onClick={() => loadTemplate(t)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium">{t.name}</span>
                  <div className="flex items-center gap-2 text-[10px] shrink-0">
                    <span className="text-muted-foreground font-mono flex items-center gap-0.5">
                      <Fuel className="size-2.5" />
                      {formatNumber(t.estimatedGas / 1000, 0)}K
                    </span>
                    {t.estimatedProfit > 0 && <span className="text-emerald-400 font-mono">+${t.estimatedProfit}</span>}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{t.description}</p>
                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                  {t.operations.map((op, i) => (
                    <React.Fragment key={op.id}>
                      <Badge
                        variant="outline"
                        className={cn("text-[8px] px-1 py-0", getOperationBadgeClass(op.operationType))}
                      >
                        {DEFI_OPERATIONS.find((d) => d.value === op.operationType)?.label ?? op.operationType}
                      </Badge>
                      {i < t.operations.length - 1 && (
                        <ArrowRight className="size-2.5 text-muted-foreground shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Operation selector + add */}
      {(operations.length > 0 || !showTemplates) && (
        <>
          {/* Visual flow */}
          {operations.length > 0 && (
            <div className="flex items-center gap-1 px-1 py-2 overflow-x-auto">
              {operations.map((op, i) => (
                <React.Fragment key={op.id}>
                  <div className="flex flex-col items-center gap-0.5 shrink-0">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-mono font-bold",
                        getOperationBadgeClass(op.operationType),
                      )}
                    >
                      {i + 1}
                    </div>
                    <span className={cn("text-[8px] truncate max-w-[60px]", getOperationColor(op.operationType))}>
                      {DEFI_OPERATIONS.find((d) => d.value === op.operationType)?.label.split(" ")[0] ??
                        op.operationType}
                    </span>
                  </div>
                  {i < operations.length - 1 && (
                    <ArrowRight className="size-3 text-muted-foreground shrink-0 mt-[-12px]" />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Operation list */}
          {operations.map((op, index) => (
            <div key={op.id} className="p-3 rounded-lg border space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] px-1.5 py-0 shrink-0", getOperationBadgeClass(op.operationType))}
                  >
                    Step {index + 1}
                  </Badge>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => moveOp(op.id, "up")}
                    disabled={index === 0}
                  >
                    <ChevronUp className="size-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => moveOp(op.id, "down")}
                    disabled={index === operations.length - 1}
                  >
                    <ChevronDown className="size-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:text-rose-400"
                    onClick={() => removeOp(op.id)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] text-muted-foreground">Operation</label>
                  <Select value={op.operationType} onValueChange={(v) => updateOp(op.id, "operationType", v)}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEFI_OPERATIONS.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          <span className={getOperationColor(d.value)}>{d.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Token</label>
                  <Select value={op.token} onValueChange={(v) => updateOp(op.id, "token", v)}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEFI_TOKENS.map((t) => (
                        <SelectItem key={t} value={t}>
                          <span className="font-mono">{t}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Amount</label>
                  <Input
                    type="text"
                    placeholder="0.00"
                    value={op.amount}
                    onChange={(e) => updateOp(op.id, "amount", e.target.value)}
                    className="h-7 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Est. Gas</label>
                  <div className="h-7 flex items-center text-xs font-mono text-muted-foreground px-2 border rounded-md bg-muted/20">
                    <Fuel className="size-3 mr-1.5 shrink-0" />
                    {`${formatNumber(op.estimatedGas / 1000, 0)}K (${formatCurrency(gasToUsd(op.estimatedGas), "USD", 2)} USD)`}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Add operation button */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="text-xs flex-1 min-w-[120px]" onClick={addOp}>
              <Plus className="size-3 mr-1.5" />
              Add Operation
            </Button>
            {operations.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => {
                  setOperations([]);
                  setShowTemplates(true);
                }}
              >
                Clear all
              </Button>
            )}
          </div>
        </>
      )}

      {operations.length === 0 && !showTemplates && (
        <div className="p-2 flex flex-col items-center justify-center gap-3 text-muted-foreground min-h-[80px]">
          <Layers className="size-8 opacity-30" />
          <p className="text-sm text-center">No operations in bundle</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button variant="outline" size="sm" className="text-xs" onClick={addOp}>
              <Plus className="size-3 mr-1.5" />
              Add operation
            </Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowTemplates(true)}>
              Use a template
            </Button>
          </div>
        </div>
      )}

      {/* Simulation preview */}
      {operations.length > 0 && (
        <>
          <Separator />
          <div className="p-3 rounded-lg border bg-muted/30 space-y-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Simulation Preview</p>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground">Total Gas Cost</span>
                <p className="text-sm font-mono font-bold text-rose-400">
                  {`${formatNumber(totalGas / 1000, 0)}K gas (~${formatCurrency(totalGasUsd, "USD", 2)})`}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground">Operations</span>
                <p className="text-sm font-mono font-bold">{operations.length} steps</p>
              </div>
            </div>

            {/* Atomic guarantee badge */}
            <div className="flex items-center gap-2 p-2 rounded-md border border-amber-500/30 bg-amber-500/5">
              <ShieldCheck className="size-4 text-amber-400 shrink-0" />
              <div>
                <p className="text-[10px] font-medium text-amber-400">Atomic Guarantee</p>
                <p className="text-[10px] text-muted-foreground">All or nothing -- reverts if any step fails</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs flex-1 gap-1.5">
                <FlaskConical className="size-3" />
                Simulate on Tenderly
              </Button>
              <Button size="sm" className="text-xs flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                <Rocket className="size-3" />
                Execute Bundle
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
