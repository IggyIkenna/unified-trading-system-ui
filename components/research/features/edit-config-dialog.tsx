"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Plus, Save, Settings2, Trash2 } from "lucide-react";
import type { FeatureCatalogueEntry, IndividualFeature } from "@/lib/build-mock-data";
import { FEATURE_SERVICES } from "@/lib/build-mock-data";
import { FEAT_STATUS_CFG } from "./feature-helpers";
import {
  categoryIdToShard,
  serviceIdToFeatureType,
  makeNewFeatureIds,
  CATALOGUE_FEATURE_GROUP_OPTIONS,
  type EditableFeature,
  type ParamRow,
} from "./feature-helpers";

// ─── EditConfigDialog ──────────────────────────────────────────────────────────

export function EditConfigDialog({
  open,
  onOpenChange,
  featureName,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  featureName: string;
  initial: EditableFeature;
  onSave: (updated: EditableFeature) => void;
}) {
  const [description, setDescription] = React.useState(initial.description);
  const [status, setStatus] = React.useState(initial.status);
  const [schedule, setSchedule] = React.useState(initial.compute_schedule ?? "0 * * * *");
  const [symbolsRaw, setSymbolsRaw] = React.useState(initial.symbols.join(", "));
  const [tagsRaw, setTagsRaw] = React.useState(initial.tags.join(", "));
  const [depsRaw, setDepsRaw] = React.useState(initial.dependencies.join("\n"));
  const [params, setParams] = React.useState<ParamRow[]>(() =>
    Object.entries(initial.parameters).map(([k, v]) => ({
      key: k,
      value: Array.isArray(v) ? v.join(", ") : String(v),
    })),
  );
  const [activeTab, setActiveTab] = React.useState<"general" | "parameters" | "compute" | "dependencies">("general");

  React.useEffect(() => {
    if (open) {
      setDescription(initial.description);
      setStatus(initial.status);
      setSchedule(initial.compute_schedule ?? "0 * * * *");
      setSymbolsRaw(initial.symbols.join(", "));
      setTagsRaw(initial.tags.join(", "));
      setDepsRaw(initial.dependencies.join("\n"));
      setParams(
        Object.entries(initial.parameters).map(([k, v]) => ({
          key: k,
          value: Array.isArray(v) ? v.join(", ") : String(v),
        })),
      );
      setActiveTab("general");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial.name]);

  function addParam() {
    setParams((p) => [...p, { key: "", value: "" }]);
  }
  function removeParam(i: number) {
    setParams((p) => p.filter((_, idx) => idx !== i));
  }
  function updateParam(i: number, field: "key" | "value", val: string) {
    setParams((p) => p.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)));
  }

  function handleSave() {
    const newParams: Record<string, unknown> = {};
    for (const { key, value } of params) {
      if (!key.trim()) continue;
      const num = Number(value);
      newParams[key.trim()] = !isNaN(num) && value.trim() !== "" ? num : value.trim();
    }
    onSave({
      name: initial.name,
      description,
      status,
      parameters: newParams,
      symbols: symbolsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      tags: tagsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      dependencies: depsRaw
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      compute_schedule: schedule,
    });
    onOpenChange(false);
  }

  const TABS = [
    { id: "general" as const, label: "General" },
    { id: "parameters" as const, label: "Parameters" },
    { id: "compute" as const, label: "Compute" },
    { id: "dependencies" as const, label: "Dependencies" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border/50 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Settings2 className="size-4 text-muted-foreground" />
            Edit Config
          </DialogTitle>
          <DialogDescription className="font-mono text-xs text-muted-foreground mt-0.5">
            {featureName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-end border-b border-border/50 shrink-0 px-6 overflow-x-auto overflow-y-hidden">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "px-3 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors",
                activeTab === t.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {t.id === "parameters" && params.length > 0 && (
                <span className="ml-1.5 text-[10px] bg-muted rounded-full px-1.5 py-0.5 text-muted-foreground">
                  {params.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="h-[min(52rem,calc(85vh-10rem))] shrink-0 overflow-y-auto overflow-x-hidden px-6 py-5">
          {activeTab === "general" && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="text-xs resize-none"
                  placeholder="Describe what this feature computes…"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="stale">Stale</SelectItem>
                    <SelectItem value="not_computed">Not Computed</SelectItem>
                    <SelectItem value="deprecated">Deprecated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Symbols
                  <span className="ml-1.5 font-normal text-muted-foreground">(comma-separated)</span>
                </Label>
                <Textarea
                  value={symbolsRaw}
                  onChange={(e) => setSymbolsRaw(e.target.value)}
                  rows={3}
                  className="text-xs resize-none font-mono"
                  placeholder="BTC/USDT, ETH/USDT, SOL/USDT…"
                />
                <p className="text-[10px] text-muted-foreground">
                  {
                    symbolsRaw
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean).length
                  }{" "}
                  symbols
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Tags
                  <span className="ml-1.5 font-normal text-muted-foreground">(comma-separated)</span>
                </Label>
                <Input
                  value={tagsRaw}
                  onChange={(e) => setTagsRaw(e.target.value)}
                  className="text-xs h-8"
                  placeholder="momentum, short-term, live-only…"
                />
              </div>
            </div>
          )}

          {activeTab === "parameters" && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Key/value pairs passed to the feature computation function. Numeric values are coerced automatically.
              </p>
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <div className="grid grid-cols-[1fr_1fr_auto] gap-3 px-3 py-2 bg-muted/30 border-b border-border/50">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Parameter
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Value
                  </span>
                  <span className="w-6" />
                </div>
                {params.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    No parameters. Click &ldquo;Add parameter&rdquo; to add one.
                  </div>
                ) : (
                  <div className="divide-y divide-border/30">
                    {params.map((row, i) => (
                      <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-3 px-3 py-2 items-center">
                        <Input
                          value={row.key}
                          onChange={(e) => updateParam(i, "key", e.target.value)}
                          className="h-7 text-xs font-mono"
                          placeholder="param_name"
                        />
                        <Input
                          value={row.value}
                          onChange={(e) => updateParam(i, "value", e.target.value)}
                          className="h-7 text-xs font-mono"
                          placeholder="14"
                        />
                        <button
                          onClick={() => removeParam(i)}
                          className="text-muted-foreground hover:text-red-400 transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={addParam} className="gap-1.5 text-xs">
                <Plus className="size-3" /> Add parameter
              </Button>
            </div>
          )}

          {activeTab === "compute" && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Cron Schedule</Label>
                <Input
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  className="text-xs h-8 font-mono"
                  placeholder="0 * * * *"
                />
                <p className="text-[10px] text-muted-foreground">
                  Standard cron expression (UTC). Examples: <code className="font-mono">0 * * * *</code> = hourly,{" "}
                  <code className="font-mono">0 0 * * *</code> = daily midnight.
                </p>
              </div>
              <div className="rounded-lg border border-border/50 p-3 space-y-2 bg-muted/20">
                <p className="text-xs font-medium">Schedule Preview</p>
                {[
                  {
                    label: "Next run",
                    value: "in ~" + (60 - new Date().getMinutes()) + " minutes",
                  },
                  {
                    label: "Frequency",
                    value: schedule.startsWith("0 * ")
                      ? "Every hour"
                      : schedule.startsWith("0 0 ")
                        ? "Daily at midnight"
                        : "Custom",
                  },
                  { label: "Timezone", value: "UTC" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-mono">{value}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Retry Policy</Label>
                <Select defaultValue="3">
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No retries</SelectItem>
                    <SelectItem value="1">1 retry</SelectItem>
                    <SelectItem value="3">3 retries (default)</SelectItem>
                    <SelectItem value="5">5 retries</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Timeout (minutes)</Label>
                <Input type="number" defaultValue={60} min={1} max={480} className="text-xs h-8 font-mono w-32" />
              </div>
            </div>
          )}

          {activeTab === "dependencies" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Feature Dependencies
                  <span className="ml-1.5 font-normal text-muted-foreground">(one per line)</span>
                </Label>
                <Textarea
                  value={depsRaw}
                  onChange={(e) => setDepsRaw(e.target.value)}
                  rows={6}
                  className="text-xs resize-none font-mono"
                  placeholder={"rsi_14_1h\nmacd_12_26_9\n…"}
                />
                <p className="text-[10px] text-muted-foreground">
                  {
                    depsRaw
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean).length
                  }{" "}
                  dependencies
                </p>
              </div>
              <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 space-y-1">
                <p className="text-xs font-medium text-amber-400">Dependency change warning</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Adding or removing dependencies may affect models that consume this feature. Changes take effect on
                  the next scheduled compute run.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border/50 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} className="gap-1.5">
            <Save className="size-3" /> Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
