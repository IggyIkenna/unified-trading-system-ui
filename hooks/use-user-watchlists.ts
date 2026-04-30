"use client";

/**
 * User-defined watchlists — CRUD against localStorage today, Firestore later.
 *
 * Why localStorage and not Firestore today: Firestore wiring needs schema +
 * security rules + a separate batch of work. localStorage gets us a
 * working UX in one file. The hook's API shape mirrors what a Firestore
 * collection would look like (`list`, `create`, `rename`, `delete`,
 * `addSymbol`, `removeSymbol`) so swapping the backing store is a one-file
 * change. Tracked as an open follow-up in the watchlist plan.
 *
 * Storage key: `user-watchlists:v1:{userId}` — JSON array of UserWatchlist.
 * The `v1` versions the schema like `live-universe:v{N}` does, so a future
 * shape bump auto-evicts pre-bump entries.
 *
 * Caps:
 *   - 50 instruments per list (enforced in `addSymbol`).
 *   - No cap on number of lists, but UI may want to surface one if it
 *     becomes a problem.
 */

import * as React from "react";
import { AuthContext } from "@/hooks/use-auth";

const SCHEMA_VERSION = 1;
const MAX_SYMBOLS_PER_LIST = 50;

export interface UserWatchlist {
  /** Stable ID, generated at create time. Used as the dropdown `value`. */
  id: string;
  /** User-supplied name. Trimmed, ≤ 30 chars. */
  label: string;
  /** Always "user" for these. */
  type: "user";
  /** Canonical instrument_keys, in user-specified order (newest at end). */
  instrument_keys: string[];
  /** ISO timestamp at create time. */
  created_at: string;
  /** ISO timestamp of last modification. */
  updated_at: string;
}

export interface UserWatchlistsApi {
  /** All user watchlists for the current user, in creation order. */
  lists: readonly UserWatchlist[];
  /** Create a new empty watchlist. Returns the new list's id. */
  create: (label: string) => string;
  /** Rename an existing list. No-op if id not found. */
  rename: (id: string, label: string) => void;
  /** Delete a list. No-op if id not found. */
  remove: (id: string) => void;
  /** Add an instrument_key to a list. Throws if at the 50-cap. */
  addSymbol: (id: string, instrumentKey: string) => void;
  /** Remove an instrument_key from a list. */
  removeSymbol: (id: string, instrumentKey: string) => void;
  /** Hard cap exposed so UI can disable "+ Add" + show tooltip. */
  readonly maxSymbolsPerList: number;
}

function storageKey(userId: string): string {
  return `user-watchlists:v${SCHEMA_VERSION}:${userId}`;
}

function readStorage(userId: string): UserWatchlist[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    // Defensive: drop entries that don't match the shape (e.g. legacy data)
    return parsed.filter(
      (e): e is UserWatchlist =>
        typeof e === "object" &&
        e !== null &&
        typeof (e as UserWatchlist).id === "string" &&
        typeof (e as UserWatchlist).label === "string" &&
        Array.isArray((e as UserWatchlist).instrument_keys),
    );
  } catch {
    return [];
  }
}

function writeStorage(userId: string, lists: UserWatchlist[]): void {
  if (typeof window === "undefined") return;
  // Evict prior-version entries for this user so localStorage doesn't drift.
  try {
    for (let i = window.localStorage.length - 1; i >= 0; i--) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith("user-watchlists:") && !key.startsWith(`user-watchlists:v${SCHEMA_VERSION}:`)) {
        window.localStorage.removeItem(key);
      }
    }
    window.localStorage.setItem(storageKey(userId), JSON.stringify(lists));
  } catch {
    // Quota / storage disabled — proceed without persisting. The in-memory
    // state still reflects the change for the rest of the session.
  }
}

function newId(): string {
  // crypto.randomUUID is widely available; fall back for older runtimes.
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `wl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function useUserWatchlists(): UserWatchlistsApi {
  // Read AuthContext directly instead of `useAuth()` so this hook also
  // works in test harnesses / pre-auth pages where no AuthProvider has
  // mounted yet. In that case the user is "anonymous" and any saved
  // lists migrate the moment the user signs in (different storage key,
  // but same hook).
  const auth = React.useContext(AuthContext);
  const userId = auth?.user?.id ?? "anonymous";

  const [lists, setLists] = React.useState<UserWatchlist[]>([]);

  // Hydrate from storage on mount + when user changes.
  React.useEffect(() => {
    setLists(readStorage(userId));
  }, [userId]);

  // Cross-tab sync — listen for storage events. If another tab edits the
  // same user's watchlists, this tab updates without a refresh.
  React.useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === storageKey(userId)) {
        setLists(readStorage(userId));
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [userId]);

  const persist = React.useCallback(
    (next: UserWatchlist[]) => {
      writeStorage(userId, next);
      setLists(next);
    },
    [userId],
  );

  const create = React.useCallback(
    (label: string): string => {
      const trimmed = label.trim().slice(0, 30) || "Untitled";
      const id = newId();
      const ts = nowIso();
      const entry: UserWatchlist = {
        id,
        label: trimmed,
        type: "user",
        instrument_keys: [],
        created_at: ts,
        updated_at: ts,
      };
      persist([...lists, entry]);
      return id;
    },
    [lists, persist],
  );

  const rename = React.useCallback(
    (id: string, label: string) => {
      const trimmed = label.trim().slice(0, 30);
      if (!trimmed) return;
      persist(lists.map((l) => (l.id === id ? { ...l, label: trimmed, updated_at: nowIso() } : l)));
    },
    [lists, persist],
  );

  const remove = React.useCallback(
    (id: string) => {
      persist(lists.filter((l) => l.id !== id));
    },
    [lists, persist],
  );

  const addSymbol = React.useCallback(
    (id: string, instrumentKey: string) => {
      const target = lists.find((l) => l.id === id);
      if (!target) return;
      if (target.instrument_keys.includes(instrumentKey)) return; // dedupe
      if (target.instrument_keys.length >= MAX_SYMBOLS_PER_LIST) {
        // The UI is responsible for blocking this earlier (disabled "+ Add"
        // at cap), but defend the data layer too.
        throw new Error(`Watchlist full (max ${MAX_SYMBOLS_PER_LIST} symbols per list)`);
      }
      persist(
        lists.map((l) =>
          l.id === id ? { ...l, instrument_keys: [...l.instrument_keys, instrumentKey], updated_at: nowIso() } : l,
        ),
      );
    },
    [lists, persist],
  );

  const removeSymbol = React.useCallback(
    (id: string, instrumentKey: string) => {
      persist(
        lists.map((l) =>
          l.id === id
            ? { ...l, instrument_keys: l.instrument_keys.filter((k) => k !== instrumentKey), updated_at: nowIso() }
            : l,
        ),
      );
    },
    [lists, persist],
  );

  return React.useMemo<UserWatchlistsApi>(
    () => ({
      lists,
      create,
      rename,
      remove,
      addSymbol,
      removeSymbol,
      maxSymbolsPerList: MAX_SYMBOLS_PER_LIST,
    }),
    [lists, create, rename, remove, addSymbol, removeSymbol],
  );
}
