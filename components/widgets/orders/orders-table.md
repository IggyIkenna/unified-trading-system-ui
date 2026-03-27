# Orders Table

Tab: orders
Widget ID: orders-table
Min size: 6 x 3 columns/rows

## What it shows

Full orders DataTable (tanstack) with 15 columns: order_id, instrument, side, type, price, mark, edge, instant P&L, strategy, qty, filled, status, venue, created, actions. Supports sorting, column visibility toggling, and pagination. Action buttons allow cancel and amend on actionable orders. Includes refresh button and export dropdown in the header area.

## Data sources

- `useOrdersData()` context (filteredOrders, cancelOrder, openAmendDialog)
- Underlying: `useOrders()`, `useCancelOrder()`, `useAmendOrder()` hooks

## Configuration

- None — column visibility is user-controlled via DataTable built-in toggle

## Recommended pairings

See [pairing guide](../pairing-guide.md).

- **Same tab:** `orders-filter`, `orders-kpi-strip`.
- **Placement & tape:** **terminal** `order-entry`, `market-trades`, `order-book` · **book** `book-order-form`, `book-preview-compliance`.
- **Ops & alerts:** **instructions** `instr-pipeline-table` · **overview** `recent-fills` · **alerts** `alerts-table`.
