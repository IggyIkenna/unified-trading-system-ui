/**
 * Mock fixtures for Strategy Architecture v2 UI — allocator, venue
 * capability, execution policy, family aggregates.
 *
 * Shape is locked to the TypeScript types in `lib/architecture-v2/`; once the
 * portfolio-allocator-service + execution-service + risk-and-exposure
 * services (phases 4-7) are wired, the API gateway returns the same shape
 * from `/api/v1/allocator/*`, `/api/v1/venues/capabilities`, and
 * `/api/v1/execution/policies` — UI swaps the fixture import for a fetch.
 */

import type {
  AllocationDirective,
  AllocatorInstance,
  ExecutionPolicyRow,
  ManualApprovalQueueItem,
  ShadowCompareRow,
  VenueCapabilityView,
} from "@/lib/architecture-v2";

export const MOCK_ALLOCATOR_INSTANCES: readonly AllocatorInstance[] = [
  {
    allocator_instance_id: "alloc-odum-sharpe-v1",
    client_id: "client-odum",
    client_name: "Odum Internal",
    archetype: "SHARPE_WEIGHTED",
    mode: "PRIMARY",
    cadence: "DAILY",
    share_class: "USD",
    status: "ACTIVE",
    managed_strategy_instance_ids: [
      "si-ml-dir-btc-v3",
      "si-ml-dir-eth-v3",
      "si-carry-basis-perp-btc-v2",
      "si-stat-arb-eth-sol-v1",
    ],
    guard_rails: {
      max_weight: 0.35,
      min_weight: 0.05,
      max_turnover_pct: 0.25,
      correlation_cap: 0.75,
      family_diversification: true,
      category_diversification: true,
    },
    last_directive_at: "2026-04-17T06:00:00Z",
    total_managed_nav_usd: 8_500_000,
  },
  {
    allocator_instance_id: "alloc-odum-kelly-shadow",
    client_id: "client-odum",
    client_name: "Odum Internal",
    archetype: "KELLY",
    mode: "SHADOW",
    cadence: "DAILY",
    share_class: "USD",
    status: "ACTIVE",
    managed_strategy_instance_ids: [
      "si-ml-dir-btc-v3",
      "si-ml-dir-eth-v3",
      "si-carry-basis-perp-btc-v2",
      "si-stat-arb-eth-sol-v1",
    ],
    guard_rails: {
      max_weight: 0.5,
      min_weight: 0.02,
      max_turnover_pct: 0.4,
      correlation_cap: 0.8,
      family_diversification: true,
      category_diversification: false,
    },
    last_directive_at: "2026-04-17T06:00:00Z",
    total_managed_nav_usd: 8_500_000,
    partner_primary_id: "alloc-odum-sharpe-v1",
  },
  {
    allocator_instance_id: "alloc-desk-a-manual",
    client_id: "client-desk-a",
    client_name: "Desk A Fund",
    archetype: "MANUAL",
    mode: "PRIMARY",
    cadence: "ON_EVENT",
    share_class: "USDT",
    status: "PENDING_APPROVAL",
    managed_strategy_instance_ids: ["si-vol-options-btc-v1", "si-event-driven-macro-v2"],
    guard_rails: {
      max_weight: 0.6,
      min_weight: 0.0,
      max_turnover_pct: 1.0,
      correlation_cap: 0.9,
      family_diversification: false,
      category_diversification: false,
    },
    last_directive_at: null,
    total_managed_nav_usd: 1_250_000,
  },
  {
    allocator_instance_id: "alloc-desk-b-riskparity",
    client_id: "client-desk-b",
    client_name: "Desk B Fund",
    archetype: "RISK_PARITY",
    mode: "PRIMARY",
    cadence: "WEEKLY",
    share_class: "USD",
    status: "ACTIVE",
    managed_strategy_instance_ids: ["si-carry-basis-dated-eth-v2", "si-ml-dir-spy-v1", "si-stat-arb-mm-cross-v1"],
    guard_rails: {
      max_weight: 0.33,
      min_weight: 0.1,
      max_turnover_pct: 0.15,
      correlation_cap: 0.7,
      family_diversification: true,
      category_diversification: true,
    },
    last_directive_at: "2026-04-14T12:00:00Z",
    total_managed_nav_usd: 4_750_000,
  },
];

