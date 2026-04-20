# UX Operating Rules

Hard rules. No essays. Drift from these is a bug.

## A. Same page, different permissions

No separate client/internal page versions unless structurally unavoidable.
Same page, scoped data, gated actions.
Entitlement controls visibility; role controls actions.

## B. Batch/live is structural

Not a cosmetic toggle.
Same entity scope must support batch/live comparison where the domain requires it.
Comparison means: same strategy, same model version, same execution config, same org scope.

## C. Research family is one family

Strategy, ML, and Execution Research share one interaction grammar:
shortlist → compare → inspect → package → handoff.
Same batch workspace shell. Same candidate basket. Same comparison components.

## D. Service hub is the foyer

All non-deep-link logins land on the service hub.
Hub shows: what's available, what's locked, what's degraded, what's next.
Locked feels premium, not broken.

## E. Taxonomy drift is a bug

One canonical name per concept. All names come from `lib/taxonomy.ts`.
No page invents its own category language.
No conflicting service names, lifecycle names, or archetype names.

## F. Provenance and freshness are required

Any serious metric needs: source, as-of timestamp, freshness indicator.
Stale data must be visually distinct from fresh data.
