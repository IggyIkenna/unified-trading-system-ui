# Module N — UTC Datetime Rendering Audit

_Replaces the previous "Internationalization Readiness (i18n)" module. i18n was retired on 2026-04-21 (product decision: English-only UI). This module now enforces UTC as the default display timezone for datetime rendering, anticipating a future user-preference toggle that swaps UTC for local time via a shared formatter._

## Search Patterns

1. `toLocaleDateString` / `toLocaleTimeString` / `toLocaleString` calls without an explicit `{ timeZone: "UTC" }` option.
2. `new Date().toString()` / `.toDateString()` / `.toTimeString()` used in render paths (implicit local-time rendering).
3. `Intl.DateTimeFormat` constructed without `timeZone: "UTC"`.
4. Raw timestamps rendered into JSX with no formatter wrapper.

## Ripgrep Commands

```bash
rg -n "toLocaleDateString\(|toLocaleTimeString\(|toLocaleString\(" components/ app/ | rg -v 'timeZone:\s*"UTC"'
rg -n "new Date\(.*\)\.toString\(\)|\.toDateString\(\)|\.toTimeString\(\)" components/ app/
rg -n "Intl\.DateTimeFormat" components/ app/ | rg -v 'timeZone:\s*"UTC"'
```

## Fix Actions

- Route all datetime rendering through a shared formatter (`lib/utils/formatters` or equivalent) that defaults to UTC.
- Where `toLocaleString` is intentional, pass `{ timeZone: "UTC" }` explicitly.
- Do not read the browser's local timezone at render time — a future settings toggle will switch the formatter's `tz` argument; until then, UTC is the single source of truth.

## Future Work (out of scope for this audit)

- Settings toggle (`timezone: "UTC" | "local"`) in user profile
- Shared `formatDatetime(ts, tz)` helper that routes off the preference
- Widget sweep to adopt the helper

Until that lands, every displayed timestamp must be UTC. This check catches regressions where a new widget renders local time by accident.
