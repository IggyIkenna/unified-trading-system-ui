# Module K — Code Organization & File Structure Audit

## Search Patterns

1. Files > 500 lines — should be split
2. Files > 900 lines — must be split (per quality gates)
3. Components with mixed concerns (data fetching + rendering + state)
4. Barrel exports (`index.ts`) — are they complete and correct?
5. Import paths: `@/` aliases used consistently?
6. Circular dependencies between modules
7. Dead code: exported functions/components with zero imports
8. `archive/` folder contents — still imported anywhere?
