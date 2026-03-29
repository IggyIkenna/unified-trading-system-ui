"use client";

/**
 * /services/data/valuation — Token Valuation Service.
 * Pricing waterfall, manual overrides, and audit log.
 */

import { StatusDot } from "@/components/trading/status-badge";
import { PageHeader } from "@/components/platform/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { BarChart3, ChevronRight, Clock, DollarSign, Edit3, Plus, RefreshCw, Search } from "lucide-react";
import * as React from "react";
import { formatNumber } from "@/lib/utils/formatters";
import {
  MOCK_AUDIT,
  MOCK_OVERRIDES,
  MOCK_PRICING,
  MOCK_WATERFALL,
  type PricingSource,
} from "@/lib/mocks/fixtures/data-valuation";

const SOURCE_COLORS: Record<PricingSource, string> = {
  exchange: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  otc: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  model: "text-sky-400 bg-sky-500/10 border-sky-500/30",
  manual: "text-red-400 bg-red-500/10 border-red-500/30",
};

const SOURCE_LABELS: Record<PricingSource, string> = {
  exchange: "Exchange Mid",
  otc: "OTC Quote",
  model: "Model (TWAP)",
  manual: "Manual",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(v: number | null): string {
  if (v === null) return "--";
  if (v >= 1000) return `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (v >= 1) return `$${formatNumber(v, 2)}`;
  return `$${formatNumber(v, 4)}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatShortTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Sub Components ───────────────────────────────────────────────────────────

function KpiCards() {
  const kpis = [
    { label: "Tokens Priced", value: "2,437", icon: DollarSign, color: "text-emerald-400" },
    { label: "Stale Prices", value: "7", icon: Clock, color: "text-amber-400" },
    { label: "Manual Overrides", value: "3", icon: Edit3, color: "text-red-400" },
    { label: "Coverage", value: "99.2%", icon: BarChart3, color: "text-sky-400" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card key={kpi.label}>
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className={cn("text-2xl font-bold font-mono mt-1", kpi.color)}>{kpi.value}</p>
                </div>
                <Icon className={cn("size-8 opacity-20", kpi.color)} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function PricingDashboard() {
  const [search, setSearch] = React.useState("");
  const [sourceFilter, setSourceFilter] = React.useState<string>("all");

  const filtered = MOCK_PRICING.filter((t) => {
    const matchesSearch =
      !search ||
      t.token.toLowerCase().includes(search.toLowerCase()) ||
      t.symbol.toLowerCase().includes(search.toLowerCase());
    const matchesSource = sourceFilter === "all" || t.source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search tokens..."
            className="pl-9 h-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger size="sm" className="w-[160px]">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="exchange">Exchange Mid</SelectItem>
            <SelectItem value="otc">OTC Quote</SelectItem>
            <SelectItem value="model">Model (TWAP)</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Token</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead className="text-right">Exchange Price</TableHead>
              <TableHead className="text-right">OTC Price</TableHead>
              <TableHead className="text-right">Model Price</TableHead>
              <TableHead className="text-right font-semibold">Final Mark</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-right">Staleness</TableHead>
              <TableHead className="text-right">Last Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((t) => (
              <TableRow key={t.symbol}>
                <TableCell className="font-medium">{t.token}</TableCell>
                <TableCell className="font-mono text-muted-foreground">{t.symbol}</TableCell>
                <TableCell className="text-right font-mono text-xs">{formatPrice(t.exchangePrice)}</TableCell>
                <TableCell className="text-right font-mono text-xs">{formatPrice(t.otcPrice)}</TableCell>
                <TableCell className="text-right font-mono text-xs">{formatPrice(t.modelPrice)}</TableCell>
                <TableCell className="text-right font-mono text-xs font-semibold">{formatPrice(t.finalMark)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("text-xs font-medium", SOURCE_COLORS[t.source])}>
                    {SOURCE_LABELS[t.source]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground font-mono">{t.staleness}</TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  {formatShortTime(t.lastUpdated)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function WaterfallConfig() {
  const [levels, setLevels] = React.useState(MOCK_WATERFALL);

  function toggleLevel(index: number) {
    setLevels((prev) => prev.map((l, i) => (i === index ? { ...l, enabled: !l.enabled } : l)));
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Pricing Waterfall Priority</CardTitle>
          <p className="text-xs text-muted-foreground">
            Prices are resolved top-down. The first non-stale source wins.
          </p>
        </CardHeader>
        <CardContent className="space-y-0">
          {levels.map((level, idx) => (
            <div key={level.level}>
              <div className="flex items-start gap-4 py-4">
                {/* Level indicator */}
                <div className="flex flex-col items-center gap-1 pt-1">
                  <div
                    className={cn(
                      "size-8 rounded-full flex items-center justify-center text-sm font-bold border-2",
                      level.enabled
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-muted bg-muted/30 text-muted-foreground",
                    )}
                  >
                    {level.level}
                  </div>
                  {idx < levels.length - 1 && <div className="w-px h-8 bg-border" />}
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={cn("text-sm font-medium", !level.enabled && "text-muted-foreground line-through")}>
                        {level.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{level.description}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Staleness Limit</p>
                        <p className="text-xs font-mono font-medium">{level.stalenessThreshold}</p>
                      </div>
                      <Switch checked={level.enabled} onCheckedChange={() => toggleLevel(idx)} />
                    </div>
                  </div>
                </div>
              </div>
              {idx < levels.length - 1 && (
                <div className="ml-4">
                  <ChevronRight className="size-3 text-muted-foreground/40 -rotate-90 ml-2.5 -mt-2 -mb-2" />
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button size="sm">Save Configuration</Button>
      </div>
    </div>
  );
}

function OverridesPanel() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {MOCK_OVERRIDES.length} active manual price override{MOCK_OVERRIDES.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" variant="outline">
          <Plus className="size-3.5 mr-1.5" />
          Add Override
        </Button>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Token</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead className="text-right">Override Price</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Set By</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Expiry</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_OVERRIDES.map((o) => (
              <TableRow key={`${o.symbol}-${o.timestamp}`}>
                <TableCell className="font-medium">{o.token}</TableCell>
                <TableCell className="font-mono text-muted-foreground">{o.symbol}</TableCell>
                <TableCell className="text-right font-mono text-xs font-semibold text-red-400">
                  {formatPrice(o.overridePrice)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[240px] truncate">{o.reason}</TableCell>
                <TableCell className="text-xs">{o.setBy}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatTime(o.timestamp)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatTime(o.expiry)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function AuditLog() {
  const eventColors: Record<string, string> = {
    "Price Updated": "text-emerald-400",
    "Override Set": "text-red-400",
    "Override Expired": "text-amber-400",
    "Source Changed": "text-sky-400",
  };

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>Token</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Old Value</TableHead>
            <TableHead>New Value</TableHead>
            <TableHead>User</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {MOCK_AUDIT.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="text-xs text-muted-foreground font-mono">{formatTime(entry.timestamp)}</TableCell>
              <TableCell>
                <span className="font-medium text-sm">{entry.symbol}</span>
                <span className="text-xs text-muted-foreground ml-1.5">{entry.token}</span>
              </TableCell>
              <TableCell>
                <span className={cn("text-xs font-medium", eventColors[entry.event] ?? "text-foreground")}>
                  {entry.event}
                </span>
              </TableCell>
              <TableCell className="text-xs font-mono text-muted-foreground">{entry.oldValue}</TableCell>
              <TableCell className="text-xs font-mono">{entry.newValue}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{entry.user}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ValuationPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-8 md:px-6">
        <PageHeader
          className="mb-8"
          title="Token Valuation"
          description={
            <>
              Last pricing run:{" "}
              <span className="font-mono">
                {new Date("2026-03-28T14:32:18Z").toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </>
          }
        >
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">
              <StatusDot status="live" className="size-1.5 animate-pulse mr-1.5" />
              Live
            </Badge>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" type="button">
                    <RefreshCw className="size-4 mr-2" />
                    Refresh
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Re-run pricing and refresh valuation data
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </PageHeader>

        {/* KPI Cards */}
        <div className="mb-8">
          <KpiCards />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="dashboard">
          <TabsList>
            <TabsTrigger value="dashboard">Pricing Dashboard</TabsTrigger>
            <TabsTrigger value="waterfall">Waterfall Config</TabsTrigger>
            <TabsTrigger value="overrides">Overrides</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <PricingDashboard />
          </TabsContent>
          <TabsContent value="waterfall">
            <WaterfallConfig />
          </TabsContent>
          <TabsContent value="overrides">
            <OverridesPanel />
          </TabsContent>
          <TabsContent value="audit">
            <AuditLog />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
