"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { EntityLink } from "@/components/trading/entity-link";
import { formatCurrency } from "@/lib/reference-data";
import {
  Users,
  BarChart3,
  Building2,
  Key,
  Shield,
  Plus,
  Search,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Settings,
  Globe,
  Wifi,
  WifiOff,
  History,
  Save,
  X,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";
import {
  CLOB_VENUES,
  DEX_VENUES,
  ZERO_ALPHA_VENUES,
  SPORTS_VENUES,
  VENUE_CATEGORY_MAP,
  VENUE_CATEGORIES,
  STRATEGY_TYPES,
  STRATEGY_ARCHETYPES,
  type VenueCategory,
} from "@/lib/reference-data";

// Config parameter schema types
interface ConfigParam {
  key: string;
  label: string;
  type: "slider" | "select" | "multiselect" | "number" | "switch";
  value: number | string | boolean | string[];
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  description?: string;
}

// Mock strategy schemas with params for config editing
const strategySchemas: Record<
  string,
  {
    params: ConfigParam[];
    versions: {
      version: string;
      status: string;
      date: string;
      author: string;
      message: string;
    }[];
  }
> = {
  "btc-basis": {
    params: [
      {
        key: "min_funding_rate",
        label: "Min Funding Rate",
        type: "slider",
        value: 0.0001,
        min: 0.0001,
        max: 0.01,
        step: 0.0001,
        description: "Minimum funding rate to enter position",
      },
      {
        key: "max_leverage",
        label: "Max Leverage",
        type: "slider",
        value: 2.5,
        min: 1.0,
        max: 5.0,
        step: 0.5,
        description: "Maximum allowed leverage",
      },
      {
        key: "fractional_kelly",
        label: "Fractional Kelly",
        type: "slider",
        value: 0.25,
        min: 0,
        max: 1,
        step: 0.05,
        description: "Kelly criterion fraction",
      },
      {
        key: "delta_drift_threshold",
        label: "Delta Drift Threshold",
        type: "slider",
        value: 0.05,
        min: 0.01,
        max: 0.1,
        step: 0.01,
        description: "Rebalance when delta drifts beyond this",
      },
      {
        key: "execution_mode",
        label: "Execution Mode",
        type: "select",
        value: "HUF",
        options: ["SCE", "HUF", "EVT"],
        description: "Order execution strategy",
      },
      {
        key: "benchmark_type",
        label: "Benchmark Type",
        type: "select",
        value: "ARRIVAL",
        options: ["ARRIVAL", "ORACLE", "TWAP", "CLOSE"],
        description: "P&L benchmark reference",
      },
      {
        key: "allowed_venues",
        label: "Allowed Venues",
        type: "multiselect",
        value: ["BINANCE", "OKX", "BYBIT"],
        options: ["BINANCE", "OKX", "BYBIT", "COINBASE", "KRAKEN", "DERIBIT"],
        description: "Venues enabled for trading",
      },
      {
        key: "initial_capital",
        label: "Initial Capital",
        type: "number",
        value: 500000,
        description: "Starting capital allocation",
      },
      {
        key: "position_limit_usd",
        label: "Position Limit USD",
        type: "number",
        value: 1000000,
        description: "Maximum position size",
      },
      {
        key: "sor_enabled",
        label: "SOR Enabled",
        type: "switch",
        value: true,
        description: "Enable smart order routing",
      },
      {
        key: "post_only",
        label: "Post Only",
        type: "switch",
        value: false,
        description: "Only post maker orders",
      },
    ],
    versions: [
      {
        version: "v3.2",
        status: "Active",
        date: "Mar 15, 2026",
        author: "quant@odum.io",
        message: "Increase funding threshold",
      },
      {
        version: "v3.1",
        status: "Previous",
        date: "Mar 10, 2026",
        author: "quant@odum.io",
        message: "Initial config",
      },
      {
        version: "v3.0",
        status: "Archived",
        date: "Mar 5, 2026",
        author: "auto-deploy",
        message: "Grid sweep winner #42",
      },
    ],
  },
};

// Mock clients data - using real venues from registry
const clients = [
  {
    id: "delta-one",
    name: "Delta One",
    status: "active" as const,
    strategies: 6,
    aum: 12500000,
    riskProfile: "moderate",
    venues: ["BINANCE-FUTURES", "HYPERLIQUID", "DERIBIT"], // Real venue IDs
  },
  {
    id: "quant-fund",
    name: "Quant Fund",
    status: "active" as const,
    strategies: 4,
    aum: 8200000,
    riskProfile: "aggressive",
    venues: ["BINANCE-FUTURES", "OKX", "BYBIT"],
  },
  {
    id: "sports-desk",
    name: "Sports Desk",
    status: "active" as const,
    strategies: 3,
    aum: 2100000,
    riskProfile: "moderate",
    venues: ["PINNACLE", "BETFAIR", "DRAFTKINGS"],
  },
  {
    id: "alpha-crypto",
    name: "Alpha Crypto",
    status: "onboarding" as const,
    strategies: 2,
    aum: 5000000,
    riskProfile: "conservative",
    venues: ["AAVE_V3_ETH", "UNISWAPV3-ETH"],
  },
];

// Mock strategies for config
const strategyConfigs = [
  {
    id: "btc-basis-v3",
    name: "BTC Basis v3",
    version: "3.3.0",
    status: "live",
    lastPublished: "2d ago",
    clients: ["Delta One", "Quant Fund"],
  },
  {
    id: "eth-staked",
    name: "ETH Staked Basis",
    version: "2.5.1",
    status: "live",
    lastPublished: "5d ago",
    clients: ["Delta One"],
  },
  {
    id: "ml-directional",
    name: "ML Directional",
    version: "1.2.0",
    status: "paper",
    lastPublished: "1d ago",
    clients: ["Quant Fund"],
  },
  {
    id: "sports-arb",
    name: "Sports Arbitrage",
    version: "1.0.3",
    status: "live",
    lastPublished: "12h ago",
    clients: ["Sports Desk"],
  },
];

// Venues from real registry data
const venues = [
  // CeFi CLOB venues
  {
    id: "BINANCE-FUTURES",
    name: "Binance Futures",
    type: VENUE_CATEGORIES[VENUE_CATEGORY_MAP["BINANCE-FUTURES"]],
    status: "connected" as const,
    latency: 2.1,
    rateLimit: "85%",
  },
  {
    id: "HYPERLIQUID",
    name: "Hyperliquid",
    type: VENUE_CATEGORIES[VENUE_CATEGORY_MAP["HYPERLIQUID"]],
    status: "connected" as const,
    latency: 0.8,
    rateLimit: "45%",
  },
  {
    id: "DERIBIT",
    name: "Deribit",
    type: VENUE_CATEGORIES[VENUE_CATEGORY_MAP["DERIBIT"]],
    status: "connected" as const,
    latency: 3.2,
    rateLimit: "62%",
  },
  {
    id: "OKX",
    name: "OKX",
    type: VENUE_CATEGORIES[VENUE_CATEGORY_MAP["OKX"]],
    status: "degraded" as const,
    latency: 8.4,
    rateLimit: "92%",
  },
  {
    id: "BYBIT",
    name: "Bybit",
    type: VENUE_CATEGORIES[VENUE_CATEGORY_MAP["BYBIT"]],
    status: "connected" as const,
    latency: 1.8,
    rateLimit: "55%",
  },
  // DeFi
  {
    id: "AAVE_V3_ETH",
    name: "Aave V3 (ETH)",
    type: VENUE_CATEGORIES[VENUE_CATEGORY_MAP["AAVE_V3_ETH"]],
    status: "connected" as const,
    latency: 1.2,
    rateLimit: "30%",
  },
  {
    id: "UNISWAPV3-ETH",
    name: "Uniswap V3",
    type: VENUE_CATEGORIES[VENUE_CATEGORY_MAP["UNISWAPV3-ETH"]],
    status: "connected" as const,
    latency: 2.1,
    rateLimit: "25%",
  },
  // Sports
  {
    id: "PINNACLE",
    name: "Pinnacle",
    type: VENUE_CATEGORIES[VENUE_CATEGORY_MAP["PINNACLE"]],
    status: "connected" as const,
    latency: 45,
    rateLimit: "70%",
  },
  {
    id: "BETFAIR",
    name: "Betfair",
    type: VENUE_CATEGORIES[VENUE_CATEGORY_MAP["BETFAIR"]],
    status: "connected" as const,
    latency: 32,
    rateLimit: "60%",
  },
];

// Risk config
const riskLimits = [
  { name: "Max Leverage", value: "3x", limit: "5x", utilization: 60 },
  { name: "Gross Exposure", value: "$8.2m", limit: "$15m", utilization: 55 },
  { name: "Single Position", value: "15%", limit: "25%", utilization: 60 },
  { name: "Daily Drawdown", value: "2.1%", limit: "5%", utilization: 42 },
];

export default function ConfigPage() {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("clients");
  const [showNewModal, setShowNewModal] = React.useState(false);
  const [reloading, setReloading] = React.useState(false);

  // Config editor state
  const [editingStrategy, setEditingStrategy] = React.useState<string | null>(
    null,
  );
  const [editedParams, setEditedParams] = React.useState<
    Record<string, number | string | boolean | string[]>
  >({});

  // Hot-reload config trigger
  const handleConfigReload = async () => {
    setReloading(true);
    try {
      await apiFetch("/api/config/reload", token, { method: "POST" });
      toast.success("Configuration reloaded successfully");
    } catch {
      toast.error("Failed to reload configuration");
    } finally {
      setReloading(false);
    }
  };

  // Initialize edited params when opening editor
  const openConfigEditor = (strategyId: string) => {
    const config = strategySchemas[strategyId];
    if (config) {
      const initialParams: Record<
        string,
        number | string | boolean | string[]
      > = {};
      config.params.forEach((p) => {
        initialParams[p.key] = p.value;
      });
      setEditedParams(initialParams);
    }
    setEditingStrategy(strategyId);
  };

  // Get changed parameters
  const getChangedParams = () => {
    if (!editingStrategy) return [];
    const config = strategySchemas[editingStrategy];
    if (!config) return [];
    return config.params.filter((p) => {
      const original = p.value;
      const edited = editedParams[p.key];
      if (Array.isArray(original) && Array.isArray(edited)) {
        return JSON.stringify(original) !== JSON.stringify(edited);
      }
      return original !== edited;
    });
  };

  // Dynamic "New" button label based on active tab
  const getNewButtonLabel = () => {
    switch (activeTab) {
      case "clients":
        return "New Client";
      case "strategies":
        return "New Strategy";
      case "venues":
        return "New Venue";
      case "risk":
        return "New Risk Config";
      case "credentials":
        return "New Credential";
      default:
        return "New";
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Config & Onboarding</h1>
            <p className="text-sm text-muted-foreground">
              Manage clients, strategies, venues, and risk configuration
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              disabled={reloading}
              onClick={handleConfigReload}
            >
              <RefreshCw
                className={`size-4 ${reloading ? "animate-spin" : ""}`}
              />
              {reloading ? "Reloading..." : "Hot Reload"}
            </Button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search configs..."
                className="pl-9 w-[240px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              size="sm"
              className="gap-2"
              style={{ backgroundColor: "var(--surface-config)" }}
              onClick={() => setShowNewModal(true)}
            >
              <Plus className="size-4" />
              {getNewButtonLabel()}
            </Button>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs
          defaultValue="clients"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList>
            <TabsTrigger value="clients" className="gap-2">
              <Users className="size-4" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="strategies" className="gap-2">
              <BarChart3 className="size-4" />
              Strategies
            </TabsTrigger>
            <TabsTrigger value="venues" className="gap-2">
              <Globe className="size-4" />
              Venues
            </TabsTrigger>
            <TabsTrigger value="risk" className="gap-2">
              <Shield className="size-4" />
              Risk Config
            </TabsTrigger>
            <TabsTrigger value="credentials" className="gap-2">
              <Key className="size-4" />
              Credentials
            </TabsTrigger>
          </TabsList>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {clients.map((client) => (
                <Card
                  key={client.id}
                  className="hover:border-primary/50 transition-colors cursor-pointer"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="size-5 text-primary" />
                        </div>
                        <div>
                          <EntityLink
                            type="client"
                            id={client.id}
                            label={client.name}
                            className="text-lg font-semibold"
                          />
                          <p className="text-xs text-muted-foreground">
                            {client.strategies} strategies &bull; Risk:{" "}
                            {client.riskProfile}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          client.status === "active" ? "default" : "secondary"
                        }
                        className={
                          client.status === "active"
                            ? "bg-[var(--status-live)]/10 text-[var(--status-live)]"
                            : "bg-[var(--status-warning)]/10 text-[var(--status-warning)]"
                        }
                      >
                        {client.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground">AUM</p>
                        <p className="text-lg font-semibold font-mono">
                          ${(client.aum / 1000000).toFixed(1)}m
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Venues</p>
                        <p className="text-sm">{client.venues.join(", ")}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2"
                      >
                        <Settings className="size-4" />
                        Configure
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-2">
                        View Live
                        <ArrowRight className="size-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Strategies Tab */}
          <TabsContent value="strategies" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Strategy Configurations
                  </CardTitle>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Plus className="size-4" />
                    New Strategy
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {strategyConfigs.map((strategy) => (
                  <div
                    key={strategy.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <EntityLink
                            type="strategy"
                            id={strategy.id}
                            label={strategy.name}
                            className="font-semibold"
                          />
                          <Badge
                            variant="outline"
                            className="font-mono text-xs"
                          >
                            v{strategy.version}
                          </Badge>
                          <Badge
                            variant={
                              strategy.status === "live"
                                ? "default"
                                : "secondary"
                            }
                            className={
                              strategy.status === "live"
                                ? "bg-[var(--status-live)]/10 text-[var(--status-live)]"
                                : "bg-[var(--status-warning)]/10 text-[var(--status-warning)]"
                            }
                          >
                            {strategy.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Clients: {strategy.clients.join(", ")} &bull;
                          Published {strategy.lastPublished}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openConfigEditor(strategy.id)}
                        disabled={!strategySchemas[strategy.id]}
                      >
                        <Settings className="size-4 mr-1.5" />
                        Edit Config
                      </Button>
                      <Button variant="ghost" size="sm">
                        Backtest
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Venues Tab */}
          <TabsContent value="venues" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Venue Connections</CardTitle>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Plus className="size-4" />
                    Add Venue
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {venues.map((venue) => (
                  <div
                    key={venue.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {venue.status === "connected" ? (
                        <Wifi className="size-5 text-[var(--status-live)]" />
                      ) : (
                        <WifiOff className="size-5 text-[var(--status-warning)]" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{venue.name}</span>
                          <Badge variant="outline">{venue.type}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Latency: {venue.latency}ms &bull; Rate Limit:{" "}
                          {venue.rateLimit}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge
                        variant={
                          venue.status === "connected" ? "default" : "secondary"
                        }
                        className={
                          venue.status === "connected"
                            ? "bg-[var(--status-live)]/10 text-[var(--status-live)]"
                            : "bg-[var(--status-warning)]/10 text-[var(--status-warning)]"
                        }
                      >
                        {venue.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Risk Config Tab */}
          <TabsContent value="risk" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Firm-Level Limits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {riskLimits.map((limit) => (
                    <div key={limit.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {limit.name}
                        </span>
                        <span className="text-sm">
                          <span className="font-mono">{limit.value}</span>
                          <span className="text-muted-foreground">
                            {" "}
                            / {limit.limit}
                          </span>
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            limit.utilization < 70
                              ? "bg-[var(--status-live)]"
                              : limit.utilization < 90
                                ? "bg-[var(--status-warning)]"
                                : "bg-[var(--status-critical)]"
                          }`}
                          style={{ width: `${limit.utilization}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-right">
                        {limit.utilization}% utilized
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Risk Hierarchy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="font-medium">Firm Limits</p>
                      <p className="text-xs text-muted-foreground">
                        Global caps apply to all activity
                      </p>
                    </div>
                    <div className="ml-4 border-l-2 border-border pl-4 space-y-3">
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="font-medium">Client Limits</p>
                        <p className="text-xs text-muted-foreground">
                          Per-mandate risk appetites
                        </p>
                      </div>
                      <div className="ml-4 border-l-2 border-border pl-4 space-y-3">
                        <div className="p-3 rounded-lg bg-muted/30">
                          <p className="font-medium">Strategy Limits</p>
                          <p className="text-xs text-muted-foreground">
                            Per-strategy risk profiles
                          </p>
                        </div>
                        <div className="ml-4 border-l-2 border-border pl-4">
                          <div className="p-3 rounded-lg bg-muted/30">
                            <p className="font-medium">Venue Limits</p>
                            <p className="text-xs text-muted-foreground">
                              Venue-imposed margin rules
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Credentials Tab */}
          <TabsContent value="credentials" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    API Keys & Credentials
                  </CardTitle>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Plus className="size-4" />
                    Add Credential
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Key className="size-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    Secure Credential Management
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    API keys, wallet addresses, and authentication credentials
                    for all connected venues and data sources. Encrypted at rest
                    with audit logging.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Config Editor Sheet */}
      <Sheet
        open={!!editingStrategy}
        onOpenChange={(open) => !open && setEditingStrategy(null)}
      >
        <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Settings className="size-5" />
              Edit Configuration
            </SheetTitle>
            <SheetDescription>
              {editingStrategy} - Modify parameters below
            </SheetDescription>
          </SheetHeader>

          {editingStrategy && strategySchemas[editingStrategy] && (
            <div className="space-y-6 py-6">
              {/* Schema Editor - Typed Controls */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground">
                  Parameters
                </h4>
                {strategySchemas[editingStrategy].params.map((param) => (
                  <div key={param.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor={param.key}
                        className="text-sm font-medium"
                      >
                        {param.label}
                      </Label>
                      {param.type === "slider" && (
                        <span className="text-sm font-mono text-muted-foreground">
                          {(() => {
                            const val = editedParams[param.key];
                            return typeof val === "number"
                              ? val.toFixed(
                                  param.step && param.step < 0.01 ? 4 : 2,
                                )
                              : val;
                          })()}
                        </span>
                      )}
                    </div>

                    {param.type === "slider" && (
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-12">
                          {param.min}
                        </span>
                        <Slider
                          id={param.key}
                          min={param.min}
                          max={param.max}
                          step={param.step}
                          value={[
                            (() => {
                              const v = editedParams[param.key];
                              return typeof v === "number" ? v : 0;
                            })(),
                          ]}
                          onValueChange={(v) =>
                            setEditedParams((prev) => ({
                              ...prev,
                              [param.key]: v[0],
                            }))
                          }
                          className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground w-12 text-right">
                          {param.max}
                        </span>
                      </div>
                    )}

                    {param.type === "select" && param.options && (
                      <Select
                        value={String(editedParams[param.key])}
                        onValueChange={(v) =>
                          setEditedParams((prev) => ({
                            ...prev,
                            [param.key]: v,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {param.options.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {param.type === "multiselect" && param.options && (
                      <div className="flex flex-wrap gap-2">
                        {param.options.map((opt) => {
                          const selected =
                            Array.isArray(editedParams[param.key]) &&
                            (editedParams[param.key] as string[]).includes(opt);
                          return (
                            <label
                              key={opt}
                              className="flex items-center gap-1.5 text-sm cursor-pointer"
                            >
                              <Checkbox
                                checked={selected}
                                onCheckedChange={(checked) => {
                                  const current = Array.isArray(
                                    editedParams[param.key],
                                  )
                                    ? [...(editedParams[param.key] as string[])]
                                    : [];
                                  if (checked) {
                                    setEditedParams((prev) => ({
                                      ...prev,
                                      [param.key]: [...current, opt],
                                    }));
                                  } else {
                                    setEditedParams((prev) => ({
                                      ...prev,
                                      [param.key]: current.filter(
                                        (v) => v !== opt,
                                      ),
                                    }));
                                  }
                                }}
                              />
                              {opt}
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {param.type === "number" && (
                      <Input
                        id={param.key}
                        type="number"
                        value={editedParams[param.key] as number}
                        onChange={(e) =>
                          setEditedParams((prev) => ({
                            ...prev,
                            [param.key]: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="font-mono"
                      />
                    )}

                    {param.type === "switch" && (
                      <Switch
                        id={param.key}
                        checked={!!editedParams[param.key]}
                        onCheckedChange={(checked) =>
                          setEditedParams((prev) => ({
                            ...prev,
                            [param.key]: checked,
                          }))
                        }
                      />
                    )}

                    {param.description && (
                      <p className="text-xs text-muted-foreground">
                        {param.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <Separator />

              {/* Config Diff */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground">
                  Changes
                </h4>
                {getChangedParams().length > 0 ? (
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                    <p className="text-sm font-medium">
                      Changed parameters ({getChangedParams().length} of{" "}
                      {strategySchemas[editingStrategy].params.length}):
                    </p>
                    {getChangedParams().map((param) => (
                      <div
                        key={param.key}
                        className="flex items-center gap-2 text-sm font-mono"
                      >
                        <span className="text-muted-foreground">
                          {param.key}:
                        </span>
                        <span className="text-destructive line-through">
                          {JSON.stringify(param.value)}
                        </span>
                        <ArrowRight className="size-3" />
                        <span className="text-[var(--status-warning)]">
                          {JSON.stringify(editedParams[param.key])}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No changes made
                  </p>
                )}
              </div>

              <Separator />

              {/* Version History */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <History className="size-4" />
                  Version History
                </h4>
                <div className="space-y-2">
                  {strategySchemas[editingStrategy].versions.map((v) => (
                    <div
                      key={v.version}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            v.status === "Active" ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {v.version}
                        </Badge>
                        <div>
                          <p className="text-sm">{v.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {v.date} by {v.author}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {v.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <SheetFooter className="pt-4">
            <Button variant="outline" onClick={() => setEditingStrategy(null)}>
              <X className="size-4 mr-2" />
              Cancel
            </Button>
            <Button
              disabled={getChangedParams().length === 0}
              onClick={async () => {
                try {
                  await apiFetch("/api/config/strategies", token, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      strategyId: editingStrategy,
                      params: editedParams,
                    }),
                  });
                  toast.success(`Config saved for ${editingStrategy}`);
                } catch {
                  toast.error("Failed to save config");
                }
                setEditingStrategy(null);
              }}
            >
              <Save className="size-4 mr-2" />
              Save Changes
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
