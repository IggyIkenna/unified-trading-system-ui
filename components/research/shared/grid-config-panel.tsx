"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils/formatters";
import { CheckCircle2, ChevronDown, ChevronRight, Grid3X3, Lock, Settings2, Zap } from "lucide-react";

// ─── Instruction Constraints (from UAC instruction_constraints.py) ──────────

/** Maps instruction_type → allowed venue asset groups (from backend) */
export const INSTRUCTION_VENUE_CONSTRAINTS: Record<string, Set<string>> = {
  TRADE: new Set(["CeFi", "TradFi"]),
  SWAP: new Set(["DeFi"]),
  LEND: new Set(["DeFi"]),
  BORROW: new Set(["DeFi"]),
  STAKE: new Set(["DeFi"]),
  FLASH_LOAN: new Set(["DeFi"]),
};

/** Maps strategy archetype → primary instruction types it generates */
export const ARCHETYPE_INSTRUCTION_TYPES: Record<string, string[]> = {
  momentum: ["TRADE"],
  mean_reversion: ["TRADE"],
  statistical_arb: ["TRADE"],
  volatility: ["TRADE"],
  yield: ["LEND", "SWAP", "STAKE"],
  arbitrage: ["TRADE"],
  value_betting: ["TRADE"],
};

/** Given an archetype, returns which venue asset groups are valid */
export function getValidVenueAssetGroups(archetype: string): Set<string> {
  const instructionTypes = ARCHETYPE_INSTRUCTION_TYPES[archetype] ?? ["TRADE"];
  const valid = new Set<string>();
  for (const it of instructionTypes) {
    const cats = INSTRUCTION_VENUE_CONSTRAINTS[it];
    if (cats) for (const c of cats) valid.add(c);
  }
  return valid;
}

// ─── Types ──────────────────────────────────────────────────────────────────

/** A selectable/lockable subscription item */
export interface SubscriptionItem {
  id: string;
  label: string;
  category: string;
  /** User has access (subscription-gated) */
  enabled: boolean;
  /** User has SELECTED this for the current run */
  selected: boolean;
  description?: string;
}

/** A grid parameter with range or set of values to sweep */
export interface GridParameter {
  id: string;
  label: string;
  type: "range" | "set" | "toggle";
  min?: number;
  max?: number;
  step?: number;
  rangeValue?: [number, number];
  options?: { value: string; label: string }[];
  selectedValues?: string[];
  sweepBoth?: boolean;
  category?: string;
  hint?: string;
  /** From config-registry: the backend field name */
  backendField?: string;
}

export interface GridConfigPanelProps {
  /** Step 1: Fixed selections (features, models, venues, instruments) */
  subscriptions: {
    title: string;
    items: SubscriptionItem[];
    onToggle: (id: string) => void;
  }[];
  /** Step 2: Dynamic grid params (change based on archetype/algo selection) */
  parameters: GridParameter[];
  onParameterChange: (id: string, update: Partial<GridParameter>) => void;
  onRunGrid: () => void;
  isRunning?: boolean;
  domain?: string;
}

// ─── Collapsible Section ────────────────────────────────────────────────────

function Section({
  title,
  icon,
  badge,
  step,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  step: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <Card className="border-border/50">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors rounded-t-lg"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center size-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
            {step}
          </span>
          {icon}
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</h4>
          {badge}
        </div>
        {open ? (
          <ChevronDown className="size-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 text-muted-foreground" />
        )}
      </button>
      {open && <CardContent className="pt-0 pb-3 px-4 space-y-2">{children}</CardContent>}
    </Card>
  );
}

// ─── Subscription Chips (Select / Deselect / Locked) ────────────────────────

