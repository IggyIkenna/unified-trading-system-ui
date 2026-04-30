# Live-universe fixtures

Static snapshots of `GET /instruments/live-universe?asset_group={cefi,tradfi,defi}`
served from a real backend boot (`bash scripts/dev-tiers.sh --tier 1 --real`).
Mock mode reads these instead of hitting the backend so we don't have to keep a
Python service alive for watchlist development.

## Files

Two-tier setup so the repo stays small while devs can opt into the full universe:

| File                 | Status               | Asset group | Instruments | Size    |
| -------------------- | -------------------- | ----------- | ----------- | ------- |
| `cefi.sample.json`   | **checked in**       | CeFi        | ~60         | ~30 KB  |
| `tradfi.sample.json` | **checked in**       | TradFi      | ~60         | ~30 KB  |
| `defi.sample.json`   | **checked in**       | DeFi        | ~60         | ~30 KB  |
| `cefi.json`          | gitignored, optional | CeFi        | ~3,690      | ~1.4 MB |
| `tradfi.json`        | gitignored, optional | TradFi      | ~14,202     | ~5.3 MB |
| `defi.json`          | gitignored, optional | DeFi        | ~3,473      | ~1.4 MB |

`mock-handler.ts` imports the `*.sample.json` files. They contain every
`instrument_key` referenced by the system watchlists plus ~30 extras per
group, so the watchlist works out of the box on a fresh clone.

To use the full ~21K-instrument universe locally (for example to test the
"+ Add" picker against the real catalogue), download the full files via the
script below — they're gitignored so they don't bloat the repo. To switch
the imports over locally, copy `cefi.json` → `cefi.sample.json` (etc.) on
your machine; gitignore protects against committing the swap.

`as_of` (the date the **data** is from) is the most recent date
instruments-service had published shards for at the time the fixtures were
captured (2026-04-14 for the snapshots taken on 2026-04-30).

## When to refresh

Refresh when any of these change:

- The instruments-service writes a new schema version (new fields on each
  row) — UI consumers may need the new fields.
- A new venue is onboarded (new chain, new exchange) and the watchlist
  search index needs to know about it.
- The `LIVE_UNIVERSE_SCHEMA_VERSION` constant in
  `hooks/api/use-instruments.ts` is bumped — that signals a server-side
  shape change.

Day-to-day instrument churn (new symbols, expired derivatives) does NOT
require a refresh — the fixtures are good enough for UI development.

## How to refresh

```bash
# 1. Boot the backend in real mode against a project with current data:
bash scripts/dev-tiers.sh --tier 1 --real

# 2. Wait until /health is 200, then snapshot all three asset groups:
DEST=lib/mocks/fixtures/live-universe
for g in cefi tradfi defi; do
  curl -s --max-time 60 \
    "http://localhost:8030/instruments/live-universe?asset_group=$g" \
    -o "$DEST/$g.json"
done

# 3. Sanity-check counts:
for f in $DEST/*.json; do
  echo "$f: $(python3 -c "import json; print(len(json.load(open('$f'))['data']))") instruments"
done

# 4. Regenerate the *.sample.json checked-in files (one-liner — keeps every
#    system-watchlist key plus 50 extras per group):
python3 - <<'PY'
import json, pathlib
DEST = pathlib.Path("lib/mocks/fixtures/live-universe")
SYS_KEYS = set()
for f in (DEST.parent / "system-watchlists").glob("*.json"):
    SYS_KEYS.update(json.loads(f.read_text()).get("instrument_keys", []))
for g in ("cefi", "tradfi", "defi"):
    full = json.loads((DEST / f"{g}.json").read_text())
    sys_rows = [r for r in full["data"] if r["instrument_key"] in SYS_KEYS]
    other = [r for r in full["data"] if r["instrument_key"] not in SYS_KEYS][:50]
    sample = {**full, "data": sys_rows + other}
    (DEST / f"{g}.sample.json").write_text(json.dumps(sample, indent=2))
    print(f"  {g}.sample.json: {len(sample['data'])} rows")
PY

# 5. Commit the *.sample.json changes. Don't commit the full *.json files
#    (they're gitignored).

# 6. Bump LIVE_UNIVERSE_SCHEMA_VERSION in hooks/api/use-instruments.ts
#    if the response shape changed — tells browser caches to evict stale entries.
```

## What's NOT in the fixtures

- **Tickers** (price, change). Mock-handler serves a separate
  `/api/market-data/tickers` route; the watchlist joins the two by
  `symbol`. Today the tickers are synthetic (no real price feed in mock
  mode) so the watchlist's price/change columns show 0 / synthetic.
- **Candles**. Mock-handler serves separate `/api/market-data/candles`
  routes (already wired pre-watchlist).
- **Expired options/futures**. The live-universe endpoint server-side-
  filters those out. Batch-mode chart access for expired contracts goes
  through `/api/instruments/list?as_of=YYYY-MM-DD` (mocked separately).

## Routing

`lib/api/mock-handler.ts` handles `/api/instruments/live-universe` and
returns these fixtures. Look for `LIVE_UNIVERSE_*_FIXTURE` references.
