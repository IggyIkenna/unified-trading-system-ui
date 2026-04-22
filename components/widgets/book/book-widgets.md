# Book Trade — Widget Decomposition Spec

**Page:** `app/(platform)/services/trading/book/page.tsx`
**Tier:** 3 (low priority — form-centric page, single monolith component)

---

## 1. Page Analysis

| Metric           | Value                                                                                                                                                                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lines            | ~948                                                                                                                                                                                                                                    |
| Sections visible | Top bar (org/client/strategy selectors), execution mode toggle, category tabs, order details card, algo config card, record-only details card, order preview panel, compliance check panel, status messages, action buttons, user badge |
| Data hooks used  | `usePlaceOrder`, `usePreTradeCheck`, `useOrganizationsList`, `useAuth`                                                                                                                                                                  |
| Inline mock data | `VENUES_BY_CATEGORY` (6 categories × 3-6 venues each), `CATEGORY_LABELS`, `ALGO_OPTIONS` — all hardcoded in-file                                                                                                                        |
| URL params       | `?prefill=` JSON for pre-populating form fields                                                                                                                                                                                         |

All logic and UI live in a single `BookTradePage` function — no child components extracted. The page is a form wizard (idle → preview → submitting → success/error).

---

## 2. Widget Decomposition

| id                   | label              | description                                                                                    | icon           | minW | minH | defaultW | defaultH | singleton |
| -------------------- | ------------------ | ---------------------------------------------------------------------------------------------- | -------------- | ---- | ---- | -------- | -------- | --------- |
| `book-trade-history` | Trade History      | Table of executed trades with search, sort, filtering                                          | `History`      | 6    | 4    | 12       | 8        | yes       |
| `book-hierarchy-bar` | Hierarchy Selector | Org → Client → Strategy selector strip                                                         | `Building2`    | 6    | 1    | 12       | 1        | yes       |
| `book-order-entry`   | Book Order Entry   | Full trade booking workflow: form body, algo config, record-only details, preview & compliance | `ClipboardPen` | 6    | 10   | 12       | 14       | yes       |

**Note (2026-04-22):** The book tab was originally decomposed into four co-dependent widgets (`book-order-form`, `book-algo-config`, `book-record-details`, `book-preview-compliance`) that all wrote to the same shared `useBookTradeData()` context and shared one submit action — none worked alone. They were merged into a single `book-order-entry` widget that owns the full `idle → preview → submitting → success/error` state machine internally.

---

## 3. Data Context Shape

```typescript
interface BookTradeData {
  // Hierarchy
  orgId: string;
  setOrgId: (v: string) => void;
  clientId: string;
  setClientId: (v: string) => void;
  strategyId: string;
  setStrategyId: (v: string) => void;
  organizations: Array<{ id: string; name: string }>;

  // Mode & category
  executionMode: "execute" | "record_only";
  setExecutionMode: (m: "execute" | "record_only") => void;
  category: CategoryTab;
  setCategory: (c: CategoryTab) => void;

  // Core fields
  venue: string;
  setVenue: (v: string) => void;
  instrument: string;
  setInstrument: (v: string) => void;
  side: "buy" | "sell";
  setSide: (s: "buy" | "sell") => void;
  quantity: string;
  setQuantity: (q: string) => void;
  price: string;
  setPrice: (p: string) => void;

  // Algo fields
  algo: AlgoType;
  setAlgo: (a: AlgoType) => void;
  algoParams: { duration: string; slices: string; displayQty: string; benchmark: string };
  setAlgoParam: (key: string, value: string) => void;

  // Record-only fields
  counterparty: string;
  setCounterparty: (v: string) => void;
  sourceReference: string;
  setSourceReference: (v: string) => void;
  fee: string;
  setFee: (v: string) => void;

  // Order state
  orderState: "idle" | "preview" | "submitting" | "success" | "error";
  errorMessage: string;
  complianceResult: PreTradeCheckResponse | null;
  complianceUnavailable: boolean;
  complianceLoading: boolean;
  compliancePassed: boolean;

  // Derived
  qty: number;
  priceNum: number;
  total: number;
  canPreview: boolean;
  canExecute: boolean;

  // Actions
  handlePreview: () => void;
  handleSubmit: () => void;
  resetForm: () => void;

  // Auth
  user: AuthUser | null;
}
```

---

## 4. Mock Data Instructions

- Move `VENUES_BY_CATEGORY` and `CATEGORY_LABELS` to `lib/config/services/trading.config.ts` — these are reference data, not mock data.
- Move `ALGO_OPTIONS` to the same config file.
- The page's actual API calls (`usePlaceOrder`, `usePreTradeCheck`) already go through hooks/api — MSW handlers in `lib/mocks/handlers/` should cover the compliance response shape with realistic pass/fail scenarios.

---

## 5. UI/UX Notes

- The page is a max-width-3xl centered form — in widget mode, the order form widget should be a **narrow column** (4-6 cols) since forms don't benefit from full width.
- Reduce vertical spacing: `space-y-6` → `space-y-3` inside widgets.
- Input heights are already `h-8` — keep those.
- The preview and compliance sections should **overlay or dock below** the form widget, not be separate floating widgets by default. They can optionally be split out for power users.

---

## 6. Collapsible Candidates

| Section            | Why                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------- |
| Algo Configuration | Only relevant in `execute` mode; collapses naturally when `record_only` is selected |
| Record Details     | Only relevant in `record_only` mode                                                 |
| Compliance Check   | Secondary info — expandable after preview                                           |
| User Badge         | Minor footer info                                                                   |

---

## 7. Reusable Component Usage

| Shared widget        | Where used                                                                      |
| -------------------- | ------------------------------------------------------------------------------- |
| `FilterBarWidget`    | Could replace the top hierarchy bar (org/client/strategy as filter definitions) |
| `CollapsibleSection` | Wrap algo config + record details sections                                      |

---

## 8. Default Preset Layout

12-column grid. Trade history on top (full width), then scope bar, then the merged order-entry widget.

```
book-default:
  book-trade-history:   { x: 0,  y: 0,  w: 12, h: 8  }
  book-hierarchy-bar:   { x: 0,  y: 8,  w: 12, h: 1  }
  book-order-entry:     { x: 0,  y: 9,  w: 12, h: 14 }
```

---

## 9. Questions to Resolve

1. **Should this page remain a standalone form or become a widget inside the terminal tab?** The terminal already has an order-entry widget. Book Trade differs by supporting record-only mode and cross-category booking.
2. **URL prefill behavior in widget mode** — how should `?prefill=` work when widgets load inside a workspace? Propagate via data context?
3. **Should the hierarchy bar be shared with other trading pages** (e.g., terminal, positions) as a workspace-level control rather than page-level?
4. **Preview/compliance as modal vs inline** — in a compact layout, showing preview as a modal might work better than a separate widget.
