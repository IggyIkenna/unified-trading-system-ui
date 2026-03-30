/**
 * Stateful mock trade ledger — localStorage-backed append-only order store.
 * Used by mock-handler.ts when NEXT_PUBLIC_MOCK_API=true.
 */

const STORAGE_KEY = "mock-trade-ledger";

export interface MockOrder {
  id: string;
  timestamp: string;
  strategy_id: string | null;
  client_id: string;
  instrument_id: string;
  venue: string;
  side: "buy" | "sell";
  order_type: "market" | "limit";
  quantity: number;
  price: number;
  status:
    | "pending"
    | "open"
    | "partially_filled"
    | "filled"
    | "cancelled"
    | "rejected";
  filled_quantity: number;
  average_fill_price: number | null;
  asset_class: "CeFi" | "DeFi" | "TradFi" | "Sports" | "Prediction";
  lane: "book" | "sports" | "defi" | "options" | "predictions";
  algo_type: string | null;
  correlation_id: string;
  created_at: string;
  updated_at: string;
}

interface MockTradeLedgerState {
  orders: MockOrder[];
}

function defaultState(): MockTradeLedgerState {
  return {
    orders: [
      {
        id: "ord-1710000001",
        timestamp: "2026-03-20T09:15:00Z",
        strategy_id: "strat-momentum-01",
        client_id: "internal-trader",
        instrument_id: "BTC-PERP",
        venue: "Binance",
        side: "buy",
        order_type: "market",
        quantity: 0.5,
        price: 68420.0,
        status: "filled",
        filled_quantity: 0.5,
        average_fill_price: 68418.5,
        asset_class: "CeFi",
        lane: "book",
        algo_type: "TWAP",
        correlation_id: "corr-ord-1710000001",
        created_at: "2026-03-20T09:15:00Z",
        updated_at: "2026-03-20T09:15:02Z",
      },
      {
        id: "ord-1710000002",
        timestamp: "2026-03-20T10:30:00Z",
        strategy_id: "strat-momentum-01",
        client_id: "internal-trader",
        instrument_id: "ETH-USDT",
        venue: "Hyperliquid",
        side: "sell",
        order_type: "limit",
        quantity: 10.0,
        price: 3812.4,
        status: "filled",
        filled_quantity: 10.0,
        average_fill_price: 3812.55,
        asset_class: "CeFi",
        lane: "book",
        algo_type: "VWAP",
        correlation_id: "corr-ord-1710000002",
        created_at: "2026-03-20T10:30:00Z",
        updated_at: "2026-03-20T10:30:05Z",
      },
      {
        id: "ord-1710000003",
        timestamp: "2026-03-20T11:00:00Z",
        strategy_id: "strat-defi-lp-01",
        client_id: "internal-trader",
        instrument_id: "UNISWAPV3:LP:ETH-USDC",
        venue: "Uniswap",
        side: "buy",
        order_type: "market",
        quantity: 1.0,
        price: 3800.0,
        status: "filled",
        filled_quantity: 1.0,
        average_fill_price: 3800.0,
        asset_class: "DeFi",
        lane: "defi",
        algo_type: null,
        correlation_id: "corr-ord-1710000003",
        created_at: "2026-03-20T11:00:00Z",
        updated_at: "2026-03-20T11:00:03Z",
      },
      {
        id: "ord-1710000004",
        timestamp: "2026-03-21T14:00:00Z",
        strategy_id: "strat-sports-01",
        client_id: "internal-trader",
        instrument_id: "NFL:GAME:KC-SF",
        venue: "Pinnacle",
        side: "buy",
        order_type: "market",
        quantity: 100.0,
        price: 1.85,
        status: "filled",
        filled_quantity: 100.0,
        average_fill_price: 1.85,
        asset_class: "Sports",
        lane: "sports",
        algo_type: null,
        correlation_id: "corr-ord-1710000004",
        created_at: "2026-03-21T14:00:00Z",
        updated_at: "2026-03-21T14:00:01Z",
      },
      {
        id: "ord-1710000005",
        timestamp: "2026-03-21T15:30:00Z",
        strategy_id: null,
        client_id: "internal-trader",
        instrument_id: "KALSHI:BINARY:FED-RATE-CUT@YES",
        venue: "Kalshi",
        side: "buy",
        order_type: "limit",
        quantity: 50.0,
        price: 0.62,
        status: "filled",
        filled_quantity: 50.0,
        average_fill_price: 0.62,
        asset_class: "Prediction",
        lane: "predictions",
        algo_type: null,
        correlation_id: "corr-ord-1710000005",
        created_at: "2026-03-21T15:30:00Z",
        updated_at: "2026-03-21T15:30:04Z",
      },
      {
        id: "ord-1710000006",
        timestamp: "2026-03-22T08:45:00Z",
        strategy_id: "strat-vol-01",
        client_id: "internal-trader",
        instrument_id: "ETH-OPTIONS",
        venue: "Deribit",
        side: "buy",
        order_type: "limit",
        quantity: 5.0,
        price: 210.5,
        status: "filled",
        filled_quantity: 5.0,
        average_fill_price: 210.45,
        asset_class: "CeFi",
        lane: "options",
        algo_type: "market",
        correlation_id: "corr-ord-1710000006",
        created_at: "2026-03-22T08:45:00Z",
        updated_at: "2026-03-22T08:45:03Z",
      },
      {
        id: "ord-1710000007",
        timestamp: "2026-03-23T06:00:00Z",
        strategy_id: "strat-momentum-01",
        client_id: "internal-trader",
        instrument_id: "SOL-PERP",
        venue: "Binance",
        side: "buy",
        order_type: "limit",
        quantity: 20.0,
        price: 187.3,
        status: "open",
        filled_quantity: 0,
        average_fill_price: null,
        asset_class: "CeFi",
        lane: "book",
        algo_type: "TWAP",
        correlation_id: "corr-ord-1710000007",
        created_at: "2026-03-23T06:00:00Z",
        updated_at: "2026-03-23T06:00:00Z",
      },
      {
        id: "ord-1710000008",
        timestamp: "2026-03-23T07:30:00Z",
        strategy_id: "strat-defi-lp-01",
        client_id: "internal-trader",
        instrument_id: "AAVE_V3:SUPPLY:USDT",
        venue: "Aave",
        side: "buy",
        order_type: "market",
        quantity: 5000.0,
        price: 1.0,
        status: "pending",
        filled_quantity: 0,
        average_fill_price: null,
        asset_class: "DeFi",
        lane: "defi",
        algo_type: null,
        correlation_id: "corr-ord-1710000008",
        created_at: "2026-03-23T07:30:00Z",
        updated_at: "2026-03-23T07:30:00Z",
      },
    ],
  };
}

