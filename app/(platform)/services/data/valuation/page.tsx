"use client";

/**
 * /services/data/valuation — Token Valuation Service.
 * Pricing waterfall, manual overrides, and audit log.
 */

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw,
  DollarSign,
  AlertTriangle,
  Edit3,
  BarChart3,
  Clock,
  ChevronRight,
  Plus,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Mock Data ────────────────────────────────────────────────────────────────

type PricingSource = "exchange" | "otc" | "model" | "manual";

interface TokenPricing {
  token: string;
  symbol: string;
  exchangePrice: number | null;
  otcPrice: number | null;
  modelPrice: number | null;
  finalMark: number;
  source: PricingSource;
  staleness: string;
  lastUpdated: string;
}

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

const MOCK_PRICING: TokenPricing[] = [
  { token: "Bitcoin", symbol: "BTC", exchangePrice: 67432.50, otcPrice: 67420.00, modelPrice: 67445.12, finalMark: 67432.50, source: "exchange", staleness: "2s", lastUpdated: "2026-03-28T14:32:18Z" },
  { token: "Ethereum", symbol: "ETH", exchangePrice: 3456.78, otcPrice: 3454.50, modelPrice: 3458.20, finalMark: 3456.78, source: "exchange", staleness: "2s", lastUpdated: "2026-03-28T14:32:18Z" },
  { token: "Solana", symbol: "SOL", exchangePrice: 178.45, otcPrice: 178.30, modelPrice: 178.52, finalMark: 178.45, source: "exchange", staleness: "3s", lastUpdated: "2026-03-28T14:32:17Z" },
  { token: "Polygon", symbol: "MATIC", exchangePrice: 0.9234, otcPrice: 0.9228, modelPrice: 0.9240, finalMark: 0.9234, source: "exchange", staleness: "2s", lastUpdated: "2026-03-28T14:32:18Z" },
  { token: "Uniswap", symbol: "UNI", exchangePrice: 12.87, otcPrice: 12.84, modelPrice: 12.89, finalMark: 12.87, source: "exchange", staleness: "4s", lastUpdated: "2026-03-28T14:32:16Z" },
  { token: "Aave", symbol: "AAVE", exchangePrice: 298.56, otcPrice: null, modelPrice: 298.80, finalMark: 298.56, source: "exchange", staleness: "5s", lastUpdated: "2026-03-28T14:32:15Z" },
  { token: "Chainlink", symbol: "LINK", exchangePrice: 18.92, otcPrice: 18.88, modelPrice: 18.95, finalMark: 18.92, source: "exchange", staleness: "3s", lastUpdated: "2026-03-28T14:32:17Z" },
  { token: "Arbitrum", symbol: "ARB", exchangePrice: 1.234, otcPrice: null, modelPrice: 1.238, finalMark: 1.234, source: "exchange", staleness: "6s", lastUpdated: "2026-03-28T14:32:14Z" },
  { token: "Optimism", symbol: "OP", exchangePrice: 3.67, otcPrice: null, modelPrice: 3.69, finalMark: 3.67, source: "exchange", staleness: "4s", lastUpdated: "2026-03-28T14:32:16Z" },
  { token: "Maker", symbol: "MKR", exchangePrice: null, otcPrice: 3245.00, modelPrice: 3250.20, finalMark: 3245.00, source: "otc", staleness: "45s", lastUpdated: "2026-03-28T14:31:33Z" },
  { token: "Synthetix", symbol: "SNX", exchangePrice: null, otcPrice: null, modelPrice: 4.56, finalMark: 4.56, source: "model", staleness: "2m", lastUpdated: "2026-03-28T14:30:18Z" },
  { token: "Curve", symbol: "CRV", exchangePrice: 0.678, otcPrice: null, modelPrice: 0.682, finalMark: 0.678, source: "exchange", staleness: "8s", lastUpdated: "2026-03-28T14:32:12Z" },
  { token: "Lido", symbol: "LDO", exchangePrice: null, otcPrice: 2.89, modelPrice: 2.91, finalMark: 2.89, source: "otc", staleness: "1m", lastUpdated: "2026-03-28T14:31:18Z" },
  { token: "Rocket Pool", symbol: "RPL", exchangePrice: null, otcPrice: null, modelPrice: 28.45, finalMark: 29.50, source: "manual", staleness: "15m", lastUpdated: "2026-03-28T14:17:18Z" },
  { token: "Compound", symbol: "COMP", exchangePrice: 67.89, otcPrice: null, modelPrice: 68.02, finalMark: 67.89, source: "exchange", staleness: "5s", lastUpdated: "2026-03-28T14:32:15Z" },
];

interface WaterfallLevel {
  level: number;
  name: string;
  description: string;
  enabled: boolean;
  stalenessThreshold: string;
}

const MOCK_WATERFALL: WaterfallLevel[] = [
  { level: 1, name: "Exchange Mid", description: "Volume-weighted mid from top 3 exchanges", enabled: true, stalenessThreshold: "30s" },
  { level: 2, name: "OTC Dealer Quote", description: "Best bid/ask from registered OTC desks", enabled: true, stalenessThreshold: "5m" },
  { level: 3, name: "Model (TWAP)", description: "24h time-weighted average price from historical trades", enabled: true, stalenessThreshold: "30m" },
  { level: 4, name: "Manual Override", description: "Manually set price by authorised risk officer", enabled: true, stalenessThreshold: "24h" },
];

interface PriceOverride {
  token: string;
  symbol: string;
  overridePrice: number;
  reason: string;
  setBy: string;
  timestamp: string;
  expiry: string;
}

