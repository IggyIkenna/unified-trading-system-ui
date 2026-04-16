# Module J — Performance Patterns Audit

## Search Patterns

1. Large component files (>500 lines) — candidates for splitting
2. `"use client"` on pages that could be server components
3. Missing `React.memo`, `useMemo`, `useCallback` on expensive renders
4. Unnecessary re-renders: components accepting new object/array refs on every render
5. Image optimization: `<img>` vs `next/image`
6. Dynamic imports / code splitting: `next/dynamic` usage for heavy components
7. Bundle size: are large libraries imported at the top level? (e.g., entire chart libs)
8. `useEffect` with missing or incorrect dependency arrays
9. Inline function definitions in JSX that cause re-renders
10. Components that create new objects/arrays in render without memoization
