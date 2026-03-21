# Acquire Tab — Navigation & Routing Audit

**Generated:** 2026-03-21 | **Source:** Phase 2a Audit

---

## DATA_TABS Definition

Source: `components/shell/service-tabs.tsx` lines 87–94

| # | label | href | matchPrefix | requiredEntitlement |
| - | ----- | ---- | ----------- | ------------------- |
| 1 | Pipeline Status | `/service/data/overview` | (defaults to href) | none |
| 2 | Coverage Matrix | `/service/data/coverage` | (defaults to href) | none |
| 3 | Missing Data | `/service/data/missing` | (defaults to href) | none |
| 4 | Venue Health | `/service/data/venues` | (defaults to href) | none |
| 5 | Markets | `/service/data/markets` | (defaults to href) | none |
| 6 | ETL Logs | `/service/data/logs` | (defaults to href) | none |

---

## routeMappings Coverage

Source: `lib/lifecycle-mapping.ts`

| Route | In routeMappings? | primaryStage | lanes | Lifecycle Nav Works? |
| ----- | ----------------- | ------------ | ----- | -------------------- |
| `/service/data/overview` | Yes | acquire | ["data"] | Yes |
| `/service/data/coverage` | **NO** | — | — | **NO — broken** |
| `/service/data/missing` | **NO** | — | — | **NO — broken** |
| `/service/data/venues` | **NO** | — | — | **NO — broken** |
| `/service/data/markets` | Yes | acquire | ["data"] | Yes |
| `/service/data/logs` | **NO** | — | — | **NO — broken** |
| `/service/data/markets/pnl` | No (but prefix matches `/service/data/markets`) | acquire (via prefix) | ["data"] | Yes (via prefix fallback) |

### getRouteMapping() Prefix Fallback

The function uses a two-step lookup:
1. Exact match: `routeMappings.find(m => m.path === path)`
2. Prefix match: `routeMappings.filter(m => path.startsWith(m.path + "/"))` sorted by longest match

This means:
- `/service/data/markets/pnl` matches `/service/data/markets` + "/" → prefix works
- `/service/data/coverage` does NOT match `/service/data/overview` + "/" → no match
- `/service/data/missing` does NOT match any `/service/data/*` + "/" → no match

**Result:** 4 of 6 DATA_TABS routes have no lifecycle stage detection. The lifecycle nav will not highlight "Acquire" on these pages.

---

## Tab Active State

| Route | Tab Highlights? | Mechanism |
| ----- | --------------- | --------- |
| `/service/data/overview` | Yes — "Pipeline Status" | pathname === href |
| `/service/data/coverage` | Yes — "Coverage Matrix" | pathname === href (but page is 404) |
| `/service/data/missing` | Yes — "Missing Data" | pathname === href |
| `/service/data/venues` | Yes — "Venue Health" | pathname === href |
| `/service/data/markets` | Yes — "Markets" | pathname === href |
| `/service/data/markets/pnl` | Yes — "Markets" | pathname starts with href |
| `/service/data/logs` | Yes — "ETL Logs" | pathname === href (but page is 404) |

Tab active state works correctly for all routes. The issue is lifecycle nav (Row 1), not service tabs (Row 2).

---

## Internal Navigation Links

| Source Page | Target | Type | Purpose |
| ----------- | ------ | ---- | ------- |
| overview | `/service/data-catalogue` | `<Link>` | Manage Subscription badge (non-admin) |
| markets/pnl | `/service/data/markets` | `<Link>` | Back button |

No internal cross-links between the 6 data tab pages (e.g., no link from overview to coverage, or markets to venues).

---

## Cross-Lifecycle Links

| Source Page | Target | Type | Target Lifecycle |
| ----------- | ------ | ---- | ---------------- |
| overview | `/service/data-catalogue` | `<Link>` | Service Hub (outside lifecycle model) |
| markets | `/strategies/${id}` | `EntityLink` | Build (strategy detail) |
| markets | `/markets/pnl?client=${id}` | `EntityLink` | Acquire (redirect to /service/data/markets/pnl) |
| markets | `/ops/services?service=${id}` | `EntityLink` | Manage/Ops |
| markets/pnl | `/strategies/${id}` | `<Link>` + `EntityLink` | Build (strategy detail) |

---

## Orphan Page: `/service/data/markets/pnl`

**Status:** Confirmed orphan — no tab entry in DATA_TABS.

**Access paths found:**

| Source | Path | Mechanism |
| ------ | ---- | --------- |
| `pnl-attribution-panel.tsx` | `/markets/pnl` | `<Link>` → redirect to `/service/data/markets/pnl` |
| `service/[key]/page.tsx` | `/markets/pnl` | P&L Attribution link → redirect |
| `entity-link.tsx` | `/markets/pnl?client=${id}` | Client entity link → redirect |
| `next.config.mjs` | `/markets/pnl` | Redirect rule to `/service/data/markets/pnl` |
| Direct URL | `/service/data/markets/pnl` | Direct browser navigation |

**NOT accessible from:**
- Markets page (`/service/data/markets`) — no direct link exists
- Any DATA_TABS entry

**Recommendation:** Add "View P&L Attribution" button/link on the markets page that navigates to `/service/data/markets/pnl`.

---

## Dead Links

| Source | Target | Type | Issue |
| ------ | ------ | ---- | ----- |
| DATA_TABS | `/service/data/coverage` | Tab nav | Page file missing → 404 |
| DATA_TABS | `/service/data/logs` | Tab nav | Page file missing → 404 |
| markets page | "View All Clients" | Button | No onClick handler or href |
| markets page | "View All Strategies" | Button | No onClick handler or href |
| overview page | Refresh button | Button | No onClick handler |

---

## Recommended routeMappings Additions

```typescript
{ path: "/service/data/coverage", label: "Coverage Matrix", primaryStage: "acquire", lanes: ["data"], requiresAuth: true },
{ path: "/service/data/missing", label: "Missing Data", primaryStage: "acquire", lanes: ["data"], requiresAuth: true },
{ path: "/service/data/venues", label: "Venue Health", primaryStage: "acquire", lanes: ["data"], requiresAuth: true },
{ path: "/service/data/logs", label: "ETL Logs", primaryStage: "acquire", lanes: ["data"], requiresAuth: true },
{ path: "/service/data/markets/pnl", label: "P&L Attribution", primaryStage: "acquire", lanes: ["data"], requiresAuth: true },
```
