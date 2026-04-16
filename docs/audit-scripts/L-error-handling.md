# Module L — Error Handling & Edge Cases Audit

## Search Patterns

1. API error states: do pages handle loading, error, and empty states for every `useQuery`?
2. Missing `Suspense` boundaries
3. Unhandled promise rejections in event handlers
4. `try/catch` around data transformations that could fail
5. `?.` optional chaining — is it used defensively where data could be undefined?
6. Form validation: are all form inputs validated before submission?
7. URL parameter validation: do pages using `useSearchParams` / `useParams` validate inputs?
8. Fallback UI for when components crash (ErrorBoundary)

## Per-Page Checklist

For each page using `useQuery` or data hooks:

- Does it show a loading skeleton/spinner while data loads?
- Does it show an error state with retry button on failure?
- Does it show an empty state when data is empty (not just blank space)?
