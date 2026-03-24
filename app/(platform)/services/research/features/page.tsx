"use client";

/**
 * Feature Catalogue — Finder + Catalogue modes
 *
 * Finder layout (fixed structure):
 *   ┌─────────────────────────────────────────────────┬──────────────┐
 *   │  AGGREGATED CONTEXT STRIP (always visible)      │              │
 *   ├──────────┬──────────┬──────────┬────────────────┤  DETAIL      │
 *   │ Services │ Category │  Groups  │  Feature list  │  PANEL       │
 *   │ col 1   │ col 2    │  col 3   │  col 4 (paged) │  (always)    │
 *   └──────────┴──────────┴──────────┴────────────────┴──────────────┘
 *
 * - Columns appear progressively as you drill deeper.
 * - Feature list (col 4) appears when a group is selected, paginated (100/page).
 * - The right detail panel is always visible; it shows context-aware info for
 *   whatever level is currently selected, and full feature details when a
 *   feature is clicked.
 * - The aggregated context strip (stats + breadcrumb) stays anchored at top
 *   and shows rolled-up numbers for whatever scope is selected.
 */

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  LayoutGrid,
  List,
  Table2,
  Search,
  Plus,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Loader2,
  Code2,
  GitBranch,
  Tag,
  Cpu,
  ArrowRight,
  Activity,
  RefreshCw,
  Columns,
  Trash2,
  Save,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FEATURE_CATALOGUE,
  FEATURE_VERSIONS,
  FEATURE_SERVICES,
  SAMPLE_FEATURES_BY_GROUP,
} from "@/lib/build-mock-data";
import type {
  FeatureCatalogueEntry,
  FeatureServiceNode,
  FeatureServiceDimension,
  FeatureGroupEntry,
  IndividualFeature,
} from "@/lib/build-mock-data";
import Link from "next/link";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 100;

// ─── Status / colour helpers ──────────────────────────────────────────────────

const GROUP_STATUS_CFG = {
  healthy: { icon: CheckCircle2, color: "text-emerald-400", label: "Healthy" },
  stale: { icon: AlertTriangle, color: "text-amber-400", label: "Stale" },
  computing: { icon: Loader2, color: "text-blue-400", label: "Computing" },
  failed: { icon: XCircle, color: "text-red-400", label: "Failed" },
  not_started: {
    icon: Clock,
    color: "text-muted-foreground",
    label: "Not Started",
  },
} as const;

const FEAT_STATUS_CFG = {
  active: {
    icon: CheckCircle2,
    color: "text-emerald-400",
    badge: "border-emerald-400/30 text-emerald-400",
  },
  stale: {
    icon: AlertTriangle,
    color: "text-amber-400",
    badge: "border-amber-400/30 text-amber-400",
  },
  not_computed: {
    icon: Clock,
    color: "text-muted-foreground",
    badge: "border-border/50 text-muted-foreground",
  },
  deprecated: {
    icon: XCircle,
    color: "text-red-400",
    badge: "border-red-400/30 text-red-400",
  },
} as const;

const SERVICE_COLORS: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  violet: "bg-violet-500/10 text-violet-400 border-violet-500/30",
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  pink: "bg-pink-500/10 text-pink-400 border-pink-500/30",
};

const SERVICE_BAR: Record<string, string> = {
  blue: "bg-blue-400",
  violet: "bg-violet-400",
  emerald: "bg-emerald-400",
  amber: "bg-amber-400",
  pink: "bg-pink-400",
};

const SHARD_COLORS: Record<string, string> = {
  CeFi: "border-blue-400/30 text-blue-400",
  DeFi: "border-violet-400/30 text-violet-400",
  TradFi: "border-amber-400/30 text-amber-400",
  Sports: "border-emerald-400/30 text-emerald-400",
  Prediction: "border-pink-400/30 text-pink-400",
};

function ComputedBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="w-full h-1 rounded-full bg-muted/60 overflow-hidden">
      <div
        className={cn(
          "h-full rounded-full transition-all",
          SERVICE_BAR[color] ?? "bg-primary",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Edit Config Dialog ────────────────────────────────────────────────────────

type EditableFeature = {
  name: string;
  description: string;
  status: string;
  parameters: Record<string, unknown>;
  symbols: string[];
  tags: string[];
  dependencies: string[];
  compute_schedule?: string;
};

type ParamRow = { key: string; value: string };

function EditConfigDialog({
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
  // Local mutable state
  const [description, setDescription] = React.useState(initial.description);
  const [status, setStatus] = React.useState(initial.status);
  const [schedule, setSchedule] = React.useState(
    initial.compute_schedule ?? "0 * * * *",
  );
  const [symbolsRaw, setSymbolsRaw] = React.useState(
    initial.symbols.join(", "),
  );
  const [tagsRaw, setTagsRaw] = React.useState(initial.tags.join(", "));
  const [depsRaw, setDepsRaw] = React.useState(initial.dependencies.join("\n"));
  const [params, setParams] = React.useState<ParamRow[]>(() =>
    Object.entries(initial.parameters).map(([k, v]) => ({
      key: k,
      value: Array.isArray(v) ? v.join(", ") : String(v),
    })),
  );
  const [activeTab, setActiveTab] = React.useState<
    "general" | "parameters" | "compute" | "dependencies"
  >("general");

  // Reset when dialog re-opens with a different feature
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
    setParams((p) =>
      p.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)),
    );
  }

  function handleSave() {
    const newParams: Record<string, unknown> = {};
    for (const { key, value } of params) {
      if (!key.trim()) continue;
      // Try to coerce numbers
      const num = Number(value);
      newParams[key.trim()] =
        !isNaN(num) && value.trim() !== "" ? num : value.trim();
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
    { id: "general", label: "General" },
    { id: "parameters", label: "Parameters" },
    { id: "compute", label: "Compute" },
    { id: "dependencies", label: "Dependencies" },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border/50 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Settings2 className="size-4 text-muted-foreground" />
            Edit Config
          </DialogTitle>
          <DialogDescription className="font-mono text-xs text-muted-foreground mt-0.5">
            {featureName}
          </DialogDescription>
        </DialogHeader>

        {/* Tab bar */}
        <div className="flex border-b border-border/50 shrink-0 px-6">
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

        {/* Tab body */}
        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5">
          {/* ── General ── */}
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
                  <span className="ml-1.5 font-normal text-muted-foreground">
                    (comma-separated)
                  </span>
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
                  <span className="ml-1.5 font-normal text-muted-foreground">
                    (comma-separated)
                  </span>
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

          {/* ── Parameters ── */}
          {activeTab === "parameters" && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Key/value pairs passed to the feature computation function.
                Numeric values are coerced automatically.
              </p>

              <div className="rounded-lg border border-border/50 overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-[1fr_1fr_auto] gap-3 px-3 py-2 bg-muted/30 border-b border-border/50">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Parameter
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Value
                  </span>
                  <span className="w-6" />
                </div>

                {/* Rows */}
                {params.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    No parameters. Click &ldquo;Add parameter&rdquo; to add one.
                  </div>
                ) : (
                  <div className="divide-y divide-border/30">
                    {params.map((row, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-[1fr_1fr_auto] gap-3 px-3 py-2 items-center"
                      >
                        <Input
                          value={row.key}
                          onChange={(e) =>
                            updateParam(i, "key", e.target.value)
                          }
                          className="h-7 text-xs font-mono"
                          placeholder="param_name"
                        />
                        <Input
                          value={row.value}
                          onChange={(e) =>
                            updateParam(i, "value", e.target.value)
                          }
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

              <Button
                variant="outline"
                size="sm"
                onClick={addParam}
                className="gap-1.5 text-xs"
              >
                <Plus className="size-3" /> Add parameter
              </Button>
            </div>
          )}

          {/* ── Compute ── */}
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
                  Standard cron expression (UTC). Examples:{" "}
                  <code className="font-mono">0 * * * *</code> = hourly,{" "}
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
                <Input
                  type="number"
                  defaultValue={60}
                  min={1}
                  max={480}
                  className="text-xs h-8 font-mono w-32"
                />
              </div>
            </div>
          )}

          {/* ── Dependencies ── */}
          {activeTab === "dependencies" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Feature Dependencies
                  <span className="ml-1.5 font-normal text-muted-foreground">
                    (one per line)
                  </span>
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
                <p className="text-xs font-medium text-amber-400">
                  Dependency change warning
                </p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Adding or removing dependencies may affect models that consume
                  this feature. Changes take effect on the next scheduled
                  compute run.
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

// ─── Shared feature detail panel (right side, always visible) ─────────────────
// Shows context-appropriate info for whatever level is selected, or feature
// details when a leaf feature is selected.

function FeatureDetailPanel({
  service,
  feature,
}: {
  service: FeatureServiceNode | null;
  feature: IndividualFeature | null;
}) {
  const [editOpen, setEditOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<IndividualFeature | null>(null);

  // Keep a local draft so edits persist within the session
  const displayed = draft?.id === feature?.id ? draft : feature;

  if (!displayed) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <Code2 className="size-10 mb-3 text-muted-foreground/20" />
        <p className="text-sm font-medium text-muted-foreground">
          No feature selected
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1 leading-relaxed">
          Click any feature to see its configuration, parameters, version
          history, and model usage.
        </p>
      </div>
    );
  }

  const versions = FEATURE_VERSIONS[displayed.id] ?? [];
  const sc = FEAT_STATUS_CFG[displayed.status];
  const SI = sc.icon;
  const svcColor = service?.color ?? "blue";

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {service && (
              <Badge
                variant="outline"
                className={cn("text-xs", SERVICE_COLORS[svcColor])}
              >
                {service.display_name}
              </Badge>
            )}
            <Badge variant="outline" className={cn("text-xs gap-1", sc.badge)}>
              <SI className="size-3" />
              {displayed.status === "not_computed"
                ? "Not Computed"
                : displayed.status.charAt(0).toUpperCase() +
                  displayed.status.slice(1)}
            </Badge>
          </div>
          <code className="text-sm font-mono font-semibold break-all leading-snug block">
            {displayed.name}
          </code>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {displayed.description}
          </p>
        </div>

        {/* Version + last computed */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <GitBranch className="size-3" />
            <span className="font-mono font-semibold text-foreground">
              {displayed.current_version}
            </span>
          </div>
          {displayed.last_computed ? (
            <span className="text-muted-foreground">
              {formatDistanceToNow(new Date(displayed.last_computed), {
                addSuffix: true,
              })}
            </span>
          ) : (
            <span className="text-muted-foreground">never computed</span>
          )}
        </div>

        <Separator />

        {/* Parameters */}
        {Object.keys(displayed.parameters).length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Code2 className="size-3" /> Parameters
            </p>
            <div className="rounded-lg bg-muted/40 p-2.5 space-y-1.5">
              {Object.entries(displayed.parameters).map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="font-mono text-muted-foreground">{k}</span>
                  <span className="font-mono font-medium">
                    {Array.isArray(v) ? v.join(", ") : String(v)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Computed for */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Computed For
          </p>
          <div className="flex flex-wrap gap-1">
            {displayed.symbols.map((s) => (
              <Badge key={s} variant="secondary" className="text-xs font-mono">
                {s}
              </Badge>
            ))}
          </div>
        </div>

        {/* Dependencies */}
        {displayed.dependencies.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <GitBranch className="size-3" /> Dependencies
            </p>
            {displayed.dependencies.map((d) => (
              <div
                key={d}
                className="text-xs rounded-lg border border-border/50 px-2.5 py-1.5 font-mono"
              >
                {d}
              </div>
            ))}
          </div>
        )}

        {/* Models */}
        {displayed.consumed_by_models.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="size-3" /> Used by Models
            </p>
            <div className="flex flex-wrap gap-1">
              {displayed.consumed_by_models.map((m) => (
                <Badge key={m} variant="outline" className="text-xs">
                  {m}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {displayed.tags.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="size-3" /> Tags
            </p>
            <div className="flex flex-wrap gap-1">
              {displayed.tags.map((t) => (
                <Badge key={t} variant="secondary" className="text-xs">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Version history */}
        {versions.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Version History
              </p>
              {versions.map((v, i) => (
                <div
                  key={v.version}
                  className={cn(
                    "rounded-lg border p-2.5 space-y-1",
                    i === 0
                      ? "border-primary/30 bg-primary/5"
                      : "border-border/50",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold">
                        {v.version}
                      </span>
                      {i === 0 && (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-primary/30 text-primary px-1 py-0"
                        >
                          current
                        </Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(v.changed_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug">
                    {v.change_summary}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    by {v.changed_by}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        <Separator />

        <div className="flex gap-2">
          <Button size="sm" className="flex-1 gap-1" asChild>
            <Link href="/services/research/feature-etl">
              <ArrowRight className="size-3" /> Compute
            </Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1"
            onClick={() => setEditOpen(true)}
          >
            <Settings2 className="size-3" /> Edit Config
          </Button>
        </div>
      </div>

      <EditConfigDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        featureName={displayed.name}
        initial={{
          name: displayed.name,
          description: displayed.description,
          status: displayed.status,
          parameters: displayed.parameters,
          symbols: displayed.symbols,
          tags: displayed.tags,
          dependencies: displayed.dependencies,
        }}
        onSave={(updated) => {
          setDraft({
            ...displayed,
            description: updated.description,
            status: updated.status as IndividualFeature["status"],
            parameters: updated.parameters,
            symbols: updated.symbols,
            tags: updated.tags,
            dependencies: updated.dependencies,
          });
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FINDER VIEW — column browser with aggregated context strip
// ═══════════════════════════════════════════════════════════════════════════════

// ── Column row primitive ──────────────────────────────────────────────────────

function ColRow({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className={cn(
        "w-full text-left flex items-start gap-2 px-2.5 py-1.5 rounded-md transition-colors text-sm",
        active
          ? "bg-primary text-primary-foreground"
          : "hover:bg-muted/60 text-foreground",
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// ── Aggregated context strip ──────────────────────────────────────────────────
// Always shows stats for the currently-selected scope (rolled up from all
// children). This persists no matter how deep into the hierarchy you go.

type ContextScope =
  | { level: "all" }
  | { level: "service"; service: FeatureServiceNode }
  | {
      level: "category";
      service: FeatureServiceNode;
      category: FeatureServiceDimension;
    }
  | {
      level: "group";
      service: FeatureServiceNode;
      category: FeatureServiceDimension;
      group: FeatureGroupEntry;
    }
  | {
      level: "feature";
      service: FeatureServiceNode;
      group: FeatureGroupEntry;
      feature: IndividualFeature;
    };

function ContextStrip({ scope }: { scope: ContextScope }) {
  let name = "All Services";
  let totalFeatures: number;
  let computedPct: number;
  let groups: number | null = null;
  let activeJobs: number | null = null;
  let color = "blue";
  let statusLabel = "";
  let lastComputed: string | null = null;

  const allTotalFeatures = FEATURE_SERVICES.reduce(
    (s, sv) => s + sv.total_features,
    0,
  );
  const allAvgComputed = Math.round(
    FEATURE_SERVICES.reduce((s, sv) => s + sv.computed_pct, 0) /
      FEATURE_SERVICES.length,
  );

  if (scope.level === "all") {
    totalFeatures = allTotalFeatures;
    computedPct = allAvgComputed;
    activeJobs = FEATURE_SERVICES.reduce((s, sv) => s + sv.active_jobs, 0);
    groups = FEATURE_SERVICES.reduce(
      (s, sv) => s + sv.categories.reduce((cs, c) => cs + c.groups.length, 0),
      0,
    );
  } else if (scope.level === "service") {
    const { service } = scope;
    name = service.display_name;
    totalFeatures = service.total_features;
    computedPct = service.computed_pct;
    activeJobs = service.active_jobs;
    groups = service.categories.reduce((s, c) => s + c.groups.length, 0);
    color = service.color;
  } else if (scope.level === "category") {
    const { service, category } = scope;
    name = `${service.display_name} / ${category.display_name}`;
    totalFeatures = category.total_features;
    computedPct = category.computed_pct;
    groups = category.groups.length;
    color = service.color;
  } else if (scope.level === "group") {
    const { service, group } = scope;
    name = group.display_name;
    totalFeatures = group.feature_count;
    computedPct = group.computed_pct;
    color = service.color;
    statusLabel = GROUP_STATUS_CFG[group.status].label;
    lastComputed = group.last_computed;
  } else {
    // feature level — show parent group stats
    const { service, group } = scope;
    name = group.display_name;
    totalFeatures = group.feature_count;
    computedPct = group.computed_pct;
    color = service.color;
    statusLabel = GROUP_STATUS_CFG[group.status].label;
    lastComputed = group.last_computed;
  }

  const barColor = SERVICE_BAR[color] ?? "bg-primary";

  return (
    <div className="flex items-center gap-0 px-4 py-2.5 border-b border-border/40 bg-muted/20 text-xs">
      {/* Name + status */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="font-semibold truncate">{name}</span>
        {statusLabel && (
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] shrink-0",
              statusLabel === "Healthy"
                ? "border-emerald-400/30 text-emerald-400"
                : statusLabel === "Stale"
                  ? "border-amber-400/30 text-amber-400"
                  : "border-border/50 text-muted-foreground",
            )}
          >
            {statusLabel}
          </Badge>
        )}
        {activeJobs !== null && activeJobs > 0 && (
          <Badge
            variant="outline"
            className="text-[10px] shrink-0 border-blue-400/30 text-blue-400 gap-1"
          >
            <Activity className="size-2.5 animate-pulse" />
            {activeJobs} active
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-5 shrink-0">
        <div className="text-right">
          <span className="font-bold tabular-nums text-foreground">
            {totalFeatures.toLocaleString()}
          </span>
          <span className="text-muted-foreground ml-1">features</span>
        </div>
        {groups !== null && (
          <div className="text-right">
            <span className="font-bold tabular-nums text-foreground">
              {groups}
            </span>
            <span className="text-muted-foreground ml-1">groups</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full", barColor)}
              style={{ width: `${computedPct}%` }}
            />
          </div>
          <span className="font-bold tabular-nums text-foreground w-8 text-right">
            {computedPct}%
          </span>
          <span className="text-muted-foreground">computed</span>
        </div>
        {lastComputed && (
          <span className="text-muted-foreground hidden xl:block">
            last{" "}
            {formatDistanceToNow(new Date(lastComputed), { addSuffix: true })}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Column 1: Services ────────────────────────────────────────────────────────

function ServiceColumn({
  selected,
  onSelect,
  search,
}: {
  selected: FeatureServiceNode | null;
  onSelect: (s: FeatureServiceNode) => void;
  search: string;
}) {
  const filtered = FEATURE_SERVICES.filter(
    (s) =>
      !search || s.display_name.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-1.5 border-b border-border/40 bg-muted/30 shrink-0">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Services · {FEATURE_SERVICES.length}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-1.5 space-y-0.5">
          {filtered.map((svc) => {
            const isActive = selected?.id === svc.id;
            return (
              <ColRow
                key={svc.id}
                active={isActive}
                onClick={() => onSelect(svc)}
              >
                <span
                  className={cn(
                    "inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-bold shrink-0",
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : SERVICE_COLORS[svc.color],
                  )}
                >
                  {svc.display_name[0]}
                </span>
                <span className="flex-1 font-medium truncate text-xs">
                  {svc.display_name}
                </span>
                <span
                  className={cn(
                    "text-[10px] tabular-nums shrink-0",
                    isActive
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground",
                  )}
                >
                  {svc.total_features.toLocaleString()}
                </span>
                <ChevronRight
                  className={cn(
                    "size-3 shrink-0",
                    isActive
                      ? "text-primary-foreground/60"
                      : "text-muted-foreground/50",
                  )}
                />
              </ColRow>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Column 2: Categories ──────────────────────────────────────────────────────

function CategoryColumn({
  service,
  selected,
  onSelect,
}: {
  service: FeatureServiceNode;
  selected: FeatureServiceDimension | null;
  onSelect: (c: FeatureServiceDimension) => void;
}) {
  const label =
    service.id === "sports"
      ? "League"
      : service.categories.length === 1
        ? "Scope"
        : "Category";
  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-1.5 border-b border-border/40 bg-muted/30 shrink-0">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          {label} · {service.categories.length}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-1.5 space-y-0.5">
          {service.categories.map((cat) => {
            const isActive = selected?.id === cat.id;
            return (
              <ColRow
                key={cat.id}
                active={isActive}
                onClick={() => onSelect(cat)}
              >
                <span className="flex-1 font-medium truncate text-xs">
                  {cat.display_name}
                </span>
                <span
                  className={cn(
                    "text-[10px] tabular-nums shrink-0",
                    isActive
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground",
                  )}
                >
                  {cat.total_features.toLocaleString()}
                </span>
                <ChevronRight
                  className={cn(
                    "size-3 shrink-0",
                    isActive
                      ? "text-primary-foreground/60"
                      : "text-muted-foreground/50",
                  )}
                />
              </ColRow>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Column 3: Groups ──────────────────────────────────────────────────────────

function GroupColumn({
  category,
  selected,
  onSelect,
}: {
  category: FeatureServiceDimension;
  selected: FeatureGroupEntry | null;
  onSelect: (g: FeatureGroupEntry) => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-1.5 border-b border-border/40 bg-muted/30 shrink-0">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Groups · {category.groups.length}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-1.5 space-y-0.5">
          {category.groups.map((grp) => {
            const isActive = selected?.id === grp.id;
            const cfg = GROUP_STATUS_CFG[grp.status];
            const Icon = cfg.icon;
            return (
              <ColRow
                key={grp.id}
                active={isActive}
                onClick={() => onSelect(grp)}
              >
                <Icon
                  className={cn(
                    "size-3 shrink-0 mt-0.5",
                    isActive ? "text-primary-foreground/80" : cfg.color,
                    grp.status === "computing" && "animate-spin",
                  )}
                />
                <span className="flex-1 text-xs text-left leading-snug">
                  {grp.display_name}
                </span>
                <span
                  className={cn(
                    "text-[10px] tabular-nums shrink-0",
                    isActive
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground",
                  )}
                >
                  {grp.feature_count}
                </span>
                <ChevronRight
                  className={cn(
                    "size-3 shrink-0",
                    isActive
                      ? "text-primary-foreground/60"
                      : "text-muted-foreground/50",
                  )}
                />
              </ColRow>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Column 4: Feature list (paginated) ────────────────────────────────────────
// Expands to fill remaining horizontal space. Paginated at PAGE_SIZE per page.
// Mock data: uses SAMPLE_FEATURES_BY_GROUP for groups that have samples,
// otherwise generates placeholder rows up to group.feature_count.

function buildFeatureList(group: FeatureGroupEntry): IndividualFeature[] {
  const samples = SAMPLE_FEATURES_BY_GROUP[group.id] ?? [];
  if (samples.length >= group.feature_count) return samples;

  // Pad with placeholder rows so pagination is meaningful in the demo
  const placeholders: IndividualFeature[] = Array.from(
    { length: group.feature_count - samples.length },
    (_, i) =>
      ({
        id: `${group.id}_placeholder_${i}`,
        name: `${group.name}_${String(i + samples.length + 1).padStart(3, "0")}`,
        display_name: `${group.display_name} Feature ${i + samples.length + 1}`,
        service_id: "",
        category_id: "",
        group_id: group.id,
        current_version: "v1.0",
        status:
          i % 7 === 0 ? "not_computed" : i % 11 === 0 ? "stale" : "active",
        last_computed:
          i % 7 === 0
            ? null
            : new Date(Date.now() - (i + 1) * 3600000).toISOString(),
        description: `Auto-generated placeholder for ${group.display_name}`,
        parameters: {},
        symbols: [],
        dependencies: [],
        consumed_by_models: [],
        tags: [],
      }) satisfies IndividualFeature,
  );
  return [...samples, ...placeholders];
}

function FeatureListColumn({
  service,
  group,
  selected,
  onSelect,
}: {
  service: FeatureServiceNode;
  group: FeatureGroupEntry;
  selected: IndividualFeature | null;
  onSelect: (f: IndividualFeature) => void;
}) {
  const [page, setPage] = React.useState(0);
  const [search, setSearch] = React.useState("");

  const allFeatures = React.useMemo(() => buildFeatureList(group), [group]);

  const filtered = React.useMemo(() => {
    if (!search) return allFeatures;
    const q = search.toLowerCase();
    return allFeatures.filter((f) => f.name.toLowerCase().includes(q));
  }, [allFeatures, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageFeatures = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset page when group changes
  React.useEffect(() => {
    setPage(0);
    setSearch("");
  }, [group.id]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-1.5 border-b border-border/40 bg-muted/30 flex items-center gap-2 shrink-0">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex-1">
          Features · {filtered.length.toLocaleString()}
          {filtered.length !== allFeatures.length && ` / ${allFeatures.length}`}
        </p>
      </div>

      {/* Search within group */}
      <div className="px-2 py-1.5 border-b border-border/30 shrink-0">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
          <Input
            placeholder="Filter features…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="pl-6 h-6 text-xs border-border/40"
          />
        </div>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-1 border-b border-border/30 bg-muted/10 shrink-0">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          Name
        </span>
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide w-10 text-center">
          Ver
        </span>
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide w-6"></span>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="py-1">
          {pageFeatures.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs">
              No features found
            </div>
          ) : (
            pageFeatures.map((feat) => {
              const sc = FEAT_STATUS_CFG[feat.status];
              const SI = sc.icon;
              const isActive = selected?.id === feat.id;
              return (
                <button
                  key={feat.id}
                  className={cn(
                    "w-full grid grid-cols-[1fr_auto_auto] gap-2 items-center px-3 py-1.5 text-xs transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted/50",
                  )}
                  onClick={() => onSelect(feat)}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <SI
                      className={cn(
                        "size-3 shrink-0",
                        isActive ? "text-primary-foreground/80" : sc.color,
                      )}
                    />
                    <code className="font-mono truncate text-left">
                      {feat.name}
                    </code>
                  </div>
                  <span
                    className={cn(
                      "font-mono text-[10px] w-10 text-center",
                      isActive
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground",
                    )}
                  >
                    {feat.current_version}
                  </span>
                  <ChevronRight
                    className={cn(
                      "size-3 shrink-0",
                      isActive
                        ? "text-primary-foreground/60"
                        : "text-muted-foreground/50",
                    )}
                  />
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-border/40 bg-muted/10 shrink-0">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="size-3" /> Prev
          </button>
          <span className="text-xs text-muted-foreground">
            {page + 1} / {totalPages} · {filtered.length.toLocaleString()}{" "}
            features
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next <ChevronRight className="size-3" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Finder view ───────────────────────────────────────────────────────────────

function FinderView({ search }: { search: string }) {
  const [selService, setSelService] = React.useState<FeatureServiceNode | null>(
    null,
  );
  const [selCategory, setSelCategory] =
    React.useState<FeatureServiceDimension | null>(null);
  const [selGroup, setSelGroup] = React.useState<FeatureGroupEntry | null>(
    null,
  );
  const [selFeature, setSelFeature] = React.useState<IndividualFeature | null>(
    null,
  );

  const selectService = (s: FeatureServiceNode) => {
    setSelService(s);
    setSelCategory(null);
    setSelGroup(null);
    setSelFeature(null);
  };
  const selectCategory = (c: FeatureServiceDimension) => {
    setSelCategory(c);
    setSelGroup(null);
    setSelFeature(null);
  };
  const selectGroup = (g: FeatureGroupEntry) => {
    setSelGroup(g);
    setSelFeature(null);
  };

  // Build context scope for the strip
  const scope: ContextScope =
    selFeature && selService && selGroup
      ? {
          level: "feature",
          service: selService,
          group: selGroup,
          feature: selFeature,
        }
      : selGroup && selService && selCategory
        ? {
            level: "group",
            service: selService,
            category: selCategory,
            group: selGroup,
          }
        : selCategory && selService
          ? { level: "category", service: selService, category: selCategory }
          : selService
            ? { level: "service", service: selService }
            : { level: "all" };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Aggregated context strip — always visible */}
      <ContextStrip scope={scope} />

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 px-4 py-1.5 text-xs text-muted-foreground border-b border-border/30 bg-background/50">
        <button
          className="hover:text-foreground transition-colors"
          onClick={() => {
            setSelService(null);
            setSelCategory(null);
            setSelGroup(null);
            setSelFeature(null);
          }}
        >
          All Services
        </button>
        {selService && (
          <>
            <ChevronRight className="size-3 text-border" />
            <button
              className="hover:text-foreground transition-colors font-medium text-foreground/80"
              onClick={() => {
                setSelCategory(null);
                setSelGroup(null);
                setSelFeature(null);
              }}
            >
              {selService.display_name}
            </button>
          </>
        )}
        {selCategory && (
          <>
            <ChevronRight className="size-3 text-border" />
            <button
              className="hover:text-foreground transition-colors font-medium text-foreground/80"
              onClick={() => {
                setSelGroup(null);
                setSelFeature(null);
              }}
            >
              {selCategory.display_name}
            </button>
          </>
        )}
        {selGroup && (
          <>
            <ChevronRight className="size-3 text-border" />
            <button
              className="hover:text-foreground transition-colors font-medium text-foreground/80"
              onClick={() => setSelFeature(null)}
            >
              {selGroup.display_name}
            </button>
          </>
        )}
        {selFeature && (
          <>
            <ChevronRight className="size-3 text-border" />
            <span className="font-medium text-foreground font-mono">
              {selFeature.name}
            </span>
          </>
        )}
      </div>

      {/* Column browser + permanent detail panel */}
      <div className="flex flex-1 min-h-0 overflow-hidden border-t border-border/20">
        {/* ── Left: columns ── */}
        <div className="flex flex-1 min-w-0 min-h-0 overflow-x-auto overflow-y-hidden divide-x divide-border/50">
          {/* Col 1 — Services (always shown) */}
          <div className="w-[168px] shrink-0 flex flex-col min-h-0 overflow-hidden">
            <ServiceColumn
              selected={selService}
              onSelect={selectService}
              search={search}
            />
          </div>

          {/* Col 2 — Categories */}
          {selService && (
            <div className="w-[148px] shrink-0 flex flex-col min-h-0 overflow-hidden">
              <CategoryColumn
                service={selService}
                selected={selCategory}
                onSelect={selectCategory}
              />
            </div>
          )}

          {/* Col 3 — Groups (wider to fit long names like "Swing Outcome Targets") */}
          {selCategory && (
            <div className="w-[210px] shrink-0 flex flex-col min-h-0 overflow-hidden">
              <GroupColumn
                category={selCategory}
                selected={selGroup}
                onSelect={selectGroup}
              />
            </div>
          )}

          {/* Col 4 — Features (fills all remaining space between cols and detail panel) */}
          {selGroup && selService && (
            <div className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden">
              <FeatureListColumn
                service={selService}
                group={selGroup}
                selected={selFeature}
                onSelect={setSelFeature}
              />
            </div>
          )}

          {/* Empty state — fills space when nothing selected yet */}
          {!selService && (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8 text-muted-foreground">
              <Columns className="size-8 mb-2 opacity-20" />
              <p className="text-sm font-medium">Select a service</p>
              <p className="text-xs opacity-60 mt-1">
                Drill down to browse individual features
              </p>
            </div>
          )}
        </div>

        {/* ── Right: permanent detail panel — wider to use available space ── */}
        <div className="w-[420px] shrink-0 flex flex-col min-h-0 bg-muted/5">
          <div className="px-3 py-1.5 border-b border-border/40 bg-muted/30">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Feature Detail
            </p>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <FeatureDetailPanel service={selService} feature={selFeature} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATALOGUE VIEW — flat table/grid/tree with right detail panel
// ═══════════════════════════════════════════════════════════════════════════════

type FlatViewMode = "grid" | "tree" | "table";

function CatStatusBadge({
  status,
}: {
  status: FeatureCatalogueEntry["status"];
}) {
  const cfg = FEAT_STATUS_CFG[status];
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={cn("text-xs gap-1", cfg.badge)}>
      <Icon className="size-3" />
      {status === "not_computed"
        ? "Not Computed"
        : status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function CatDetailPanel({
  feature,
}: {
  feature: FeatureCatalogueEntry | null;
}) {
  const [editOpen, setEditOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<FeatureCatalogueEntry | null>(null);
  const displayed = draft?.id === feature?.id ? draft : feature;

  if (!displayed) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <Code2 className="size-10 mb-3 text-muted-foreground/20" />
        <p className="text-sm font-medium text-muted-foreground">
          Select a feature
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Click any row to see details
        </p>
      </div>
    );
  }
  const versions = FEATURE_VERSIONS[displayed.id] ?? [];
  const sc = FEAT_STATUS_CFG[displayed.status];
  const SI = sc.icon;

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge
              variant="outline"
              className={cn("text-xs", SHARD_COLORS[displayed.shard])}
            >
              {displayed.shard}
            </Badge>
            <Badge variant="outline" className={cn("text-xs gap-1", sc.badge)}>
              <SI className="size-3" />
              {displayed.status === "not_computed"
                ? "Not Computed"
                : displayed.status.charAt(0).toUpperCase() +
                  displayed.status.slice(1)}
            </Badge>
          </div>
          <code className="text-sm font-mono font-semibold break-all">
            {displayed.name}
          </code>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {displayed.description}
          </p>
        </div>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <GitBranch className="size-3" />
            <span className="font-mono font-semibold text-foreground">
              {displayed.current_version}
            </span>
          </div>
          <span className="text-muted-foreground">
            {displayed.last_computed
              ? formatDistanceToNow(new Date(displayed.last_computed), {
                  addSuffix: true,
                })
              : "never"}
          </span>
        </div>
        <Separator />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Type</p>
            <Badge variant="secondary" className="text-xs">
              {displayed.feature_type}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Group</p>
            <Badge variant="secondary" className="text-xs">
              {displayed.feature_group}
            </Badge>
          </div>
        </div>
        {Object.keys(displayed.parameters).length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Code2 className="size-3" /> Parameters
            </p>
            <div className="rounded-lg bg-muted/40 p-2.5 space-y-1.5">
              {Object.entries(displayed.parameters).map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="font-mono text-muted-foreground">{k}</span>
                  <span className="font-mono font-medium">
                    {Array.isArray(v) ? v.join(", ") : String(v)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Computed For
          </p>
          <div className="flex flex-wrap gap-1">
            {displayed.symbols.map((s) => (
              <Badge key={s} variant="secondary" className="text-xs font-mono">
                {s}
              </Badge>
            ))}
          </div>
        </div>
        {displayed.consumed_by_models.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="size-3" /> Used by Models
            </p>
            <div className="flex flex-wrap gap-1">
              {displayed.consumed_by_models.map((m) => (
                <Badge key={m} variant="outline" className="text-xs">
                  {m}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {versions.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Version History
              </p>
              {versions.map((v, i) => (
                <div
                  key={v.version}
                  className={cn(
                    "rounded-lg border p-2.5 space-y-1",
                    i === 0
                      ? "border-primary/30 bg-primary/5"
                      : "border-border/50",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold">
                        {v.version}
                      </span>
                      {i === 0 && (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-primary/30 text-primary px-1 py-0"
                        >
                          current
                        </Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(v.changed_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {v.change_summary}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
        <Separator />
        <div className="flex gap-2">
          <Button size="sm" className="flex-1 gap-1" asChild>
            <Link href="/services/research/feature-etl">
              <ArrowRight className="size-3" /> Compute
            </Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1"
            onClick={() => setEditOpen(true)}
          >
            <Settings2 className="size-3" /> Edit Config
          </Button>
        </div>
      </div>

      <EditConfigDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        featureName={displayed.name}
        initial={{
          name: displayed.name,
          description: displayed.description,
          status: displayed.status,
          parameters: displayed.parameters,
          symbols: displayed.symbols,
          tags: displayed.tags,
          dependencies: displayed.dependencies,
        }}
        onSave={(updated) => {
          setDraft({
            ...displayed,
            description: updated.description,
            status: updated.status as FeatureCatalogueEntry["status"],
            parameters: updated.parameters,
            symbols: updated.symbols,
            tags: updated.tags,
            dependencies: updated.dependencies,
          });
        }}
      />
    </div>
  );
}

function CatGridView({
  features,
  selected,
  onSelect,
}: {
  features: FeatureCatalogueEntry[];
  selected: FeatureCatalogueEntry | null;
  onSelect: (f: FeatureCatalogueEntry) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {features.map((f) => {
        const sc = FEAT_STATUS_CFG[f.status];
        const SI = sc.icon;
        return (
          <Card
            key={f.id}
            className={cn(
              "hover:border-primary/40 transition-colors cursor-pointer",
              selected?.id === f.id && "border-primary/60 bg-primary/5",
            )}
            onClick={() => onSelect(f)}
          >
            <CardContent className="p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <code className="text-xs font-mono font-medium leading-tight break-all">
                  {f.name}
                </code>
                <SI className={cn("size-3.5 shrink-0 mt-0.5", sc.color)} />
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {f.description}
              </p>
              <div className="flex items-center gap-1 flex-wrap">
                <Badge
                  variant="outline"
                  className={cn("text-xs", SHARD_COLORS[f.shard])}
                >
                  {f.shard}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {f.feature_type}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-mono">{f.current_version}</span>
                <span>
                  {f.last_computed
                    ? formatDistanceToNow(new Date(f.last_computed), {
                        addSuffix: true,
                      })
                    : "never"}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function CatTreeView({
  features,
  selected,
  onSelect,
}: {
  features: FeatureCatalogueEntry[];
  selected: FeatureCatalogueEntry | null;
  onSelect: (f: FeatureCatalogueEntry) => void;
}) {
  const [expanded, setExpanded] = React.useState<Set<string>>(
    new Set(["CeFi / Technical"]),
  );
  const grouped: Record<string, FeatureCatalogueEntry[]> = {};
  for (const f of features) {
    const k = `${f.shard} / ${f.feature_group}`;
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(f);
  }
  return (
    <div className="space-y-1">
      {Object.entries(grouped).map(([key, items]) => {
        const isOpen = expanded.has(key);
        const [shard] = key.split(" / ");
        return (
          <div
            key={key}
            className="rounded-lg border border-border/50 overflow-hidden"
          >
            <button
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/40 transition-colors text-left"
              onClick={() =>
                setExpanded((p) => {
                  const n = new Set(p);
                  isOpen ? n.delete(key) : n.add(key);
                  return n;
                })
              }
            >
              {isOpen ? (
                <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
              )}
              <span className="font-medium text-sm flex-1">{key}</span>
              <Badge
                variant="outline"
                className={cn("text-xs", SHARD_COLORS[shard])}
              >
                {shard}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {items.filter((f) => f.status === "active").length}/
                {items.length}
              </Badge>
            </button>
            {isOpen && (
              <div className="border-t border-border/40 divide-y divide-border/30">
                {items.map((f) => {
                  const sc = FEAT_STATUS_CFG[f.status];
                  const SI = sc.icon;
                  return (
                    <button
                      key={f.id}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2 hover:bg-muted/30 transition-colors text-left text-xs",
                        selected?.id === f.id && "bg-primary/5",
                      )}
                      onClick={() => onSelect(f)}
                    >
                      <SI className={cn("size-3.5 shrink-0", sc.color)} />
                      <code className="font-mono font-medium flex-1 truncate">
                        {f.name}
                      </code>
                      <span className="font-mono text-muted-foreground shrink-0">
                        {f.current_version}
                      </span>
                      <ChevronRight className="size-3 text-muted-foreground shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CatTableView({
  features,
  selected,
  onSelect,
}: {
  features: FeatureCatalogueEntry[];
  selected: FeatureCatalogueEntry | null;
  onSelect: (f: FeatureCatalogueEntry) => void;
}) {
  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Feature</TableHead>
            <TableHead>Shard</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Syms</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {features.map((f) => (
            <TableRow
              key={f.id}
              className={cn(
                "cursor-pointer hover:bg-muted/30 transition-colors",
                selected?.id === f.id && "bg-primary/5 hover:bg-primary/10",
              )}
              onClick={() => onSelect(f)}
            >
              <TableCell>
                <code className="text-xs font-mono font-medium">{f.name}</code>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn("text-xs", SHARD_COLORS[f.shard])}
                >
                  {f.shard}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-xs text-muted-foreground">
                  {f.feature_type}
                </span>
              </TableCell>
              <TableCell>
                <span className="font-mono text-xs">{f.current_version}</span>
              </TableCell>
              <TableCell>
                <CatStatusBadge status={f.status} />
              </TableCell>
              <TableCell className="text-right text-xs tabular-nums">
                {f.symbols.length}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function CatalogueView({ search }: { search: string }) {
  const [viewMode, setViewMode] = React.useState<FlatViewMode>("table");
  const [shardFilter, setShardFilter] = React.useState("all");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [selectedFeature, setSelectedFeature] =
    React.useState<FeatureCatalogueEntry | null>(null);

  const filtered = React.useMemo(() => {
    let items = FEATURE_CATALOGUE;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (shardFilter !== "all")
      items = items.filter((f) => f.shard === shardFilter);
    if (typeFilter !== "all")
      items = items.filter((f) => f.feature_type === typeFilter);
    if (statusFilter !== "all")
      items = items.filter((f) => f.status === statusFilter);
    return items;
  }, [search, shardFilter, typeFilter, statusFilter]);

  const shards = [...new Set(FEATURE_CATALOGUE.map((f) => f.shard))];
  const types = [...new Set(FEATURE_CATALOGUE.map((f) => f.feature_type))];

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-border/30">
        <Select value={shardFilter} onValueChange={setShardFilter}>
          <SelectTrigger className="w-[120px] h-7 text-xs">
            <SelectValue placeholder="Shard" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Shards</SelectItem>
            {shards.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px] h-7 text-xs">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {types.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px] h-7 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="stale">Stale</SelectItem>
            <SelectItem value="not_computed">Not Computed</SelectItem>
            <SelectItem value="deprecated">Deprecated</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">
          {filtered.length} of {FEATURE_CATALOGUE.length}
        </span>
        <div className="flex items-center gap-0.5 rounded-md border border-border/50 p-0.5 ml-auto">
          {(
            [
              { mode: "grid" as const, icon: LayoutGrid },
              { mode: "tree" as const, icon: List },
              { mode: "table" as const, icon: Table2 },
            ] as const
          ).map(({ mode, icon: Icon }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "p-1.5 rounded transition-colors",
                viewMode === mode
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" />
            </button>
          ))}
        </div>
      </div>

      {/* Split: list + detail (same panel as Finder) */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="size-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No features match</p>
              </div>
            ) : viewMode === "grid" ? (
              <CatGridView
                features={filtered}
                selected={selectedFeature}
                onSelect={setSelectedFeature}
              />
            ) : viewMode === "tree" ? (
              <CatTreeView
                features={filtered}
                selected={selectedFeature}
                onSelect={setSelectedFeature}
              />
            ) : (
              <CatTableView
                features={filtered}
                selected={selectedFeature}
                onSelect={setSelectedFeature}
              />
            )}
          </div>
        </div>
        {/* Same right detail panel — wider to match Finder */}
        <div className="w-[420px] shrink-0 border-l border-border/50 flex flex-col min-h-0 bg-muted/5">
          <div className="px-3 py-1.5 border-b border-border/40 bg-muted/30">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Feature Detail
            </p>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <CatDetailPanel feature={selectedFeature} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════

type PageMode = "finder" | "catalogue";

export default function FeaturesPage() {
  const [pageMode, setPageMode] = React.useState<PageMode>("finder");
  const [search, setSearch] = React.useState("");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Top bar ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 px-6 pt-4 pb-3 border-b border-border/50">
        <div>
          <h1 className="text-lg font-bold tracking-tight">
            Feature Catalogue
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {pageMode === "finder"
              ? "Service → Category → Group → Feature"
              : `${FEATURE_CATALOGUE.length} features · ${[...new Set(FEATURE_CATALOGUE.map((f) => f.shard))].length} shards`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder={
                pageMode === "finder" ? "Filter services…" : "Search features…"
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-7 w-[180px] text-xs"
            />
          </div>
          <div className="flex items-center rounded-lg border border-border/50 overflow-hidden">
            {(["finder", "catalogue"] as PageMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setPageMode(m)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
                  m !== "finder" && "border-l border-border/50",
                  pageMode === m
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                {m === "finder" ? (
                  <Columns className="size-3" />
                ) : (
                  <Table2 className="size-3" />
                )}
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
            <Link href="/services/research/feature-etl">ETL Status</Link>
          </Button>
          <Button size="sm" className="h-7 text-xs">
            <Plus className="size-3.5 mr-1" /> New Feature
          </Button>
        </div>
      </div>

      {/* ── View ─────────────────────────────────────────────────── */}
      {pageMode === "finder" ? (
        <FinderView search={search} />
      ) : (
        <CatalogueView search={search} />
      )}
    </div>
  );
}
