"use client";

/**
 * Reports → P&L Attribution → Allocator View subsection (Plan C p3-wire-reports-im-allocator).
 *
 * Allocator picks a strategy instance from the authorised universe and sees
 * the 3-way backtest / paper / live overlay with `per_venue=true` so venue-
 * level degradation is visible. Split mode because IM allocators typically
 * study each regime separately before cross-referencing.
 */

import { useMemo, useState } from "react";

import { PerformanceOverlay } from "@/components/strategy-catalogue/PerformanceOverlay";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { loadStrategyCatalogue, lookupVenueSetVariant } from "@/lib/architecture-v2/lifecycle";

export interface AllocatorStrategyOverlayProps {
  /** When non-null, scopes the strategy picker to the client's subscribed instances. */
  readonly clientId: string | null;
}

export function AllocatorStrategyOverlay({ clientId }: AllocatorStrategyOverlayProps) {
  const catalogue = useMemo(() => loadStrategyCatalogue(), []);
  const [instanceId, setInstanceId] = useState<string>(() => catalogue[0]?.instanceId ?? "");

  const instance = catalogue.find((c) => c.instanceId === instanceId);

  return (
    <Card data-testid="allocator-strategy-overlay">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-base">Allocator View</CardTitle>
            <CardDescription>
              Backtest / paper / live overlay per strategy instance, sliced by venue.
              Use to diagnose venue-level execution drift before rebalancing allocations.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-[10px]">
            {clientId ? `Client: ${clientId}` : "All clients"}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Select value={instanceId} onValueChange={setInstanceId}>
            <SelectTrigger className="w-[320px]" data-testid="allocator-instance-select">
              <SelectValue placeholder="Select a strategy instance" />
            </SelectTrigger>
            <SelectContent>
              {catalogue.map((c) => (
                <SelectItem key={c.instanceId} value={c.instanceId}>
                  <span className="font-mono text-xs">{c.instanceId}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {instance ? (
            <>
              <Badge variant="secondary" className="font-mono text-[10px]">
                {instance.family}
              </Badge>
              <Badge variant="secondary" className="font-mono text-[10px]">
                {instance.archetype}
              </Badge>
              <Badge variant="outline" className="font-mono text-[10px]">
                {lookupVenueSetVariant(instance.venueSetVariantId)?.label ?? instance.venueSetVariantId}
              </Badge>
            </>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {instanceId ? (
          <PerformanceOverlay
            instanceId={instanceId}
            mode="split"
            views={["backtest", "paper", "live"]}
            perVenue
            heightClass="h-44"
            showPhaseMarkers
            showStats
            showViewToggles
          />
        ) : (
          <p className="text-xs text-muted-foreground">
            Pick a strategy instance to view venue-level performance.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
