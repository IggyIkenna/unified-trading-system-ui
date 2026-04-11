/**
 * Stateful mock position ledger — tracks positions from filled orders.
 * Stored in localStorage alongside the trade ledger.
 * When a mock order fills, the position ledger is updated automatically.
 */

const STORAGE_KEY = "mock-position-ledger";

export interface MockPosition {
  id: string;
  instrument_id: string;
  venue: string;
  side: "long" | "short";
  quantity: number;
  entry_price: number;
  current_price: number;
  unrealized_pnl: number;
  realized_pnl: number;
  strategy_id: string | null;
  asset_class: string;
  updated_at: string;
}

interface MockPositionLedgerState {
  positions: MockPosition[];
}

function defaultState(): MockPositionLedgerState {
  return { positions: [] };
}

function load(): MockPositionLedgerState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return JSON.parse(raw) as MockPositionLedgerState;
  } catch {
    return defaultState();
  }
}

function save(state: MockPositionLedgerState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* localStorage full or unavailable */
  }
}

/** Get all positions from the ledger. */
export function getPositions(): MockPosition[] {
  return load().positions;
}

/**
 * Update positions when a filled order comes in.
 * If a position for the same instrument+venue+strategy exists, adjust it.
 * Otherwise create a new position.
 */
export function applyFilledOrder(order: {
  instrument_id: string;
  venue: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  strategy_id: string | null;
  asset_class: string;
}): MockPosition {
  const state = load();
  const positionSide: "long" | "short" = order.side === "buy" ? "long" : "short";

  // Find existing position for this instrument+venue+strategy
  const existing = state.positions.find(
    (p) =>
      p.instrument_id === order.instrument_id &&
      p.venue === order.venue &&
      p.strategy_id === order.strategy_id,
  );

  if (existing) {
    // Same direction: increase position
    if (existing.side === positionSide) {
      const totalCost = existing.entry_price * existing.quantity + order.price * order.quantity;
      existing.quantity += order.quantity;
      existing.entry_price = totalCost / existing.quantity;
    } else {
      // Opposite direction: reduce or flip
      if (order.quantity >= existing.quantity) {
        // Close or flip
        const closedQty = existing.quantity;
        const pnl =
          existing.side === "long"
            ? (order.price - existing.entry_price) * closedQty
            : (existing.entry_price - order.price) * closedQty;
        existing.realized_pnl += pnl;
        const remainingQty = order.quantity - closedQty;
        if (remainingQty > 0) {
          existing.side = positionSide;
          existing.quantity = remainingQty;
          existing.entry_price = order.price;
        } else {
          existing.quantity = 0;
        }
      } else {
        // Partial close
        const pnl =
          existing.side === "long"
            ? (order.price - existing.entry_price) * order.quantity
            : (existing.entry_price - order.price) * order.quantity;
        existing.realized_pnl += pnl;
        existing.quantity -= order.quantity;
      }
    }
    existing.current_price = order.price;
    const mult = existing.side === "long" ? 1 : -1;
    existing.unrealized_pnl =
      Math.round((existing.current_price - existing.entry_price) * existing.quantity * mult * 100) / 100;
    existing.updated_at = new Date().toISOString();

    // Remove zero-quantity positions
    if (existing.quantity <= 0) {
      state.positions = state.positions.filter((p) => p !== existing);
    }

    save(state);
    return existing;
  }

  // Create new position
  const newPos: MockPosition = {
    id: `pos-trade-${Date.now()}`,
    instrument_id: order.instrument_id,
    venue: order.venue,
    side: positionSide,
    quantity: order.quantity,
    entry_price: order.price,
    current_price: order.price,
    unrealized_pnl: 0,
    realized_pnl: 0,
    strategy_id: order.strategy_id,
    asset_class: order.asset_class,
    updated_at: new Date().toISOString(),
  };
  state.positions.push(newPos);
  save(state);
  return newPos;
}

/** Clear all positions (for reset). */
export function clearPositions(): void {
  save(defaultState());
}
