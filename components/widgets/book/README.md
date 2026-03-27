# Book trade widgets

Workspace widgets for **Book Trade** (`/services/trading/book`). Spec: [`book-widgets.md`](./book-widgets.md).

## Provider

`BookTradeDataProvider` (`components/widgets/book/book-data-context.tsx`) holds hierarchy, mode, instrument fields, algo params, record-only fields, order state machine, and actions (`handlePreview`, `handleSubmit`, `resetForm`). It reads `?prefill=` JSON from the URL the same way the legacy page did.

## Widgets

| id                        | Role                                                                                                 |
| ------------------------- | ---------------------------------------------------------------------------------------------------- |
| `book-hierarchy-bar`      | Org, client, strategy                                                                                |
| `book-order-form`         | Execute / record-only, category, venue, instrument, side, qty, price; Preview when idle; user footer |
| `book-algo-config`        | Execute-mode algos; `CollapsibleSection` + fields                                                    |
| `book-record-details`     | Record-only counterparty / source / fee; `CollapsibleSection`                                        |
| `book-preview-compliance` | Summary grid, compliance (execute), Edit / Confirm, success and error                                |

## Config

Venues, category labels, and algo list: `lib/config/services/trading.config.ts` (`BOOK_VENUES_BY_CATEGORY`, `BOOK_CATEGORY_LABELS`, `BOOK_ALGO_OPTIONS`).

## Preset

`book-default` is registered in `components/widgets/book/register.ts` (12-column layout aligned with the spec).