function SubscriptionChips({
  title,
  items,
  onToggle,
}: {
  title: string;
  items: SubscriptionItem[];
  onToggle: (id: string) => void;
}) {
  const categories = [...new Set(items.map((i) => i.category))];
  const selectedCount = items.filter((i) => i.selected).length;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium text-muted-foreground">{title}</p>
        <span className="text-[9px] text-muted-foreground/60">{selectedCount} sel.</span>
      </div>
      <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5">
        {categories.map((cat, ci) => (
          <React.Fragment key={cat}>
            {ci > 0 && <span className="text-border mx-0.5">|</span>}
            <span className="text-[8px] uppercase tracking-wider text-muted-foreground/40 mr-0.5">{cat}</span>
            {items
              .filter((i) => i.category === cat)
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() => item.enabled && onToggle(item.id)}
                  disabled={!item.enabled}
                  className={cn(
                    "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] transition-all border leading-tight",
                    !item.enabled
                      ? "bg-muted/10 text-muted-foreground/30 border-border/20 cursor-not-allowed"
                      : item.selected
                        ? "bg-primary/15 text-primary border-primary/30"
                        : "bg-muted/20 text-muted-foreground border-border/30 hover:border-primary/30 hover:text-foreground",
                  )}
                  title={
                    !item.enabled
                      ? `Upgrade to access ${item.label}`
                      : item.selected
                        ? "Click to deselect"
                        : "Click to select"
                  }
                >
                  {!item.enabled ? (
                    <Lock className="size-2.5" />
                  ) : item.selected ? (
                    <CheckCircle2 className="size-2.5" />
                  ) : (
                    <span className="size-2.5 rounded-full border border-muted-foreground/40" />
                  )}
                  {item.label}
                </button>
              ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ─── Grid Parameter Renderers ───────────────────────────────────────────────

function RangeParam({ param, onChange }: { param: GridParameter; onChange: (u: Partial<GridParameter>) => void }) {
  const [low, high] = param.rangeValue ?? [param.min ?? 0, param.max ?? 100];
  const step = param.step ?? 1;
  const steps = step > 0 ? Math.floor((high - low) / step) + 1 : 1;

  // Compute sensible step options based on the param range
  const range = (param.max ?? 100) - (param.min ?? 0);
  const stepOptions = React.useMemo(() => {
    const opts: number[] = [];
    // Generate step options: start from current step, then halve/double
    const base = param.step ?? 1;
    for (const mult of [0.1, 0.25, 0.5, 1, 2, 5, 10]) {
      const v = base * mult;
      if (v > 0 && v <= range / 2 && !opts.includes(v)) opts.push(v);
    }
    return opts.sort((a, b) => a - b).slice(0, 5);
  }, [param.step, range]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Label className="text-xs">{param.label}</Label>
          {param.backendField && (
            <span className="text-[8px] font-mono text-muted-foreground/40">{param.backendField}</span>
          )}
        </div>
        <Badge variant="secondary" className="text-[10px] font-mono">
          {steps} val
        </Badge>
      </div>
      <Slider
        min={param.min ?? 0}
        max={param.max ?? 100}
        step={step}
        value={[low, high]}
        onValueChange={([l, h]) => onChange({ rangeValue: [l, h] })}
        className="py-0.5"
      />
      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
        <span>{low}</span>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground/50">step:</span>
          {stepOptions.map((s) => (
            <button
              key={s}
              onClick={() => onChange({ step: s })}
              className={cn(
                "px-1 py-0 rounded text-[9px] transition-colors",
                s === step ? "bg-primary/20 text-primary" : "hover:bg-muted/40 text-muted-foreground/60",
              )}
            >
              {s % 1 === 0 ? s : formatNumber(s, s < 0.1 ? 4 : s < 1 ? 2 : 1)}
            </button>
          ))}
        </div>
        <span>{high}</span>
      </div>
      {param.hint && <p className="text-[9px] text-muted-foreground/60">{param.hint}</p>}
    </div>
  );
}

function SetParam({ param, onChange }: { param: GridParameter; onChange: (u: Partial<GridParameter>) => void }) {
  const selected = new Set(param.selectedValues ?? []);
  const toggle = (val: string) => {
    const next = new Set(selected);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    onChange({ selectedValues: [...next] });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-xs">{param.label}</Label>
          {param.backendField && (
            <span className="ml-2 text-[9px] font-mono text-muted-foreground/50">{param.backendField}</span>
          )}
        </div>
        <Badge variant="secondary" className="text-[10px] font-mono">
          {selected.size} selected
        </Badge>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {(param.options ?? []).map((opt) => (
          <button
            key={opt.value}
            onClick={() => toggle(opt.value)}
            className={cn(
              "px-2.5 py-1 rounded-md text-xs font-medium transition-all border",
              selected.has(opt.value)
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-muted/20 text-muted-foreground border-border/30 hover:border-border",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {param.hint && <p className="text-[10px] text-muted-foreground">{param.hint}</p>}
    </div>
  );
}

function ToggleParam({ param, onChange }: { param: GridParameter; onChange: (u: Partial<GridParameter>) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <Label className="text-xs">{param.label}</Label>
        {param.hint && <p className="text-[10px] text-muted-foreground">{param.hint}</p>}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground">{param.sweepBoth ? "Sweep both" : "Fixed"}</span>
        <Switch checked={param.sweepBoth ?? false} onCheckedChange={(v) => onChange({ sweepBoth: v })} />
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function GridConfigPanel({
  subscriptions,
  parameters,
  onParameterChange,
  onRunGrid,
  isRunning,
  domain = "Backtest",
}: GridConfigPanelProps) {
  const gridSize = React.useMemo(() => {
    let total = 1;
    for (const p of parameters) {
      if (p.type === "range") {
        const [low, high] = p.rangeValue ?? [p.min ?? 0, p.max ?? 100];
        const step = p.step ?? 1;
        const count = step > 0 ? Math.floor((high - low) / step) + 1 : 1;
        if (count > 1) total *= count;
      } else if (p.type === "set") {
        const count = (p.selectedValues ?? []).length;
        if (count > 1) total *= count;
      } else if (p.type === "toggle" && p.sweepBoth) {
        total *= 2;
      }
    }
    return total;
  }, [parameters]);

  const paramCategories = React.useMemo(() => {
    const cats = new Map<string, GridParameter[]>();
    for (const p of parameters) {
      const cat = p.category ?? "General";
      if (!cats.has(cat)) cats.set(cat, []);
      cats.get(cat)!.push(p);
    }
    return cats;
  }, [parameters]);

  const totalSelected = subscriptions.reduce((sum, s) => sum + s.items.filter((i) => i.selected).length, 0);

  return (
    <div className="space-y-4">
      {/* Step 1: Fixed Selections */}
      <Section
        title="Fixed Selections"
        icon={<Settings2 className="size-3.5 text-muted-foreground" />}
        badge={
          <Badge variant="outline" className="text-[10px]">
            {totalSelected} selected
          </Badge>
        }
        step={1}
        defaultOpen={true}
      >
        <p className="text-[11px] text-muted-foreground">
          Select which items to include in this run. Locked items require a subscription upgrade.
        </p>
        {subscriptions.map((sub) => (
          <SubscriptionChips key={sub.title} title={sub.title} items={sub.items} onToggle={sub.onToggle} />
        ))}
      </Section>

      {/* Step 2: Grid Parameters */}
      <Section
        title="Grid Parameters"
        icon={<Grid3X3 className="size-3.5 text-muted-foreground" />}
        badge={
          <Badge
            variant="secondary"
            className={cn(
              "text-[10px] font-mono",
              gridSize > 100 && "text-amber-400",
              gridSize > 500 && "text-rose-400",
            )}
          >
            {gridSize.toLocaleString()} combinations
          </Badge>
        }
        step={2}
        defaultOpen={true}
      >
        <p className="text-[11px] text-muted-foreground">
          Define value ranges to sweep. Parameters shown are specific to your selections above. Each parameter with
          multiple values multiplies the grid size.
        </p>
        {parameters.length === 0 ? (
          <p className="text-xs text-muted-foreground/60 italic py-3 text-center">
            Make selections above to see available grid parameters
          </p>
        ) : (
          [...paramCategories.entries()].map(([cat, params]) => (
            <div key={cat} className="space-y-3">
              {paramCategories.size > 1 && (
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium border-b border-border/30 pb-1">
                  {cat}
                </p>
              )}
              {params.map((p) => {
                if (p.type === "range")
                  return <RangeParam key={p.id} param={p} onChange={(u) => onParameterChange(p.id, u)} />;
                if (p.type === "set")
                  return <SetParam key={p.id} param={p} onChange={(u) => onParameterChange(p.id, u)} />;
                return <ToggleParam key={p.id} param={p} onChange={(u) => onParameterChange(p.id, u)} />;
              })}
            </div>
          ))
        )}
      </Section>

      {/* Step 3: Preview & Run */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex items-center justify-center size-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
              3
            </span>
            <p className="text-sm font-medium">Run Grid Search</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {domain} will run <span className="font-mono font-bold text-primary">{gridSize.toLocaleString()}</span>{" "}
              parameter combinations across {totalSelected} selected items
            </p>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">Est. runtime</p>
              <p className="text-xs font-mono font-medium">~{Math.max(1, Math.ceil(gridSize * 0.04))} min</p>
            </div>
          </div>
          {gridSize > 500 && (
            <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-2 text-[11px] text-amber-400">
              Large grid ({gridSize.toLocaleString()} combinations). Consider narrowing parameter ranges.
            </div>
          )}
          <Button
            className="w-full gap-2"
            onClick={onRunGrid}
            disabled={isRunning || gridSize === 0 || totalSelected === 0}
          >
            {isRunning ? (
              <>Running grid search...</>
            ) : (
              <>
                <Zap className="size-4" />
                Run {gridSize > 1 ? "Grid Search" : domain} ({gridSize.toLocaleString()}{" "}
                {gridSize === 1 ? "config" : "configs"})
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
