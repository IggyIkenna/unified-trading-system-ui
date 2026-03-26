"use client";

/**
 * Feature Catalogue — Finder + Catalogue modes
 *
 * Finder layout (powered by <FinderBrowser>):
 *   ┌─────────────────────────────────────────────────┬──────────────┐
 *   │  AGGREGATED CONTEXT STRIP (always visible)      │              │
 *   ├──────────┬──────────┬──────────┬────────────────┤  DETAIL      │
 *   │ Services │ Category │  Groups  │  Feature list  │  PANEL       │
 *   │ col 1   │ col 2    │  col 3   │  col 4 (paged) │  (collapsible│
 *   └──────────┴──────────┴──────────┴────────────────┴──────────────┘
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  FeatureCatalogueEntry,
  IndividualFeature,
} from "@/lib/build-mock-data";
import { FEATURE_CATALOGUE, FEATURE_VERSIONS } from "@/lib/build-mock-data";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Code2,
  Columns,
  Cpu,
  GitBranch,
  LayoutGrid,
  List,
  Plus,
  Search,
  Settings2,
  Table2,
  Tag,
} from "lucide-react";
import * as React from "react";
import { FinderBrowser } from "@/components/shared/finder";
import type { FinderSelections } from "@/components/shared/finder";
import {
  buildFeaturesColumns,
  getFeaturesContextStats,
} from "@/components/research/features/features-finder-config";
import { FeatureDetailPanel } from "@/components/research/features/feature-detail-panel";
import {
  NewFeatureDialog,
  CatStatusBadge,
  EditConfigDialog,
} from "@/components/research/features/feature-dialogs";
import {
  FEAT_STATUS_CFG,
  SHARD_COLORS,
  SERVICE_COLORS,
} from "@/components/research/features/feature-helpers";
import type {
  FeatureGroupEntry,
  FeatureServiceNode,
} from "@/lib/build-mock-data";

// ═══════════════════════════════════════════════════════════════════════════════
// CATALOGUE VIEW — flat table/grid/tree with right detail panel
// ═══════════════════════════════════════════════════════════════════════════════

type FlatViewMode = "grid" | "tree" | "table";

function CatDetailPanel({
  feature,
}: {
  feature: FeatureCatalogueEntry | null;
}) {
  const [editOpen, setEditOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<FeatureCatalogueEntry | null>(null);
  const displayed = draft?.id === feature?.id ? draft : feature;

  if (!displayed) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <Code2 className="size-10 mb-3 text-muted-foreground/20" />
        <p className="text-sm font-medium text-muted-foreground">
          Select a feature
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Click any row to see details
        </p>
      </div>
    );
  }
  const versions = FEATURE_VERSIONS[displayed.id] ?? [];
  const sc = FEAT_STATUS_CFG[displayed.status];
  const SI = sc.icon;

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge
              variant="outline"
              className={cn("text-xs", SHARD_COLORS[displayed.shard])}
            >
              {displayed.shard}
            </Badge>
            <Badge variant="outline" className={cn("text-xs gap-1", sc.badge)}>
              <SI className="size-3" />
              {displayed.status === "not_computed"
                ? "Not Computed"
                : displayed.status.charAt(0).toUpperCase() +
                  displayed.status.slice(1)}
            </Badge>
          </div>
          <code className="text-sm font-mono font-semibold break-all">
            {displayed.name}
          </code>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {displayed.description}
          </p>
        </div>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <GitBranch className="size-3" />
            <span className="font-mono font-semibold text-foreground">
              {displayed.current_version}
            </span>
          </div>
          <span className="text-muted-foreground">
            {displayed.last_computed
              ? formatDistanceToNow(new Date(displayed.last_computed), {
                  addSuffix: true,
                })
              : "never"}
          </span>
        </div>
        <Separator />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Type</p>
            <Badge variant="secondary" className="text-xs">
              {displayed.feature_type}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Group</p>
            <Badge variant="secondary" className="text-xs">
              {displayed.feature_group}
            </Badge>
          </div>
        </div>
        {Object.keys(displayed.parameters).length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Code2 className="size-3" /> Parameters
            </p>
            <div className="rounded-lg bg-muted/40 p-2.5 space-y-1.5">
              {Object.entries(displayed.parameters).map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="font-mono text-muted-foreground">{k}</span>
                  <span className="font-mono font-medium">
                    {Array.isArray(v) ? v.join(", ") : String(v)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Computed For
          </p>
          <div className="flex flex-wrap gap-1">
            {displayed.symbols.map((s) => (
              <Badge key={s} variant="secondary" className="text-xs font-mono">
                {s}
              </Badge>
            ))}
          </div>
        </div>
        {displayed.consumed_by_models.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="size-3" /> Used by Models
            </p>
            <div className="flex flex-wrap gap-1">
              {displayed.consumed_by_models.map((m) => (
                <Badge key={m} variant="outline" className="text-xs">
                  {m}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {versions.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Version History
              </p>
              {versions.map((v, i) => (
                <div
                  key={v.version}
                  className={cn(
                    "rounded-lg border p-2.5 space-y-1",
                    i === 0
                      ? "border-primary/30 bg-primary/5"
                      : "border-border/50",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold">
                        {v.version}
                      </span>
                      {i === 0 && (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-primary/30 text-primary px-1 py-0"
                        >
                          current
                        </Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(v.changed_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {v.change_summary}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
        <Separator />
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1"
            onClick={() => setEditOpen(true)}
          >
            <Settings2 className="size-3" /> Edit Config
          </Button>
        </div>
      </div>

      <EditConfigDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        featureName={displayed.name}
        initial={{
          name: displayed.name,
          description: displayed.description,
          status: displayed.status,
          parameters: displayed.parameters,
          symbols: displayed.symbols,
          tags: displayed.tags,
          dependencies: displayed.dependencies,
        }}
        onSave={(updated) => {
          setDraft({
            ...displayed,
            description: updated.description,
            status: updated.status as FeatureCatalogueEntry["status"],
            parameters: updated.parameters,
            symbols: updated.symbols,
            tags: updated.tags,
            dependencies: updated.dependencies,
          });
        }}
      />
    </div>
  );
}

function CatGridView({
  features,
  selected,
  onSelect,
}: {
  features: FeatureCatalogueEntry[];
  selected: FeatureCatalogueEntry | null;
  onSelect: (f: FeatureCatalogueEntry) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {features.map((f) => {
        const sc = FEAT_STATUS_CFG[f.status];
        const SI = sc.icon;
        return (
          <Card
            key={f.id}
            className={cn(
              "hover:border-primary/40 transition-colors cursor-pointer",
              selected?.id === f.id && "border-primary/60 bg-primary/5",
            )}
            onClick={() => onSelect(f)}
          >
            <CardContent className="p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <code className="text-xs font-mono font-medium leading-tight break-all">
                  {f.name}
                </code>
                <SI className={cn("size-3.5 shrink-0 mt-0.5", sc.color)} />
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {f.description}
              </p>
              <div className="flex items-center gap-1 flex-wrap">
                <Badge
                  variant="outline"
                  className={cn("text-xs", SHARD_COLORS[f.shard])}
                >
                  {f.shard}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {f.feature_type}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-mono">{f.current_version}</span>
                <span>
                  {f.last_computed
                    ? formatDistanceToNow(new Date(f.last_computed), {
                        addSuffix: true,
                      })
                    : "never"}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function CatTreeView({
  features,
  selected,
  onSelect,
}: {
  features: FeatureCatalogueEntry[];
  selected: FeatureCatalogueEntry | null;
  onSelect: (f: FeatureCatalogueEntry) => void;
}) {
  const [expanded, setExpanded] = React.useState<Set<string>>(
    new Set(["CeFi / Technical"]),
  );
  const grouped: Record<string, FeatureCatalogueEntry[]> = {};
  for (const f of features) {
    const k = `${f.shard} / ${f.feature_group}`;
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(f);
  }
  return (
    <div className="space-y-1">
      {Object.entries(grouped).map(([key, items]) => {
        const isOpen = expanded.has(key);
        const [shard] = key.split(" / ");
        return (
          <div
            key={key}
            className="rounded-lg border border-border/50 overflow-hidden"
          >
            <button
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/40 transition-colors text-left"
              onClick={() =>
                setExpanded((p) => {
                  const n = new Set(p);
                  isOpen ? n.delete(key) : n.add(key);
                  return n;
                })
              }
            >
              {isOpen ? (
                <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
              )}
              <span className="font-medium text-sm flex-1">{key}</span>
              <Badge
                variant="outline"
                className={cn("text-xs", SHARD_COLORS[shard])}
              >
                {shard}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {items.filter((f) => f.status === "active").length}/
                {items.length}
              </Badge>
            </button>
            {isOpen && (
              <div className="border-t border-border/40 divide-y divide-border/30">
                {items.map((f) => {
                  const sc = FEAT_STATUS_CFG[f.status];
                  const SI = sc.icon;
                  return (
                    <button
                      key={f.id}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2 hover:bg-muted/30 transition-colors text-left text-xs",
                        selected?.id === f.id && "bg-primary/5",
                      )}
                      onClick={() => onSelect(f)}
                    >
                      <SI className={cn("size-3.5 shrink-0", sc.color)} />
                      <code className="font-mono font-medium flex-1 truncate">
                        {f.name}
                      </code>
                      <span className="font-mono text-muted-foreground shrink-0">
                        {f.current_version}
                      </span>
                      <ChevronRight className="size-3 text-muted-foreground shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CatTableView({
  features,
  selected,
  onSelect,
}: {
  features: FeatureCatalogueEntry[];
  selected: FeatureCatalogueEntry | null;
  onSelect: (f: FeatureCatalogueEntry) => void;
}) {
  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Feature</TableHead>
            <TableHead>Shard</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Syms</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {features.map((f) => (
            <TableRow
              key={f.id}
              className={cn(
                "cursor-pointer hover:bg-muted/30 transition-colors",
                selected?.id === f.id && "bg-primary/5 hover:bg-primary/10",
              )}
              onClick={() => onSelect(f)}
            >
              <TableCell>
                <code className="text-xs font-mono font-medium">{f.name}</code>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn("text-xs", SHARD_COLORS[f.shard])}
                >
                  {f.shard}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-xs text-muted-foreground">
                  {f.feature_type}
                </span>
              </TableCell>
              <TableCell>
                <span className="font-mono text-xs">{f.current_version}</span>
              </TableCell>
              <TableCell>
                <CatStatusBadge status={f.status} />
              </TableCell>
              <TableCell className="text-right text-xs tabular-nums">
                {f.symbols.length}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function CatalogueView({
  search,
  catalogueSource,
}: {
  search: string;
  catalogueSource: FeatureCatalogueEntry[];
}) {
  const [viewMode, setViewMode] = React.useState<FlatViewMode>("table");
  const [shardFilter, setShardFilter] = React.useState("all");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [selectedFeature, setSelectedFeature] =
    React.useState<FeatureCatalogueEntry | null>(null);

  const filtered = React.useMemo(() => {
    let items = catalogueSource;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (shardFilter !== "all")
      items = items.filter((f) => f.shard === shardFilter);
    if (typeFilter !== "all")
      items = items.filter((f) => f.feature_type === typeFilter);
    if (statusFilter !== "all")
      items = items.filter((f) => f.status === statusFilter);
    return items;
  }, [search, shardFilter, typeFilter, statusFilter, catalogueSource]);

  const shards = [...new Set(catalogueSource.map((f) => f.shard))];
  const types = [...new Set(catalogueSource.map((f) => f.feature_type))];

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-border/30">
        <Select value={shardFilter} onValueChange={setShardFilter}>
          <SelectTrigger className="w-[120px] h-7 text-xs">
            <SelectValue placeholder="Shard" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Shards</SelectItem>
            {shards.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px] h-7 text-xs">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {types.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px] h-7 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="stale">Stale</SelectItem>
            <SelectItem value="not_computed">Not Computed</SelectItem>
            <SelectItem value="deprecated">Deprecated</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">
          {filtered.length} of {catalogueSource.length}
        </span>
        <div className="flex items-center gap-0.5 rounded-md border border-border/50 p-0.5 ml-auto">
          {(
            [
              { mode: "grid" as const, icon: LayoutGrid },
              { mode: "tree" as const, icon: List },
              { mode: "table" as const, icon: Table2 },
            ] as const
          ).map(({ mode, icon: Icon }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "p-1.5 rounded transition-colors",
                viewMode === mode
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" />
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="size-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No features match</p>
              </div>
            ) : viewMode === "grid" ? (
              <CatGridView
                features={filtered}
                selected={selectedFeature}
                onSelect={setSelectedFeature}
              />
            ) : viewMode === "tree" ? (
              <CatTreeView
                features={filtered}
                selected={selectedFeature}
                onSelect={setSelectedFeature}
              />
            ) : (
              <CatTableView
                features={filtered}
                selected={selectedFeature}
                onSelect={setSelectedFeature}
              />
            )}
          </div>
        </div>
        <div className="w-[420px] shrink-0 border-l border-border/50 flex flex-col min-h-0 bg-muted/5">
          <div className="px-3 py-1.5 border-b border-border/40 bg-muted/30">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Feature Detail
            </p>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <CatDetailPanel feature={selectedFeature} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════

type PageMode = "finder" | "catalogue";

export default function FeaturesPage() {
  const [pageMode, setPageMode] = React.useState<PageMode>("finder");
  const [search, setSearch] = React.useState("");
  const [userAddedFeatures, setUserAddedFeatures] = React.useState<
    IndividualFeature[]
  >([]);
  const [userCatalogue, setUserCatalogue] = React.useState<
    FeatureCatalogueEntry[]
  >([]);
  const [newFeatureOpen, setNewFeatureOpen] = React.useState(false);

  const catalogueMerged = React.useMemo(
    () => [...FEATURE_CATALOGUE, ...userCatalogue],
    [userCatalogue],
  );

  const existingFeatureNames = React.useMemo(() => {
    const s = new Set<string>();
    for (const f of FEATURE_CATALOGUE) s.add(f.name);
    for (const f of userCatalogue) s.add(f.name);
    for (const f of userAddedFeatures) s.add(f.name);
    return s;
  }, [userCatalogue, userAddedFeatures]);

  // Column defs for FinderBrowser — memoized so they don't re-create on each render
  const finderColumns = React.useMemo(
    () => buildFeaturesColumns(userAddedFeatures),
    [userAddedFeatures],
  );

  // Detail panel — receives selections and extracts feature + service
  function renderFinderDetail(selections: FinderSelections) {
    const featItem = selections["feature"];
    if (!featItem) {
      // Show service-level or group-level context when no feature selected
      const grpItem = selections["group"];
      const svcItem = selections["service"];
      if (!svcItem)
        return (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <Code2 className="size-10 mb-3 text-muted-foreground/20" />
            <p className="text-sm font-medium text-muted-foreground">
              No feature selected
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1 leading-relaxed">
              Drill down to a feature to see its config, parameters, and version
              history.
            </p>
          </div>
        );
      return (
        <FeatureDetailPanel
          service={svcItem.data as FeatureServiceNode}
          feature={null}
        />
      );
    }
    const { feat, service } = featItem.data as {
      feat: IndividualFeature;
      service: FeatureServiceNode;
    };
    return <FeatureDetailPanel service={service} feature={feat} />;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Top bar ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 px-6 pt-4 pb-3 border-b border-border/50">
        <div>
          <h1 className="text-lg font-bold tracking-tight">
            Feature Catalogue
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {pageMode === "finder"
              ? "Service → Category → Group → Feature"
              : `${catalogueMerged.length} features · ${[...new Set(catalogueMerged.map((f) => f.shard))].length} shards`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder={
                pageMode === "finder" ? "Filter services…" : "Search features…"
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-7 w-[180px] text-xs"
            />
          </div>
          <div className="flex items-center rounded-lg border border-border/50 overflow-hidden">
            {(["finder", "catalogue"] as PageMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setPageMode(m)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
                  m !== "finder" && "border-l border-border/50",
                  pageMode === m
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                {m === "finder" ? (
                  <Columns className="size-3" />
                ) : (
                  <Table2 className="size-3" />
                )}
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
          <Button
            size="sm"
            className="h-7 text-xs"
            type="button"
            onClick={() => setNewFeatureOpen(true)}
          >
            <Plus className="size-3.5 mr-1" /> New Feature
          </Button>
        </div>
      </div>

      <NewFeatureDialog
        open={newFeatureOpen}
        onOpenChange={setNewFeatureOpen}
        existingNames={existingFeatureNames}
        onCreate={({ individual, catalogue }) => {
          setUserAddedFeatures((p) => [...p, individual]);
          setUserCatalogue((p) => [...p, catalogue]);
        }}
      />

      {/* ── View ─────────────────────────────────────────────────── */}
      {pageMode === "finder" ? (
        <FinderBrowser
          columns={finderColumns}
          detailPanel={renderFinderDetail}
          contextStats={getFeaturesContextStats}
          search={search}
          detailPanelTitle="Feature Detail"
          emptyState={
            <>
              <Columns className="size-8 mb-2 opacity-20" />
              <p className="text-sm font-medium">Select a service</p>
              <p className="text-xs opacity-60 mt-1">
                Drill down to browse individual features
              </p>
            </>
          }
        />
      ) : (
        <CatalogueView search={search} catalogueSource={catalogueMerged} />
      )}
    </div>
  );
}