const MOCK_OVERRIDES: PriceOverride[] = [
  { token: "Rocket Pool", symbol: "RPL", overridePrice: 29.50, reason: "Exchange feeds down — using last known + dealer quote average", setBy: "J. Chen", timestamp: "2026-03-28T14:17:00Z", expiry: "2026-03-28T20:00:00Z" },
  { token: "Helium", symbol: "HNT", overridePrice: 8.12, reason: "Token migration — exchange prices unreliable during swap period", setBy: "M. Patel", timestamp: "2026-03-28T10:30:00Z", expiry: "2026-03-29T10:30:00Z" },
  { token: "Render", symbol: "RNDR", overridePrice: 11.45, reason: "Circuit breaker triggered — locked at pre-event price pending review", setBy: "J. Chen", timestamp: "2026-03-28T13:00:00Z", expiry: "2026-03-28T17:00:00Z" },
];

interface AuditEntry {
  id: string;
  timestamp: string;
  token: string;
  symbol: string;
  event: string;
  oldValue: string;
  newValue: string;
  user: string;
}

const MOCK_AUDIT: AuditEntry[] = [
  { id: "a1", timestamp: "2026-03-28T14:17:00Z", token: "Rocket Pool", symbol: "RPL", event: "Override Set", oldValue: "$28.45 (Model)", newValue: "$29.50 (Manual)", user: "J. Chen" },
  { id: "a2", timestamp: "2026-03-28T13:00:00Z", token: "Render", symbol: "RNDR", event: "Override Set", oldValue: "$11.32 (Exchange)", newValue: "$11.45 (Manual)", user: "J. Chen" },
  { id: "a3", timestamp: "2026-03-28T10:30:00Z", token: "Helium", symbol: "HNT", event: "Override Set", oldValue: "$7.98 (Exchange)", newValue: "$8.12 (Manual)", user: "M. Patel" },
  { id: "a4", timestamp: "2026-03-28T09:15:00Z", token: "Maker", symbol: "MKR", event: "Source Changed", oldValue: "Exchange Mid", newValue: "OTC Quote", user: "System" },
  { id: "a5", timestamp: "2026-03-28T08:00:00Z", token: "Synthetix", symbol: "SNX", event: "Source Changed", oldValue: "OTC Quote", newValue: "Model (TWAP)", user: "System" },
  { id: "a6", timestamp: "2026-03-28T06:45:00Z", token: "Lido", symbol: "LDO", event: "Source Changed", oldValue: "Exchange Mid", newValue: "OTC Quote", user: "System" },
  { id: "a7", timestamp: "2026-03-28T06:00:00Z", token: "Aave", symbol: "AAVE", event: "Price Updated", oldValue: "$296.12", newValue: "$298.56", user: "System" },
  { id: "a8", timestamp: "2026-03-27T23:59:00Z", token: "Rocket Pool", symbol: "RPL", event: "Override Expired", oldValue: "$30.10 (Manual)", newValue: "$28.45 (Model)", user: "System" },
  { id: "a9", timestamp: "2026-03-27T22:30:00Z", token: "Bitcoin", symbol: "BTC", event: "Price Updated", oldValue: "$67,100.00", newValue: "$67,432.50", user: "System" },
  { id: "a10", timestamp: "2026-03-27T18:00:00Z", token: "Ethereum", symbol: "ETH", event: "Price Updated", oldValue: "$3,420.10", newValue: "$3,456.78", user: "System" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(v: number | null): string {
  if (v === null) return "--";
  if (v >= 1000) return `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (v >= 1) return `$${v.toFixed(2)}`;
  return `$${v.toFixed(4)}`;
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
                  <p className={cn("text-2xl font-bold font-mono mt-1", kpi.color)}>
                    {kpi.value}
                  </p>
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
                <TableCell className="text-right font-mono text-xs">
                  {formatPrice(t.exchangePrice)}
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {formatPrice(t.otcPrice)}
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {formatPrice(t.modelPrice)}
                </TableCell>
                <TableCell className="text-right font-mono text-xs font-semibold">
                  {formatPrice(t.finalMark)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn("text-xs font-medium", SOURCE_COLORS[t.source])}
                  >
                    {SOURCE_LABELS[t.source]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground font-mono">
                  {t.staleness}
                </TableCell>
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
    setLevels((prev) =>
      prev.map((l, i) => (i === index ? { ...l, enabled: !l.enabled } : l)),
    );
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
                  {idx < levels.length - 1 && (
                    <div className="w-px h-8 bg-border" />
                  )}
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className={cn(
                          "text-sm font-medium",
                          !level.enabled && "text-muted-foreground line-through",
                        )}
                      >
                        {level.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {level.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Staleness Limit</p>
                        <p className="text-xs font-mono font-medium">{level.stalenessThreshold}</p>
                      </div>
                      <Switch
                        checked={level.enabled}
                        onCheckedChange={() => toggleLevel(idx)}
                      />
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
                <TableCell className="text-xs text-muted-foreground max-w-[240px] truncate">
                  {o.reason}
                </TableCell>
                <TableCell className="text-xs">{o.setBy}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatTime(o.timestamp)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatTime(o.expiry)}
                </TableCell>
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
              <TableCell className="text-xs text-muted-foreground font-mono">
                {formatTime(entry.timestamp)}
              </TableCell>
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Token Valuation</h1>
            <p className="text-sm text-muted-foreground mt-1">
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
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
              Live
            </Badge>
            <Button variant="outline" size="sm">
              <RefreshCw className="size-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

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
