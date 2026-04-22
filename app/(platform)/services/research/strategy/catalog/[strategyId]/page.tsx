"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  STRATEGY_CATALOG,
  CATEGORY_COLORS,
  RISK_COLORS,
  STATUS_COLORS,
  type StrategyCatalogEntry,
  type StrategyCategory,
} from "@/lib/mocks/fixtures/strategy-catalog-data";
import { cn } from "@/lib/utils";
import { formatNumber, formatCurrency } from "@/lib/utils/formatters";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Lock,
  AlertTriangle,
  Shield,
  Settings,
  TrendingUp,
  Zap,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import * as React from "react";

// ---------------------------------------------------------------------------
// Category display labels
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<StrategyCategory, string> = {
  DEFI: "DeFi",
  CEFI: "CeFi",
  TRADFI: "TradFi",
  SPORTS: "Sports",
  PREDICTION: "Predictions",
};

// ---------------------------------------------------------------------------
// Readiness gate helpers — convert code strings like "C3" to numeric values
// ---------------------------------------------------------------------------

function parseGateLevel(code: string): number {
  if (code === "none") return 0;
  const num = parseInt(code.slice(1), 10);
  return isNaN(num) ? 0 : num;
}

function getGateMax(prefix: string): number {
  switch (prefix) {
    case "C":
      return 5;
    case "D":
      return 5;
    case "B":
      return 6;
    default:
      return 5;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function MetricCard({
  label,
  value,
  sublabel,
  valueClassName,
}: {
  label: string;
  value: string;
  sublabel?: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 px-4 py-3 text-center">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={cn("text-xl font-bold font-mono mt-1", valueClassName)}>{value}</p>
      {sublabel && <p className="text-[10px] text-muted-foreground mt-0.5">{sublabel}</p>}
    </div>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function GateProgress({ label, current, max }: { label: string; current: number; max: number }) {
  const pct = max > 0 ? (current / max) * 100 : 0;
  const color = pct === 100 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground font-mono text-xs">
          {current}/{max}
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-primary/10">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MonthlyReturnsChart({ returns }: { returns: number[] }) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const maxAbs = Math.max(...returns.map(Math.abs), 1);

  return (
    <div className="flex items-end justify-between gap-1.5 h-32 px-1">
      {returns.map((ret, i) => {
        const heightPct = (Math.abs(ret) / maxAbs) * 100;
        const isPositive = ret >= 0;
        return (
          <div key={months[i]} className="flex flex-1 flex-col items-center gap-1">
            <div className="relative flex w-full items-end justify-center h-24">
              {isPositive ? (
                <div className="flex flex-col items-center justify-end h-full w-full">
                  <span className="text-[9px] font-mono text-emerald-400 mb-0.5">
                    {ret > 0 ? "+" : ""}
                    {formatNumber(ret, 1)}
                  </span>
                  <div
                    className="w-full max-w-[28px] rounded-t bg-emerald-500/60"
                    style={{ height: `${heightPct}%`, minHeight: ret > 0 ? "4px" : "1px" }}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-start h-full w-full">
                  <div className="flex-1" />
                  <div
                    className="w-full max-w-[28px] rounded-b bg-red-500/60"
                    style={{ height: `${heightPct}%`, minHeight: "4px" }}
                  />
                  <span className="text-[9px] font-mono text-red-400 mt-0.5">{formatNumber(ret, 1)}</span>
                </div>
              )}
            </div>
            <span className="text-[9px] text-muted-foreground">{months[i]}</span>
          </div>
        );
      })}
    </div>
  );
}

function DepositFlowDiagram({ strategy }: { strategy: StrategyCatalogEntry }) {
  const steps =
    strategy.category === "DEFI"
      ? ["Deposit USDT/USDC", "Treasury (Copper MPC)", "Trading Wallet", "On-Chain Strategy"]
      : strategy.category === "SPORTS"
        ? ["Deposit Funds", "Treasury (Copper MPC)", "Betting Wallet", "Bookmaker Account"]
        : ["Deposit Funds", "Treasury (Copper MPC)", "Trading Wallet", "Strategy Execution"];

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 py-4">
      {steps.map((step, i) => (
        <React.Fragment key={step}>
          <div className="rounded-lg border border-border/50 bg-muted/30 px-4 py-2.5 text-center min-w-[120px]">
            <p className="text-xs font-medium text-foreground">{step}</p>
          </div>
          {i < steps.length - 1 && <ArrowRight className="size-4 text-muted-foreground shrink-0" />}
        </React.Fragment>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Overview
// ---------------------------------------------------------------------------

function OverviewTab({ strategy }: { strategy: StrategyCatalogEntry }) {
  return (
    <div className="space-y-6">
      {/* How it works */}
      <Card className="border-border/50 border-l-4 border-l-primary/60">
        <CardContent className="pt-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">How It Works</h3>
          <p className="text-sm text-foreground leading-relaxed">{strategy.how_it_works}</p>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <MetricCard
          label="Target APY"
          value={`${strategy.performance.target_apy_range[0]}-${strategy.performance.target_apy_range[1]}%`}
          valueClassName="text-emerald-400"
        />
        <MetricCard label="Sharpe Ratio" value={formatNumber(strategy.performance.expected_sharpe, 2)} />
        <MetricCard
          label="Max Drawdown"
          value={`${formatNumber(strategy.performance.max_drawdown_pct, 1)}%`}
          valueClassName="text-red-400"
        />
        <MetricCard label="Win Rate" value={`${strategy.performance.win_rate_pct}%`} />
        <MetricCard
          label="Risk Level"
          value={strategy.risk.risk_level.replace("_", " ")}
          valueClassName={
            strategy.risk.risk_level === "LOW"
              ? "text-emerald-400"
              : strategy.risk.risk_level === "MEDIUM"
                ? "text-amber-400"
                : "text-red-400"
          }
        />
      </div>

      {/* Venues */}
      <SectionCard title="Venue Coverage" icon={<Zap className="size-4" />}>
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Primary Venues</p>
            <div className="flex flex-wrap gap-2">
              {strategy.venue_coverage.primary_venues.map((v) => (
                <Badge key={v} variant="outline" className="text-xs px-2.5 py-1">
                  {v}
                </Badge>
              ))}
            </div>
          </div>
          {strategy.venue_coverage.backup_venues.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Backup Venues</p>
              <div className="flex flex-wrap gap-2">
                {strategy.venue_coverage.backup_venues.map((v) => (
                  <Badge key={v} variant="secondary" className="text-xs px-2.5 py-1">
                    {v}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {strategy.venue_coverage.data_sources.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Data Sources</p>
              <div className="flex flex-wrap gap-2">
                {strategy.venue_coverage.data_sources.map((v) => (
                  <Badge key={v} variant="secondary" className="text-xs px-2.5 py-1 bg-muted/50">
                    {v}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Monthly Returns Sparkline */}
      <SectionCard title="Monthly Returns (Backtest)" icon={<TrendingUp className="size-4" />}>
        <MonthlyReturnsChart returns={strategy.performance.monthly_returns} />
      </SectionCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Performance
// ---------------------------------------------------------------------------

function PerformanceTab({ strategy }: { strategy: StrategyCatalogEntry }) {
  const perf = strategy.performance;
  const rows: Array<{ label: string; value: string; highlight?: boolean }> = [
    { label: "Target APY", value: `${perf.target_apy_range[0]}-${perf.target_apy_range[1]}%`, highlight: true },
    { label: "Sharpe Ratio", value: formatNumber(perf.expected_sharpe, 2) },
    { label: "Calmar Ratio", value: formatNumber(perf.calmar_ratio, 2) },
    { label: "Max Drawdown", value: `${formatNumber(perf.max_drawdown_pct, 1)}%` },
    { label: "Win Rate", value: `${perf.win_rate_pct}%` },
    { label: "Avg Trade Duration", value: perf.avg_trade_duration },
    { label: "Correlation to BTC", value: formatNumber(strategy.risk.correlation_to_btc, 2) },
  ];

  return (
    <div className="space-y-6">
      <SectionCard title="Monthly Returns" icon={<TrendingUp className="size-4" />}>
        <MonthlyReturnsChart returns={perf.monthly_returns} />
      </SectionCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Performance Metrics" icon={<FileText className="size-4" />}>
          <div className="space-y-2">
            {rows.map((r) => (
              <div
                key={r.label}
                className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0"
              >
                <span className="text-sm text-muted-foreground">{r.label}</span>
                <span className={cn("text-sm font-mono font-semibold", r.highlight && "text-emerald-400")}>
                  {r.value}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Benchmark Comparison" icon={<TrendingUp className="size-4" />}>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Benchmark</span>
                <span className="text-sm font-medium">{perf.benchmark}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Strategy Target APY</span>
                <span className="text-sm font-mono font-semibold text-emerald-400">
                  {perf.target_apy_range[0]}-{perf.target_apy_range[1]}%
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Backtest period: {perf.backtest_period}</p>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Risk Management
// ---------------------------------------------------------------------------

function RiskTab({ strategy }: { strategy: StrategyCatalogEntry }) {
  const r = strategy.risk;
  return (
    <div className="space-y-6">
      {/* Risk Overview */}
      <Card className="border-border/50">
        <CardContent className="pt-5">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-muted/30 p-3">
              <Shield className="size-6 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold">Risk Level</h3>
                <Badge variant="outline" className={cn(RISK_COLORS[r.risk_level])}>
                  {r.risk_level.replace("_", " ")}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{strategy.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Circuit Breakers */}
        <SectionCard title="Circuit Breakers" icon={<AlertTriangle className="size-4 text-amber-400" />}>
          <ul className="space-y-2.5">
            {r.circuit_breakers.map((cb, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <XCircle className="size-4 text-red-400 mt-0.5 shrink-0" />
                <span className="text-muted-foreground">{cb}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        {/* Position Limits */}
        <SectionCard title="Position Limits" icon={<Lock className="size-4" />}>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-1.5 border-b border-border/30">
              <span className="text-sm text-muted-foreground">Max Leverage</span>
              <span className="text-sm font-mono font-semibold">{r.max_leverage}x</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border/30">
              <span className="text-sm text-muted-foreground">Max Position</span>
              <span className="text-sm font-mono font-semibold">{formatCurrency(r.max_position_usd, "USD", 0)}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border/30">
              <span className="text-sm text-muted-foreground">Correlation to BTC</span>
              <span className="text-sm font-mono">{formatNumber(r.correlation_to_btc, 2)}</span>
            </div>
            {r.stop_loss_pct !== null && (
              <div className="flex items-center justify-between py-1.5 border-b border-border/30">
                <span className="text-sm text-muted-foreground">Stop Loss</span>
                <span className="text-sm font-mono font-semibold">{r.stop_loss_pct}%</span>
              </div>
            )}
            {r.liquidation_protection && (
              <div className="pt-2 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Liquidation Protection
                </p>
                <p className="text-sm text-muted-foreground">{r.liquidation_protection}</p>
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Tail Risk */}
      <Card className="border-border/50">
        <CardContent className="pt-5 space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Tail Risk</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{r.tail_risk}</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Money Operations
// ---------------------------------------------------------------------------

function MoneyOpsTab({ strategy }: { strategy: StrategyCatalogEntry }) {
  const m = strategy.money_ops;
  return (
    <div className="space-y-6">
      {/* Deposit Flow */}
      <SectionCard title="Deposit Flow" icon={<ArrowRight className="size-4" />}>
        <DepositFlowDiagram strategy={strategy} />
      </SectionCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Deposit Info */}
        <SectionCard title="Deposit Requirements" icon={<DollarSign className="size-4" />}>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-1.5 border-b border-border/30">
              <span className="text-sm text-muted-foreground">Minimum Deposit</span>
              <span className="text-sm font-mono font-semibold">{formatCurrency(m.min_deposit_usd, "USD", 0)}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border/30">
              <span className="text-sm text-muted-foreground">Recommended Deposit</span>
              <span className="text-sm font-mono font-semibold">
                {formatCurrency(m.recommended_deposit_usd, "USD", 0)}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border/30">
              <span className="text-sm text-muted-foreground">Accepted Currencies</span>
              <div className="flex gap-1">
                {m.deposit_currency.map((c) => (
                  <Badge key={c} variant="outline" className="text-[10px]">
                    {c}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border/30">
              <span className="text-sm text-muted-foreground">Treasury Wallet</span>
              <span className="text-sm font-medium">{m.treasury_wallet}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border/30">
              <span className="text-sm text-muted-foreground">Trading Wallet</span>
              <span className="text-sm font-medium">{m.trading_wallet}</span>
            </div>
          </div>
        </SectionCard>

        {/* Rebalancing */}
        <SectionCard title="Rebalancing" icon={<Clock className="size-4" />}>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-1.5 border-b border-border/30">
              <span className="text-sm text-muted-foreground">Auto Rebalance</span>
              <Badge variant={m.auto_rebalance ? "success" : "secondary"} className="text-[10px]">
                {m.auto_rebalance ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border/30">
              <span className="text-sm text-muted-foreground">Frequency</span>
              <span className="text-sm font-medium">{m.rebalance_frequency}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border/30">
              <span className="text-sm text-muted-foreground">Buffer</span>
              <span className="text-sm font-mono">{m.rebalance_buffer_pct}%</span>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Fees */}
        <Card className="border-border/50">
          <CardContent className="pt-5 space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Fee Structure</h3>
            <p className="text-sm text-foreground">{m.fee_structure}</p>
            <div className="flex items-center justify-between py-1.5 border-t border-border/30">
              <span className="text-sm text-muted-foreground">Gas Budget</span>
              <span className="text-sm font-mono">{m.gas_budget_pct}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Withdrawals */}
        <Card className="border-border/50">
          <CardContent className="pt-5 space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Withdrawals</h3>
            <p className="text-sm text-muted-foreground">{m.withdrawal_notice}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Configuration
// ---------------------------------------------------------------------------

function ConfigTab({ strategy }: { strategy: StrategyCatalogEntry }) {
  const cfg = strategy.config;
  const rows: Array<{ label: string; value: React.ReactNode }> = [
    { label: "Timeframe", value: cfg.timeframe },
    { label: "Execution Mode", value: cfg.execution_mode },
    {
      label: "Instruments",
      value: (
        <div className="flex flex-wrap gap-1 justify-end">
          {cfg.instruments.map((inst) => (
            <Badge key={inst} variant="outline" className="text-[10px] font-mono">
              {inst}
            </Badge>
          ))}
        </div>
      ),
    },
    ...(cfg.chains.length > 0
      ? [
          {
            label: "Chains",
            value: (
              <div className="flex flex-wrap gap-1 justify-end">
                {cfg.chains.map((ch) => (
                  <Badge key={ch} variant="secondary" className="text-[10px]">
                    {ch}
                  </Badge>
                ))}
              </div>
            ),
          },
        ]
      : []),
    {
      label: "Venues",
      value: (
        <div className="flex flex-wrap gap-1 justify-end">
          {cfg.venues.map((v) => (
            <Badge key={v} variant="outline" className="text-[10px]">
              {v}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      label: "Config Hot-Reload",
      value: cfg.config_hot_reload ? (
        <Badge variant="success" className="text-[10px]">
          Enabled
        </Badge>
      ) : (
        <Badge variant="secondary" className="text-[10px]">
          Disabled
        </Badge>
      ),
    },
    { label: "Schema Version", value: <span className="font-mono">{cfg.schema_version}</span> },
    { label: "Deployment Type", value: cfg.deployment_type },
    { label: "Scaling", value: cfg.scaling },
  ];

  return (
    <SectionCard title="Strategy Configuration" icon={<Settings className="size-4" />}>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
            <span className="text-sm text-muted-foreground">{r.label}</span>
            <div className="text-sm font-medium">{r.value}</div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Tab: Readiness & Security
// ---------------------------------------------------------------------------

function ReadinessTab({ strategy }: { strategy: StrategyCatalogEntry }) {
  const gates = strategy.readiness;
  const sec = strategy.security;

  const codeLevel = parseGateLevel(gates.code);
  const deployLevel = parseGateLevel(gates.deployment);
  const businessLevel = parseGateLevel(gates.business);

  const secRows: Array<{ label: string; value: string; icon: React.ReactNode }> = [
    { label: "Custody", value: sec.custody, icon: <Lock className="size-4 text-emerald-400" /> },
    { label: "Key Management", value: sec.key_management, icon: <Shield className="size-4 text-blue-400" /> },
    {
      label: "Audit Trail",
      value: sec.audit_trail ? "Full audit trail enabled" : "No audit trail",
      icon: <FileText className="size-4 text-amber-400" />,
    },
    { label: "Disaster Recovery", value: sec.disaster_recovery, icon: <Zap className="size-4 text-purple-400" /> },
    { label: "Insurance", value: sec.insurance ?? "None", icon: <Shield className="size-4 text-pink-400" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Readiness Gates */}
      <SectionCard title="Readiness Gates" icon={<CheckCircle2 className="size-4 text-emerald-400" />}>
        <div className="space-y-5">
          <GateProgress label={`Code Readiness (${gates.code})`} current={codeLevel} max={getGateMax("C")} />
          <GateProgress
            label={`Deployment Readiness (${gates.deployment})`}
            current={deployLevel}
            max={getGateMax("D")}
          />
          <GateProgress
            label={`Business Readiness (${gates.business})`}
            current={businessLevel}
            max={getGateMax("B")}
          />
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Status */}
        <Card className="border-border/50">
          <CardContent className="pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current Status</span>
              <Badge variant="outline" className={cn(STATUS_COLORS[gates.status])}>
                {gates.status}
              </Badge>
            </div>
            {gates.estimated_launch && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estimated Launch</span>
                <span className="text-sm font-medium">{gates.estimated_launch}</span>
              </div>
            )}
            {gates.blockers.length > 0 && (
              <div className="pt-2 border-t border-border/30">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Blockers</p>
                <ul className="space-y-1.5">
                  {gates.blockers.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="size-3.5 text-amber-400 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security */}
        <SectionCard title="Security" icon={<Shield className="size-4" />}>
          <div className="space-y-4">
            {secRows.map((r) => (
              <div key={r.label} className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{r.icon}</div>
                <div>
                  <p className="text-sm font-medium">{r.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.value}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function StrategyDetailPage() {
  const params = useParams();
  const strategyId = params.strategyId as string;
  const strategy = STRATEGY_CATALOG.find((s) => s.strategy_id === strategyId);

  if (!strategy) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="platform-page-width p-6 space-y-4">
          <Link
            href="/services/research/strategy/catalog"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back to Catalog
          </Link>
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-lg font-medium text-muted-foreground">Strategy not found</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              The strategy &ldquo;{strategyId}&rdquo; does not exist in the catalog.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="platform-page-width space-y-6 p-6">
        {/* Back link */}
        <Link
          href="/services/research/strategy/catalog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Catalog
        </Link>

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-page-title font-semibold tracking-tight text-foreground">{strategy.name}</h1>
              <Badge variant="outline" className={cn(STATUS_COLORS[strategy.readiness.status])}>
                {strategy.readiness.status}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn(CATEGORY_COLORS[strategy.category])}>
                {CATEGORY_LABELS[strategy.category]}
              </Badge>
              <Badge variant="secondary">{strategy.family}</Badge>
              <Badge variant="secondary" className="text-[10px]">
                {strategy.subcategory}
              </Badge>
            </div>
          </div>
          <Button size="lg" className="shrink-0">
            {strategy.readiness.status === "LIVE" ? "Subscribe" : "Request Access"}
          </Button>
        </div>

        {/* Tabbed Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <WidgetScroll axes="horizontal" scrollbarSize="thin" className="shrink-0">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="risk">Risk</TabsTrigger>
              <TabsTrigger value="money">Money Ops</TabsTrigger>
              <TabsTrigger value="config">Configuration</TabsTrigger>
              <TabsTrigger value="readiness">Readiness</TabsTrigger>
            </TabsList>
          </WidgetScroll>

          <TabsContent value="overview">
            <OverviewTab strategy={strategy} />
          </TabsContent>
          <TabsContent value="performance">
            <PerformanceTab strategy={strategy} />
          </TabsContent>
          <TabsContent value="risk">
            <RiskTab strategy={strategy} />
          </TabsContent>
          <TabsContent value="money">
            <MoneyOpsTab strategy={strategy} />
          </TabsContent>
          <TabsContent value="config">
            <ConfigTab strategy={strategy} />
          </TabsContent>
          <TabsContent value="readiness">
            <ReadinessTab strategy={strategy} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
