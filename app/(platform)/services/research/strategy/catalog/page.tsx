"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { useStrategyCatalog } from "@/hooks/api/use-strategy-catalog";
import {
  CATEGORY_COLORS,
  RISK_COLORS,
  STATUS_COLORS,
  STRATEGY_CATALOG,
  type StrategyCatalogEntry,
  type StrategyCategory,
} from "@/lib/mocks/fixtures/strategy-catalog-data";
import { getStrategyCatalogSource } from "@/lib/strategy-catalog/source";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber } from "@/lib/utils/formatters";
import {
  ArrowUpDown,
  BarChart3,
  Grid3X3,
  LayoutList,
  Search,
  Shield,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<StrategyCategory, string> = {
  DEFI: "DeFi",
  CEFI: "CeFi",
  TRADFI: "TradFi",
  SPORTS: "Sports",
  PREDICTION: "Predictions",
};

const CATEGORIES: Array<{ id: StrategyCategory | "All"; label: string; icon: React.ReactNode }> = [
  { id: "All", label: "All Strategies", icon: <BarChart3 className="size-4" /> },
  { id: "DEFI", label: "DeFi", icon: <Zap className="size-4" /> },
  { id: "CEFI", label: "CeFi", icon: <TrendingUp className="size-4" /> },
  { id: "TRADFI", label: "TradFi", icon: <BarChart3 className="size-4" /> },
  { id: "SPORTS", label: "Sports", icon: <Trophy className="size-4" /> },
  { id: "PREDICTION", label: "Predictions", icon: <Shield className="size-4" /> },
];

const CATEGORY_ICONS: Record<StrategyCategory, React.ReactNode> = {
  DEFI: <Zap className="size-5 text-purple-400" />,
  CEFI: <TrendingUp className="size-5 text-blue-400" />,
  TRADFI: <BarChart3 className="size-5 text-emerald-400" />,
  SPORTS: <Trophy className="size-5 text-orange-400" />,
  PREDICTION: <Shield className="size-5 text-pink-400" />,
};

type SortKey = "name" | "apy" | "sharpe" | "risk" | "status";
type ViewMode = "grid" | "list";

const RISK_ORDER: Record<string, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, VERY_HIGH: 3 };
const STATUS_ORDER: Record<string, number> = { LIVE: 0, STAGING: 1, PAPER: 2, BACKTEST: 3, RESEARCH: 4, SUSPENDED: 5 };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sortStrategies(items: StrategyCatalogEntry[], sortKey: SortKey, sortDir: "asc" | "desc"): StrategyCatalogEntry[] {
  const sorted = [...items].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case "name":
        cmp = a.name.localeCompare(b.name);
        break;
      case "apy":
        cmp = a.performance.target_apy_range[1] - b.performance.target_apy_range[1];
        break;
      case "sharpe":
        cmp = a.performance.expected_sharpe - b.performance.expected_sharpe;
        break;
      case "risk":
        cmp = (RISK_ORDER[a.risk.risk_level] ?? 0) - (RISK_ORDER[b.risk.risk_level] ?? 0);
        break;
      case "status":
        cmp = (STATUS_ORDER[a.readiness.status] ?? 0) - (STATUS_ORDER[b.readiness.status] ?? 0);
        break;
    }
    return sortDir === "desc" ? -cmp : cmp;
  });
  return sorted;
}

// ---------------------------------------------------------------------------
// Strategy Card (Grid View)
// ---------------------------------------------------------------------------

