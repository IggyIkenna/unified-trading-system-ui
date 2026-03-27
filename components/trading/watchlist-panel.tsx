"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Star, StarOff, ChevronRight, Plus, X } from "lucide-react";

// ---------- Types ----------

export interface WatchlistSymbol {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume?: number;
  iv?: number;
  category?: string;
  /** extra badge text shown on hover — e.g. "ATM IV: 52%" */
  meta?: string;
}

export interface WatchlistDefinition {
  id: string;
  label: string;
  symbols: WatchlistSymbol[];
}

interface WatchlistPanelProps {
  /** All available watchlists */
  watchlists: WatchlistDefinition[];
  /** Currently active watchlist id */
  activeListId: string;
  onListChange: (id: string) => void;
  /** Currently selected symbol id */
  selectedSymbolId?: string;
  onSelectSymbol: (sym: WatchlistSymbol) => void;
  /** Allow adding to / removing from current list */
  editable?: boolean;
  className?: string;
}

// ---------- Formatting helpers ----------

function formatPrice(price: number, symbol: string): string {
  if (price >= 1000) return price.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (price >= 10) return price.toFixed(2);
  return price.toFixed(4);
}

function changeColor(chg: number): string {
  if (chg > 0) return "text-emerald-400";
  if (chg < 0) return "text-red-400";
  return "text-muted-foreground";
}

// ---------- Component ----------

export function WatchlistPanel({
  watchlists,
  activeListId,
  onListChange,
  selectedSymbolId,
  onSelectSymbol,
  editable = false,
  className,
}: WatchlistPanelProps) {
  const [query, setQuery] = React.useState("");
  const [starred, setStarred] = React.useState<Set<string>>(new Set());

  const activeList = watchlists.find((w) => w.id === activeListId) ?? watchlists[0];

  const filtered = React.useMemo(() => {
    const q = query.toLowerCase();
    return (activeList?.symbols ?? []).filter(
      (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q),
    );
  }, [activeList, query]);

  function toggleStar(id: string) {
    setStarred((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className={cn("flex flex-col h-full bg-background border-r", className)}>
      {/* List selector */}
      <div className="px-2 pt-2 pb-1.5 border-b space-y-1.5">
        <Select value={activeListId} onValueChange={onListChange}>
          <SelectTrigger className="h-7 text-xs w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {watchlists.map((wl) => (
              <SelectItem key={wl.id} value={wl.id} className="text-xs">
                {wl.label}
                <span className="ml-1.5 text-muted-foreground">({wl.symbols.length})</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter…"
            className="h-7 pl-6 text-xs"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      </div>

      {/* Symbol list */}
      <ScrollArea className="flex-1">
        <div className="py-0.5">
          {filtered.length === 0 && <p className="text-[11px] text-muted-foreground text-center py-4">No symbols</p>}
          {filtered.map((sym) => {
            const isSelected = sym.id === selectedSymbolId;
            const isStarred = starred.has(sym.id);
            return (
              <div
                key={sym.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectSymbol(sym)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectSymbol(sym);
                  }
                }}
                className={cn(
                  "w-full flex items-center gap-1.5 px-2 py-1.5 text-left group cursor-pointer",
                  "hover:bg-muted/40 transition-colors",
                  isSelected && "bg-primary/10 border-l-2 border-primary",
                )}
              >
                {/* Star */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStar(sym.id);
                  }}
                  className={cn(
                    "shrink-0 opacity-0 group-hover:opacity-100 transition-opacity",
                    isStarred && "opacity-100",
                  )}
                >
                  {isStarred ? (
                    <Star className="size-3 text-amber-400 fill-amber-400" />
                  ) : (
                    <StarOff className="size-3 text-muted-foreground" />
                  )}
                </button>

                {/* Symbol + name */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span
                      className={cn(
                        "text-xs font-mono font-semibold truncate",
                        isSelected ? "text-primary" : "text-foreground",
                      )}
                    >
                      {sym.symbol}
                    </span>
                    {sym.iv !== undefined && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-amber-500/30 text-amber-400">
                        IV {sym.iv.toFixed(0)}%
                      </Badge>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate leading-tight">{sym.name}</div>
                </div>

                {/* Price + change */}
                <div className="shrink-0 text-right">
                  <div className="text-xs font-mono font-medium">{formatPrice(sym.price, sym.symbol)}</div>
                  <div className={cn("text-[10px] font-mono", changeColor(sym.change24h))}>
                    {sym.change24h > 0 ? "+" : ""}
                    {sym.change24h.toFixed(2)}%
                  </div>
                </div>

                {/* Arrow indicator when selected */}
                <ChevronRight
                  className={cn(
                    "size-3 shrink-0 text-muted-foreground transition-opacity",
                    isSelected ? "opacity-100 text-primary" : "opacity-0 group-hover:opacity-50",
                  )}
                />
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer stats */}
      <div className="px-2 py-1.5 border-t flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{filtered.length} symbols</span>
        {editable && (
          <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px]">
            <Plus className="size-3 mr-0.5" />
            Add
          </Button>
        )}
      </div>
    </div>
  );
}
