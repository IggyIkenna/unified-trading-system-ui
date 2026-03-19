# UI Coding Rules — Quick Reference

**Read `.cursorrules` for the full detailed rules.**
This document is a quick cheat sheet while coding.

---

## The Core Problem These Rules Solve

Without rules, UI codebases tend to:
- ❌ Create `PositionsTableV2`, `PositionsTableRefactored` → two versions of truth
- ❌ Implement filters per-domain → `DataFilter`, `ExecutionFilter`, `ResearchFilter` all different
- ❌ Hardcode API endpoints → `http://localhost:8004/api/execution/positions` scattered everywhere
- ❌ Mock per-page → tests pass, production fails because mock code != real code
- ❌ Duplicate auth logic → admin checks in 5 places, change one rule and miss the others
- ❌ No branding centralization → change the logo color in 50+ places

**These rules prevent all of that.**

---

## Rule 1: Structure by Service Domain

**Organize like the backend organizes:**

```
src/
├── services/                    ← Backend shards: CEFI, DeFi, Sports, TradFi
│   ├── data/
│   ├── execution/               ← Each service domain has own folder
│   ├── research/
│   ├── reporting/
│   └── admin/
│
├── shared/                      ← Shared across all domains
│   ├── components/              ← Filters, tables, headers, modals
│   ├── hooks/                   ← API hooks, useAuth, useBranding
│   ├── config/                  ← API endpoints, branding, constants
│   ├── types/                   ← Shared types
│   └── mocks/                   ← Central mock API (not per-page)
│
└── layout/                      ← Global routing
```

**When refactoring:** Update in place. Don't create V2.

```typescript
// ❌ DON'T
src/pages/PositionsPage.tsx
src/pages/PositionsPageV2.tsx    ← Two versions

// ✅ DO
src/services/execution/pages/PositionsPage.tsx  ← One version, updated in place
```

---

## Rule 2: Shared Components for Common Patterns

**These go to `shared/components/`, used everywhere:**

| Component | Location | Examples |
|-----------|----------|----------|
| Filters | `shared/components/filters/FilterBar.tsx` | Date, shard, venue, symbol filters |
| Headers | `shared/components/headers/MainHeader.tsx` | Logo, org selector, user menu |
| Tables | `shared/components/tables/DataTable.tsx` | Sortable, paginated, filterable |
| Forms | `shared/components/forms/` | Input validation, labels |
| Cards | `shared/components/cards/` | Uniform spacing, shadows |
| Modals | `shared/components/modals/` | Consistent backdrop, animations |

**One implementation, used everywhere:**

```typescript
// ✅ shared/components/filters/FilterBar.tsx
export const FilterBar = ({ filters, onApply, onClear }) => {
  // One filter implementation
  // Used in /data, /execution, /research, etc.
}

// ❌ DON'T: Implement filters per-page
// services/execution/components/ExecutionFilter.tsx (different style)
// services/data/components/DataFilter.tsx (different logic)
```

---

## Rule 3: Centralize All Configuration

**Nothing hardcoded in components. Everything comes from `shared/config/`:**

```typescript
// ✅ shared/config/api.ts
export const API_CONFIG = {
  baseUrl: process.env.REACT_APP_API_BASE_URL,
  services: {
    execution: { baseUrl: '/api/execution', endpoints: { ... } },
    data: { baseUrl: '/api/data', endpoints: { ... } },
  },
};

// ✅ shared/config/branding.ts
export const BRANDING = {
  company: { name: 'Unified Trading System', logo: '/images/logo.svg' },
  colors: { primary: '#1a1a1a', accent: '#00d9ff', ... },
  spacing: { xs: '4px', sm: '8px', ... },
};

// ✅ shared/config/constants.ts
export const PAGINATION = { DEFAULT_PAGE_SIZE: 20, MAX_PAGE_SIZE: 100 };
export const TIMEOUTS = { API_SHORT: 5000, API_MEDIUM: 15000, ... };
export const ERROR_MESSAGES = { FETCH_FAILED: '...', ... };
```

**Use in components:**

```typescript
// ✅ Any component
import { API_CONFIG, BRANDING, PAGINATION } from '@/shared/config';

const Header = () => (
  <header style={{ backgroundColor: BRANDING.colors.primary }}>
    <img src={BRANDING.company.logo} alt={BRANDING.company.name} />
  </header>
);

const PositionsTable = ({ data }) => {
  const [pageSize, setPageSize] = useState(PAGINATION.DEFAULT_PAGE_SIZE);
  // ...
};
```

