"use client";

import * as React from "react";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { WatchlistPanel, type WatchlistDefinition, type WatchlistSymbol } from "@/components/trading/watchlist-panel";
import { WatchlistInstrumentPicker, type PickableInstrument } from "@/components/trading/watchlist-instrument-picker";
import { useTerminalData } from "./terminal-data-context";
import { SYSTEM_WATCHLISTS } from "@/lib/api/system-watchlists";
import { useUserWatchlists } from "@/hooks/use-user-watchlists";

/**
 * Terminal watchlist widget.
 *
 * Merges:
 *   - System-curated lists shipped with the app (read-only).
 *   - User-defined lists stored in localStorage (CRUD).
 * Looks up each instrument_key against the live-universe records the
 * page already loaded, so per-symbol metadata (venue, name) is fresh
 * without re-fetching.
 */
export function TerminalWatchlistWidget(_props: WidgetComponentProps) {
  const { instruments, selectedInstrument, setSelectedInstrument } = useTerminalData();
  const userLists = useUserWatchlists();

  // Build a fast lookup from instrument_key → minimal display row.
  // The full live universe lives on `instruments` already.
  const universeByKey = React.useMemo(() => {
    const m = new Map<string, (typeof instruments)[number]>();
    for (const i of instruments) m.set(i.instrumentKey, i);
    return m;
  }, [instruments]);

  // Resolve a list of instrument_keys → WatchlistSymbol[]. Drops keys
  // that aren't in the current live universe (e.g. a system-list pin
  // that was published yesterday but isn't tradeable today).
  const resolveSymbols = React.useCallback(
    (keys: readonly string[]): WatchlistSymbol[] => {
      const out: WatchlistSymbol[] = [];
      for (const k of keys) {
        const inst = universeByKey.get(k);
        if (!inst) continue;
        out.push({
          id: inst.instrumentKey,
          symbol: inst.symbol,
          name: inst.name,
          price: inst.midPrice,
          change24h: inst.change,
          category: inst.venue,
        });
      }
      return out;
    },
    [universeByKey],
  );

  // Compose the WatchlistDefinition[] in display order: system first,
  // then user. Each user list resolves through the same universeByKey
  // so symbols share metadata + tickers automatically.
  const watchlists = React.useMemo<WatchlistDefinition[]>(() => {
    const sys = SYSTEM_WATCHLISTS.map((wl) => ({
      id: wl.id,
      label: wl.label,
      type: "system" as const,
      symbols: resolveSymbols(wl.instrument_keys),
    }));
    const usr = userLists.lists.map((wl) => ({
      id: wl.id,
      label: wl.label,
      type: "user" as const,
      symbols: resolveSymbols(wl.instrument_keys),
    }));
    return [...sys, ...usr];
  }, [resolveSymbols, userLists.lists]);

  // Default to the first system list if nothing has been picked yet.
  const [activeListId, setActiveListId] = React.useState<string>(() => SYSTEM_WATCHLISTS[0]?.id ?? "");

  // Reconcile if the active list disappears (e.g. user deletes it).
  React.useEffect(() => {
    if (!watchlists.find((w) => w.id === activeListId)) {
      setActiveListId(watchlists[0]?.id ?? "");
    }
  }, [watchlists, activeListId]);

  const onSelectSymbol = React.useCallback(
    (sym: WatchlistSymbol) => {
      const inst = universeByKey.get(sym.id);
      if (inst) setSelectedInstrument(inst);
    },
    [universeByKey, setSelectedInstrument],
  );

  // ── User-list CRUD bindings ──
  const handleCreateList = React.useCallback(
    (label: string) => {
      const id = userLists.create(label);
      setActiveListId(id);
    },
    [userLists],
  );

  const handleRenameList = React.useCallback(
    (id: string, label: string) => {
      userLists.rename(id, label);
    },
    [userLists],
  );

  const handleDeleteList = React.useCallback(
    (id: string) => {
      userLists.remove(id);
      // The reconcile effect above will switch activeListId on its own.
    },
    [userLists],
  );

  const handleRemoveSymbol = React.useCallback(
    (symbolId: string) => {
      userLists.removeSymbol(activeListId, symbolId);
    },
    [userLists, activeListId],
  );

  // ── Picker modal ──
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const universe: PickableInstrument[] = React.useMemo(
    () =>
      instruments.map((i) => ({
        instrumentKey: i.instrumentKey,
        symbol: i.symbol,
        venue: i.venue,
        assetGroup: i.category,
      })),
    [instruments],
  );
  const activeUserList = userLists.lists.find((l) => l.id === activeListId);
  const alreadyIncluded = activeUserList?.instrument_keys ?? [];
  const remainingSlots = activeUserList
    ? Math.max(0, userLists.maxSymbolsPerList - activeUserList.instrument_keys.length)
    : 0;

  const handleAddSymbolClick = React.useCallback(() => {
    setPickerOpen(true);
  }, []);

  const handlePick = React.useCallback(
    (instrumentKey: string) => {
      try {
        userLists.addSymbol(activeListId, instrumentKey);
      } catch {
        // Already at cap — UI should have prevented this, but defend.
      }
      setPickerOpen(false);
    },
    [userLists, activeListId],
  );

  return (
    <>
      <WatchlistPanel
        watchlists={watchlists}
        activeListId={activeListId}
        onListChange={setActiveListId}
        selectedSymbolId={selectedInstrument.instrumentKey}
        onSelectSymbol={onSelectSymbol}
        maxSymbolsPerList={userLists.maxSymbolsPerList}
        onAddSymbolClick={handleAddSymbolClick}
        onRemoveSymbol={handleRemoveSymbol}
        onCreateList={handleCreateList}
        onRenameList={handleRenameList}
        onDeleteList={handleDeleteList}
        className="h-full min-h-[200px]"
      />
      <WatchlistInstrumentPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        universe={universe}
        alreadyIncluded={alreadyIncluded}
        remainingSlots={remainingSlots}
        onPick={handlePick}
      />
    </>
  );
}
