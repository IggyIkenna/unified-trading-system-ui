# Quality Gate Bypass Audit — odum-research-website

## Active Bypasses

None.

## Historical Bypasses

### MIN_UI_COVERAGE=0 (resolved 2026-03-16)

- **Location**: `scripts/quality-gates.sh`
- **Reason**: Newly integrated repo. Coverage floor set to 0% during initial ramp-up.
- **Resolution**: 101 tests written (mock store, API routes, middleware, access control, admin, components). Coverage at 72%. Floor restored to standard 70%.

## Notes

- Repo integrated into workspace 2026-03-16
- Migrated from datadodo/odum_website (private), git history wiped (API key exposure)
- Next.js 15 + Firebase Auth + Firestore + GCS presentation proxy
- Firebase SDK wrappers (firebaseClient.ts, firebaseAdmin.ts, useAuth.ts) excluded from coverage — always mocked in tests, untestable without Firebase emulator
