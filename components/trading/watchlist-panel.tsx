"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Star, StarOff, ChevronRight, Plus, X, MoreVertical, Trash2, Pencil, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

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
  /**
   * "system" lists ship with the app and are read-only — no add/remove/rename/delete.
   * "user" lists are user-created (currently localStorage, Firestore later) and
   * support the full edit surface.
   */
  type?: "system" | "user";
  symbols: WatchlistSymbol[];
}

interface WatchlistPanelProps {
  /** All available watchlists (system + user, in display order). */
  watchlists: WatchlistDefinition[];
  /** Currently active watchlist id */
  activeListId: string;
  onListChange: (id: string) => void;
  /** Currently selected symbol id */
  selectedSymbolId?: string;
  onSelectSymbol: (sym: WatchlistSymbol) => void;
  /** Hard cap on symbols per user list (e.g. 50). Used for the "+ Add" button state and footer counter. */
  maxSymbolsPerList?: number;

  // ── User-list lifecycle (called only on `type: "user"` lists) ──
  /** Open the picker modal to add an instrument to the active list. */
  onAddSymbolClick?: () => void;
  /** Remove a symbol from the active user list. */
  onRemoveSymbol?: (symbolId: string) => void;
  /** Create a new empty user list and switch to it. */
  onCreateList?: (label: string) => void;
  /** Rename an existing user list. */
  onRenameList?: (id: string, label: string) => void;
  /** Delete a user list. */
  onDeleteList?: (id: string) => void;
  /** @deprecated retained for backwards compat with options-watchlist-widget. */
  editable?: boolean;

  className?: string;
}

// ---------- Formatting helpers ----------