export const MOCK_DIRECTIVE_HISTORY: readonly AllocationDirective[] = [
  {
    directive_id: "dir-20260417-06",
    allocator_instance_id: "alloc-odum-sharpe-v1",
    client_id: "client-odum",
    emitted_at: "2026-04-17T06:00:00Z",
    cadence_trigger: "DAILY",
    archetype: "SHARPE_WEIGHTED",
    mode: "PRIMARY",
    share_class: "USD",
    equity_directives: [
      { strategy_instance_id: "si-ml-dir-btc-v3", target_equity_usd: 3_100_000, weight: 0.365, previous_weight: 0.35 },
      { strategy_instance_id: "si-ml-dir-eth-v3", target_equity_usd: 2_350_000, weight: 0.276, previous_weight: 0.3 },
      {
        strategy_instance_id: "si-carry-basis-perp-btc-v2",
        target_equity_usd: 1_900_000,
        weight: 0.224,
        previous_weight: 0.2,
      },
      {
        strategy_instance_id: "si-stat-arb-eth-sol-v1",
        target_equity_usd: 1_150_000,
        weight: 0.135,
        previous_weight: 0.15,
      },
    ],
    total_nav_usd: 8_500_000,
    approved: true,
    approved_by: "auto",
    notes: "Cadence trigger; Sharpe-weighted auto-rebalance",
  },
  {
    directive_id: "dir-20260416-06",
    allocator_instance_id: "alloc-odum-sharpe-v1",
    client_id: "client-odum",
    emitted_at: "2026-04-16T06:00:00Z",
    cadence_trigger: "DAILY",
    archetype: "SHARPE_WEIGHTED",
    mode: "PRIMARY",
    share_class: "USD",
    equity_directives: [
      { strategy_instance_id: "si-ml-dir-btc-v3", target_equity_usd: 2_975_000, weight: 0.35, previous_weight: 0.32 },
      { strategy_instance_id: "si-ml-dir-eth-v3", target_equity_usd: 2_550_000, weight: 0.3, previous_weight: 0.28 },
      {
        strategy_instance_id: "si-carry-basis-perp-btc-v2",
        target_equity_usd: 1_700_000,
        weight: 0.2,
        previous_weight: 0.22,
      },
      {
        strategy_instance_id: "si-stat-arb-eth-sol-v1",
        target_equity_usd: 1_275_000,
        weight: 0.15,
        previous_weight: 0.18,
      },
    ],
    total_nav_usd: 8_500_000,
    approved: true,
    approved_by: "auto",
    notes: "Cadence trigger",
  },
  {
    directive_id: "dir-20260417-pending-a",
    allocator_instance_id: "alloc-desk-a-manual",
    client_id: "client-desk-a",
    emitted_at: "2026-04-17T09:15:00Z",
    cadence_trigger: "ON_EVENT",
    archetype: "MANUAL",
    mode: "PRIMARY",
    share_class: "USDT",
    equity_directives: [
      { strategy_instance_id: "si-vol-options-btc-v1", target_equity_usd: 750_000, weight: 0.6, previous_weight: 0.45 },
      {
        strategy_instance_id: "si-event-driven-macro-v2",
        target_equity_usd: 500_000,
        weight: 0.4,
        previous_weight: 0.55,
      },
    ],
    total_nav_usd: 1_250_000,
    approved: false,
    approved_by: null,
    notes: "Operator proposal — awaiting review",
  },
];

export const MOCK_SHADOW_COMPARE: readonly ShadowCompareRow[] = [
  { strategy_instance_id: "si-ml-dir-btc-v3", primary_weight: 0.365, shadow_weight: 0.5, abs_diff_bps: 1350 },
  { strategy_instance_id: "si-ml-dir-eth-v3", primary_weight: 0.276, shadow_weight: 0.3, abs_diff_bps: 240 },
  { strategy_instance_id: "si-carry-basis-perp-btc-v2", primary_weight: 0.224, shadow_weight: 0.15, abs_diff_bps: 740 },
  { strategy_instance_id: "si-stat-arb-eth-sol-v1", primary_weight: 0.135, shadow_weight: 0.05, abs_diff_bps: 850 },
];

