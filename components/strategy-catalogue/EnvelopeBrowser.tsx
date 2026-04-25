"use client";

/**
 * EnvelopeBrowser — renders the full 5k+ catalogue envelope with progressive
 * disclosure (category → family → archetype → instance) and access-aware
 * lock badges. Reads from /api/catalogue/envelope (GCS proxy).
 *
 * 4-level filter cascade:
 *   1. Primary category (top-level dropdown with "All")
 *   2. Family (within selected category)
 *   3. Archetype (within selected family)
 *   4. Instance (cells × venues)
 *
 * Virtualised via @tanstack/react-virtual when instance counts exceed
 * VIRTUALISATION_THRESHOLD.
 */

import * as React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Loader2, Lock, Eye, ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import {
  loadEnvelope,
  loadStrategyInstruments,
  type EnvelopeJson,
  type EnvelopeArchetype,
  type StrategyInstrumentsJson,
} from "@/lib/architecture-v2/envelope-loader";
import { TERMS, formatCategory, CATEGORY_LABELS } from "@/lib/architecture-v2/terminology";
import {
  resolveSlotAccess,
  resolveArchetypeAccess,
  ACCESS_LABELS,
  ACCESS_BADGE_VARIANTS,
  type StrategyAccess,
} from "@/lib/entitlements/strategy-route";

const VIRTUALISATION_THRESHOLD = 100;

const CATEGORY_ORDER = ["CEFI", "DEFI", "TRADFI", "SPORTS", "PREDICTION", "CROSS_CATEGORY"] as const;

interface FlatRow {
  type: "category" | "family" | "archetype" | "cell";
  category: string;
  family?: string;
  archetypeId?: string;
  archetype?: EnvelopeArchetype;
  cellIndex?: number;
  depth: number;
  key: string;
}

