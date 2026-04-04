"use client";

import { PnLValue } from "@/components/trading/pnl-value";
import { CollapsibleSection } from "@/components/shared/collapsible-section";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { usePnLData } from "./pnl-data-context";
import { formatPercent } from "@/lib/utils/formatters";

// ---------------------------------------------------------------------------
// DeFi P&L Attribution Mock Data
// ---------------------------------------------------------------------------

interface DeFiPnLCategory {
  name: string;
  value: number;
  color: string;
  isNegative: boolean;
}

const DEFI_PNL_ATTRIBUTION: DeFiPnLCategory[] = [
  { name: "Interest Income", value: 5860, color: "#10b981", isNegative: false },
  { name: "Funding Income", value: 4120, color: "#3b82f6", isNegative: false },
  { name: "Staking Yield", value: 2850, color: "#8b5cf6", isNegative: false },
  { name: "Rewards (EIGEN/ETHFI)", value: 1240, color: "#14b8a6", isNegative: false },
  { name: "Gas Costs", value: -345, color: "#6b7280", isNegative: true },
  { name: "Swap Slippage", value: -128, color: "#f59e0b", isNegative: true },
  { name: "Impermanent Loss", value: -520, color: "#ef4444", isNegative: true },
  { name: "Bridge Fees", value: -85, color: "#94a3b8", isNegative: true },
];

const DEFI_PNL_NET = DEFI_PNL_ATTRIBUTION.reduce((sum, c) => sum + c.value, 0);
const DEFI_PNL_MAX_ABS = Math.max(...DEFI_PNL_ATTRIBUTION.map((c) => Math.abs(c.value)), 1);

export function PnlWaterfallWidget(_props: WidgetComponentProps) {
  const { structuralPnL, residualPnL, pnlComponents, netPnL, selectedFactor, setSelectedFactor } = usePnLData();

  const maxFactorAbs = Math.max(...pnlComponents.map((c) => Math.abs(c.value)), 1);

  return (
    <div className="flex flex-col gap-3 h-full min-h-0 p-2">
      <div className="flex items-center justify-between shrink-0">
        <span className="text-xs text-muted-foreground">Cross-section net</span>
        <PnLValue value={netPnL} size="lg" showSign />
      </div>

      <CollapsibleSection title="Structural" defaultOpen>
        <div className="space-y-2 pb-2 px-1">
          {structuralPnL.map((component) => {
            const totalStruct = structuralPnL.reduce((s, c) => s + c.value, 0);
            const maxStructVal = Math.max(...structuralPnL.map((c) => c.value));
            const width = (component.value / maxStructVal) * 100;
            return (
              <div key={component.name} className="p-2 -mx-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{component.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {formatPercent((component.value / totalStruct) * 100, 1)}
                    </span>
                    <PnLValue value={component.value} size="sm" showSign />
                  </div>
                </div>
                <div className="h-5 bg-muted rounded-md overflow-hidden">
                  <div
                    className={`h-full rounded-md transition-all duration-300 ${
                      component.name === "Realized" ? "bg-[var(--pnl-positive)]/70" : "bg-[var(--accent-blue)]/60"
                    }`}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
          <div className="flex items-center justify-between px-2 pt-1">
            <span className="text-sm font-semibold">Total P&L</span>
            <PnLValue value={structuralPnL.reduce((s, c) => s + c.value, 0)} size="md" showSign />
          </div>
        </div>
      </CollapsibleSection>

      <div className="space-y-2 py-1 min-h-0 overflow-auto flex-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">Factor Attribution</p>
        {pnlComponents.map((component) => {
          const width = (Math.abs(component.value) / maxFactorAbs) * 100;
          const isSelected = selectedFactor === component.name;
          return (
            <div
              key={component.name}
              className={`group cursor-pointer rounded-lg p-2 -mx-1 transition-colors ${
                isSelected ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted/50"
              }`}
              onClick={() => setSelectedFactor(isSelected ? null : component.name)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-medium ${isSelected ? "text-primary" : ""}`}>{component.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {component.percentage > 0 ? "+" : ""}
                    {formatPercent(component.percentage, 1)}
                  </span>
                  <PnLValue value={component.value} size="sm" showSign />
                </div>
              </div>
              <div className="h-5 bg-muted rounded-md overflow-hidden">
                <div
                  className={`h-full rounded-md transition-all duration-300 ${
                    component.isNegative ? "bg-[var(--pnl-negative)]/60" : "bg-[var(--pnl-positive)]/60"
                  }`}
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* DeFi P&L Attribution */}
      <CollapsibleSection title="DeFi P&L Attribution" defaultOpen={false} count={DEFI_PNL_ATTRIBUTION.length}>
        <div className="space-y-2 pb-2 px-1">
          {DEFI_PNL_ATTRIBUTION.map((cat) => {
            const width = (Math.abs(cat.value) / DEFI_PNL_MAX_ABS) * 100;
            return (
              <div key={cat.name} className="p-2 -mx-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{cat.name}</span>
                  <PnLValue value={cat.value} size="sm" showSign />
                </div>
                <div className="h-4 bg-muted rounded-md overflow-hidden">
                  <div
                    className="h-full rounded-md transition-all duration-300"
                    style={{
                      width: `${width}%`,
                      backgroundColor: cat.color,
                      opacity: 0.7,
                    }}
                  />
                </div>
              </div>
            );
          })}
          <div className="flex items-center justify-between px-2 pt-1 border-t border-border">
            <span className="text-sm font-semibold">DeFi Net P&L</span>
            <PnLValue value={DEFI_PNL_NET} size="md" showSign />
          </div>
        </div>
      </CollapsibleSection>

      <div className="pt-2 border-t border-dashed border-[var(--status-warning)]/40 space-y-2 shrink-0">
        <div
          className="p-2 -mx-1 rounded-lg bg-[var(--status-warning)]/5 border border-dashed border-[var(--status-warning)]/30"
          title="Unexplained P&L — large residual indicates a missing risk factor."
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[var(--status-warning)]">{residualPnL.name}</span>
              <span className="text-xs text-muted-foreground">(unexplained)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">{formatPercent(residualPnL.percentage, 1)}</span>
              <PnLValue value={residualPnL.value} size="sm" showSign />
            </div>
          </div>
          <div className="h-4 bg-muted rounded-md overflow-hidden">
            <div
              className="h-full rounded-md bg-[var(--status-warning)]/50"
              style={{ width: `${(Math.abs(residualPnL.value) / maxFactorAbs) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-border shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">NET P&L</span>
          <PnLValue value={netPnL} size="lg" showSign />
        </div>
      </div>
    </div>
  );
}
