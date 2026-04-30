"use client";

/**
 * Typeahead modal for adding instruments to a user watchlist.
 *
 * Sources from the in-memory live-universe index passed as `universe` —
 * cefi+tradfi+defi merged ~21K rows. Pure client-side fuzzy match so
 * no network round-trips per keystroke. Already-included keys are
 * filtered out and shown disabled.
 */

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PickableInstrument {
  /** Canonical instrument_key — e.g. "NASDAQ:SPOT_PAIR:AAPL" */
  instrumentKey: string;
  /** Display symbol, usually `raw_symbol` from the live universe */
  symbol: string;
  /** Venue, shown as a badge for disambiguation (BTC-USDT lives on 8 venues) */
  venue: string;
  /** Asset group (cefi/tradfi/defi) — used for filtering and tinting */
  assetGroup?: string;
  /** Instrument type (SPOT_PAIR / PERPETUAL / OPTION / POOL / …) */
  instrumentType?: string;
}

interface WatchlistInstrumentPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Full universe to search across. Caller passes pre-filtered if needed. */
  universe: readonly PickableInstrument[];
  /** Already-included keys — these render disabled. */
  alreadyIncluded: readonly string[];
  /** Hard cap on how many can be added (e.g. 50 - alreadyIncluded.length). */
  remainingSlots: number;
  /** Called when user picks an instrument. Caller is responsible for cap. */
  onPick: (instrumentKey: string) => void;
  /** Optional title override — defaults to "Add to watchlist". */
  title?: string;
}

const MAX_RENDER = 100; // virtualization budget — render top N matches only

export function WatchlistInstrumentPicker({
  open,
  onOpenChange,
  universe,
  alreadyIncluded,
  remainingSlots,
  onPick,
  title = "Add to watchlist",
}: WatchlistInstrumentPickerProps) {
  const [query, setQuery] = React.useState("");
  const includedSet = React.useMemo(() => new Set(alreadyIncluded), [alreadyIncluded]);

  // Reset query when modal opens to avoid stale state
  React.useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  const matches = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Empty query → show first MAX_RENDER, biased to non-included
      return universe.slice(0, MAX_RENDER);
    }
    // Substring match across symbol, instrument_key, venue. Scored:
    //   exact-prefix on symbol = 3, prefix on key = 2, contains = 1
    type Scored = { item: PickableInstrument; score: number };
    const scored: Scored[] = [];
    for (const item of universe) {
      const s = item.symbol.toLowerCase();
      const k = item.instrumentKey.toLowerCase();
      const v = item.venue.toLowerCase();
      let score = 0;
      if (s.startsWith(q)) score = 3;
      else if (k.startsWith(q.toUpperCase().toLowerCase())) score = 2;
      else if (s.includes(q) || k.includes(q) || v.includes(q)) score = 1;
      if (score > 0) scored.push({ item, score });
      if (scored.length > MAX_RENDER * 4) break; // bound work
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, MAX_RENDER).map((s) => s.item);
  }, [universe, query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="text-sm">{title}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Search across {universe.length.toLocaleString()} instruments. {remainingSlots} slots remaining.
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Symbol, venue, or canonical key…"
              className="h-8 pl-7 text-xs font-mono"
            />
          </div>
        </div>

        <ScrollArea className="h-[420px] border-t">
          <div className="py-1">
            {matches.length === 0 && <p className="text-[11px] text-muted-foreground text-center py-6">No matches</p>}
            {matches.map((item) => {
              const isIncluded = includedSet.has(item.instrumentKey);
              const isDisabled = isIncluded || remainingSlots <= 0;
              return (
                <button
                  key={item.instrumentKey}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => onPick(item.instrumentKey)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs",
                    "hover:bg-muted/50 transition-colors",
                    "disabled:opacity-40 disabled:cursor-not-allowed",
                  )}
                >
                  <span className="font-mono font-semibold text-foreground truncate min-w-0 flex-1">{item.symbol}</span>
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1 py-0 h-4 border-muted-foreground/30 text-muted-foreground font-mono shrink-0"
                  >
                    {item.venue}
                  </Badge>
                  {item.instrumentType && (
                    <Badge
                      variant="outline"
                      className="text-[9px] px-1 py-0 h-4 border-muted-foreground/20 text-muted-foreground/70 shrink-0"
                    >
                      {item.instrumentType}
                    </Badge>
                  )}
                  {isIncluded && <span className="text-[9px] text-muted-foreground shrink-0">already in list</span>}
                </button>
              );
            })}
            {matches.length === MAX_RENDER && (
              <p className="text-[10px] text-muted-foreground text-center py-2">
                Showing top {MAX_RENDER}. Refine search to narrow.
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