function StrategyCard({ strategy }: { strategy: StrategyCatalogEntry }) {
  return (
    <Link href={`/services/research/strategy/catalog/${strategy.strategy_id}`}>
      <Card className="group h-full cursor-pointer border-border/50 transition-all duration-200 hover:border-border hover:shadow-lg hover:shadow-black/20">
        <CardContent className="flex h-full flex-col gap-4 pt-5">
          {/* Top: Name + Badges */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 space-y-1">
                <h3 className="text-base font-semibold leading-tight text-foreground group-hover:text-primary transition-colors">
                  {strategy.name}
                </h3>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className={cn("text-[10px]", CATEGORY_COLORS[strategy.category])}>
                    {CATEGORY_LABELS[strategy.category]}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">
                    {strategy.family}
                  </Badge>
                </div>
              </div>
              <Badge variant="outline" className={cn("shrink-0 text-[10px]", STATUS_COLORS[strategy.readiness.status])}>
                {strategy.readiness.status}
              </Badge>
            </div>

            {/* APY Hero Number */}
            <div className="rounded-lg bg-muted/40 px-4 py-3 text-center">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Target APY</p>
              <p className="text-2xl font-bold text-foreground">
                {strategy.performance.target_apy_range[0]}&#8211;{strategy.performance.target_apy_range[1]}%
              </p>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-3 gap-3 border-t border-border/50 pt-3">
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Sharpe</p>
              <p className="text-sm font-semibold font-mono">{formatNumber(strategy.performance.expected_sharpe, 2)}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Max DD</p>
              <p className="text-sm font-semibold font-mono text-red-400">
                {formatNumber(strategy.performance.max_drawdown_pct, 1)}%
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Win Rate</p>
              <p className="text-sm font-semibold font-mono">{strategy.performance.win_rate_pct}%</p>
            </div>
          </div>

          {/* Risk + Min Deposit */}
          <div className="flex items-center justify-between border-t border-border/50 pt-3">
            <Badge variant="outline" className={cn("text-[10px]", RISK_COLORS[strategy.risk.risk_level])}>
              {strategy.risk.risk_level.replace("_", " ")} RISK
            </Badge>
            <span className="text-xs text-muted-foreground">
              Min {formatCurrency(strategy.money_ops.min_deposit_usd, "USD", 0)}
            </span>
          </div>

          {/* Venues */}
          <div className="flex flex-wrap items-center gap-1 mt-auto">
            {strategy.config.venues.slice(0, 3).map((venue) => (
              <Badge key={venue} variant="outline" className="text-[10px] px-1.5 py-0 border-border/60">
                {venue}
              </Badge>
            ))}
            {strategy.config.venues.length > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{strategy.config.venues.length - 3} more
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Category Section (Grid View grouped by category)
// ---------------------------------------------------------------------------

function CategorySection({
  category,
  strategies,
}: {
  category: StrategyCategory;
  strategies: StrategyCatalogEntry[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {CATEGORY_ICONS[category]}
          <h2 className="text-lg font-semibold text-foreground">{CATEGORY_LABELS[category]}</h2>
        </div>
        <Badge variant="secondary" className="text-[10px]">
          {strategies.length} {strategies.length === 1 ? "strategy" : "strategies"}
        </Badge>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {strategies.map((s) => (
          <StrategyCard key={s.strategy_id} strategy={s} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// List View Row
// ---------------------------------------------------------------------------

function StrategyListRow({ strategy }: { strategy: StrategyCatalogEntry }) {
  return (
    <TableRow className="border-border/30 cursor-pointer hover:bg-muted/30">
      <TableCell>
        <Link
          href={`/services/research/strategy/catalog/${strategy.strategy_id}`}
          className="font-medium text-foreground hover:text-primary transition-colors"
        >
          {strategy.name}
        </Link>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={cn("text-[10px]", CATEGORY_COLORS[strategy.category])}>
          {CATEGORY_LABELS[strategy.category]}
        </Badge>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{strategy.family}</TableCell>
      <TableCell className="font-mono text-sm font-semibold">
        {strategy.performance.target_apy_range[0]}&#8211;{strategy.performance.target_apy_range[1]}%
      </TableCell>
      <TableCell className="font-mono text-sm">{formatNumber(strategy.performance.expected_sharpe, 2)}</TableCell>
      <TableCell>
        <Badge variant="outline" className={cn("text-[10px]", RISK_COLORS[strategy.risk.risk_level])}>
          {strategy.risk.risk_level.replace("_", " ")}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={cn("text-[10px]", STATUS_COLORS[strategy.readiness.status])}>
          {strategy.readiness.status}
        </Badge>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatCurrency(strategy.money_ops.min_deposit_usd, "USD", 0)}
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {strategy.config.venues.slice(0, 2).map((v) => (
            <Badge key={v} variant="outline" className="text-[9px] px-1 py-0">
              {v}
            </Badge>
          ))}
          {strategy.config.venues.length > 2 && (
            <span className="text-[9px] text-muted-foreground">+{strategy.config.venues.length - 2}</span>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function StrategyCatalogPage() {
  const catalogQuery = useStrategyCatalog();
  const catalogSource = getStrategyCatalogSource();
  const catalog = catalogQuery.data?.entries;

  const [search, setSearch] = React.useState("");
  // Multi-select: empty set === "All". Categories are DERIVED from venue mix
  // per the v2 architecture, so the filter must allow the union of categories.
  const [selectedCategories, setSelectedCategories] = React.useState<Set<StrategyCategory>>(
    () => new Set(),
  );
  const [sortKey, setSortKey] = React.useState<SortKey>("apy");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");
  const [view, setView] = React.useState<ViewMode>("grid");

  const toggleCategory = React.useCallback((id: StrategyCategory | "All") => {
    if (id === "All") {
      setSelectedCategories(new Set());
      return;
    }
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const allSelected = selectedCategories.size === 0;

  // Filter
  const filtered = React.useMemo(() => {
    const base = catalog ?? STRATEGY_CATALOG;
    let items: StrategyCatalogEntry[] = base;
    if (!allSelected) {
      items = items.filter((s) => selectedCategories.has(s.category));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.family.toLowerCase().includes(q) ||
          s.config.venues.some((v) => v.toLowerCase().includes(q)),
      );
    }
    return sortStrategies(items, sortKey, sortDir);
  }, [allSelected, selectedCategories, search, sortKey, sortDir, catalog]);

  // Group by category (for "All" grid view)
  const grouped = React.useMemo(() => {
    const map = new Map<StrategyCategory, StrategyCatalogEntry[]>();
    for (const s of filtered) {
      const existing = map.get(s.category) ?? [];
      existing.push(s);
      map.set(s.category, existing);
    }
    return map;
  }, [filtered]);

  const categoryCounts = React.useMemo(() => {
    const base = catalog ?? STRATEGY_CATALOG;
    return {
      DEFI: base.filter((s) => s.category === "DEFI").length,
      CEFI: base.filter((s) => s.category === "CEFI").length,
      TRADFI: base.filter((s) => s.category === "TRADFI").length,
      SPORTS: base.filter((s) => s.category === "SPORTS").length,
      PREDICTION: base.filter((s) => s.category === "PREDICTION").length,
    } satisfies Record<StrategyCategory, number>;
  }, [catalog]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  if (catalogQuery.isError && !catalogQuery.data) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6">
        <Alert variant="destructive" className="max-w-xl">
          <AlertTitle>Catalog unavailable</AlertTitle>
          <AlertDescription>
            {(catalogQuery.error as Error)?.message ?? "Could not load the strategy registry."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!catalog) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6 space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded-md bg-muted" />
        <div className="h-40 w-full animate-pulse rounded-lg bg-muted/60" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="platform-page-width space-y-6 p-6">
        {/* Page Header */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-page-title font-semibold tracking-tight text-foreground">
              Strategy Catalog
            </h1>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
              Source: {catalogQuery.data?.source ?? catalogSource}
            </Badge>
          </div>
          <p className="text-body text-muted-foreground max-w-2xl">
            Browse our full range of systematic trading strategies across DeFi, CeFi, traditional
            markets, sports, and prediction markets.
          </p>
          {catalogQuery.data?.degraded ? (
            <Alert className="max-w-2xl border-amber-500/40 bg-amber-500/5">
              <AlertTitle>Showing fixture catalogue</AlertTitle>
              <AlertDescription>
                The live registry request failed; you are seeing merged/static rows until connectivity is restored.
              </AlertDescription>
            </Alert>
          ) : null}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Tabs — multi-select. "All" clears selection. */}
          <div
            className="flex flex-wrap items-center gap-1 rounded-lg bg-muted/40 p-1"
            role="group"
            aria-label="Category filter (multi-select)"
          >
            {CATEGORIES.map((cat) => {
              const isActive = cat.id === "All" ? allSelected : selectedCategories.has(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  aria-pressed={isActive}
                  data-testid={`category-filter-${cat.id}`}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                  )}
                >
                  {cat.icon}
                  <span className="hidden sm:inline">{cat.label}</span>
                  {cat.id !== "All" && (
                    <span className="text-[10px] text-muted-foreground">
                      ({categoryCounts[cat.id]})
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex-1" />

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search name, family, venue..."
              className="pl-9 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Sort */}
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <SelectTrigger className="w-36 h-9" size="sm">
              <ArrowUpDown className="size-3.5 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="apy">Target APY</SelectItem>
              <SelectItem value="sharpe">Sharpe Ratio</SelectItem>
              <SelectItem value="risk">Risk Level</SelectItem>
              <SelectItem value="status">Readiness</SelectItem>
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <div className="flex items-center rounded-lg border border-border/50 p-0.5">
            <Button
              variant={view === "grid" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => setView("grid")}
              aria-label="Grid view"
            >
              <Grid3X3 className="size-4" />
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => setView("list")}
              aria-label="List view"
            >
              <LayoutList className="size-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="size-10 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No strategies found</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : view === "grid" ? (
          <div className="space-y-8">
            {allSelected ? (
              Array.from(grouped.entries()).map(([cat, strategies]) => (
                <CategorySection key={cat} category={cat} strategies={strategies} />
              ))
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((s) => (
                  <StrategyCard key={s.strategy_id} strategy={s} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <Card className="border-border/50">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead
                      className="text-xs text-muted-foreground cursor-pointer select-none"
                      onClick={() => toggleSort("name")}
                    >
                      Name
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground">Category</TableHead>
                    <TableHead className="text-xs text-muted-foreground">Family</TableHead>
                    <TableHead
                      className="text-xs text-muted-foreground cursor-pointer select-none"
                      onClick={() => toggleSort("apy")}
                    >
                      Target APY
                    </TableHead>
                    <TableHead
                      className="text-xs text-muted-foreground cursor-pointer select-none"
                      onClick={() => toggleSort("sharpe")}
                    >
                      Sharpe
                    </TableHead>
                    <TableHead
                      className="text-xs text-muted-foreground cursor-pointer select-none"
                      onClick={() => toggleSort("risk")}
                    >
                      Risk
                    </TableHead>
                    <TableHead
                      className="text-xs text-muted-foreground cursor-pointer select-none"
                      onClick={() => toggleSort("status")}
                    >
                      Status
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground">Min Deposit</TableHead>
                    <TableHead className="text-xs text-muted-foreground">Venues</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <StrategyListRow key={s.strategy_id} strategy={s} />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
