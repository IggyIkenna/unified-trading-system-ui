# Frontend Primer for Backend Engineers

> **Last verified: 2026-04-17**
> **Audience:** Python backend engineers joining the UI codebase for the first time.
> **Goal:** Read this once (~15 min), then explore the code with confidence.
> **Assumption:** You are comfortable with Python, REST APIs, and backend architecture.
> You have some exposure to React/Angular/JS but the frontend ecosystem still feels foreign.

---

## Table of Contents

1. [The Mental Model Shift](#1-the-mental-model-shift)
2. [JavaScript and TypeScript](#2-javascript-and-typescript)
3. [React — the Foundation](#3-react--the-foundation)
4. [Next.js — the Framework](#4-nextjs--the-framework)
5. [How This Codebase is Structured](#5-how-this-codebase-is-structured)
6. [The Data Layer — How the UI Gets Its Data](#6-the-data-layer--how-the-ui-gets-its-data)
7. [Styling — Tailwind CSS](#7-styling--tailwind-css)
8. [Testing — Vitest and Testing Library](#8-testing--vitest-and-testing-library)
9. [Key Files at the Project Root](#9-key-files-at-the-project-root)
10. [Naming Conventions](#10-naming-conventions)
11. [Vocabulary Glossary](#11-vocabulary-glossary)
12. [The Golden Rules for This Codebase](#12-the-golden-rules-for-this-codebase)
13. [Where to Look for What](#13-where-to-look-for-what)

---

## 1. The Mental Model Shift

### "Isn't Next.js a backend framework?"

Sort of — but not really. This is the single most common confusion for backend engineers.

**React** renders UI components in the browser. It is purely frontend — no server, no routing, no data fetching strategy built in.

**Next.js** (this repo runs 16.2.1) is a framework built on top of React that adds:

- A file-system-based router (no router config file)
- The ability to run some code on a server (Node.js) before the browser loads the page
- Automatic code splitting, image optimisation, and build tooling

The "server-side" capability in Next.js is **not a replacement for your Python backend**. In this codebase, the Python backend is a separate system. Next.js is the UI layer only — it fetches data from Python APIs and renders it. The occasional server-side Next.js code exists for things like authentication checks or initial data loading, not business logic.

### The browser is stateful in a way servers are not

In Python backend work, each HTTP request is largely independent. A request comes in, you handle it, you return a response, and you forget about it. The server holds no per-user memory between requests (unless you use sessions or a DB).

The browser is the opposite. It holds state continuously — the user is sitting there, clicking things, navigating pages — and you need to keep the UI in sync with that state at all times. This is why state management is a big topic in frontend: managing "what does the UI currently know and show" is genuinely hard at scale.

### Python → JavaScript analogy map

| Python concept                 | JavaScript/Frontend equivalent             |
| ------------------------------ | ------------------------------------------ |
| `pyproject.toml`               | `package.json`                             |
| `uv.lock`                      | `pnpm-lock.yaml`                           |
| `.venv/`                       | `node_modules/`                            |
| `uv pip install`               | `pnpm install`                             |
| `pytest`                       | Vitest                                     |
| `pytest.ini` / `[tool.pytest]` | `vitest.config.ts`                         |
| `basedpyright`                 | TypeScript compiler (`tsc`)                |
| `ruff`                         | ESLint                                     |
| FastAPI `@app.get("/path")`    | `app/(platform)/services/trading/page.tsx` |
| Pydantic model                 | TypeScript `interface` or `type`           |
| Python `dict`                  | JavaScript `object` (`{}`)                 |
| Python `list`                  | JavaScript `array` (`[]`)                  |
| `f"Hello {name}"`              | `` `Hello ${name}` `` (template literal)   |
| `async def` / `await`          | `async function` / `await`                 |
| `None`                         | `null` or `undefined`                      |
| `__init__.py` barrel export    | `index.ts` barrel export                   |
| Jinja2 templates               | React components (JSX)                     |
| `.env`                         | `.env.local`                               |

---

## 2. JavaScript and TypeScript

### Why TypeScript?

JavaScript has no type system. TypeScript adds static types on top of JavaScript. This project is entirely TypeScript — you will never write raw `.js` files for source code (only config files use `.js`).

TypeScript syntax you will see constantly:

```typescript
// Type annotation — like Python's type hints
const price: number = 100.5;
const symbol: string = "BTC/USD";
const isLive: boolean = true;

// Interface — like a Pydantic model, but compile-time only (no validation at runtime)
interface Position {
  id: string;
  symbol: string;
  quantity: number;
  unrealized_pnl: number;
}

// Union type — like Python's Union[str, None] or str | None
type Status = "OPEN" | "FILLED" | "CANCELLED";

// Optional field — the ? means it can be undefined
interface User {
  email: string;
  role?: string; // may or may not be present
}

// Generic type — like Python's Generic[T]
interface ApiResponse<T> {
  data: T;
  timestamp: string;
}

// Type for a function — parameters and return type
type FilterFn = (item: Position) => boolean;
```

### Key JavaScript patterns you will encounter

```typescript
// Destructuring — extract fields from an object (very common in React)
const { symbol, quantity, unrealized_pnl } = position;
// Equivalent Python: symbol, quantity = position["symbol"], position["quantity"]

// Spread operator — clone or merge objects/arrays
const updated = { ...position, quantity: 200 };
// Equivalent Python: { **position, "quantity": 200 }

// Arrow functions — anonymous functions (used everywhere)
const double = (x: number) => x * 2;
// Equivalent Python: double = lambda x: x * 2

// Optional chaining — safely access nested properties
const name = user?.org?.name; // returns undefined instead of throwing if org is null
// Equivalent Python: getattr(getattr(user, "org", None), "name", None)

// Nullish coalescing — default value when null/undefined
const label = user?.name ?? "Anonymous";
// Equivalent Python: user.name if user and user.name is not None else "Anonymous"

// Array methods (use these instead of for loops)
const symbols = positions.map((p) => p.symbol); // transform each item
const open = positions.filter((p) => p.status === "OPEN"); // keep matching items
const total = positions.reduce((sum, p) => sum + p.pnl, 0); // accumulate
```

---

## 3. React — the Foundation

### What is a component?

A React component is a function that returns UI. That's it. It's written in **JSX** — a syntax that looks like HTML embedded in JavaScript.

```tsx
// A simple component
function PriceTag({ price, currency }: { price: number; currency: string }) {
  return (
    <div className="text-green-500 font-bold">
      {currency} {price.toFixed(2)}
    </div>
  );
}

// Using it in another component
function PositionCard({ position }: { position: Position }) {
  return (
    <div>
      <h2>{position.symbol}</h2>
      <PriceTag price={position.current_price} currency="USD" />
    </div>
  );
}
```

The `{}` inside JSX is "escape to JavaScript" — anything inside curly braces is evaluated as a JavaScript expression. The `className` is the JSX equivalent of HTML's `class` attribute (because `class` is a reserved word in JavaScript).

### Props — passing data down

Components receive data through **props** (short for properties). Props are like function arguments.

```tsx
// Parent passes data to child via props
<PriceTag price={100.5} currency="USD" />;

// Child receives them as a single object
function PriceTag({ price, currency }: { price: number; currency: string }) {
  // price = 100.5, currency = "USD"
}
```

**Key rule:** Data flows **down** through props (parent → child). It never flows up automatically. If a child needs to tell a parent something happened, you pass a callback function as a prop.

### State — component memory

`useState` gives a component its own memory that persists across re-renders.

```tsx
"use client"; // required for any component that uses useState
import { useState } from "react";

function VenueFilter() {
  const [selectedVenue, setSelectedVenue] = useState("All"); // initial value is "All"

  return (
    <select
      value={selectedVenue}
      onChange={(e) => setSelectedVenue(e.target.value)} // update state on change
    >
      <option value="All">All Venues</option>
      <option value="Binance">Binance</option>
      <option value="Kraken">Kraken</option>
    </select>
  );
}
```

When `setSelectedVenue` is called, React re-renders the component with the new value. This is the core reactive loop.

### Hooks — reusable stateful logic

A **hook** is a function whose name starts with `use`. Hooks let you share stateful logic between components without copying code.

```typescript
// Custom hook — encapsulates the "are we on mobile?" logic
function useMobile() {
  const [isMobile, setIsMobile] = useState(false)
  // ... resize listener logic
  return isMobile
}

// Use it in any component
function Sidebar() {
  const isMobile = useMobile()
  if (isMobile) return null
  return <nav>...</nav>
}
```

Built-in hooks you will see constantly (React 19.2.4):

| Hook          | What it does                                              | Python analogy                     |
| ------------- | --------------------------------------------------------- | ---------------------------------- |
| `useState`    | Component-local memory                                    | An instance variable on a class    |
| `useEffect`   | Run code when something changes (fetching, subscriptions) | Background thread / event listener |
| `useContext`  | Read from a shared context without passing props          | A module-level singleton           |
| `useRef`      | Hold a value that doesn't trigger re-renders              | A mutable object attribute         |
| `useMemo`     | Cache an expensive computed value                         | `@functools.lru_cache`             |
| `useCallback` | Cache a function reference                                | Memoising a lambda                 |

### The `"use client"` directive

Next.js defaults all components to **Server Components** — they run only on the server. If a component needs `useState`, `useEffect`, browser APIs, or event handlers, you must add `"use client"` as the very first line.

```tsx
"use client"; // ← this component runs in the browser

import { useState } from "react";

export function FilterBar() {
  const [venue, setVenue] = useState("All");
  // ...
}
```

Components without `"use client"` are Server Components. They can `await` data directly but cannot use any browser APIs or stateful hooks.

---

## 4. Next.js — the Framework

### File-system routing

There is **no router configuration file**. The folder structure inside `app/` is the router.

```
app/
├── page.tsx                         →  renders at  /
├── (public)/
│   └── login/
│       └── page.tsx                 →  renders at  /login
├── (platform)/
│   └── services/
│       └── trading/
│           ├── page.tsx             →  renders at  /services/trading
│           └── positions/
│               └── page.tsx         →  renders at  /services/trading/positions
```

### The reserved filenames

Next.js gives special meaning to certain filenames. You cannot use them for other purposes:

| Filename        | Purpose                                                        |
| --------------- | -------------------------------------------------------------- |
| `page.tsx`      | The page component — what renders at that URL                  |
| `layout.tsx`    | Wraps all pages inside its folder — persists across navigation |
| `loading.tsx`   | Shown while `page.tsx` is loading data                         |
| `error.tsx`     | Shown when `page.tsx` throws an error                          |
| `not-found.tsx` | Shown for 404s                                                 |
| `route.ts`      | An API endpoint with no UI (like a FastAPI route)              |

### Route groups — the `(name)` folders

Folders wrapped in parentheses are **route groups**. They organise files without creating a URL segment. The `(platform)` in the path does not appear in the URL.

```
app/
├── (public)/          ← group: not in URL — landing, login, marketing
│   └── login/
│       └── page.tsx   →  /login  (not /(public)/login)
├── (platform)/        ← group: not in URL — signed-in app surface
│   └── services/
│       └── page.tsx   →  /services  (not /(platform)/services)
├── (ops)/             ← group: not in URL — internal/admin/devops/compliance
│   └── admin/
│       └── page.tsx   →  /admin
```

Route groups exist so each section can have its own `layout.tsx` — its own shell, auth wrapper, and navigation style.

### `layout.tsx` — the most important pattern

A `layout.tsx` wraps every page inside its folder. When the user navigates between pages in the same layout, the layout stays mounted — only the page content swaps. This is how the sidebar and header persist without re-rendering.

```
app/
├── (platform)/
│   ├── layout.tsx            ← this wraps EVERYTHING below
│   ├── services/
│   │   ├── trading/
│   │   │   └── page.tsx      ← rendered inside (platform)/layout.tsx
│   │   └── data/
│   │       └── page.tsx      ← also rendered inside the same layout
```

The layout receives `children` — a React prop representing whatever `page.tsx` rendered:

```tsx
export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <UnifiedShell>{children}</UnifiedShell> {/* page.tsx renders where {children} is */}
    </RequireAuth>
  );
}
```

### Dynamic routes — `[param]`

Square brackets in a folder name create a dynamic route segment — equivalent to FastAPI's path parameters.

```
strategies/[id]/page.tsx    →   /strategies/strat-001
                                /strategies/strat-002
```

Inside the component, you get the value via `params`:

```tsx
export default function StrategyDetailPage({ params }: { params: { id: string } }) {
  const strategyId = params.id; // "strat-001"
  // fetch data for this strategy...
}
```

---

## 5. How This Codebase is Structured

The project has four main source folders. Everything else is config.

```
app/          ← Routes (pages + layouts)
components/   ← Reusable React components
hooks/        ← Custom hooks (data fetching + utilities)
lib/          ← Everything non-component: types, stores, config, mocks, utilities
```

### The three route groups

| Group         | URL paths                          | Who sees it                          | Auth                  |
| ------------- | ---------------------------------- | ------------------------------------ | --------------------- |
| `(public)/`   | `/`, `/login`, `/services/*`, etc. | Anyone (unauthenticated landing)     | None                  |
| `(platform)/` | `/dashboard`, `/services/*`        | Logged-in users (internal + clients) | Required              |
| `(ops)/`      | `/admin`, `/devops`, `/compliance` | Internal operators only              | Required + role check |

**The key insight:** Internal users and client users see **the same platform pages**. There is no separate "client portal" built from different components. What changes is the data the API returns — scoped by the user's organisation and subscription entitlements. The same `PositionsTable` component renders for both; it just gets different rows.

### Inside `components/`

Components are organised by domain:

| Folder            | What lives here                                                                    |
| ----------------- | ---------------------------------------------------------------------------------- |
| `ui/`             | 57 base primitives (Button, Card, Table, Dialog, Badge, Input) — no business logic |
| `shell/`          | App shells, site header, auth guard (`RequireAuth`), lifecycle nav                 |
| `trading/`        | Trading-domain components — P&L, orders, risk, strategy controls                   |
| `platform/`       | Platform-wide components — global filters, health bar, activity feed               |
| `dashboards/`     | Role-specific assembled dashboards (Trader, Quant, Risk, Executive)                |
| `ops/deployment/` | Deployment console components                                                      |
| `data/`           | Data subscription manager, shard catalogue, freshness heatmap                      |
| `ml/`             | ML loss curves, ML navigation                                                      |
| `marketing/`      | Landing page visualisations                                                        |

**Note:** `context-bar.tsx` exists in both `trading/` and `platform/`. They are different components. Always import from the correct subfolder.

### Inside `lib/`

```
lib/
├── config/          ← Static config constants (API URLs, branding, service registry)
├── stores/          ← Zustand state stores (auth, global filters, UI preferences)
├── mocks/           ← Mock data infrastructure (fake backend for dev + tests)
│   ├── fixtures/    ← Static seed data keyed by domain (positions, strategies, …)
│   └── generators/  ← Synthetic data generators used by fixtures + tests
├── types/           ← Shared TypeScript types
├── providers.tsx    ← Root React provider tree
├── query-client.ts  ← React Query configuration
└── utils.ts         ← Shared utilities (cn(), date formatters, number formatters)
```

The mock layer is fed to the app via `NEXT_PUBLIC_MOCK_API=true` — fixtures and generators produce the data that API hooks consume during development and tests. Historically this included MSW-style HTTP handlers; today the mock surface is primarily fixture/generator modules, with any request interception configured at the provider boundary when needed.

### Inside `hooks/`

```
hooks/
├── use-auth.tsx              ← Auth state (current user, login, logout)
├── use-mobile.ts             ← Mobile breakpoint detection
├── use-toast.ts              ← Toast notification trigger
├── use-websocket.ts          ← Shared WebSocket subscription hook
├── use-app-access.tsx        ← Entitlement / scope access checks
├── use-protocol-status.ts    ← Live venue / protocol status
├── use-scoped-categories.ts  ← Scope-aware category routing
├── use-sports-live-updates.ts
├── use-tab-param.ts
├── use-ticking-now.ts
├── api/                      ← One hook file per data domain (React Query wrappers)
│   ├── use-positions.ts
│   ├── use-strategies.ts
│   ├── use-orders.ts
│   └── ...                   ← All follow the same useQuery/useMutation pattern
└── deployment/               ← Deployment-console hooks (legacy PascalCase filenames)
```

---

## 6. The Data Layer — How the UI Gets Its Data

This is the most important section for backend engineers. Understanding this flow removes most of the mystery.

### The full data flow

```
Python Backend API
       ↕  (HTTP fetch)
Mock layer (fixtures/generators)  ← active when NEXT_PUBLIC_MOCK_API=true
       ↕
React Query hook  (e.g. usePositions())
       ↕
React component   (receives data, isLoading, error)
       ↕
DOM (what the user sees)
```

### Step 1: The hook calls an API

Every API call goes through a custom hook in `hooks/api/`. Never call `fetch()` directly in a component.

```typescript
// hooks/api/use-positions.ts
import { useQuery } from "@tanstack/react-query";
import { API_CONFIG } from "@/lib/config/api";

export function usePositions(orgId?: string) {
  return useQuery({
    queryKey: ["positions", orgId], // cache key — unique per query + params
    queryFn: async () => {
      const res = await fetch(`${API_CONFIG.baseUrl}/api/positions?org=${orgId}`);
      if (!res.ok) throw new Error("Failed to fetch positions");
      return res.json();
    },
  });
}
```

### Step 2: The component uses the hook

```tsx
"use client";
import { usePositions } from "@/hooks/api/use-positions";

export function PositionsPage() {
  const { data, isLoading, error } = usePositions("blue-coast-capital");

  if (isLoading) return <Skeleton />; // show loading state
  if (error) return <ErrorState />; // show error state
  return <PositionsTable positions={data} />;
}
```

### Step 3: The mock layer supplies data in development

When `NEXT_PUBLIC_MOCK_API=true`, the hook reads from `lib/mocks/fixtures/` (and helpers in `lib/mocks/generators/`) instead of hitting the real Python backend. Fixtures are plain TypeScript modules:

```typescript
// lib/mocks/fixtures/positions.ts (illustrative)
export const positionsFixture = {
  data: [
    { id: "1", symbol: "BTC/USD", quantity: 1.5, unrealized_pnl: 4200 },
    { id: "2", symbol: "ETH/USD", quantity: 10, unrealized_pnl: -300 },
  ],
};
```

This means you can develop and test the entire UI without the Python backend running. The component code is identical — only the data source changes.

### React Query — what it does for you

**React Query** (`@tanstack/react-query`) is the caching and synchronisation layer. Without it, every time a component mounts it would re-fetch from the API. With React Query:

- Responses are cached by `queryKey`
- If two components use `usePositions()`, only one HTTP request is made
- Data goes "stale" after 30 seconds and is refetched in the background
- `isLoading`, `error`, `data` states are managed automatically
- `useMutation` handles POST/PUT/DELETE with automatic cache invalidation

### Zustand — global state

**Zustand** is the global state store for UI state that isn't server data — which filters are active, which organisation is selected, which theme is active.

```typescript
// lib/stores/global-scope-store.ts
export const useGlobalScopeStore = create<GlobalScopeState>((set) => ({
  selectedOrg: "odum-internal",
  selectedShard: "All",
  setSelectedOrg: (org) => set({ selectedOrg: org }),
  setSelectedShard: (shard) => set({ selectedShard: shard }),
  reset: () => set({ selectedOrg: "odum-internal", selectedShard: "All" }),
}));

// In any component:
const selectedOrg = useGlobalScopeStore((s) => s.selectedOrg);
```

Think of it as a module-level singleton dict that triggers re-renders in any component that reads from it when it changes.

#### Persisted stores — the real pattern

Stores that need to survive page reloads wrap state in Zustand's `persist` middleware. The canonical example in this repo is `lib/stores/ui-prefs-store.ts`:

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

const STORAGE_KEY = "unified-ui-prefs";

const initialState = {
  sidebarCollapsed: false,
  theme: "dark" as const,
  // ...
};

export const useUIPrefsStore = create<UIPrefsState>()(
  persist(
    (set) => ({
      ...initialState,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      reset: () => {
        localStorage.removeItem(STORAGE_KEY);
        set(initialState);
      },
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      migrate: (persistedState, version) => {
        // bump version + reshape fields when schema changes
        return persistedState;
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn("[ui-prefs-store] rehydration error — resetting", error);
          localStorage.removeItem(STORAGE_KEY);
        }
      },
    },
  ),
);
```

Mirror this shape for any new persisted store — always set `version`, always handle `migrate`, and always scrub `localStorage` on rehydration errors.

---

## 7. Styling — Tailwind CSS

This project does not have `.css` files for components. Styling is done entirely through **Tailwind CSS** utility classes applied directly in the JSX.

```tsx
// Instead of writing a CSS class and styling it separately:
<div className="flex items-center gap-4 p-6 bg-gray-900 border border-gray-700 rounded-lg">
  <span className="text-sm text-green-400 font-medium">+4,200 USD</span>
</div>
```

Each class name is a single CSS property:

| Class             | CSS it produces                              |
| ----------------- | -------------------------------------------- |
| `flex`            | `display: flex`                              |
| `items-center`    | `align-items: center`                        |
| `gap-4`           | `gap: 1rem` (16px)                           |
| `p-6`             | `padding: 1.5rem` (24px)                     |
| `bg-gray-900`     | `background-color: #111827`                  |
| `text-sm`         | `font-size: 0.875rem`                        |
| `text-green-400`  | `color: #4ade80`                             |
| `rounded-lg`      | `border-radius: 0.5rem`                      |
| `hidden md:block` | hidden on mobile, visible on medium+ screens |

You will get used to reading these quickly. The [Tailwind documentation](https://tailwindcss.com/docs) is searchable by property. The classes are consistent and predictable.

**The `cn()` utility:** When class names are conditional, use `cn()` from `lib/utils.ts`:

```tsx
import { cn } from "@/lib/utils"

<div className={cn(
  "px-4 py-2 rounded",              // always applied
  isActive && "bg-blue-500",        // applied only if isActive is true
  isDisabled && "opacity-50 cursor-not-allowed"
)}>
```

---

## 8. Testing — Vitest and Testing Library

### What Vitest does

**Vitest** (4.1.1) is the test runner — it finds test files, runs them, and reports pass/fail. It is the direct equivalent of `pytest`, and its API is largely compatible with Jest so older examples still port cleanly.

| pytest            | Vitest                                                 |
| ----------------- | ------------------------------------------------------ |
| `pytest tests/`   | `pnpm test`                                            |
| `def test_foo():` | `it("foo", () => {})` or `test("foo", () => {})`       |
| `assert x == y`   | `expect(x).toBe(y)`                                    |
| `@pytest.fixture` | `beforeEach()` / `vi.fn()` / Testing Library utilities |
| `conftest.py`     | `vitest.config.ts` `setupFiles`                        |
| `pytest.ini`      | `vitest.config.ts`                                     |
| `pytest -k foo`   | `pnpm test -- -t foo`                                  |
| `monkeypatch`     | `vi.mock(...)` / `vi.spyOn(...)` from `vitest`         |

### Project layout for tests

Tests live under the top-level `tests/` folder — not `__tests__/` — and Vitest is configured with separate projects for each layer:

```
tests/
├── unit/           ← pure components, hooks, lib functions
│   ├── components/
│   └── lib/
├── integration/    ← cross-store / cross-provider / middleware behaviour
│   ├── api.integration.test.ts
│   ├── cross-tab-widgets.test.tsx
│   ├── filter-propagation.test.tsx
│   ├── middleware.test.ts
│   └── zustand-selectors.test.ts
├── audit/          ← regulatory / compliance surface checks
├── helpers/        ← shared test utilities (render wrappers, fixtures)
└── e2e/            ← Playwright specs (run separately, excluded from Vitest)
```

Vitest only picks up files matching `tests/**/*.{test,spec}.{ts,tsx}` and explicitly excludes `tests/e2e/**`. Playwright owns end-to-end.

### Running tests (pnpm)

```bash
pnpm test                  # interactive (vitest default)
pnpm test -- --run         # single-shot, CI-style
pnpm test:unit             # --project unit
pnpm test:integration      # --project integration
pnpm test:audit            # --project audit
pnpm test:coverage         # v8 coverage → build-artifacts/coverage
pnpm test:e2e              # Playwright
```

`CI=true pnpm test -- --run` is the pattern used in quality gates.

### What Testing Library does

`@testing-library/react` renders components and lets you query them the way a user would interact with them — by text, by label, by role.

```tsx
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PositionsPage } from "@/components/trading/positions-page";

describe("PositionsPage", () => {
  it("shows positions after loading", async () => {
    render(<PositionsPage />);
    await waitFor(() => {
      expect(screen.getByText("BTC/USD")).toBeInTheDocument();
    });
  });

  it("filters by venue", async () => {
    render(<PositionsPage />);
    await userEvent.click(screen.getByRole("combobox", { name: /venue/i }));
    await userEvent.click(screen.getByText("Binance"));
    expect(screen.queryByText("Kraken")).not.toBeInTheDocument();
  });
});
```

### happy-dom — the fake browser

Vitest runs in Node.js, which has no browser. This project uses **happy-dom** (`environment: "happy-dom"` in `vitest.config.ts`) instead of jsdom — it is faster and implements enough of the DOM for React plus Testing Library.

Some browser APIs (ResizeObserver, IntersectionObserver, matchMedia) are not implemented by happy-dom and are either mocked in a `setupFiles` entry or stubbed per-test with `vi.stubGlobal(...)`. The test runner uses `pool: "forks"` to prevent zombie node processes on parallel suites.

---

## 9. Key Files at the Project Root

| File                   | Purpose                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `package.json`         | Lists all dependencies and defines scripts (`pnpm dev`, `pnpm test`, `pnpm build`)   |
| `pnpm-lock.yaml`       | Exact pinned versions of every dependency. Never edit manually.                      |
| `next.config.mjs`      | Next.js configuration — redirect rules, environment variable exposure, image domains |
| `tsconfig.json`        | TypeScript compiler settings — defines the `@/` path alias, sets strict mode         |
| `tailwind.config.ts`   | Tailwind configuration — custom colours, fonts, animation definitions                |
| `vitest.config.ts`     | Vitest configuration — environment (happy-dom), projects, include/exclude, coverage  |
| `playwright.config.ts` | Playwright configuration for the E2E suite in `tests/e2e/`                           |
| `.env.local`           | Local environment variables — never committed                                        |
| `node_modules/`        | All installed packages — never edit, never commit                                    |
| `.next/`               | Build output — never edit, never commit                                              |

---

## 10. Naming Conventions

Understanding naming conventions tells you where to look for something without searching.

| Convention                  | Applied to                          | Example                                 |
| --------------------------- | ----------------------------------- | --------------------------------------- |
| `kebab-case` filenames      | Components, hooks, lib files        | `use-positions.ts`, `filter-bar.tsx`    |
| `PascalCase` function names | React components, TypeScript types  | `PositionsTable`, `FilterBar`           |
| `camelCase` function names  | Regular functions, hooks, variables | `usePositions()`, `selectedOrg`         |
| `use` prefix                | All hooks                           | `useAuth`, `usePositions`, `useMobile`  |
| `page.tsx`                  | Route entry points only             | Never name a component `page.tsx`       |
| `layout.tsx`                | Shell wrappers only                 | Never name a component `layout.tsx`     |
| `index.ts`                  | Barrel exports                      | Aggregates and re-exports from a folder |
| `*.test.tsx`                | Test files                          | `positions-table.test.tsx`              |
| `[param]` folder            | Dynamic route segment               | `[id]/page.tsx` → `/strategies/abc`     |
| `(group)` folder            | Route group (no URL segment)        | `(platform)/` → not in URL              |

**One naming inconsistency to be aware of:** hooks inside `hooks/deployment/` use `useX` PascalCase filenames (legacy). Do not copy this style for new hooks — use `use-x` kebab-case.

---

## 11. Vocabulary Glossary

| Term                         | Plain English definition                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Component**                | A function that returns UI (JSX). The basic building block.                                            |
| **JSX / TSX**                | HTML-like syntax embedded in JavaScript/TypeScript.`.tsx` = TypeScript + JSX.                          |
| **Props**                    | Data passed to a component from its parent, like function arguments.                                   |
| **State**                    | A component's own internal memory. Changing it triggers a re-render.                                   |
| **Hook**                     | A function starting with `use` that encapsulates reusable stateful logic.                              |
| **Re-render**                | When React re-runs a component function and updates the DOM. Happens when state or props change.       |
| **Server Component**         | A component that runs on the server only. Can `await` directly. No `useState`. Default in Next.js.     |
| **Client Component**         | A component that runs in the browser. Requires `"use client"`. Needed for interactivity.               |
| **`"use client"`**           | Directive at the top of a file that opts it into browser execution.                                    |
| **App Router**               | Next.js routing system based on the `app/` folder structure (Next 16.2.1 in this repo).                |
| **Route Group**              | A `(name)` folder that organises routes without affecting URLs.                                        |
| **Layout**                   | A `layout.tsx` that wraps all pages in its folder. Persists across navigation.                         |
| **Dynamic Route**            | A `[param]` folder that matches any value in that URL segment.                                         |
| **React Query**              | Library that fetches, caches, and synchronises server data.                                            |
| **Zustand**                  | Lightweight global state manager. Like a reactive singleton dict.                                      |
| **Mock layer**               | `lib/mocks/{fixtures,generators}/` — supplies fake data when `NEXT_PUBLIC_MOCK_API=true`.              |
| **Tailwind**                 | CSS utility class library. Style things by adding class names directly to JSX.                         |
| **shadcn/ui**                | A collection of pre-built, accessible UI components (Button, Dialog, Table, etc.) in `components/ui/`. |
| **Vitest**                   | The test runner. Equivalent to pytest. Jest-compatible API.                                            |
| **happy-dom**                | A fake browser environment that runs inside Node.js for tests. Faster than jsdom.                      |
| **`@testing-library/react`** | Testing utilities — renders components and queries them like a user would.                             |
| **Coverage**                 | What percentage of source code is executed during tests. Gated at 80% in this project.                 |
| **Barrel export**            | An `index.ts` that re-exports from multiple files so importers use one path.                           |
| **`cn()`**                   | Utility function from `lib/utils.ts` for merging Tailwind classes conditionally.                       |
| **`@/`**                     | Path alias meaning "from the project root".`@/components/ui/button` → `components/ui/button.tsx`.      |
| **`node_modules/`**          | Where pnpm packages are installed. Never edit.                                                         |
| **`.next/`**                 | Build output directory. Never edit.                                                                    |
| **`process.env`**            | How you access environment variables in Node.js/Next.js. Like Python's `os.environ`.                   |
| **Hydration**                | When the browser takes server-rendered HTML and attaches JavaScript interactivity to it.               |
| **Bundle / chunk**           | A compiled JS file sent to the browser. Next.js splits these automatically.                            |

---

## 12. The Golden Rules for This Codebase

Before writing any code, read these. They will save you from the most common mistakes.

**1. Never create a page outside `app/(platform)/services/<domain>/`**
All platform content lives under `/services/` (plural). The old flat paths (`/trading/`, `/execution/`, `/ml/`) are redirect rules in `next.config.mjs` — files created there are unreachable. Note also: the route is `/services/*`, not `/service/*` — any older docs that say the singular form are stale.

**2. `"use client"` goes at the very top of the file, before all imports**
It must be the first line. If you get an error about hooks in a Server Component, you forgot this.

**3. All API calls go through `hooks/api/` — never `fetch()` directly in a page**
React Query handles caching, loading states, and retries. Bypass it and you lose all of that.

**4. Use shared and domain components — do not bypass them with raw primitives**
Cross-domain UI (`StatusBadge`, `PageHeader`, `Spinner`, `EmptyState`, `DataTable`, etc.) lives in `components/shared/` (see `components/shared/index.ts`). Domain-only pieces live in `components/<domain>/`. `components/ui/` is **shadcn/Radix primitives only** — not the place for custom app chrome. Do not rebuild shared patterns from scratch in a page file.

**5. Never hardcode API URLs**
All API paths come from `lib/config/api.ts`. Hardcoding creates invisible coupling that breaks when the backend URL changes.

**6. State that multiple components share goes in Zustand, not in multiple `useState` calls**
If two components need the same filter value, it belongs in `lib/stores/`, not duplicated in each component.

**7. Add mock data before writing the component**
If you're building a new feature, define the fixture/generator in `lib/mocks/fixtures/` (or `lib/mocks/generators/`) first. Then the component has something to render during development without a real backend.

**8. Check `UI_STRUCTURE_MANIFEST.json` before refactoring anything**
The manifest tracks ongoing refactors and the target structure. Changes without updating it create confusion for the next person (or agent) who works in the codebase.

---

## 13. Where to Look for What

| You want to...                         | Look here                                                   |
| -------------------------------------- | ----------------------------------------------------------- |
| Add a new page                         | `app/(platform)/services/<domain>/`                         |
| Add cross-domain shared UI             | `components/shared/` (`components/shared/index.ts`)         |
| Add a domain-only component            | `components/<domain>/` (trading, research, ops, …)          |
| Add an API data fetching hook          | `hooks/api/use-<domain>.ts`                                 |
| Add mock data                          | `lib/mocks/fixtures/<domain>.ts` or `lib/mocks/generators/` |
| Add a global config constant           | `lib/config/`                                               |
| Add shared TypeScript types            | `lib/<domain>-types.ts`                                     |
| Add global state (filters, user prefs) | `lib/stores/<name>-store.ts`                                |
| Add `cn()` / class merging             | `lib/utils.ts`                                              |
| Add formatters (numbers, dates, P&L)   | `lib/utils/formatters.ts`, `lib/utils/pnl.ts`, etc.         |
| Add a unit test                        | `tests/unit/<corresponding path>/`                          |
| Add an integration test                | `tests/integration/`                                        |
| Add a compliance/audit test            | `tests/audit/`                                              |
| Add an E2E test                        | `tests/e2e/`                                                |
| Understand the route structure         | `docs/STRUCTURE_APP.md`                                     |
| Understand available components        | `docs/STRUCTURE_COMPONENTS.md`                              |
| Understand the lib/ layer              | `docs/STRUCTURE_LIB.md`                                     |
| Understand hooks                       | `docs/STRUCTURE_HOOKS.md`                                   |
| Understand the context layer           | `docs/STRUCTURE_CONTEXT.md`                                 |
| Understand who sees what               | `app/(platform)/layout.tsx` + `hooks/use-auth.tsx`          |
| Find where a URL renders               | Follow the path in `app/` matching the URL segments         |
| Find the fixture for an API call       | Match the endpoint path to `lib/mocks/fixtures/<domain>.ts` |
| Run the dev server                     | `pnpm dev` (then open http://localhost:3000)                |
| Run tests                              | `pnpm test`                                                 |
| Run tests with coverage                | `pnpm test:coverage`                                        |
| Build for production                   | `pnpm build`                                                |

---

_This document is maintained in `docs/FRONTEND_PRIMER_FOR_BACKEND_ENGINEERS.md`._
_If you find something missing or confusing, add it here — the next intern will thank you._