export const MOCK_APPROVAL_QUEUE: readonly ManualApprovalQueueItem[] = [
  {
    directive_id: "dir-20260417-pending-a",
    allocator_instance_id: "alloc-desk-a-manual",
    client_id: "client-desk-a",
    client_name: "Desk A Fund",
    archetype: "MANUAL",
    emitted_at: "2026-04-17T09:15:00Z",
    proposed_total_nav_usd: 1_250_000,
    num_strategies: 2,
    age_minutes: 42,
  },
];

export const MOCK_VENUE_CAPABILITIES: readonly VenueCapabilityView[] = [
  {
    venue: "BINANCE",
    display_name: "Binance",
    assetGroup: "CEFI",
    routing_mode: "SOR_AT_EXECUTION",
    features: ["SPOT_TRADING", "PERPS_TRADING", "CROSS_MARGIN", "PORTFOLIO_MARGIN"],
    collateral_rules: {
      supported_assets: ["USDT", "USDC", "BTC", "ETH"],
      per_asset_ltv: {
        USDT: { max_ltv_pct: 95, initial_haircut_pct: 5, maintenance_haircut_pct: 3 },
        USDC: { max_ltv_pct: 95, initial_haircut_pct: 5, maintenance_haircut_pct: 3 },
        BTC: { max_ltv_pct: 80, initial_haircut_pct: 20, maintenance_haircut_pct: 12 },
        ETH: { max_ltv_pct: 75, initial_haircut_pct: 25, maintenance_haircut_pct: 15 },
      },
      netting_enabled: true,
    },
    margin: {
      modes: ["ISOLATED", "CROSS", "PORTFOLIO"],
      default_mode: "CROSS",
      max_leverage: 20,
      notes: "Portfolio margin available post KYC + $5M equity",
    },
    commission: {
      type: "MAKER_TAKER",
      flat_bps: null,
      tiers: [
        { min_volume_usd: 0, maker_bps: 1.0, taker_bps: 4.0 },
        { min_volume_usd: 50_000_000, maker_bps: 0.8, taker_bps: 3.0 },
        { min_volume_usd: 1_000_000_000, maker_bps: 0.0, taker_bps: 1.5 },
      ],
    },
    notes: "Primary CEFI venue; supports portfolio margin",
  },
  {
    venue: "HYPERLIQUID",
    display_name: "Hyperliquid",
    assetGroup: "DEFI",
    routing_mode: "SOR_AT_EXECUTION",
    features: ["PERPS_TRADING", "CROSS_MARGIN"],
    collateral_rules: {
      supported_assets: ["USDC"],
      per_asset_ltv: { USDC: { max_ltv_pct: 100, initial_haircut_pct: 0, maintenance_haircut_pct: 1 } },
      netting_enabled: true,
    },
    margin: {
      modes: ["CROSS"],
      default_mode: "CROSS",
      max_leverage: 50,
      notes: null,
    },
    commission: {
      type: "MAKER_TAKER",
      flat_bps: null,
      tiers: [{ min_volume_usd: 0, maker_bps: 0.2, taker_bps: 3.5 }],
    },
    notes: "DEX perps; on-chain margin",
  },
  {
    venue: "AAVE_V3",
    display_name: "Aave V3",
    assetGroup: "DEFI",
    routing_mode: "STRATEGY_PICKED",
    features: ["FLASH_LOAN", "LP_PROVISION"],
    collateral_rules: {
      supported_assets: ["WETH", "WBTC", "USDC", "DAI"],
      per_asset_ltv: {
        WETH: { max_ltv_pct: 80, initial_haircut_pct: 20, maintenance_haircut_pct: 12 },
        WBTC: { max_ltv_pct: 70, initial_haircut_pct: 30, maintenance_haircut_pct: 20 },
        USDC: { max_ltv_pct: 87, initial_haircut_pct: 13, maintenance_haircut_pct: 8 },
        DAI: { max_ltv_pct: 87, initial_haircut_pct: 13, maintenance_haircut_pct: 8 },
      },
      netting_enabled: false,
    },
    margin: {
      modes: ["ISOLATED"],
      default_mode: "ISOLATED",
      max_leverage: 1,
      notes: "LTV-based; liquidation at health factor < 1",
    },
    commission: {
      type: "FLAT",
      flat_bps: 0,
      tiers: [],
    },
    notes: "Lending protocol; flash loans enabled",
  },
  {
    venue: "UNITY",
    display_name: "Unity (meta-broker)",
    assetGroup: "SPORTS",
    routing_mode: "META_BROKER",
    features: ["BACK_LAY_EXCHANGE"],
    collateral_rules: {
      supported_assets: ["USD"],
      per_asset_ltv: { USD: { max_ltv_pct: 100, initial_haircut_pct: 0, maintenance_haircut_pct: 0 } },
      netting_enabled: false,
    },
    margin: {
      modes: ["ISOLATED"],
      default_mode: "ISOLATED",
      max_leverage: 1,
      notes: "Pre-funded wallet per child book",
    },
    commission: {
      type: "FLAT",
      flat_bps: null,
      tiers: [],
    },
    notes: "Child-book commissions declared on each UnityChildBook",
  },
  {
    venue: "IBKR",
    display_name: "Interactive Brokers",
    assetGroup: "TRADFI",
    routing_mode: "STRATEGY_PICKED",
    features: ["SPOT_TRADING", "OPTIONS_TRADING"],
    collateral_rules: {
      supported_assets: ["USD", "EUR", "GBP"],
      per_asset_ltv: {
        USD: { max_ltv_pct: 100, initial_haircut_pct: 0, maintenance_haircut_pct: 0 },
        EUR: { max_ltv_pct: 100, initial_haircut_pct: 0, maintenance_haircut_pct: 0 },
        GBP: { max_ltv_pct: 100, initial_haircut_pct: 0, maintenance_haircut_pct: 0 },
      },
      netting_enabled: true,
    },
    margin: {
      modes: ["REG_T", "PORTFOLIO"],
      default_mode: "REG_T",
      max_leverage: 4,
      notes: "Portfolio margin above $110k equity",
    },
    commission: {
      type: "TIERED",
      flat_bps: null,
      tiers: [
        { min_volume_usd: 0, maker_bps: 5, taker_bps: 5 },
        { min_volume_usd: 100_000_000, maker_bps: 3, taker_bps: 3 },
      ],
    },
    notes: "Primary TradFi execution and custody",
  },
];

