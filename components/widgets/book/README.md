# Book trade widgets

Workspace widgets for **Book Trade** (`/services/trading/book`). Spec: [`book-widgets.md`](./book-widgets.md).

## Provider

`BookTradeDataProvider` (`components/widgets/book/book-data-context.tsx`) holds hierarchy, mode, instrument fields, algo params, record-only fields, order state machine, and actions (`handlePreview`, `handleSubmit`, `resetForm`). It reads `?prefill=` JSON from the URL the same way the legacy page did.

## Widgets

| id                   | Role                                                                                                                                                                                                                                                                                                                         |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `book-trade-history` | Table of executed trades with search, sort, filtering                                                                                                                                                                                                                                                                        |
| `book-hierarchy-bar` | Org, client, strategy                                                                                                                                                                                                                                                                                                        |
| `book-order-entry`   | Full booking workflow: execute / record-only toggle, category tabs, venue, instrument, side, qty, price, CeFi / DeFi algo config, record-only counterparty / source / fee, preview summary + compliance panel, Edit / Confirm. State machine (`orderState`: `idle → preview → submitting → success/error`) owned internally. |

## Config

Venues, category labels, and algo list: `lib/config/services/trading.config.ts` (`BOOK_VENUES_BY_CATEGORY`, `BOOK_CATEGORY_LABELS`, `BOOK_ALGO_OPTIONS`).

## Preset

`book-default` and `book-full` are registered in `components/widgets/book/register.ts` (12-column layout aligned with the spec).

## History

`book-order-form`, `book-algo-config`, `book-record-details`, `book-preview-compliance` were merged into the single `book-order-entry` widget on 2026-04-22 — all four wrote to the same shared context and shared one submit action (see `docs/audits/live-review-findings.md` row #17).