export function EnvelopeBrowser(): React.ReactElement {
  const { user } = useAuth();
  const [envelope, setEnvelope] = React.useState<EnvelopeJson | null>(null);
  const [instruments, setInstruments] = React.useState<StrategyInstrumentsJson | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [categoryFilter, setCategoryFilter] = React.useState<string>("ALL");
  const [familyFilter, setFamilyFilter] = React.useState<string>("ALL");
  const [archetypeFilter, setArchetypeFilter] = React.useState<string>("ALL");
  const [accessFilter, setAccessFilter] = React.useState<string>("ALL");
  const [expandedKeys, setExpandedKeys] = React.useState<ReadonlySet<string>>(new Set());

  React.useEffect(() => {
    let cancelled = false;
    Promise.all([loadEnvelope(), loadStrategyInstruments()])
      .then(([env, inst]) => {
        if (cancelled) return;
        // Mock mode intercepts the GCS proxy route and may return undefined
        // or malformed payloads. Validate shape before rendering.
        if (!env || typeof env !== "object" || !env.categories || typeof env.categories !== "object") {
          setError("Catalogue unavailable in mock mode — switch to real-data mode or run regen-catalogue.sh.");
          return;
        }
        setEnvelope(env);
        setInstruments(inst && typeof inst === "object" && inst.slots ? inst : { schema_version: "0.0.0", generated_at: "", source_script: "", resolver: "missing", slot_count: 0, slots: {} });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load catalogue");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleExpand = React.useCallback((key: string): void => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // Cascade filter dependencies — reset child filters when parent changes
  React.useEffect(() => {
    if (familyFilter !== "ALL" && categoryFilter !== "ALL") {
      const fams = envelope?.categories[categoryFilter]?.families;
      if (fams && !fams[familyFilter]) setFamilyFilter("ALL");
    }
  }, [categoryFilter, familyFilter, envelope]);

  React.useEffect(() => {
    if (archetypeFilter !== "ALL" && familyFilter !== "ALL" && categoryFilter !== "ALL") {
      const arc = envelope?.categories[categoryFilter]?.families[familyFilter]?.archetypes;
      if (arc && !arc[archetypeFilter]) setArchetypeFilter("ALL");
    }
  }, [archetypeFilter, familyFilter, categoryFilter, envelope]);

  const availableFamilies = React.useMemo(() => {
    if (!envelope?.categories) return [];
    if (categoryFilter === "ALL") {
      const s = new Set<string>();
      for (const cat of Object.values(envelope.categories)) {
        for (const fam of Object.keys(cat?.families ?? {})) s.add(fam);
      }
      return Array.from(s).sort();
    }
    return Object.keys(envelope.categories[categoryFilter]?.families ?? {}).sort();
  }, [envelope, categoryFilter]);

  const availableArchetypes = React.useMemo(() => {
    if (!envelope?.categories) return [];
    const out = new Set<string>();
    const cats = categoryFilter === "ALL"
      ? Object.entries(envelope.categories)
      : envelope.categories[categoryFilter]
        ? [[categoryFilter, envelope.categories[categoryFilter]] as const]
        : [];
    for (const [, cat] of cats) {
      const families = familyFilter === "ALL"
        ? Object.entries(cat?.families ?? {})
        : cat?.families[familyFilter]
          ? [[familyFilter, cat.families[familyFilter]] as const]
          : [];
      for (const [, fam] of families) {
        for (const arc of Object.keys(fam?.archetypes ?? {})) out.add(arc);
      }
    }
    return Array.from(out).sort();
  }, [envelope, categoryFilter, familyFilter]);

  const flatRows = React.useMemo<readonly FlatRow[]>(() => {
    if (!envelope) return [];
    const rows: FlatRow[] = [];

    const filteredCats = categoryFilter === "ALL"
      ? CATEGORY_ORDER.filter((c) => envelope.categories?.[c])
      : envelope.categories?.[categoryFilter] ? [categoryFilter] : [];

    for (const category of filteredCats) {
      const cat = envelope.categories?.[category];
      if (!cat || !cat.families) continue;
      const catKey = `cat:${category}`;
      rows.push({ type: "category", category, depth: 0, key: catKey });
      if (!expandedKeys.has(catKey) && categoryFilter === "ALL") continue;

      const families = Object.entries(cat.families)
        .filter(([fam]) => familyFilter === "ALL" || fam === familyFilter)
        .sort(([a], [b]) => a.localeCompare(b));

      for (const [family, famData] of families) {
        const famKey = `fam:${category}:${family}`;
        rows.push({ type: "family", category, family, depth: 1, key: famKey });
        if (!expandedKeys.has(famKey) && categoryFilter === "ALL" && familyFilter === "ALL") continue;

        const archetypes = Object.entries(famData.archetypes)
          .filter(([arc]) => archetypeFilter === "ALL" || arc === archetypeFilter)
          .sort(([a], [b]) => a.localeCompare(b));

        for (const [archetypeId, archetype] of archetypes) {
          // Apply access filter
          if (accessFilter !== "ALL") {
            const access = resolveArchetypeAccess(user, archetypeId);
            if (access !== accessFilter) continue;
          }
          const arcKey = `arc:${category}:${family}:${archetypeId}`;
          rows.push({
            type: "archetype",
            category,
            family,
            archetypeId,
            archetype,
            depth: 2,
            key: arcKey,
          });
          if (!expandedKeys.has(arcKey)) continue;

          archetype.cells.forEach((_, idx) => {
            rows.push({
              type: "cell",
              category,
              family,
              archetypeId,
              archetype,
              cellIndex: idx,
              depth: 3,
              key: `cell:${category}:${family}:${archetypeId}:${idx}`,
            });
          });
        }
      }
    }
    return rows;
  }, [envelope, categoryFilter, familyFilter, archetypeFilter, accessFilter, expandedKeys, user]);

  const parentRef = React.useRef<HTMLDivElement>(null);
  const useVirtual = flatRows.length > VIRTUALISATION_THRESHOLD;
  const virtualizer = useVirtualizer({
    count: flatRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 8,
  });

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-red-600">
          Failed to load catalogue: {error}
        </CardContent>
      </Card>
    );
  }
  if (!envelope || !instruments) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 p-6 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading catalogue from GCS…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{TERMS.CATALOGUE} — full envelope</span>
          <span className="text-sm font-normal text-muted-foreground">
            {envelope.totals.instances.toLocaleString()} instances · {envelope.totals.bespoke_archetype_rows} bespoke archetypes
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 4-level filter cascade */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={TERMS.FILTER_CATEGORY} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{TERMS.FILTER_ALL} {TERMS.FILTER_CATEGORY}</SelectItem>
              {CATEGORY_ORDER.filter((c) => envelope.categories[c]).map((c) => (
                <SelectItem key={c} value={c}>{formatCategory(c)} ({envelope.categories[c]?.instances_count ?? 0})</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={familyFilter} onValueChange={setFamilyFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={TERMS.FILTER_FAMILY} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{TERMS.FILTER_ALL} {TERMS.FILTER_FAMILY}</SelectItem>
              {availableFamilies.map((f) => (
                <SelectItem key={f} value={f}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={archetypeFilter} onValueChange={setArchetypeFilter}>
            <SelectTrigger className="w-[260px]">
              <SelectValue placeholder={TERMS.FILTER_ARCHETYPE} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{TERMS.FILTER_ALL} {TERMS.FILTER_ARCHETYPE}</SelectItem>
              {availableArchetypes.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={accessFilter} onValueChange={setAccessFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Access" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All access</SelectItem>
              <SelectItem value="terminal">Terminal & reports</SelectItem>
              <SelectItem value="reports-only">Reports only</SelectItem>
              <SelectItem value="locked-visible">Locked</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (expandedKeys.size > 0) setExpandedKeys(new Set());
              else {
                const all = new Set<string>();
                for (const r of flatRows) all.add(r.key);
                setExpandedKeys(all);
              }
            }}
          >
            {expandedKeys.size > 0 ? "Collapse all" : "Expand all"}
          </Button>

          <span className="ml-auto text-xs text-muted-foreground">
            {flatRows.length} rows {useVirtual ? "(virtualised)" : ""}
          </span>
        </div>

        {useVirtual ? (
          <div ref={parentRef} className="h-[600px] overflow-auto rounded border">
            <div style={{ height: virtualizer.getTotalSize(), position: "relative", width: "100%" }}>
              {virtualizer.getVirtualItems().map((vRow) => {
                const row = flatRows[vRow.index];
                if (!row) return null;
                return (
                  <div
                    key={row.key}
                    data-index={vRow.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${vRow.start}px)`,
                    }}
                  >
                    <RowRenderer
                      row={row}
                      user={user}
                      instruments={instruments}
                      onToggle={toggleExpand}
                      isExpanded={expandedKeys.has(row.key)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded border">
            {flatRows.map((row) => (
              <RowRenderer
                key={row.key}
                row={row}
                user={user}
                instruments={instruments}
                onToggle={toggleExpand}
                isExpanded={expandedKeys.has(row.key)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Row rendering ───────────────────────────────────────────────────────────

interface RowRendererProps {
  row: FlatRow;
  user: ReturnType<typeof useAuth>["user"];
  instruments: StrategyInstrumentsJson;
  onToggle: (key: string) => void;
  isExpanded: boolean;
}

function RowRenderer({ row, user, instruments, onToggle, isExpanded }: RowRendererProps): React.ReactElement {
  if (row.type === "category") {
    const cat = row.category;
    return (
      <button
        type="button"
        onClick={() => onToggle(row.key)}
        className="flex w-full items-center gap-2 border-b bg-muted/40 px-3 py-2 text-left font-semibold hover:bg-muted/70"
      >
        {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        <span className="text-sm">{formatCategory(cat)}</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {CATEGORY_LABELS[cat] ?? cat}
        </span>
      </button>
    );
  }
  if (row.type === "family") {
    return (
      <button
        type="button"
        onClick={() => onToggle(row.key)}
        className="flex w-full items-center gap-2 border-b px-3 py-2 pl-10 text-left text-sm font-medium hover:bg-muted/30"
      >
        {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        <span>{row.family}</span>
      </button>
    );
  }
  if (row.type === "archetype" && row.archetypeId && row.archetype) {
    const access = resolveArchetypeAccess(user, row.archetypeId);
    return (
      <button
        type="button"
        onClick={() => onToggle(row.key)}
        className="flex w-full items-center gap-2 border-b px-3 py-2 pl-16 text-left text-sm hover:bg-muted/20"
      >
        {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        <span className="font-mono text-xs">{row.archetypeId}</span>
        {row.archetype.bespoke_capable ? (
          <Badge variant="outline" className="ml-1 text-[9px]">+ bespoke ∞</Badge>
        ) : null}
        <span className="ml-2 text-xs text-muted-foreground">
          {row.archetype.instances_total} instances
        </span>
        <Badge className={`ml-auto text-[10px] ${ACCESS_BADGE_VARIANTS[access]}`} variant="outline">
          {access === "terminal" ? <Eye className="mr-1 size-3" /> : <Lock className="mr-1 size-3" />}
          {ACCESS_LABELS[access]}
        </Badge>
      </button>
    );
  }
  if (row.type === "cell" && row.archetypeId && row.archetype && row.cellIndex !== undefined) {
    const cell = row.archetype.cells[row.cellIndex];
    if (!cell) return <div />;
    const slotKey = `${row.archetypeId}@${row.category.toLowerCase()}-${cell.instrument_type}-${cell.venues[0] ?? "unknown"}`;
    const access = resolveSlotAccess(user, slotKey);
    const concrete = instruments.slots[slotKey];
    return (
      <div className="flex items-center gap-3 border-b px-3 py-1.5 pl-24 text-xs">
        <span className="font-mono">{cell.instrument_type}</span>
        <Badge variant="outline" className="text-[9px]">{cell.status}</Badge>
        <span className="text-muted-foreground">
          {cell.venue_count} venues × {cell.tf_count} tfs = {cell.instances}
        </span>
        {concrete && concrete.instruments.length > 0 ? (
          <span className="ml-2 text-muted-foreground">
            {concrete.instruments.length} live instrument{concrete.instruments.length === 1 ? "" : "s"}
          </span>
        ) : null}
        <Badge
          className={`ml-auto text-[9px] ${ACCESS_BADGE_VARIANTS[access]}`}
          variant="outline"
        >
          {access === "terminal" ? null : <Lock className="mr-1 size-3" />}
          {access}
        </Badge>
      </div>
    );
  }
  return <div />;
}
