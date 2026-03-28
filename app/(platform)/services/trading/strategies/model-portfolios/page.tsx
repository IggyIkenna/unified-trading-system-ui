"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useExecutionMode } from "@/lib/execution-mode-context";
import {
  PieChart,
  ArrowRightLeft,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  Play,
  X,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

interface PortfolioAsset {
  asset: string;
  targetPct: number;
  actualPct: number;
}

interface ModelPortfolio {
  id: string;
  name: string;
  assets: PortfolioAsset[];
  totalValue: number;
  lastRebalanced: string;
}

const MODEL_PORTFOLIOS: ModelPortfolio[] = [
  {
    id: "core-crypto",
    name: "Core Crypto",
    totalValue: 2_380_000,
    lastRebalanced: "2026-03-15",
    assets: [
      { asset: "BTC", targetPct: 40, actualPct: 43.2 },
      { asset: "ETH", targetPct: 30, actualPct: 28.1 },
      { asset: "SOL", targetPct: 10, actualPct: 9.8 },
      { asset: "MATIC", targetPct: 5, actualPct: 4.5 },
      { asset: "USDC", targetPct: 15, actualPct: 14.4 },
    ],
  },
  {
    id: "defi-yield",
    name: "DeFi Yield",
    totalValue: 1_640_000,
    lastRebalanced: "2026-03-20",
    assets: [
      { asset: "stETH", targetPct: 25, actualPct: 26.8 },
      { asset: "rETH", targetPct: 15, actualPct: 14.2 },
      { asset: "mSOL", targetPct: 15, actualPct: 16.1 },
      { asset: "AAVE", targetPct: 10, actualPct: 9.4 },
      { asset: "CRV", targetPct: 10, actualPct: 8.5 },
      { asset: "UNI", targetPct: 5, actualPct: 5.3 },
      { asset: "USDC", targetPct: 20, actualPct: 19.7 },
    ],
  },
  {
    id: "balanced-multi",
    name: "Balanced Multi-Asset",
    totalValue: 4_150_000,
    lastRebalanced: "2026-03-22",
    assets: [
      { asset: "BTC", targetPct: 25, actualPct: 24.1 },
      { asset: "ETH", targetPct: 20, actualPct: 21.3 },
      { asset: "SOL", targetPct: 10, actualPct: 10.4 },
      { asset: "LINK", targetPct: 5, actualPct: 4.6 },
      { asset: "AVAX", targetPct: 5, actualPct: 5.8 },
      { asset: "DOT", targetPct: 5, actualPct: 4.2 },
      { asset: "USDC", targetPct: 20, actualPct: 19.8 },
      { asset: "USDT", targetPct: 10, actualPct: 9.8 },
    ],
  },
];

interface DriftEvent {
  day: number;
  description: string;
}

function generateDriftHistory(portfolio: ModelPortfolio): DriftEvent[] {
  const events: DriftEvent[] = [];
  const breached = portfolio.assets.filter(
    (a) => Math.abs(a.actualPct - a.targetPct) > 2.0,
  );

  events.push({ day: 1, description: "All assets within tolerance after rebalance." });
  events.push({ day: 5, description: "Minor drift detected in major assets (+0.3% BTC)." });
  events.push({ day: 10, description: "Portfolio remains within 2% tolerance band." });

  if (breached.length > 0) {
    events.push({
      day: 15,
      description: `${breached[0].asset} exceeded +2% drift threshold (${(breached[0].actualPct - breached[0].targetPct).toFixed(1)}%).`,
    });
    events.push({ day: 20, description: "Rebalance suggestion generated." });
  } else {
    events.push({ day: 15, description: "All allocations steady within tolerance." });
    events.push({ day: 20, description: "No rebalance needed." });
  }
  events.push({ day: 25, description: "Market volatility increased; monitoring drift." });
  events.push({
    day: 30,
    description:
      breached.length > 0
        ? `Current drift: ${breached.map((b) => `${b.asset} ${(b.actualPct - b.targetPct) > 0 ? "+" : ""}${(b.actualPct - b.targetPct).toFixed(1)}%`).join(", ")}.`
        : "Portfolio remains balanced.",
  });

  return events;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TOLERANCE = 2.0;

function driftColor(drift: number): string {
  const absDrift = Math.abs(drift);
  if (absDrift > TOLERANCE) return "text-rose-400";
  if (absDrift > TOLERANCE * 0.75) return "text-amber-400";
  return "text-emerald-400";
}

function driftBadgeVariant(drift: number): "success" | "warning" | "error" {
  const absDrift = Math.abs(drift);
  if (absDrift > TOLERANCE) return "error";
  if (absDrift > TOLERANCE * 0.75) return "warning";
  return "success";
}

function DriftIcon({ drift }: { drift: number }) {
  if (drift > 0.1) return <TrendingUp className="size-3" />;
  if (drift < -0.1) return <TrendingDown className="size-3" />;
  return <Minus className="size-3" />;
}

// ---------------------------------------------------------------------------
// New model form
// ---------------------------------------------------------------------------

interface NewModelFormProps {
  onClose: () => void;
}

function NewModelForm({ onClose }: NewModelFormProps) {
  const [name, setName] = React.useState("");
  const [rows, setRows] = React.useState([
    { asset: "", target: "" },
    { asset: "", target: "" },
    { asset: "", target: "" },
  ]);

  const addRow = () => setRows((prev) => [...prev, { asset: "", target: "" }]);
  const totalTarget = rows.reduce((s, r) => s + (parseFloat(r.target) || 0), 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Create New Model Portfolio</CardTitle>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Portfolio Name</label>
          <Input
            placeholder="e.g. Conservative DeFi"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Assets & Target Allocations</label>
          {rows.map((row, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_100px_40px] gap-2 items-center">
              <Input
                placeholder="Asset symbol"
                value={row.asset}
                onChange={(e) => {
                  const next = [...rows];
                  next[idx] = { ...next[idx], asset: e.target.value };
                  setRows(next);
                }}
                className="h-8 text-sm font-mono"
              />
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  placeholder="%"
                  value={row.target}
                  onChange={(e) => {
                    const next = [...rows];
                    next[idx] = { ...next[idx], target: e.target.value };
                    setRows(next);
                  }}
                  className="h-8 text-sm font-mono"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:text-rose-400"
                onClick={() => setRows((prev) => prev.filter((_, i) => i !== idx))}
                disabled={rows.length <= 1}
              >
                <X className="size-3" />
              </Button>
            </div>
          ))}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" className="text-xs" onClick={addRow}>
              <Plus className="size-3 mr-1" />
              Add Asset
            </Button>
            <span
              className={cn(
                "text-xs font-mono",
                Math.abs(totalTarget - 100) < 0.01
                  ? "text-emerald-400"
                  : "text-rose-400",
              )}
            >
              Total: {totalTarget.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Drift Tolerance</label>
          <div className="flex items-center gap-2">
            <Input defaultValue="2" className="h-8 text-sm font-mono w-20" type="number" />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            className="flex-1"
            size="sm"
            disabled={!name || totalTarget === 0}
          >
            Create Portfolio
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function ModelPortfoliosPage() {
  const { mode } = useExecutionMode();
  const [selectedId, setSelectedId] = React.useState(MODEL_PORTFOLIOS[0].id);
  const [showNewForm, setShowNewForm] = React.useState(false);

  const portfolio = MODEL_PORTFOLIOS.find((p) => p.id === selectedId) ?? MODEL_PORTFOLIOS[0];
  const driftHistory = React.useMemo(() => generateDriftHistory(portfolio), [portfolio]);

  // Rebalance suggestions
  const rebalanceTrades = portfolio.assets
    .map((a) => {
      const drift = a.actualPct - a.targetPct;
      const dollarAmount = Math.abs(drift / 100) * portfolio.totalValue;
      return { asset: a.asset, drift, dollarAmount, action: drift > 0 ? "Sell" : "Buy" };
    })
    .filter((t) => Math.abs(t.drift) > 0.1)
    .sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift));

  return (
    <div className="h-full bg-background overflow-auto">
      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">Model Portfolios</h1>
            <Badge
              variant={mode === "live" ? "success" : mode === "paper" ? "warning" : "secondary"}
              className="text-xs"
            >
              {mode.toUpperCase()}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODEL_PORTFOLIOS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowNewForm(!showNewForm)}>
              <Plus className="size-4" />
              Create New Model
            </Button>
          </div>
        </div>

        {/* New model form */}
        {showNewForm && <NewModelForm onClose={() => setShowNewForm(false)} />}

        {/* Portfolio summary */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="py-4">
            <CardContent className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <PieChart className="size-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Portfolio Value</p>
                <p className="text-lg font-bold font-mono">
                  ${(portfolio.totalValue / 1_000_000).toFixed(2)}M
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="py-4">
            <CardContent className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <ArrowRightLeft className="size-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Drift Breaches</p>
                <p className="text-lg font-bold font-mono">
                  {portfolio.assets.filter((a) => Math.abs(a.actualPct - a.targetPct) > TOLERANCE).length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="py-4">
            <CardContent>
              <p className="text-xs text-muted-foreground">Last Rebalanced</p>
              <p className="text-sm font-mono mt-1">{portfolio.lastRebalanced}</p>
            </CardContent>
          </Card>
        </div>

        {/* Target vs Actual allocation */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Target vs Actual Allocation &mdash; {portfolio.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Asset</TableHead>
                  <TableHead className="text-xs text-right">Target %</TableHead>
                  <TableHead className="text-xs text-right">Actual %</TableHead>
                  <TableHead className="text-xs text-right">Drift</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right">Visual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portfolio.assets.map((a) => {
                  const drift = a.actualPct - a.targetPct;
                  return (
                    <TableRow key={a.asset}>
                      <TableCell className="text-xs font-medium">
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {a.asset}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-right font-mono">
                        {a.targetPct.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-xs text-right font-mono">
                        {a.actualPct.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <DriftIcon drift={drift} />
                          <span className={cn("text-xs font-mono font-bold", driftColor(drift))}>
                            {drift > 0 ? "+" : ""}
                            {drift.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={driftBadgeVariant(drift)} className="text-[10px]">
                          {Math.abs(drift) > TOLERANCE
                            ? "Breached"
                            : Math.abs(drift) > TOLERANCE * 0.75
                              ? "Approaching"
                              : "Within"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <div className="w-24 h-2 rounded-full bg-muted overflow-hidden flex">
                            <div
                              className="h-full bg-blue-500/40 border-r border-blue-500"
                              style={{ width: `${a.targetPct}%` }}
                              title={`Target: ${a.targetPct}%`}
                            />
                          </div>
                          <div className="w-24 h-2 rounded-full bg-muted overflow-hidden flex">
                            <div
                              className={cn(
                                "h-full border-r",
                                Math.abs(drift) > TOLERANCE
                                  ? "bg-rose-500/40 border-rose-500"
                                  : "bg-emerald-500/40 border-emerald-500",
                              )}
                              style={{ width: `${a.actualPct}%` }}
                              title={`Actual: ${a.actualPct}%`}
                            />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-2 rounded bg-blue-500/40 border border-blue-500" />
                Target
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-2 rounded bg-emerald-500/40 border border-emerald-500" />
                Actual (within)
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-2 rounded bg-rose-500/40 border border-rose-500" />
                Actual (breached)
              </div>
              <span>Tolerance: +/-{TOLERANCE}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Rebalance suggestions */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Rebalance Suggestions</CardTitle>
              <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                <Play className="size-3" />
                Execute Rebalance
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {rebalanceTrades.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No rebalance needed -- all allocations within tolerance.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Action</TableHead>
                    <TableHead className="text-xs">Asset</TableHead>
                    <TableHead className="text-xs text-right">Drift</TableHead>
                    <TableHead className="text-xs text-right">Estimated Trade Size</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rebalanceTrades.map((t) => (
                    <TableRow key={t.asset}>
                      <TableCell>
                        <Badge
                          variant={t.action === "Sell" ? "error" : "success"}
                          className="text-[10px]"
                        >
                          {t.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-medium font-mono">{t.asset}</TableCell>
                      <TableCell className="text-xs text-right font-mono">
                        <span className={driftColor(t.drift)}>
                          {t.drift > 0 ? "+" : ""}
                          {t.drift.toFixed(1)}% excess
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-right font-mono">
                        <span className={t.action === "Sell" ? "text-rose-400" : "text-emerald-400"}>
                          {t.action === "Sell" ? "-" : "+"}${Math.round(t.dollarAmount).toLocaleString()}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Drift history timeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Drift History (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {driftHistory.map((event, idx) => (
                <div key={event.day} className="flex items-start gap-3 pb-4 relative">
                  {/* Vertical line */}
                  {idx < driftHistory.length - 1 && (
                    <div className="absolute left-[11px] top-6 w-px h-full bg-border" />
                  )}
                  {/* Dot */}
                  <div
                    className={cn(
                      "mt-1 w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center text-[8px] font-mono font-bold shrink-0",
                      event.description.includes("exceeded") || event.description.includes("drift:")
                        ? "border-rose-500 text-rose-400 bg-rose-500/10"
                        : "border-border text-muted-foreground bg-muted/30",
                    )}
                  >
                    {event.day}
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Day {event.day}
                    </span>
                    <p className="text-xs">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
