"use client";

import * as React from "react";
import { useCallback, useRef, useState, useMemo } from "react";
import { Radio, WifiOff, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGlobalScope } from "@/lib/stores/global-scope-store";
import {
  useSignalStream,
  type SignalStreamEvent,
} from "@/hooks/api/use-sse-channels";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils/formatters";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_FEED_SIZE = 100;

// ---------------------------------------------------------------------------
// Mock signal generator for demo mode
// ---------------------------------------------------------------------------

const MOCK_STRATEGY_IDS = [
  "trend-follow-v3",
  "mean-rev-btc",
  "funding-arb-v2",
  "stat-arb-eth",
  "liq-hunter-v1",
  "defi-flow-v1",
  "vol-surface-v1",
  "momentum-crypto-v2",
];

const MOCK_INSTRUMENTS = [
  "BTC-USDT",
  "ETH-USDT",
  "SOL-USDT",
  "AVAX-USDT",
  "ARB-USDT",
  "MATIC-USDT",
  "DOGE-USDT",
  "LINK-USDT",
];

function generateMockSignals(): SignalStreamEvent[] {
  return Array.from({ length: 20 }, (_, i) => ({
    signal_id: `sig-mock-${i}`,
    strategy_id: MOCK_STRATEGY_IDS[i % MOCK_STRATEGY_IDS.length],
    instrument: MOCK_INSTRUMENTS[i % MOCK_INSTRUMENTS.length],
    direction: (i % 2 === 0 ? "BUY" : "SELL") as "BUY" | "SELL",
    confidence: Math.round((0.4 + Math.random() * 0.6) * 100) / 100,
    features: {},
    timestamp: new Date(Date.now() - i * 15_000).toISOString(),
  }));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function confidenceColor(confidence: number): string {
  if (confidence >= 0.8) return "[&>div]:bg-emerald-500";
  if (confidence >= 0.5) return "[&>div]:bg-amber-500";
  return "[&>div]:bg-red-500";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LiveSignalFeed() {
  const { scope } = useGlobalScope();
  const isLive = scope.mode === "live";

  const [signalFeed, setSignalFeed] = useState<SignalStreamEvent[]>([]);
  const [filterText, setFilterText] = useState("");
  const seenIdsRef = useRef<Set<string>>(new Set());

  const handleMessage = useCallback((event: SignalStreamEvent) => {
    // Deduplicate by signal_id
    if (seenIdsRef.current.has(event.signal_id)) return;
    seenIdsRef.current.add(event.signal_id);

    // Cap the seen-IDs set
    if (seenIdsRef.current.size > MAX_FEED_SIZE * 2) {
      const entries = [...seenIdsRef.current];
      seenIdsRef.current = new Set(entries.slice(entries.length - MAX_FEED_SIZE));
    }

    // Ring buffer: newest first, cap at MAX_FEED_SIZE
    setSignalFeed((prev) => [event, ...prev].slice(0, MAX_FEED_SIZE));
  }, []);

  const mockGenerator = useCallback(generateMockSignals, []);

  const { isConnected } = useSignalStream({
    enabled: isLive,
    onMessage: handleMessage,
    mockGenerator,
  });

  // Clear feed when switching away from live mode
  React.useEffect(() => {
    if (!isLive) {
      setSignalFeed([]);
      seenIdsRef.current.clear();
    }
  }, [isLive]);

  // Filter signals by strategy_id or instrument
  const filteredSignals = useMemo(() => {
    if (!filterText) return signalFeed;
    const lower = filterText.toLowerCase();
    return signalFeed.filter(
      (s) =>
        s.strategy_id.toLowerCase().includes(lower) ||
        s.instrument.toLowerCase().includes(lower),
    );
  }, [signalFeed, filterText]);

  // -- Batch mode placeholder --
  if (!isLive) {
    return (
      <Card className="bg-card/50">
        <CardContent className="p-8 text-center">
          <WifiOff className="size-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Live signals not available in batch mode
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Switch to Live mode to see the real-time signal stream
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Radio className="size-4 text-emerald-400 animate-pulse" />
              Live Signal Stream
            </CardTitle>
            <CardDescription>
              Real-time strategy signals via SSE ({signalFeed.length} buffered)
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "gap-1.5",
              isConnected
                ? "text-emerald-400 border-emerald-400/40"
                : "text-red-400 border-red-400/40",
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                isConnected ? "bg-emerald-400" : "bg-red-400",
              )}
            />
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
        {/* Filter input */}
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Filter by strategy or instrument..."
            className="pl-8 h-8 text-sm"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredSignals.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {signalFeed.length === 0
              ? "Waiting for signals..."
              : "No signals match the current filter"}
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden max-h-[480px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Time</TableHead>
                  <TableHead>Strategy</TableHead>
                  <TableHead>Instrument</TableHead>
                  <TableHead className="text-center w-[80px]">Direction</TableHead>
                  <TableHead className="w-[160px]">Confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSignals.map((signal) => (
                  <TableRow key={signal.signal_id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatTimestamp(signal.timestamp)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {signal.strategy_id}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {signal.instrument}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          signal.direction === "BUY"
                            ? "text-emerald-400 border-emerald-400/40"
                            : "text-red-400 border-red-400/40",
                        )}
                      >
                        {signal.direction}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={signal.confidence * 100}
                          className={cn("h-1.5 flex-1", confidenceColor(signal.confidence))}
                        />
                        <span className="font-mono text-xs w-[36px] text-right">
                          {formatNumber(signal.confidence, 2)}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
