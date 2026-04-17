"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { VenueCapabilityView } from "@/lib/architecture-v2";
import { MOCK_VENUE_CAPABILITIES } from "@/lib/mocks/fixtures/architecture-v2-fixtures";
import { formatNumber } from "@/lib/utils/formatters";

function formatCommission(c: VenueCapabilityView["commission"]): string {
  if (c.flat_bps !== null) {
    return `${c.flat_bps} bps (${c.type})`;
  }
  if (c.tiers.length === 0) {
    return `${c.type} (no tiers)`;
  }
  const first = c.tiers[0];
  return `maker ${formatNumber(first.maker_bps, 1)} / taker ${formatNumber(first.taker_bps, 1)} bps (${c.type})`;
}

function formatLtvRange(per_asset: VenueCapabilityView["collateral_rules"]["per_asset_ltv"]): string {
  const ltvs = Object.values(per_asset).map((r) => r.max_ltv_pct);
  if (ltvs.length === 0) {
    return "—";
  }
  const min = Math.min(...ltvs);
  const max = Math.max(...ltvs);
  return min === max ? `${min}%` : `${min}–${max}%`;
}

export function VenueCapabilityViewer() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="platform-page-width space-y-6 p-6">
        <div className="space-y-2">
          <h1 className="text-page-title font-semibold tracking-tight">Venue capabilities</h1>
          <p className="text-body text-muted-foreground max-w-2xl">
            View of <code>VenueCapabilityV2</code> from UAC — LTV / haircut per asset, margin
            mode, max leverage, commission structure. Execution-service consults this registry
            before routing every instruction.
          </p>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-xs text-muted-foreground">Venue</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Category</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Routing mode</TableHead>
                  <TableHead className="text-xs text-muted-foreground">LTV range</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Margin</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Max leverage</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Commission</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_VENUE_CAPABILITIES.map((v) => (
                  <TableRow key={v.venue} className="border-border/30" data-testid={`venue-${v.venue}`}>
                    <TableCell>
                      <p className="font-medium">{v.display_name}</p>
                      <p className="text-[10px] text-muted-foreground">{v.venue}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {v.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{v.routing_mode}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {formatLtvRange(v.collateral_rules.per_asset_ltv)}
                    </TableCell>
                    <TableCell className="text-xs">{v.margin.default_mode}</TableCell>
                    <TableCell className="font-mono text-xs">{v.margin.max_leverage}x</TableCell>
                    <TableCell className="text-xs">{formatCommission(v.commission)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