function formatPrice(price: number, symbol: string): string {
  if (price >= 1000) return price.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (price >= 10) return formatNumber(price, 2);
  return formatNumber(price, 4);
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
  maxSymbolsPerList,
  onAddSymbolClick,
  onRemoveSymbol,
  onCreateList,
  onRenameList,
  onDeleteList,
  className,
}: WatchlistPanelProps) {
  const [query, setQuery] = React.useState("");
  const [starred, setStarred] = React.useState<Set<string>>(new Set());

  // Inline create / rename UI state
  const [creatingNew, setCreatingNew] = React.useState(false);
  const [newListName, setNewListName] = React.useState("");
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState("");

  const activeList = watchlists.find((w) => w.id === activeListId) ?? watchlists[0];
  const isUserList = activeList?.type === "user";
  const cap = maxSymbolsPerList ?? Infinity;
  const atCap = isUserList && activeList ? activeList.symbols.length >= cap : false;

  // Group lists by type for the dropdown render. Order is preserved
  // within each group; system always renders above user.
  const systemLists = watchlists.filter((w) => w.type !== "user");
  const userLists = watchlists.filter((w) => w.type === "user");

  const filtered = React.useMemo(() => {
    const q = query.toLowerCase();
    return (activeList?.symbols ?? []).filter(
      (s) =>
        s.symbol.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        (s.category ?? "").toLowerCase().includes(q),
    );
  }, [activeList, query]);

  function toggleStar(id: string) {
    setStarred((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function commitCreate() {
    const trimmed = newListName.trim();
    if (!trimmed) {
      setCreatingNew(false);
      setNewListName("");
      return;
    }
    onCreateList?.(trimmed);
    setNewListName("");
    setCreatingNew(false);
  }

  function commitRename(id: string) {
    const trimmed = renameValue.trim();
    if (trimmed) onRenameList?.(id, trimmed);
    setRenamingId(null);
    setRenameValue("");
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
            {systemLists.length > 0 && (
              <SelectGroup>
                <SelectLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                  System
                </SelectLabel>
                {systemLists.map((wl) => (
                  <SelectItem key={wl.id} value={wl.id} className="text-xs">
                    {wl.label}
                    <span className="ml-1.5 text-muted-foreground">({wl.symbols.length})</span>
                  </SelectItem>
                ))}
              </SelectGroup>
            )}
            {systemLists.length > 0 && userLists.length > 0 && <SelectSeparator />}
            {userLists.length > 0 && (
              <SelectGroup>
                <SelectLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                  My Lists
                </SelectLabel>
                {userLists.map((wl) => (
                  <SelectItem key={wl.id} value={wl.id} className="text-xs">
                    {wl.label}
                    <span className="ml-1.5 text-muted-foreground">({wl.symbols.length})</span>
                  </SelectItem>
                ))}
              </SelectGroup>
            )}
            {/* "+ Create new watchlist" footer — outside groups so the
                separator above it is visually intentional. */}
            {onCreateList && (
              <>
                {(systemLists.length > 0 || userLists.length > 0) && <SelectSeparator />}
                <div
                  className="px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer flex items-center gap-1.5"
                  onClick={(e) => {
                    // Prevent the Select from closing on this click.
                    e.preventDefault();
                    e.stopPropagation();
                    setCreatingNew(true);
                  }}
                  // Same for keyboard activation
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setCreatingNew(true);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <Plus className="size-3" />
                  Create new watchlist
                </div>
              </>
            )}
          </SelectContent>
        </Select>

        {/* Inline create input — appears when "Create new watchlist" is clicked. */}
        {creatingNew && (
          <div className="flex items-center gap-1">
            <Input
              autoFocus
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitCreate();
                if (e.key === "Escape") {
                  setCreatingNew(false);
                  setNewListName("");
                }
              }}
              placeholder="New watchlist name"
              maxLength={30}
              className="h-7 text-xs flex-1"
            />
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={commitCreate}>
              <Check className="size-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => {
                setCreatingNew(false);
                setNewListName("");
              }}
            >
              <X className="size-3" />
            </Button>
          </div>
        )}

        {/* Active-list header for user lists — rename / delete affordances */}
        {isUserList && activeList && !creatingNew && (
          <div className="flex items-center justify-between gap-1">
            {renamingId === activeList.id ? (
              <div className="flex items-center gap-1 flex-1">
                <Input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename(activeList.id);
                    if (e.key === "Escape") {
                      setRenamingId(null);
                      setRenameValue("");
                    }
                  }}
                  maxLength={30}
                  className="h-6 text-xs flex-1"
                />
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => commitRename(activeList.id)}>
                  <Check className="size-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => {
                    setRenamingId(null);
                    setRenameValue("");
                  }}
                >
                  <X className="size-3" />
                </Button>
              </div>
            ) : (
              <>
                <span className="text-[10px] text-muted-foreground truncate flex-1">
                  {activeList.symbols.length} / {cap === Infinity ? "—" : cap}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-5 w-5 p-0">
                      <MoreVertical className="size-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="text-xs">
                    {onRenameList && (
                      <DropdownMenuItem
                        className="text-xs gap-2"
                        onClick={() => {
                          setRenamingId(activeList.id);
                          setRenameValue(activeList.label);
                        }}
                      >
                        <Pencil className="size-3" />
                        Rename
                      </DropdownMenuItem>
                    )}
                    {onDeleteList && (
                      <DropdownMenuItem
                        className="text-xs gap-2 text-red-400"
                        onClick={() => {
                          if (confirm(`Delete "${activeList.label}"?`)) onDeleteList(activeList.id);
                        }}
                      >
                        <Trash2 className="size-3" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        )}

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
          {filtered.length === 0 && (
            <p className="text-[11px] text-muted-foreground text-center py-4">
              {isUserList && activeList?.symbols.length === 0
                ? "Search instruments and add them with + Add. (0 / " + (cap === Infinity ? "—" : cap) + ")"
                : "No symbols"}
            </p>
          )}
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

                {/* Symbol + name + venue. Same canonical symbol (e.g. BTC-USDT)
                    is listed on 8+ CeFi exchanges; venue badge is the only
                    way the user can distinguish them in the watchlist. */}
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
                    {sym.category && (
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1 py-0 h-4 border-muted-foreground/30 text-muted-foreground font-mono"
                        title={`Venue: ${sym.category}`}
                      >
                        {sym.category}
                      </Badge>
                    )}
                    {sym.iv !== undefined && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-amber-500/30 text-amber-400">
                        IV {formatPercent(sym.iv, 0)}
                      </Badge>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate leading-tight">{sym.name}</div>
                </div>

                {/* Price + change. Always shown, even when 0/0 — that's a
                    deliberate signal that the instrument has no ticker, so
                    the operator can spot instrument↔market-data drift. */}
                <div className="shrink-0 text-right">
                  <div className="text-xs font-mono font-medium">{formatPrice(sym.price, sym.symbol)}</div>
                  <div className={cn("text-[10px] font-mono", changeColor(sym.change24h))}>
                    {sym.change24h > 0 ? "+" : ""}
                    {formatPercent(sym.change24h, 2)}
                  </div>
                </div>

                {/* Per-row × on hover — only on user lists. System rows
                    show the chevron (chart-link affordance) instead. */}
                {isUserList && onRemoveSymbol ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveSymbol(sym.id);
                    }}
                    title="Remove from this list"
                    className="size-3 shrink-0 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="size-3" />
                  </button>
                ) : (
                  <ChevronRight
                    className={cn(
                      "size-3 shrink-0 text-muted-foreground transition-opacity",
                      isSelected ? "opacity-100 text-primary" : "opacity-0 group-hover:opacity-50",
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer — symbol count + "+ Add" for user lists */}
      <div className="px-2 py-1.5 border-t flex items-center justify-between text-[10px] text-muted-foreground">
        <span>
          {filtered.length} {filtered.length === 1 ? "symbol" : "symbols"}
          {isUserList && cap !== Infinity && ` / ${cap}`}
        </span>
        {isUserList && onAddSymbolClick && (
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-1.5 text-[10px]"
            disabled={atCap}
            title={atCap ? `Limit reached — ${cap} max per list` : "Add an instrument"}
            onClick={onAddSymbolClick}
          >
            <Plus className="size-3 mr-0.5" />
            Add
          </Button>
        )}
      </div>
    </div>
  );
}
