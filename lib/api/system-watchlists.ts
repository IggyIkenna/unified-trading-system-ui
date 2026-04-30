/**
 * System watchlists — curated, shipped-with-app, read-only.
 *
 * These are the default watchlists every user sees. Mirror of how
 * TradingView ships "BTC Top Picks" and Bloomberg ships "WORLD
 * MOST ACTIVE". Users can't edit them; they create their own
 * (see `hooks/use-user-watchlists.ts`).
 *
 * Source: `lib/mocks/fixtures/system-watchlists/*.json`. Static-imported
 * at module load; bundled into the JS payload. Lookups against
 * the live-universe happen at render time so stale `instrument_keys`
 * (instrument no longer published by instruments-service) gracefully
 * drop out instead of breaking the UI.
 */

import CRYPTO_MAJORS from "@/lib/mocks/fixtures/system-watchlists/crypto-majors.json";
import DEFI_BLUE_CHIPS from "@/lib/mocks/fixtures/system-watchlists/defi-blue-chips.json";
import US_STOCKS from "@/lib/mocks/fixtures/system-watchlists/us-stocks.json";

export interface SystemWatchlist {
  /** Stable ID, kebab-case. Used as the dropdown's `value`. */
  id: string;
  /** Human-readable label shown in the dropdown and panel header. */
  label: string;
  /** Always "system" for these. User lists carry "user". */
  type: "system";
  /** Primary asset group these instruments belong to. */
  asset_group: "cefi" | "tradfi" | "defi";
  /** One-line description, shown on hover. */
  description: string;
  /** Canonical instrument_keys; resolved against the live universe at render time. */
  instrument_keys: string[];
}

/**
 * Order matters — this is the order shown in the watchlist dropdown.
 * CeFi first because it's the most active asset group on most desks;
 * TradFi second; DeFi last because it's the most niche.
 */
export const SYSTEM_WATCHLISTS: readonly SystemWatchlist[] = [
  CRYPTO_MAJORS as SystemWatchlist,
  US_STOCKS as SystemWatchlist,
  DEFI_BLUE_CHIPS as SystemWatchlist,
];
