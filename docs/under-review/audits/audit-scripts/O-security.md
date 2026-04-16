# Module O — Security Patterns Audit

**Output:** `docs/UI-shared-components-Issues/15-SECURITY-AUDIT.md`

## Search Patterns

1. `dangerouslySetInnerHTML` usage — is input sanitized?
2. User input rendered without escaping
3. API keys / secrets in client-side code (`.env` vars with `NEXT_PUBLIC_` that shouldn't be public)
4. `eval()` or `new Function()` usage
5. External URLs opened without `rel="noopener noreferrer"`
6. Form submissions: CSRF protection?
7. Auth token handling: stored in localStorage (vulnerable) vs httpOnly cookie?
