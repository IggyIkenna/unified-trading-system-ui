"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { SchemaForm } from "@/components/shared/schema-driven-form";
import { buildDefaults, DEFI_STRATEGY_FAMILIES, DEFI_STRATEGY_SCHEMAS } from "@/lib/config/strategy-config-schemas";
import { deployDefiStrategy, getDefiStrategyConfig, saveDefiStrategyConfig } from "@/lib/stores/defi-strategy-store";
import {
  SHARE_CLASSES,
  SHARE_CLASS_LABELS,
  STRATEGY_DISPLAY_NAMES,
  type DeFiStrategyId,
  type ShareClass,
} from "@/lib/types/defi";
import * as React from "react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Share class colour indicator
// ---------------------------------------------------------------------------

const SHARE_CLASS_COLORS: Record<ShareClass, string> = {
  USDT: "text-emerald-400",
  ETH: "text-blue-400",
  BTC: "text-amber-400",
};

// ---------------------------------------------------------------------------
// All strategy IDs from the families
// ---------------------------------------------------------------------------

const ALL_DEFI_IDS = DEFI_STRATEGY_FAMILIES.flatMap((f) => f.strategies.map((s) => s.id));

function loadInitialConfigs(): Record<string, Record<string, unknown>> {
  const init: Record<string, Record<string, unknown>> = {};
  for (const id of ALL_DEFI_IDS) {
    const schema = DEFI_STRATEGY_SCHEMAS[id];
    const defaults = buildDefaults(schema);
    const stored = getDefiStrategyConfig(id);
    init[id] = stored ? { ...defaults, ...stored.config } : defaults;
  }
  return init;
}

// ---------------------------------------------------------------------------
// Widget
// ---------------------------------------------------------------------------