export const MOCK_EXECUTION_POLICIES: readonly ExecutionPolicyRow[] = [
  {
    venue: "BINANCE",
    action: "TRADE",
    condition: "urgency=HIGH AND spread_bps>50",
    decision: "RESIZE",
    rationale: "Wide spread — cap notional to 30% of orderbook depth",
    policy_version: "v12",
  },
  {
    venue: "BINANCE",
    action: "TRANSFER",
    condition: "amount_usd>250000",
    decision: "DEFER",
    rationale: "Large transfer — await risk-and-exposure approval",
    policy_version: "v12",
  },
  {
    venue: "HYPERLIQUID",
    action: "ATOMIC",
    condition: "atomic_mode=ATOMIC_ON_CHAIN AND gas_price_gwei>200",
    decision: "DEFER",
    rationale: "Gas too high; queue for off-peak execution",
    policy_version: "v9",
  },
  {
    venue: "AAVE_V3",
    action: "BORROW",
    condition: "health_factor<1.5",
    decision: "REJECT",
    rationale: "Near liquidation; no further borrow permitted",
    policy_version: "v7",
  },
  {
    venue: "UNITY",
    action: "QUOTE",
    condition: "sport NOT IN (SOCCER, TENNIS, BASKETBALL)",
    decision: "REJECT",
    rationale: "Only 3 sports enabled on Unity integration",
    policy_version: "v4",
  },
  {
    venue: "IBKR",
    action: "TRADE",
    condition: "tif=GTC AND after_hours=TRUE",
    decision: "ALLOW",
    rationale: "Pre/post market GTC orders allowed; Reg-T margin applies",
    policy_version: "v5",
  },
];
