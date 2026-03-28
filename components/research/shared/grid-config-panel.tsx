"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Grid3X3,
  Lock,
  Play,
  Settings2,
  Zap,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

/** A subscription item (feature, model, venue, instrument) with lock state */
export interface SubscriptionItem {
  id: string;
  label: string;
  category: string;
  enabled: boolean;
  description?: string;
}

/** A grid parameter: defines a range or set of values to sweep */
export interface GridParameter {
  id: string;
  label: string;
  type: "range" | "set" | "toggle";
  /** For 'range': [min, max] + step */
  min?: number;
  max?: number;
  step?: number;
  /** Current range selection [low, high] */
  rangeValue?: [number, number];
  /** For 'set': available choices */
  options?: { value: string; label: string }[];
  /** Currently selected set values */
  selectedValues?: string[];
  /** For 'toggle': boolean sweep (true only vs true+false) */
  sweepBoth?: boolean;
  /** Category grouping */
  category?: string;
  /** Help text */
  hint?: string;
}

export interface GridConfigPanelProps {
  /** Section 1: Available subscriptions (features, models, venues, etc.) */
  subscriptions: {
    title: string;
    items: SubscriptionItem[];
    onToggle?: (id: string) => void;
  }[];
  /** Section 2: Grid parameters to sweep */
  parameters: GridParameter[];
  onParameterChange: (id: string, update: Partial<GridParameter>) => void;
  /** Callback when "Run Grid Search" is clicked */
  onRunGrid: () => void;
  /** Loading state */
  isRunning?: boolean;
  /** Optional domain label (Strategy / Execution / ML Training) */
  domain?: string;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function CollapsibleSection({
  title,
  icon,
  badge,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
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
          {icon}
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </h4>
          {badge}
        </div>
        {open ? (
          <ChevronDown className="size-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 text-muted-foreground" />
        )}
      </button>
      {open && (
        <CardContent className="pt-0 pb-4 space-y-3">{children}</CardContent>
      )}
    </Card>
  );
}

function SubscriptionSection({
  title,
  items,
  onToggle,
}: {
  title: string;
  items: SubscriptionItem[];
  onToggle?: (id: string) => void;
}) {
  const categories = [...new Set(items.map((i) => i.category))];
  const enabledCount = items.filter((i) => i.enabled).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <Badge variant="outline" className="text-[10px]">
          {enabledCount}/{items.length} enabled
        </Badge>
      </div>
      {categories.map((cat) => (
        <div key={cat} className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 pl-1">
            {cat}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {items
              .filter((i) => i.category === cat)
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() => onToggle?.(item.id)}
                  disabled={!item.enabled && !onToggle}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all",
                    item.enabled
                      ? "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                      : "bg-muted/20 text-muted-foreground/40 border border-border/30 cursor-not-allowed",
                  )}
                  title={
                    item.enabled
                      ? item.description
                      : `Upgrade to access ${item.label}`
                  }
                >
                  {item.enabled ? (
                    <CheckCircle2 className="size-3" />
                  ) : (
                    <Lock className="size-3" />
                  )}
                  {item.label}
                </button>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function RangeGridParam({
  param,
  onChange,
}: {
  param: GridParameter;
  onChange: (update: Partial<GridParameter>) => void;
}) {
  const [low, high] = param.rangeValue ?? [param.min ?? 0, param.max ?? 100];
  const step = param.step ?? 1;
  const steps = step > 0 ? Math.floor((high - low) / step) + 1 : 1;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{param.label}</Label>
        <Badge variant="secondary" className="text-[10px] font-mono">
          {steps} values
        </Badge>
      </div>
      <Slider
        min={param.min ?? 0}
        max={param.max ?? 100}
        step={step}
        value={[low, high]}
        onValueChange={([l, h]) =>
          onChange({ rangeValue: [l, h] })
        }
        className="py-1"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
        <span>{low}</span>
        <span>step: {step}</span>
        <span>{high}</span>
      </div>
      {param.hint && (
        <p className="text-[10px] text-muted-foreground">{param.hint}</p>
      )}
    </div>
  );
}

function SetGridParam({
  param,
  onChange,
}: {
  param: GridParameter;
  onChange: (update: Partial<GridParameter>) => void;
}) {
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
        <Label className="text-xs">{param.label}</Label>
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
      {param.hint && (
        <p className="text-[10px] text-muted-foreground">{param.hint}</p>
      )}
    </div>
  );
}

function ToggleGridParam({
  param,
  onChange,
}: {
  param: GridParameter;
  onChange: (update: Partial<GridParameter>) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <Label className="text-xs">{param.label}</Label>
        {param.hint && (
          <p className="text-[10px] text-muted-foreground">{param.hint}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground">
          {param.sweepBoth ? "Sweep true+false" : "Fixed true"}
        </span>
        <Switch
          checked={param.sweepBoth ?? false}
          onCheckedChange={(v) => onChange({ sweepBoth: v })}
        />
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
  // Calculate total grid combinations
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

  // Group parameters by category
  const paramCategories = React.useMemo(() => {
    const cats = new Map<string, GridParameter[]>();
    for (const p of parameters) {
      const cat = p.category ?? "General";
      if (!cats.has(cat)) cats.set(cat, []);
      cats.get(cat)!.push(p);
    }
    return cats;
  }, [parameters]);

  const enabledSubscriptions = subscriptions.reduce(
    (sum, s) => sum + s.items.filter((i) => i.enabled).length,
    0,
  );
  const totalSubscriptions = subscriptions.reduce(
    (sum, s) => sum + s.items.length,
    0,
  );

  return (
    <div className="space-y-4">
      {/* Section 1: Subscriptions (Fixed / Locked) */}
      <CollapsibleSection
        title="Subscriptions"
        icon={<Settings2 className="size-3.5 text-muted-foreground" />}
        badge={
          <Badge variant="outline" className="text-[10px]">
            {enabledSubscriptions}/{totalSubscriptions}
          </Badge>
        }
        defaultOpen={true}
      >
        <p className="text-[11px] text-muted-foreground">
          Available features, models, venues, and instruments based on your
          subscription. Locked items require an upgrade.
        </p>
        {subscriptions.map((sub) => (
          <SubscriptionSection
            key={sub.title}
            title={sub.title}
            items={sub.items}
            onToggle={sub.onToggle}
          />
        ))}
      </CollapsibleSection>

      {/* Section 2: Grid Parameters (Dynamic) */}
      <CollapsibleSection
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
        defaultOpen={true}
      >
        <p className="text-[11px] text-muted-foreground">
          Define parameter ranges to sweep. Each parameter with multiple values
          multiplies the total grid size.
        </p>
        {[...paramCategories.entries()].map(([cat, params]) => (
          <div key={cat} className="space-y-3">
            {paramCategories.size > 1 && (
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium border-b border-border/30 pb-1">
                {cat}
              </p>
            )}
            {params.map((p) => {
              if (p.type === "range") {
                return (
                  <RangeGridParam
                    key={p.id}
                    param={p}
                    onChange={(u) => onParameterChange(p.id, u)}
                  />
                );
              }
              if (p.type === "set") {
                return (
                  <SetGridParam
                    key={p.id}
                    param={p}
                    onChange={(u) => onParameterChange(p.id, u)}
                  />
                );
              }
              return (
                <ToggleGridParam
                  key={p.id}
                  param={p}
                  onChange={(u) => onParameterChange(p.id, u)}
                />
              );
            })}
          </div>
        ))}
      </CollapsibleSection>

      {/* Section 3: Grid Preview & Run */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Grid Search Preview</p>
              <p className="text-xs text-muted-foreground">
                {domain} will run{" "}
                <span className="font-mono font-bold text-primary">
                  {gridSize.toLocaleString()}
                </span>{" "}
                parameter combinations
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">Est. runtime</p>
              <p className="text-xs font-mono font-medium">
                ~{Math.max(1, Math.ceil(gridSize * 0.04))} min
              </p>
            </div>
          </div>

          {gridSize > 500 && (
            <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-2 text-[11px] text-amber-400">
              Large grid ({gridSize.toLocaleString()} combinations). Consider
              narrowing parameter ranges to reduce runtime.
            </div>
          )}

          <Button
            className="w-full gap-2"
            onClick={onRunGrid}
            disabled={isRunning || gridSize === 0}
          >
            {isRunning ? (
              <>Running grid search...</>
            ) : (
              <>
                <Zap className="size-4" />
                Run {gridSize > 1 ? "Grid Search" : domain}{" "}
                ({gridSize.toLocaleString()}{" "}
                {gridSize === 1 ? "config" : "configs"})
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