**DON'T:**

```typescript
// ❌ Hardcoded anywhere
fetch('http://localhost:8004/api/execution/positions')
<header style={{ backgroundColor: '#1a1a1a' }}>
const [pageSize, setPageSize] = useState(20);  // Magic number
```

**Why it matters:**
- Change API base URL? Update `shared/config/api.ts` → done globally
- Change logo? Update `shared/config/branding.ts` → done everywhere
- Change pagination default? One place → easy

---

## Rule 4: Centralized Mock API

**All mocks in `shared/mocks/`, used in both dev and tests:**

```
shared/mocks/
├── api.ts                       ← Mock API setup
├── handlers/
│   ├── execution.ts             ← Execution service mocks
│   ├── data.ts                  ← Data service mocks
│   └── ...
└── fixtures/
    ├── positions.json           ← Mock data
    ├── orders.json
    └── ...
```

**One mock API, same everywhere:**

```typescript
// ✅ shared/mocks/handlers/execution.ts
export const executionHandlers = [
  http.get(`${API_CONFIG.baseUrl}/api/execution/positions`, () => {
    return HttpResponse.json(POSITIONS_FIXTURE);
  }),
];

// Dev environment (main.tsx or vite.config.ts)
if (process.env.REACT_APP_MOCK_API === 'true') {
  mockServer.listen();  // Uses centralized mock API
}

// Tests (setupTests.ts)
beforeAll(() => mockServer.listen());  // Same mock API
```

**Components use same code path regardless:**

```typescript
// ✅ services/execution/hooks/usePositions.ts
export const usePositions = () => {
  return useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const url = `${API_CONFIG.baseUrl}/api/execution/positions`;
      return fetch(url).then(r => r.json());
    },
  });
};

// Works with:
// • Real API (production)
// • Real API (staging, different baseUrl)
// • Mock API (local dev, same endpoint)
// • Mock API (tests, same endpoint)
```

**DON'T:**

```typescript
// ❌ Mock per-component/page
// services/execution/mocks/usePositionsMock.ts
// services/data/mocks/useDataMock.ts
// Each mocks differently → tests pass, production fails
```

---

## Rule 5: API Calls Through Hooks

**All API calls go through `shared/hooks/api/`:**

```typescript
// ✅ shared/hooks/api/useExecutionAPI.ts
export const usePositions = (shard?: string, venue?: string) => {
  return useQuery({
    queryKey: ['positions', shard, venue],
    queryFn: async () => {
      // API call happens here
      // Uses API_CONFIG (not hardcoded)
      // Cached by react-query
      // Error handling built-in
    },
  });
};

// ✅ In any component
const { data, isLoading, error } = usePositions(org.shard);
```

**DON'T:**

```typescript
// ❌ Direct fetch in components
const [positions, setPositions] = useState([]);

useEffect(() => {
  fetch('http://localhost:8004/api/execution/positions')
    .then(r => r.json())
    .then(setPositions);
}, []);
// Problems: no caching, no error handling, hardcoded URL, repeated everywhere
```

---

## Rule 6: Branding & Auth in Shared

**Logo, colors, roles → `shared/config/` and `shared/hooks/useAuth`**

Change logo color once:
```typescript
// shared/config/branding.ts
colors: { primary: '#1a1a1a' }  // Change here → updates everywhere
```

Check permissions once:
```typescript
// ✅ shared/components/headers/MainHeader.tsx
const { role } = useAuth();
{role === 'internal' && <AdminLink />}  // Show if internal

// One place where admin features are gated
// Change the rule? Update one place
```

**DON'T:**

```typescript
// ❌ Colors scattered
// Header.tsx: backgroundColor: '#1a1a1a'
// Card.tsx: borderColor: '#1a1a1a'
// Footer.tsx: backgroundColor: '#1a1a1a'
// Want to change color? Update 50+ places?

// ❌ Permissions scattered
// Header.tsx: role === 'admin' && ...
// Sidebar.tsx: role === 'admin' && ...
// AdminPanel.tsx: role === 'admin' && ...
// Add a new role? Update 10+ places?
```

---

## Rule 7: Refactor in Place, Never Leave Old Code

**When updating a page:**

```typescript
// ✅ Before refactor
<Route path="/positions" element={<PositionsPage />} />

// ✅ During refactor: Update the file itself
// PositionsPage.tsx is updated in place
// Components refactored
// Routes unchanged

// ✅ After refactor: Delete old files
// Remove intermediate files (PositionsPageV2.tsx if you used it)
// Keep ONE PositionsPage.tsx

// Result: Clean route, one version of truth
```

