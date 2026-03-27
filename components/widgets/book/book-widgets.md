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

| id                        | label                | description                                                                                  | icon           | minW | minH | defaultW | defaultH | singleton |
| ------------------------- | -------------------- | -------------------------------------------------------------------------------------------- | -------------- | ---- | ---- | -------- | -------- | --------- |
| `book-hierarchy-bar`      | Hierarchy Selector   | Org → Client → Strategy selector strip                                                       | `Building2`    | 6    | 1    | 12       | 1        | yes       |
| `book-order-form`         | Order Entry          | Core order form: mode toggle, category, venue, instrument, side, qty, price                  | `ClipboardPen` | 4    | 5    | 6        | 8        | yes       |
| `book-algo-config`        | Algo Configuration   | Algorithm selector + conditional params (TWAP/VWAP duration, iceberg display qty, benchmark) | `Settings2`    | 3    | 3    | 6        | 4        | yes       |
| `book-record-details`     | Record Details       | Counterparty, source reference, fee fields for record-only mode                              | `FileText`     | 3    | 3    | 6        | 3        | yes       |
| `book-preview-compliance` | Preview & Compliance | Order preview grid + pre-trade compliance checks with pass/fail badges                       | `ShieldCheck`  | 4    | 3    | 6        | 5        | yes       |

**Note:** Because this is a form page with sequential state machine flow (idle → preview → submit), widgets must share order state. The `book-order-form` widget owns the state machine; other widgets are read-only consumers that appear/hide based on `orderState`.

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

12-column grid. This is a form page — compact center layout.

```
book-default:
  book-hierarchy-bar:   { x: 0,  y: 0,  w: 12, h: 1 }
  book-order-form:      { x: 0,  y: 1,  w: 6,  h: 8 }
  book-algo-config:     { x: 6,  y: 1,  w: 6,  h: 4 }
  book-record-details:  { x: 6,  y: 5,  w: 6,  h: 3 }
  book-preview-compliance: { x: 6, y: 8, w: 6, h: 5 }
```

---

## 9. Questions to Resolve

1. **Should this page remain a standalone form or become a widget inside the terminal tab?** The terminal already has an order-entry widget. Book Trade differs by supporting record-only mode and cross-category booking.
2. **URL prefill behavior in widget mode** — how should `?prefill=` work when widgets load inside a workspace? Propagate via data context?
3. **Should the hierarchy bar be shared with other trading pages** (e.g., terminal, positions) as a workspace-level control rather than page-level?
4. **Preview/compliance as modal vs inline** — in a compact layout, showing preview as a modal might work better than a separate widget.
