"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FAMILY_METADATA,
  listArchetypesForFamily,
  type StrategyArchetype,
} from "@/lib/architecture-v2";
import { cn } from "@/lib/utils";
import { formatNumber, formatCurrency } from "@/lib/utils/formatters";
import {
  CATEGORY_COLORS,
  RISK_COLORS,
  STATUS_COLORS,
  type StrategyCatalogEntry,
} from "@/lib/mocks/fixtures/strategy-catalog-data";
import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import type { FamilyAggregate } from "./aggregation";

function entriesByArchetype(
  entries: readonly StrategyCatalogEntry[],
  archetypeLabelMap: Readonly<Record<StrategyArchetype, string>>,
): Map<string, StrategyCatalogEntry[]> {
  // We don't yet have v2 archetype tags on the legacy fixture, so bucket by
  // subcategory as a best-effort proxy. Dashboard header flags this with an
  // explicit note so consumers know archetype binding is pending phase 11.
  const map = new Map<string, StrategyCatalogEntry[]>();
  for (const e of entries) {
    const key = e.subcategory || "UNSPECIFIED";
    const bucket = map.get(key) ?? [];
    bucket.push(e);
    map.set(key, bucket);
  }
  // suppress unused lint: we keep the map shape ready for archetype binding
  void archetypeLabelMap;
  return map;
}

export function FamilyDashboard({ aggregate }: { aggregate: FamilyAggregate }) {
  const meta = FAMILY_METADATA[aggregate.family];
  const archetypes = listArchetypesForFamily(aggregate.family);
  const archetypeLabel: Record<StrategyArchetype, string> = Object.fromEntries(
    archetypes.map((a) => [a.archetype, a.label]),
  ) as Record<StrategyArchetype, string>;
  const subcatBuckets = entriesByArchetype(aggregate.entries, archetypeLabel);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="platform-page-width space-y-6 p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            href="/services/research/strategy/families"
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Families
          </Link>
          <span>/</span>
          <span className="text-foreground">{meta.label}</span>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-page-title font-semibold tracking-tight">{meta.label}</h1>
            <p className="text-body text-muted-foreground max-w-2xl">{meta.shortDescription}</p>
            <p className="text-xs text-muted-foreground">
              Alpha source: <span className="text-foreground">{meta.alphaSource}</span>
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <a href={meta.docHref} target="_blank" rel="noreferrer">
              <BookOpen className="mr-2 size-3.5" />
              Family doc
            </a>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Instances
              </p>
              <p className="text-2xl font-bold font-mono">{aggregate.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Live / Paper
              </p>
              <p className="text-2xl font-bold font-mono">
                {aggregate.live} / {aggregate.paper}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Avg Sharpe
              </p>
              <p className="text-2xl font-bold font-mono">{formatNumber(aggregate.avgSharpe, 2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                APY range
              </p>
              <p className="text-2xl font-bold font-mono">
                {formatNumber(aggregate.minApy, 0)}&#8211;{formatNumber(aggregate.maxApy, 0)}%
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Archetypes</h2>
            <Badge variant="secondary" className="text-[10px]">
              {archetypes.length} code paths
            </Badge>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {archetypes.map((a) => {
              const bucket = subcatBuckets.get(a.label) ?? [];
              return (
                <Card key={a.archetype} className="border-border/50">
                  <CardContent className="pt-5 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold">{a.label}</p>
                        <p className="text-[11px] text-muted-foreground">{a.archetype}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {a.settlementShape}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{a.shortDescription}</p>
                    <p className="text-[11px] text-muted-foreground/80">
                      Bound instances (phase 11 wiring pending): {bucket.length}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Instances in this family</h2>
            <Badge variant="secondary" className="text-[10px]">
              {aggregate.total} strategies
            </Badge>
          </div>
          <Card className="border-border/50">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-xs text-muted-foreground">Name</TableHead>
                    <TableHead className="text-xs text-muted-foreground">Category</TableHead>
                    <TableHead className="text-xs text-muted-foreground">Target APY</TableHead>
                    <TableHead className="text-xs text-muted-foreground">Sharpe</TableHead>
                    <TableHead className="text-xs text-muted-foreground">Risk</TableHead>
                    <TableHead className="text-xs text-muted-foreground">Status</TableHead>
                    <TableHead className="text-xs text-muted-foreground">Min Deposit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aggregate.entries.map((s) => (
                    <TableRow key={s.strategy_id} className="border-border/30">
                      <TableCell>
                        <Link
                          href={`/services/research/strategy/catalog/${s.strategy_id}`}
                          className="font-medium text-foreground hover:text-primary"
                        >
                          {s.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn("text-[10px]", CATEGORY_COLORS[s.category])}
                        >
                          {s.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {s.performance.target_apy_range[0]}&#8211;
                        {s.performance.target_apy_range[1]}%
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatNumber(s.performance.expected_sharpe, 2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn("text-[10px]", RISK_COLORS[s.risk.risk_level])}
                        >
                          {s.risk.risk_level.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn("text-[10px]", STATUS_COLORS[s.readiness.status])}
                        >
                          {s.readiness.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {formatCurrency(s.money_ops.min_deposit_usd, "USD", 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
