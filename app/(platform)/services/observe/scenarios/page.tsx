"use client";

import { PageHeader } from "@/components/shared/page-header";
import { WidgetScroll } from "@/components/shared/widget-scroll";
/**
 * /services/observe/scenarios — What-If / Scenario Analysis.
 * Scenario builder with shock parameters, historical replay,
 * and stress test matrix.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { pnlColorClass } from "@/lib/utils/pnl";
import { AlertTriangle, Grid3X3, History, Play, ShieldAlert, Zap } from "lucide-react";
import * as React from "react";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

// ── Types ────────────────────────────────────────────────────────────────────

interface ScenarioPosition {
  position: string;
  instrument: string;
  currentValue: number;
  scenarioValue: number;
  pnlDelta: number;
  pctImpact: number;
}

interface HistoricalPreset {
  id: string;
  name: string;
  date: string;
  btcChange: number;
  ethChange: number;
  ratesChange: number;
  volChange: number;
  description: string;
}

// ── Mock Data ────────────────────────────────────────────────────────────────

function computePositions(btcPct: number, ethPct: number, ratesBp: number, volPct: number): ScenarioPosition[] {
  const base: Array<{
    position: string;
    instrument: string;
    currentValue: number;
    btcSensitivity: number;
    ethSensitivity: number;
    ratesSensitivity: number;
    volSensitivity: number;
  }> = [
    {
      position: "BTC Spot Long",
      instrument: "BTC-USD",
      currentValue: 674320,
      btcSensitivity: 1.0,
      ethSensitivity: 0.0,
      ratesSensitivity: 0.0,
      volSensitivity: 0.0,
    },
    {
      position: "BTC-PERP Short",
      instrument: "BTC-PERP",
      currentValue: -445000,
      btcSensitivity: -1.0,
      ethSensitivity: 0.0,
      ratesSensitivity: -0.1,
      volSensitivity: 0.15,
    },
    {
      position: "ETH Spot Long",
      instrument: "ETH-USD",
      currentValue: 345600,
      ethSensitivity: 1.0,
      btcSensitivity: 0.0,
      ratesSensitivity: 0.0,
      volSensitivity: 0.0,
    },
    {
      position: "ETH-PERP Short",
      instrument: "ETH-PERP",
      currentValue: -230000,
      ethSensitivity: -1.0,
      btcSensitivity: 0.0,
      ratesSensitivity: -0.1,
      volSensitivity: 0.12,
    },
    {
      position: "SOL Long",
      instrument: "SOL-USD",
      currentValue: 178450,
      btcSensitivity: 0.6,
      ethSensitivity: 0.3,
      ratesSensitivity: 0.0,
      volSensitivity: 0.0,
    },
    {
      position: "BTC Call 70K",
      instrument: "BTC-28MAR-70000-C",
      currentValue: 89000,
      btcSensitivity: 0.65,
      ethSensitivity: 0.0,
      ratesSensitivity: 0.02,
      volSensitivity: 0.35,
    },
    {
      position: "ETH Put 3200",
      instrument: "ETH-28MAR-3200-P",
      currentValue: 42000,
      ethSensitivity: -0.4,
      btcSensitivity: 0.0,
      ratesSensitivity: -0.01,
      volSensitivity: 0.25,
    },
    {
      position: "AAVE Lending",
      instrument: "AAVE-LEND",
      currentValue: 156000,
      btcSensitivity: 0.1,
      ethSensitivity: 0.2,
      ratesSensitivity: 0.5,
      volSensitivity: 0.0,
    },
    {
      position: "UNI LP Position",
      instrument: "UNI-ETH-LP",
      currentValue: 98000,
      btcSensitivity: 0.15,
      ethSensitivity: 0.7,
      ratesSensitivity: 0.0,
      volSensitivity: -0.2,
    },
    {
      position: "LINK Long",
      instrument: "LINK-USD",
      currentValue: 56700,
      btcSensitivity: 0.5,
      ethSensitivity: 0.3,
      ratesSensitivity: 0.0,
      volSensitivity: 0.0,
    },
  ];

  return base.map((b) => {
    const delta =
      b.currentValue * (btcPct / 100) * b.btcSensitivity +
      b.currentValue * (ethPct / 100) * b.ethSensitivity +
      b.currentValue * (ratesBp / 10000) * b.ratesSensitivity +
      b.currentValue * (volPct / 100) * b.volSensitivity;
    const scenarioValue = b.currentValue + delta;
    const pctImpact = b.currentValue !== 0 ? (delta / Math.abs(b.currentValue)) * 100 : 0;
    return {
      position: b.position,
      instrument: b.instrument,
      currentValue: b.currentValue,
      scenarioValue: Math.round(scenarioValue),
      pnlDelta: Math.round(delta),
      pctImpact,
    };
  });
}

const HISTORICAL_PRESETS: HistoricalPreset[] = [
  {
    id: "covid",
    name: "COVID Crash",
    date: "Mar 2020",
    btcChange: -50,
    ethChange: -55,
    ratesChange: -150,
    volChange: 80,
    description: "Global pandemic panic: BTC dropped from $9K to $4K in 48 hours, DeFi TVL collapsed 40%",
  },
  {
    id: "ftx",
    name: "FTX Collapse",
    date: "Nov 2022",
    btcChange: -25,
    ethChange: -30,
    ratesChange: 0,
    volChange: 45,
    description: "Exchange contagion: SOL crashed 60%, lending protocols froze withdrawals",
  },
  {
    id: "luna",
    name: "Luna/UST Depeg",
    date: "May 2022",
    btcChange: -30,
    ethChange: -35,
    ratesChange: 50,
    volChange: 60,
    description: "Algorithmic stablecoin failure: $40B wiped, cascading DeFi liquidations",
  },
  {
    id: "svb",
    name: "SVB Bank Run",
    date: "Mar 2023",
    btcChange: -10,
    ethChange: -12,
    ratesChange: -75,
    volChange: 25,
    description: "Banking crisis: USDC briefly depegged to $0.87, flight to BTC",
  },
  {
    id: "china",
    name: "China Mining Ban",
    date: "Sep 2021",
    btcChange: -35,
    ethChange: -40,
    ratesChange: 0,
    volChange: 50,
    description: "Hash rate dropped 50%, network disruption, miner capitulation",
  },
];

// Stress matrix: 7x7 grid of portfolio PnL
const STRESS_AXIS = [-30, -20, -10, 0, 10, 20, 30];

function computeStressMatrix(): number[][] {
  return STRESS_AXIS.map((btcPct) =>
    STRESS_AXIS.map((ethPct) => {
      const positions = computePositions(btcPct, ethPct, 0, 0);
      return positions.reduce((sum, p) => sum + p.pnlDelta, 0);
    }),
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Compact USD for large notionals (scenario tables). */
function formatScenarioUsd(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) {
    return `${v < 0 ? "-" : ""}$${formatNumber(abs / 1_000_000, 1)}M`;
  }
  if (abs >= 1_000) {
    return `${v < 0 ? "-" : ""}$${formatNumber(abs / 1_000, 0)}K`;
  }
  return `${v < 0 ? "-" : ""}$${formatNumber(abs, 0)}`;
}

