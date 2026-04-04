# Module N — Internationalization Readiness (i18n) Audit

**Output:** `docs/UI-shared-components-Issues/14-I18N-AUDIT.md`

## Search Patterns

1. Hardcoded English strings in JSX (user-visible text not in a constants file or i18n system)
2. Date/time formatting: using `date-fns` / `Intl` consistently? Or hardcoded formats?
3. Number formatting: using `Intl.NumberFormat` or a shared formatter? Or inline `.toFixed()`?
4. Currency formatting: consistent across P&L, positions, reports?
5. Pluralization: hardcoded "1 item" / "N items" vs dynamic?
6. RTL readiness: using `start`/`end` vs `left`/`right` in layout?
