"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ExecutionNav } from "@/components/execution-platform/execution-nav";
import { useVenues } from "@/hooks/api/use-orders";
import { ApiError } from "@/components/shared/api-error";
import { Spinner } from "@/components/shared/spinner";
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Zap,
  TrendingUp,
  BarChart3,
  Globe,
  RefreshCw,
} from "lucide-react";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

export default function ExecutionVenuesPage() {
  const { data: venuesData, isLoading, error: venuesError, refetch: refetchVenues } = useVenues();
  const MOCK_VENUES: Array<any> = (venuesData as any)?.data ?? [];

  // Venue routing matrix derived from API response or fallback
  const VENUE_MATRIX: { instrument: string; venues: Array<any> } = (venuesData as any)?.routingMatrix ?? {
    instrument: "ETH-PERP",
    venues: MOCK_VENUES.slice(0, 5).map((v: any) => ({
      venueId: v.id ?? "",
      spread: v.quality?.avgSpread ?? 0,
      bidDepth: v.volume?.bidDepth ?? 0,
      askDepth: v.volume?.askDepth ?? 0,
      fillProb: v.quality?.fillRate ?? 0,
      score: v.quality?.score ?? 0,
    })),
  };

  const [selectedInstrument, setSelectedInstrument] = React.useState("ETH-PERP");

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <Spinner size="lg" className="text-muted-foreground" />
      </div>
    );
  }

  if (venuesError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="platform-page-width px-6 py-3">
            <ExecutionNav />
          </div>
        </div>
        <div className="platform-page-width p-6">
          <ApiError
            error={venuesError as Error}
            onRetry={() => void refetchVenues()}
            title="Failed to load venue data"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="platform-page-width px-6 py-3">
          <ExecutionNav />
        </div>
      </div>

      <div className="platform-page-width p-6 space-y-6">
        <PageHeader
          title={
            <span className="flex items-center gap-3">
              <Building2 className="size-6" />
              Venue Matrix
            </span>
          }
          description="Real-time venue comparison for optimal order routing"
        >
          <Select value={selectedInstrument} onValueChange={setSelectedInstrument}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ETH-PERP">ETH-PERP</SelectItem>
              <SelectItem value="BTC-PERP">BTC-PERP</SelectItem>
              <SelectItem value="SOL-PERP">SOL-PERP</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 size-4" />
            Refresh
          </Button>
        </PageHeader>

        {/* Venue Status Grid */}
        {MOCK_VENUES.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <p className="text-sm text-muted-foreground text-center">
                No venues available. Venue connections will appear here once configured.
              </p>
            </CardContent>
          </Card>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {MOCK_VENUES.map((venue) => (
            <Card key={venue.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "size-2 rounded-full",
                        venue.connectivity.status === "connected" && "bg-emerald-500",
                        venue.connectivity.status === "degraded" && "bg-amber-500",
                        venue.connectivity.status === "disconnected" && "bg-red-500",
                      )}
                    />
                    <span className="font-medium">{venue.name}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {venue.type}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Latency</span>
                    <span className="font-mono">{venue.connectivity.latency}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fill Rate</span>
                    <span className="font-mono">{venue.quality.fillRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Slippage</span>
                    <span className="font-mono">{venue.quality.avgSlippage} bps</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Maker Fee</span>
                    <span className="font-mono">{venue.capabilities.makerFee} bps</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Venue Comparison Matrix */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Routing Matrix: {VENUE_MATRIX.instrument}</CardTitle>
            <CardDescription>Best execution venue selection based on current market conditions</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Venue</TableHead>
                  <TableHead className="text-right">Spread</TableHead>
                  <TableHead className="text-right">Bid Depth</TableHead>
                  <TableHead className="text-right">Ask Depth</TableHead>
                  <TableHead className="text-right">Fill Probability</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Recommendation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {VENUE_MATRIX.venues
                  .sort((a, b) => b.score - a.score)
                  .map((v, i) => {
                    const venue = MOCK_VENUES.find((mv) => mv.id === v.venueId);
                    return (
                      <TableRow key={v.venueId}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "size-2 rounded-full",
                                venue?.connectivity.status === "connected" && "bg-emerald-500",
                                venue?.connectivity.status === "degraded" && "bg-amber-500",
                              )}
                            />
                            <span className="font-medium">{venue?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">{formatPercent(v.spread, 3)}</TableCell>
                        <TableCell className="text-right font-mono">${formatNumber(v.bidDepth / 1e6, 2)}M</TableCell>
                        <TableCell className="text-right font-mono">${formatNumber(v.askDepth / 1e6, 2)}M</TableCell>
                        <TableCell className="text-right font-mono">{v.fillProb}%</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={v.score} className="h-2 w-16" />
                            <span className="font-mono text-sm">{v.score}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {i === 0 ? (
                            <Badge className="bg-emerald-500">Primary</Badge>
                          ) : i === 1 ? (
                            <Badge variant="outline" className="text-blue-500">
                              Secondary
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">Backup</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Venue Details */}
        <div className="grid grid-cols-2 gap-6">
          {/* Quality Metrics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quality Metrics</CardTitle>
              <CardDescription>Historical execution quality by venue</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Venue</TableHead>
                    <TableHead className="text-right">P50 Latency</TableHead>
                    <TableHead className="text-right">P99 Latency</TableHead>
                    <TableHead className="text-right">Reject Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_VENUES.map((venue) => (
                    <TableRow key={venue.id}>
                      <TableCell className="font-medium">{venue.name}</TableCell>
                      <TableCell className="text-right font-mono">{venue.quality.latencyP50}ms</TableCell>
                      <TableCell className="text-right font-mono">{venue.quality.latencyP99}ms</TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-mono",
                          venue.quality.rejectRate > 0.5 ? "text-amber-500" : "text-emerald-500",
                        )}
                      >
                        {venue.quality.rejectRate}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Fee Comparison */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Fee Structure</CardTitle>
              <CardDescription>Trading fees by venue</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Venue</TableHead>
                    <TableHead className="text-right">Maker Fee</TableHead>
                    <TableHead className="text-right">Taker Fee</TableHead>
                    <TableHead className="text-right">Max Order</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_VENUES.map((venue) => (
                    <TableRow key={venue.id}>
                      <TableCell className="font-medium">{venue.name}</TableCell>
                      <TableCell
                        className={cn("text-right font-mono", venue.capabilities.makerFee === 0 && "text-emerald-500")}
                      >
                        {venue.capabilities.makerFee} bps
                      </TableCell>
                      <TableCell className="text-right font-mono">{venue.capabilities.takerFee} bps</TableCell>
                      <TableCell className="text-right font-mono">
                        ${formatNumber(venue.capabilities.maxOrderSize / 1e6, 0)}M
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Market Share */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Market Share</CardTitle>
            <CardDescription>Volume distribution across connected venues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-8 rounded-lg overflow-hidden flex">
                {MOCK_VENUES.sort((a, b) => b.volume.marketShare - a.volume.marketShare).map((venue, i) => {
                  const colors = ["bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500", "bg-red-500"];
                  return (
                    <div
                      key={venue.id}
                      className={cn("h-full", colors[i % colors.length])}
                      style={{ width: `${venue.volume.marketShare}%` }}
                      title={`${venue.name}: ${venue.volume.marketShare}%`}
                    />
                  );
                })}
              </div>
            </div>
            <div className="flex flex-wrap gap-4 mt-4">
              {MOCK_VENUES.sort((a, b) => b.volume.marketShare - a.volume.marketShare).map((venue, i) => {
                const colors = ["bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500", "bg-red-500"];
                return (
                  <div key={venue.id} className="flex items-center gap-2">
                    <div className={cn("size-3 rounded", colors[i % colors.length])} />
                    <span className="text-sm">{venue.name}</span>
                    <span className="text-sm text-muted-foreground">{venue.volume.marketShare}%</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
