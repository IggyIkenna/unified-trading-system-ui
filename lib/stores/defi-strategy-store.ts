/**
 * Persistent store for DeFi strategy configurations and deployed strategy state.
 * Backed by localStorage so configs survive page reloads and can be reset via resetDemo().
 */

const STORAGE_KEY = "defi-strategy-configs";

export interface DefiStrategyConfig {
  strategy_id: string;
  share_class: string;
  status: "draft" | "deployed" | "paused" | "stopped";
  deployed_at: string | null;
  config: Record<string, unknown>;
}

interface DefiStrategyStoreState {
  configs: DefiStrategyConfig[];
}

function defaultConfigs(): DefiStrategyStoreState {
  return {
    configs: [
      {
        strategy_id: "AAVE_LENDING",
        share_class: "USDT",
        status: "deployed",
        deployed_at: "2026-03-25T10:00:00Z",
        config: {
          lending_basket: ["USDC", "USDT"],
          min_apy_threshold: 2,
          chain: "ETHEREUM",
          capital_usd: 1000000,
        },
      },
      {
        strategy_id: "BASIS_TRADE",
        share_class: "USDT",
        status: "deployed",
        deployed_at: "2026-03-25T10:00:00Z",
        config: {
          basis_coins: ["ETH", "BTC"],
          perp_venues: ["HYPERLIQUID", "BINANCE", "OKX", "BYBIT"],
          min_funding_rate: 0.01,
          max_single_venue_pct: 40,
          max_single_coin_pct: 60,
          capital_usd: 2000000,
        },
      },
      {
        strategy_id: "STAKED_BASIS",
        share_class: "ETH",
        status: "deployed",
        deployed_at: "2026-03-26T08:00:00Z",
        config: {
          lst_token: "weETH",
          perp_venue: "HYPERLIQUID",
          max_delta_deviation_pct: 2,
          capital_usd: 1500000,
        },
      },
      {
        strategy_id: "RECURSIVE_STAKED_BASIS",
        share_class: "ETH",
        status: "deployed",
        deployed_at: "2026-03-27T09:00:00Z",
        config: {
          target_leverage: 2.5,
          max_leverage: 3.0,
          min_net_apy: 8,
          hedged: true,
          reward_mode: "all",
          max_depeg_tolerance_pct: 2,
          flash_loan_provider: "MORPHO",
          capital_usd: 3000000,
        },
      },
    ],
  };
}

let _state: DefiStrategyStoreState | null = null;

function loadState(): DefiStrategyStoreState {
  if (typeof window === "undefined") return defaultConfigs();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DefiStrategyStoreState;
  } catch {
    /* ignore */
  }
  return defaultConfigs();
}

function saveState(state: DefiStrategyStoreState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getState(): DefiStrategyStoreState {
  if (!_state) _state = loadState();
  return _state;
}

export function getDefiStrategyConfigs(): DefiStrategyConfig[] {
  return getState().configs;
}

export function getDefiStrategyConfig(strategyId: string): DefiStrategyConfig | undefined {
  return getState().configs.find((c) => c.strategy_id === strategyId);
}

export function saveDefiStrategyConfig(strategyId: string, config: Record<string, unknown>): void {
  const state = getState();
  const idx = state.configs.findIndex((c) => c.strategy_id === strategyId);
  if (idx !== -1) {
    state.configs[idx] = { ...state.configs[idx], config: { ...state.configs[idx].config, ...config } };
  } else {
    state.configs.push({
      strategy_id: strategyId,
      share_class: "USDT",
      status: "draft",
      deployed_at: null,
      config,
    });
  }
  saveState(state);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("defi-config-saved", { detail: { strategyId } }));
  }
}

export function deployDefiStrategy(strategyId: string): void {
  const state = getState();
  const idx = state.configs.findIndex((c) => c.strategy_id === strategyId);
  if (idx !== -1) {
    state.configs[idx] = {
      ...state.configs[idx],
      status: "deployed",
      deployed_at: new Date().toISOString(),
    };
    saveState(state);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("defi-strategy-deployed", { detail: { strategyId } }));
    }
  }
}

export function pauseDefiStrategy(strategyId: string): void {
  const state = getState();
  const idx = state.configs.findIndex((c) => c.strategy_id === strategyId);
  if (idx !== -1) {
    state.configs[idx] = { ...state.configs[idx], status: "paused" };
    saveState(state);
  }
}

export function resetDefiStrategyConfigs(): void {
  _state = defaultConfigs();
  saveState(_state);
}