export function DeFiStrategyConfigWidget(_props: WidgetComponentProps) {
  const [selectedStrategy, setSelectedStrategy] = React.useState<DeFiStrategyId>("AAVE_LENDING");
  const [shareClass, setShareClass] = React.useState<ShareClass>("USDT");
  const [mode] = React.useState<"Active" | "Paper">("Paper");
  // isLoading: true during SSR/hydration until localStorage is readable client-side
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [configs, setConfigs] = React.useState<Record<string, Record<string, unknown>>>({});

  React.useEffect(() => {
    try {
      setConfigs(loadInitialConfigs());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load strategy configs");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const schema = DEFI_STRATEGY_SCHEMAS[selectedStrategy];
  const current = configs[selectedStrategy] ?? buildDefaults(schema);

  function updateConfig(next: Record<string, unknown>) {
    setConfigs((prev) => ({ ...prev, [selectedStrategy]: next }));
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-3 p-1">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-7 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="flex h-full min-h-[120px] items-center justify-center p-4">
        <div className="text-center space-y-1">
          <p className="text-xs font-medium text-rose-400">Failed to load strategy configs</p>
          <p className="text-micro text-muted-foreground">{loadError}</p>
        </div>
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (ALL_DEFI_IDS.length === 0) {
    return (
      <div className="flex h-full min-h-[120px] items-center justify-center p-4">
        <p className="text-xs text-muted-foreground">No DeFi strategies registered.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-1">
      {/* Header row: strategy selector + share class + mode badge */}
      <div className="flex items-center gap-2">
        <div className="flex-1 space-y-1">
          <label className="text-xs text-muted-foreground">Strategy</label>
          <Select value={selectedStrategy} onValueChange={(v) => setSelectedStrategy(v as DeFiStrategyId)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEFI_STRATEGY_FAMILIES.map((family) => (
                <React.Fragment key={family.label}>
                  <div className="px-2 py-1.5 text-micro font-semibold text-muted-foreground uppercase tracking-wider">
                    {family.label}
                  </div>
                  {family.strategies.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs pl-4">
                      {STRATEGY_DISPLAY_NAMES[s.id]}
                    </SelectItem>
                  ))}
                </React.Fragment>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 w-28">
          <label className="text-xs text-muted-foreground">Share Class</label>
          <Select value={shareClass} onValueChange={(v) => setShareClass(v as ShareClass)}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SHARE_CLASSES.map((sc) => (
                <SelectItem key={sc} value={sc} className={`text-xs font-mono ${SHARE_CLASS_COLORS[sc]}`}>
                  {sc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="pt-5">
          <Badge variant={mode === "Active" ? "success" : "warning"}>{mode}</Badge>
        </div>
      </div>

      {/* Share class info banner */}
      <div
        className={`rounded-md border px-3 py-1.5 text-xs flex items-center gap-1.5 ${shareClass === "ETH" ? "border-blue-500/30 bg-blue-500/5 text-blue-400" : shareClass === "BTC" ? "border-amber-500/30 bg-amber-500/5 text-amber-400" : "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"}`}
      >
        <span className="font-mono font-medium">{shareClass}</span>
        <span className="text-muted-foreground">— {SHARE_CLASS_LABELS[shareClass]}</span>
        <span className="ml-auto text-muted-foreground text-micro">P&L denominated in {shareClass}</span>
      </div>

      {/* Locked banner for recursive staked basis */}
      {selectedStrategy === "RECURSIVE_STAKED_BASIS" && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
          Demo only -- this strategy will be locked in production.
        </div>
      )}

      {/* Schema-driven config form */}
      <div className="rounded-lg border bg-muted/30 p-3">
        <SchemaForm schema={schema} values={current} onChange={updateConfig} />
      </div>

      {/* Client restrictions panel */}
      <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-micro font-medium text-muted-foreground uppercase tracking-wide">Client Config</span>
          <Badge variant="outline" className="text-nano h-4 px-1">
            DeFi Client
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
            <span className="text-muted-foreground">OKX, Bybit, Binance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0" />
            <span className="text-muted-foreground line-through">HyperLiquid</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
            <span className="text-muted-foreground font-mono">ETH only</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
            <span className="text-muted-foreground">Multi-coin: Locked</span>
          </div>
        </div>
      </div>

      {/* Risk indicators */}
      <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
        <span className="text-micro font-medium text-muted-foreground uppercase tracking-wide">Risk Indicators</span>
        <div className="space-y-1.5">
          {[
            { label: "Oracle Depeg (weETH/ETH)", value: "0.12%", status: "green" },
            { label: "Borrow-Staking Spread", value: "+1.4% net (4.2x levered)", status: "green" },
            { label: "USDT Peg", value: "$1.0002", status: "green" },
            { label: "Withdrawal Delay (ether.fi)", value: "7d queue", status: "amber" },
            { label: "Est. Rebalance Cost", value: "$420 (0.014% NAV)", status: "green" },
            { label: "Est. Full Close Cost", value: "$2,800 (0.093% NAV, ~35min)", status: "green" },
          ].map(({ label, value, status }) => (
            <div key={label} className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">{label}</span>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${status === "green" ? "bg-emerald-400" : status === "amber" ? "bg-amber-400" : "bg-rose-400"}`}
                />
                <span className="font-mono tabular-nums">{value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          className="flex-1"
          size="sm"
          onClick={() => {
            saveDefiStrategyConfig(selectedStrategy, current);
            toast.success("Config saved", {
              description: `${STRATEGY_DISPLAY_NAMES[selectedStrategy]} configuration persisted. Survives reload.`,
            });
          }}
        >
          Save Config
        </Button>
        <Button
          variant="secondary"
          className="flex-1"
          size="sm"
          onClick={() => {
            deployDefiStrategy(selectedStrategy);
            toast.success("Strategy deployed", {
              description: `${STRATEGY_DISPLAY_NAMES[selectedStrategy]} deployed. Yield generation active.`,
            });
          }}
        >
          Deploy Strategy
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const runId = Math.floor(Math.random() * 9000) + 1000;
            toast.success("Promoted from backtest", {
              description: `Promoted from backtest run #${runId} for ${STRATEGY_DISPLAY_NAMES[selectedStrategy]}.`,
            });
          }}
        >
          Promote
        </Button>
      </div>
    </div>
  );
}
