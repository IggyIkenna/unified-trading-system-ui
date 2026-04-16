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
        venue: "BINANCE-FUTURES",
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
        venue: "HYPERLIQUID",
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
        venue: "UNISWAPV3-ETHEREUM",
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
        venue: "MULTI_VENUE",
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
        venue: "KALSHI",
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
        venue: "DERIBIT",
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
  /** Max slippage tolerance in bps — used for realistic fill simulation */
  max_slippage_bps?: number;
  /** Strategy reference/benchmark price at signal time */
  benchmark_price?: number;
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
      // Simulate realistic fill price with slippage based on order params
      // Slippage = random fraction of max tolerance (30-80% of max_slippage_bps)
      const maxSlipBps = params.max_slippage_bps ?? 5; // default 0.5 bps if not set
      const slipFraction = 0.3 + (Math.sin(Date.now() * 0.001) + 1) * 0.25; // 0.3–0.8
      const actualSlipBps = maxSlipBps * slipFraction;
      const slipMultiplier = params.side === "buy" ? (1 + actualSlipBps / 10000) : (1 - actualSlipBps / 10000);
      const fillPrice = params.price * slipMultiplier;

      state.orders[idx] = {
        ...state.orders[idx],
        status: "filled",
        filled_quantity: params.quantity,
        average_fill_price: Math.round(fillPrice * 1e8) / 1e8,
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
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("mock-ledger-reset"));
  }
}

/**
 * Get filled DeFi orders from the ledger, optionally filtered by strategy.
 * Used by contexts that need to derive state from DeFi trades.
 */
export function getFilledDefiOrders(strategyId?: string): MockOrder[] {
  return getState().orders.filter(
    (o) =>
      o.asset_class === "DeFi" &&
      o.status === "filled" &&
      (!strategyId || o.strategy_id === strategyId),
  );
}

/**
 * Compute aggregate P&L from filled DeFi orders.
 * Returns per-strategy and total P&L based on order costs.
 */
export function computeDefiLedgerPnL(): {
  totalGasCost: number;
  totalSlippage: number;
  totalNetCost: number;
  byStrategy: Record<string, { orderCount: number; totalCost: number; gasEstimate: number }>;
} {
  const filled = getState().orders.filter(
    (o) => o.asset_class === "DeFi" && o.status === "filled",
  );

  const byStrategy: Record<string, { orderCount: number; totalCost: number; gasEstimate: number }> = {};
  let totalGasCost = 0;
  let totalSlippage = 0;

  for (const order of filled) {
    const stratId = order.strategy_id ?? "UNKNOWN";
    if (!byStrategy[stratId]) {
      byStrategy[stratId] = { orderCount: 0, totalCost: 0, gasEstimate: 0 };
    }
    const entry = byStrategy[stratId];
    entry.orderCount += 1;
    // Mock gas: ~$5 per simple tx, ~$25 for flash loans, ~$15 for swaps
    const instrUpper = order.instrument_id.toUpperCase();
    const gas = instrUpper.includes("FLASH") || instrUpper.includes("MORPHO")
      ? 25
      : instrUpper.includes("SWAP") || instrUpper.includes("UNISWAP") || instrUpper.includes("CURVE")
        ? 15
        : 5;
    entry.gasEstimate += gas;
    entry.totalCost += order.quantity * order.price;
    totalGasCost += gas;
    // Mock slippage: ~0.05% of notional
    totalSlippage += order.quantity * order.price * 0.0005;
  }

  return { totalGasCost, totalSlippage, totalNetCost: totalGasCost + totalSlippage, byStrategy };
}

export function computeCeFiLedgerPnL(): {
  totalCommission: number;
  totalSlippage: number;
  totalNotional: number;
  orderCount: number;
} {
  const filled = getState().orders.filter(
    (o) => o.asset_class === "CeFi" && o.status === "filled",
  );

  let totalCommission = 0;
  let totalSlippage = 0;
  let totalNotional = 0;

  for (const order of filled) {
    const notional = order.quantity * (order.average_fill_price ?? order.price);
    totalNotional += notional;
    totalCommission += notional * 0.0004;
    if (order.average_fill_price && order.price > 0) {
      totalSlippage += Math.abs(order.average_fill_price - order.price) * order.quantity;
    }
  }

  return { totalCommission, totalSlippage, totalNotional, orderCount: filled.length };
}
