# System Watchlists

Curated watchlists shipped with the app. Users see these by default;
they can also create their own ("My Watchlists" are stored in
`localStorage` for now and will migrate to Firestore later).

## Files

| ID                | Label           | Asset group | Symbols | Notes                                                                                   |
| ----------------- | --------------- | ----------- | ------- | --------------------------------------------------------------------------------------- |
| `crypto-majors`   | Crypto Majors   | cefi        | 10      | BTC/ETH/SOL across major CeFi venues. Includes chart-tested BTC/ETH on BINANCE-FUTURES. |
| `us-stocks`       | US Stocks       | tradfi      | 10      | NASDAQ/NYSE equities. Includes chart-tested AAPL/MSFT/GOOGL/JPM.                        |
| `defi-blue-chips` | DeFi Blue Chips | defi        | 10      | Uniswap V3 pools, Aave a-tokens, Lido stETH, Curve. Ethereum-only.                      |

## Schema

```ts
{
  id: string;                  // stable identifier, kebab-case
  label: string;               // human-readable name shown in UI
  type: "system";              // discriminator vs user lists
  asset_group: "cefi" | "tradfi" | "defi";
  description: string;         // ~1 line, shown in tooltips
  instrument_keys: string[];   // canonical UAC instrument_keys
}
```

`instrument_keys` are validated against the live-universe fixtures
at build time of these files. If a key drops out of the live
universe (instruments-service stops publishing it), the watchlist
silently skips it at render time — no broken UI.

## How to add a new system watchlist

1. Pick instrument_keys from `lib/mocks/fixtures/live-universe/{group}.json`.
   Confirm each one resolves:
   ```bash
   python3 -c "
   import json
   group = 'tradfi'  # or cefi/defi
   keys = {r['instrument_key'] for r in json.load(open(f'lib/mocks/fixtures/live-universe/{group}.json'))['data']}
   for k in ['NASDAQ:SPOT_PAIR:AAPL', 'NYSE:ETF:SPY']:
       print(k, '✓' if k in keys else 'MISSING')
   "
   ```
2. Create `lib/mocks/fixtures/system-watchlists/{id}.json` matching the schema above.
3. Register in `lib/api/system-watchlists.ts` (static import + the
   exported list).
4. Add a row to the table above.

## How to refresh existing system watchlists

Same as adding — just edit the JSON. The list is loaded at runtime
from these files so changes hot-reload during dev.

## What's NOT in here

- **User watchlists.** Stored in `localStorage` keyed
  `user-watchlists:{userId}`. See `hooks/use-user-watchlists.ts`.
- **Live tickers** (price/change). Joined onto each row at render
  time from the tickers feed. Watchlist shows 0/0 when ticker is
  missing — useful as a signal for instrument↔market-data misalignment.
- **Per-symbol metadata** (venue, type) — pulled from the
  live-universe fixtures by `instrument_key` lookup at render time,
  not duplicated here.