function loadState(): MockTradeLedgerState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as MockTradeLedgerState;
  } catch {
    /* ignore */
  }
  return defaultState();
}

function saveState(state: MockTradeLedgerState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Singleton
let _state: MockTradeLedgerState | null = null;

function getState(): MockTradeLedgerState {
  if (!_state) _state = loadState();
  return _state;
}

function persist(): void {
  if (_state) saveState(_state);
}

// --- Queries ---

export function getOrders(): MockOrder[] {
  return getState().orders;
}

export function getOrdersByStatus(status: MockOrder["status"]): MockOrder[] {
  return getState().orders.filter((o) => o.status === status);
}

// --- Mutations ---

export interface PlaceOrderParams {
  strategy_id?: string | null;
  client_id: string;
  instrument_id: string;
  venue: string;
  side: "buy" | "sell";
  order_type: "market" | "limit";
  quantity: number;
  price: number;
  asset_class: "CeFi" | "DeFi" | "TradFi" | "Sports" | "Prediction";
  lane: "book" | "sports" | "defi" | "options" | "predictions";
  algo_type?: string | null;
}

export function placeMockOrder(params: PlaceOrderParams): MockOrder {
  const now = new Date().toISOString();
  const id = `ord-${Date.now()}`;
  const order: MockOrder = {
    id,
    timestamp: now,
    strategy_id: params.strategy_id ?? null,
    client_id: params.client_id,
    instrument_id: params.instrument_id,
    venue: params.venue,
    side: params.side,
    order_type: params.order_type,
    quantity: params.quantity,
    price: params.price,
    status: "pending",
    filled_quantity: 0,
    average_fill_price: null,
    asset_class: params.asset_class,
    lane: params.lane,
    algo_type: params.algo_type ?? null,
    correlation_id: `corr-${id}`,
    created_at: now,
    updated_at: now,
  };

  getState().orders.push(order);
  persist();

  setTimeout(() => {
    const state = getState();
    const idx = state.orders.findIndex((o) => o.id === id);
    if (idx !== -1 && state.orders[idx].status === "pending") {
      state.orders[idx] = {
        ...state.orders[idx],
        status: "filled",
        filled_quantity: params.quantity,
        average_fill_price: params.price,
        updated_at: new Date().toISOString(),
      };
      persist();
      // Notify listeners (e.g. positions context) that an order was filled
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("mock-order-filled", { detail: { orderId: id } }));
      }
    }
  }, 200);

  return order;
}

export function cancelMockOrder(id: string): MockOrder | null {
  const state = getState();
  const idx = state.orders.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  state.orders[idx] = {
    ...state.orders[idx],
    status: "cancelled",
    updated_at: new Date().toISOString(),
  };
  persist();
  return state.orders[idx];
}

export function amendMockOrder(
  id: string,
  updates: { quantity?: number; price?: number },
): MockOrder | null {
  const state = getState();
  const idx = state.orders.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  state.orders[idx] = {
    ...state.orders[idx],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  persist();
  return state.orders[idx];
}

export function resetMockOrders(): void {
  _state = defaultState();
  persist();
}