/** Signed emphasis for shock inputs (% / bp / vol), not dollar PnL. */
function shockSignedClass(v: number): string {
  if (v > 0) return "text-emerald-400";
  if (v < 0) return "text-red-400";
  return "text-muted-foreground";
}

function cellBg(v: number): string {
  const abs = Math.abs(v);
  if (v > 0) {
    if (abs > 200000) return "bg-emerald-500/40";
    if (abs > 100000) return "bg-emerald-500/25";
    if (abs > 50000) return "bg-emerald-500/15";
    return "bg-emerald-500/5";
  }
  if (v < 0) {
    if (abs > 200000) return "bg-red-500/40";
    if (abs > 100000) return "bg-red-500/25";
    if (abs > 50000) return "bg-red-500/15";
    return "bg-red-500/5";
  }
  return "bg-muted/20";
}

// ── Sub Components ───────────────────────────────────────────────────────────

function ScenarioBuilder() {
  const [btcPct, setBtcPct] = React.useState(-20);
  const [ethPct, setEthPct] = React.useState(-25);
  const [ratesBp, setRatesBp] = React.useState(100);
  const [volPct, setVolPct] = React.useState(30);
  const [hasRun, setHasRun] = React.useState(false);

  const positions = React.useMemo(
    () => computePositions(btcPct, ethPct, ratesBp, volPct),
    [btcPct, ethPct, ratesBp, volPct],
  );

  const totalPnl = positions.reduce((s, p) => s + p.pnlDelta, 0);
  const worstPos = positions.reduce((worst, p) => (p.pnlDelta < worst.pnlDelta ? p : worst), positions[0]);
  const marginCallRisk = totalPnl < -500000;
  const liquidationRisk = totalPnl < -800000;

  function handleRun() {
    setHasRun(true);
  }

  return (
    <div className="space-y-6">
      {/* Shock Parameters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="size-4" />
            Market Shock Parameters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* BTC Price Change */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">BTC Price Change</label>
                <span className={cn("text-sm font-mono font-bold", shockSignedClass(btcPct))}>
                  {btcPct > 0 ? "+" : ""}
                  {btcPct}%
                </span>
              </div>
              <Slider min={-50} max={50} step={1} value={[btcPct]} onValueChange={([v]) => setBtcPct(v)} />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>-50%</span>
                <span>0%</span>
                <span>+50%</span>
              </div>
            </div>
            {/* ETH Price Change */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">ETH Price Change</label>
                <span className={cn("text-sm font-mono font-bold", shockSignedClass(ethPct))}>
                  {ethPct > 0 ? "+" : ""}
                  {ethPct}%
                </span>
              </div>
              <Slider min={-50} max={50} step={1} value={[ethPct]} onValueChange={([v]) => setEthPct(v)} />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>-50%</span>
                <span>0%</span>
                <span>+50%</span>
              </div>
            </div>
            {/* Interest Rates */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">Interest Rates Change</label>
                <span className={cn("text-sm font-mono font-bold", shockSignedClass(ratesBp))}>
                  {ratesBp > 0 ? "+" : ""}
                  {ratesBp}bp
                </span>
              </div>
              <Slider min={-200} max={200} step={5} value={[ratesBp]} onValueChange={([v]) => setRatesBp(v)} />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>-200bp</span>
                <span>0bp</span>
                <span>+200bp</span>
              </div>
            </div>
            {/* Volatility */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">Volatility Change</label>
                <span className={cn("text-sm font-mono font-bold", shockSignedClass(volPct))}>
                  {volPct > 0 ? "+" : ""}
                  {volPct}%
                </span>
              </div>
              <Slider min={-50} max={100} step={1} value={[volPct]} onValueChange={([v]) => setVolPct(v)} />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>-50%</span>
                <span>0%</span>
                <span>+100%</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button size="sm" onClick={handleRun}>
              <Play className="size-3.5 mr-1.5" />
              Run Scenario
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results (always shown, updates reactively) */}
      {(hasRun || true) && (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-5 pb-4 px-5">
                <p className="text-xs text-muted-foreground">Portfolio P&L Impact</p>
                <p className={cn("text-2xl font-bold font-mono mt-1", pnlColorClass(totalPnl))}>
                  {formatScenarioUsd(totalPnl)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4 px-5">
                <p className="text-xs text-muted-foreground">Worst Position</p>
                <p className="text-sm font-medium mt-1 truncate">{worstPos.position}</p>
                <p className={cn("text-lg font-bold font-mono", pnlColorClass(worstPos.pnlDelta))}>
                  {formatScenarioUsd(worstPos.pnlDelta)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4 px-5">
                <p className="text-xs text-muted-foreground">Margin Call Risk</p>
                <p className={cn("text-2xl font-bold mt-1", marginCallRisk ? "text-red-400" : "text-emerald-400")}>
                  {marginCallRisk ? "Yes" : "No"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4 px-5">
                <p className="text-xs text-muted-foreground">Liquidation Risk</p>
                <p className={cn("text-2xl font-bold mt-1", liquidationRisk ? "text-red-400" : "text-emerald-400")}>
                  {liquidationRisk ? "Yes" : "No"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Position Impact Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Position Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Position</TableHead>
                    <TableHead>Instrument</TableHead>
                    <TableHead className="text-right">Current Value</TableHead>
                    <TableHead className="text-right">Scenario Value</TableHead>
                    <TableHead className="text-right">P&L Delta</TableHead>
                    <TableHead className="text-right">% Impact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.map((p) => (
                    <TableRow key={p.instrument}>
                      <TableCell className="font-medium text-sm">{p.position}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{p.instrument}</TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {formatScenarioUsd(p.currentValue)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {formatScenarioUsd(p.scenarioValue)}
                      </TableCell>
                      <TableCell
                        className={cn("text-right font-mono text-xs font-semibold", pnlColorClass(p.pnlDelta))}
                      >
                        {p.pnlDelta >= 0 ? "+" : ""}
                        {formatScenarioUsd(p.pnlDelta)}
                      </TableCell>
                      <TableCell className={cn("text-right font-mono text-xs", pnlColorClass(p.pctImpact))}>
                        {p.pctImpact >= 0 ? "+" : ""}
                        {formatPercent(p.pctImpact, 1)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Total row */}
                  <TableRow className="border-t-2">
                    <TableCell className="font-bold text-sm" colSpan={2}>
                      Total
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold">
                      {formatScenarioUsd(positions.reduce((s, p) => s + p.currentValue, 0))}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold">
                      {formatScenarioUsd(positions.reduce((s, p) => s + p.scenarioValue, 0))}
                    </TableCell>
                    <TableCell className={cn("text-right font-mono text-xs font-bold", pnlColorClass(totalPnl))}>
                      {totalPnl >= 0 ? "+" : ""}
                      {formatScenarioUsd(totalPnl)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function HistoricalReplay() {
  const [selectedPreset, setSelectedPreset] = React.useState<string>(HISTORICAL_PRESETS[0].id);

  const preset = HISTORICAL_PRESETS.find((p) => p.id === selectedPreset) ?? HISTORICAL_PRESETS[0];
  const positions = React.useMemo(
    () => computePositions(preset.btcChange, preset.ethChange, preset.ratesChange, preset.volChange),
    [preset],
  );
  const totalPnl = positions.reduce((s, p) => s + p.pnlDelta, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Select value={selectedPreset} onValueChange={setSelectedPreset}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select scenario..." />
          </SelectTrigger>
          <SelectContent>
            {HISTORICAL_PRESETS.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name} ({p.date})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="secondary" className="text-xs">
          {preset.date}
        </Badge>
      </div>

      {/* Scenario description */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-start gap-3">
            <History className="size-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">{preset.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{preset.description}</p>
              <div className="flex items-center gap-4 mt-3 text-xs">
                <span className={cn("font-mono", shockSignedClass(preset.btcChange))}>
                  BTC: {preset.btcChange > 0 ? "+" : ""}
                  {preset.btcChange}%
                </span>
                <span className={cn("font-mono", shockSignedClass(preset.ethChange))}>
                  ETH: {preset.ethChange > 0 ? "+" : ""}
                  {preset.ethChange}%
                </span>
                <span className={cn("font-mono", shockSignedClass(preset.ratesChange))}>
                  Rates: {preset.ratesChange > 0 ? "+" : ""}
                  {preset.ratesChange}bp
                </span>
                <span className={cn("font-mono", shockSignedClass(preset.volChange))}>Vol: +{preset.volChange}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4 px-5">
            <p className="text-xs text-muted-foreground">Portfolio P&L Impact</p>
            <p className={cn("text-2xl font-bold font-mono mt-1", pnlColorClass(totalPnl))}>
              {formatScenarioUsd(totalPnl)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 px-5">
            <p className="text-xs text-muted-foreground">BTC Impact</p>
            <p className={cn("text-2xl font-bold font-mono mt-1", shockSignedClass(preset.btcChange))}>
              {preset.btcChange}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 px-5">
            <p className="text-xs text-muted-foreground">ETH Impact</p>
            <p className={cn("text-2xl font-bold font-mono mt-1", shockSignedClass(preset.ethChange))}>
              {preset.ethChange}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 px-5">
            <p className="text-xs text-muted-foreground">Vol Spike</p>
            <p className="text-2xl font-bold font-mono mt-1 text-amber-400">+{preset.volChange}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Position table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Position Impact: {preset.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Position</TableHead>
                <TableHead>Instrument</TableHead>
                <TableHead className="text-right">Current Value</TableHead>
                <TableHead className="text-right">Scenario Value</TableHead>
                <TableHead className="text-right">P&L Delta</TableHead>
                <TableHead className="text-right">% Impact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.map((p) => (
                <TableRow key={p.instrument}>
                  <TableCell className="font-medium text-sm">{p.position}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{p.instrument}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{formatScenarioUsd(p.currentValue)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{formatScenarioUsd(p.scenarioValue)}</TableCell>
                  <TableCell className={cn("text-right font-mono text-xs font-semibold", pnlColorClass(p.pnlDelta))}>
                    {p.pnlDelta >= 0 ? "+" : ""}
                    {formatScenarioUsd(p.pnlDelta)}
                  </TableCell>
                  <TableCell className={cn("text-right font-mono text-xs", pnlColorClass(p.pctImpact))}>
                    {p.pctImpact >= 0 ? "+" : ""}
                    {formatPercent(p.pctImpact, 1)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function StressMatrix() {
  const matrix = React.useMemo(() => computeStressMatrix(), []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Grid3X3 className="size-4" />
            Stress Test Matrix
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Portfolio P&L under combined BTC/ETH price shocks (rates & vol held constant)
          </p>
        </CardHeader>
        <CardContent>
          <WidgetScroll axes="horizontal" scrollbarSize="thin">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                    <div className="flex flex-col items-start">
                      <span className="text-[10px]">ETH \ BTC</span>
                    </div>
                  </th>
                  {STRESS_AXIS.map((btc) => (
                    <th
                      key={btc}
                      className={cn(
                        "text-center py-2 px-1 font-mono font-medium",
                        btc === 0 ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {btc > 0 ? "+" : ""}
                      {btc}%
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {STRESS_AXIS.map((ethPct, ri) => (
                  <tr key={ethPct}>
                    <td
                      className={cn(
                        "py-1 px-2 font-mono font-medium",
                        ethPct === 0 ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {ethPct > 0 ? "+" : ""}
                      {ethPct}%
                    </td>
                    {matrix[ri].map((pnl, ci) => (
                      <td key={`${ri}-${ci}`} className="p-0.5">
                        <div
                          className={cn(
                            "rounded px-1 py-1.5 text-center font-mono text-[11px] font-medium",
                            cellBg(pnl),
                            pnlColorClass(pnl),
                          )}
                        >
                          {formatScenarioUsd(pnl)}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </WidgetScroll>
          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded bg-emerald-500/40" /> Large gain
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded bg-emerald-500/15" /> Small gain
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded bg-muted/20" /> Neutral
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded bg-red-500/15" /> Small loss
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded bg-red-500/40" /> Large loss
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ScenarioAnalysisPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-8 md:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <PageHeader
              title="Scenario Analysis"
              description="What-if analysis, historical replay, and stress testing"
            />
          </div>
          <Badge variant="outline" className="text-sky-400 border-sky-500/30">
            <ShieldAlert className="size-3 mr-1.5" />
            Simulation
          </Badge>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="builder">
          <TabsList>
            <TabsTrigger value="builder">
              <Zap className="size-3.5 mr-1.5" />
              Scenario Builder
            </TabsTrigger>
            <TabsTrigger value="replay">
              <History className="size-3.5 mr-1.5" />
              Historical Replay
            </TabsTrigger>
            <TabsTrigger value="matrix">
              <Grid3X3 className="size-3.5 mr-1.5" />
              Stress Matrix
            </TabsTrigger>
          </TabsList>

          <TabsContent value="builder">
            <ScenarioBuilder />
          </TabsContent>
          <TabsContent value="replay">
            <HistoricalReplay />
          </TabsContent>
          <TabsContent value="matrix">
            <StressMatrix />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