**DON'T:**

```typescript
// ❌ Create multiple versions
<Route path="/positions" element={<PositionsPage />} />          ← Old
<Route path="/positions-v2" element={<PositionsPageV2 />} />    ← New
<Route path="/positions-refactored" element={<...PageRef />} />  ← Trying it out

// Which one is real?
// Traffic split between them
// Confusing for users and developers
// Code bloat
```

---

## Rule 8: No Hardcoded Strings or Magic Numbers

**Use constants for everything:**

```typescript
// ✅ shared/config/constants.ts
export const PAGINATION = { DEFAULT_PAGE_SIZE: 20, MAX_PAGE_SIZE: 100 };
export const TIMEOUTS = { API_SHORT: 5000, API_MEDIUM: 15000 };
export const ERROR_MESSAGES = {
  FETCH_FAILED: 'Failed to fetch data. Please try again.',
  UNAUTHORIZED: 'You do not have permission.',
};

// In components
const [pageSize, setPageSize] = useState(PAGINATION.DEFAULT_PAGE_SIZE);
return alert(ERROR_MESSAGES.FETCH_FAILED);
```

**DON'T:**

```typescript
// ❌ Magic numbers
const [pageSize, setPageSize] = useState(20);        // What is 20?
const timeout = 5000;                               // What timeouts?
return alert('Failed to fetch data. Please try again.');  // Update in 5 places?
```

---

## Checklist Before You Start Coding

- [ ] **Where does this belong?** (Which service domain folder?)
- [ ] **Is there a shared component I can use?** (Filter? Table? Header?)
- [ ] **Are there config values I need?** (From `shared/config/`)
- [ ] **Will I need API data?** (Use `shared/hooks/api/`)
- [ ] **Do I need auth checks?** (Use `useAuth()` from `shared/hooks/`)
- [ ] **Am I hardcoding anything?** (Move to `shared/config/`)
- [ ] **Am I duplicating a component?** (Extract to `shared/components/`)
- [ ] **Am I creating a V2 or Refactored version?** (DON'T. Update in place.)

---

## Common Scenarios

### Scenario 1: Build a New Page for Data Service

```typescript
// 1. Create file in right domain
src/services/data/pages/CatalogPage.tsx

// 2. Find shared components to use
import { FilterBar } from '@/shared/components/filters';
import { DataTable } from '@/shared/components/tables';

// 3. Get config
import { API_CONFIG, BRANDING } from '@/shared/config';

// 4. Use API hook
import { useDataCatalog } from '@/shared/hooks/api';

// 5. Add route
// services/data/routes.tsx
<Route path="/catalog" element={<CatalogPage />} />

// Done. No hardcoding, reusing components, consistent UX.
```

### Scenario 2: Update Filter Style

```typescript
// Old way: Update ExecutionFilter.tsx, DataFilter.tsx, ResearchFilter.tsx
// New way: Update ONE component

// shared/components/filters/FilterBar.tsx
// Change styling
// All pages using FilterBar automatically updated ✓
```

### Scenario 3: Change API Base URL

```typescript
// Old way: Search codebase for 'localhost:8004', update 100 places
// New way: Update one place

// shared/config/api.ts
baseUrl: process.env.REACT_APP_API_BASE_URL  ← Change here
// All API calls use this ✓
```

### Scenario 4: Mock New API for Testing

```typescript
// 1. Add handler
// shared/mocks/handlers/myservice.ts
export const handlers = [
  http.get(`${API_CONFIG.baseUrl}/api/myservice/data`, () => {
    return HttpResponse.json(FIXTURE);
  }),
];

// 2. Export from main mock
// shared/mocks/api.ts
const mockServer = setupServer(...handlers);

// 3. Use in tests (no changes needed)
// Tests automatically use new mock ✓
// Dev environment automatically uses new mock ✓
```

---

## Key Takeaway

**These rules exist to prevent:**

1. ✅ Two versions of truth → One version in place
2. ✅ Scattered duplicate components → Shared component library
3. ✅ Hardcoded values everywhere → Centralized config
4. ✅ Per-page mocking → One mock API everywhere
5. ✅ Scattered auth logic → One `useAuth()` hook
6. ✅ Branding changes in 50+ places → One `shared/config/branding.ts`

**Result:** Coherent, maintainable, easy to update codebase.

**Read `.cursorrules` for the full details on each rule.**

