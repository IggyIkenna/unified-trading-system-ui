# DeFi Venue Matrix

SSOT for DeFi venue readiness across mainnet and testnet deployments.

Source: `unified-market-interface/unified_market_interface/factory.py` VENUE_REGISTRY (defi category).

## DeFi Venues (14 protocols)

| venue_name | chain       | testnet_chain | testnet_rpc                        | api_base_url               | has_testnet | status         |
| ---------- | ----------- | ------------- | ---------------------------------- | -------------------------- | ----------- | -------------- |
| aave_v3    | ethereum    | sepolia       | https://rpc.sepolia.org            | https://app.aave.com       | yes         | live (Phase 2) |
| balancer   | ethereum    | sepolia       | https://rpc.sepolia.org            | https://api.balancer.fi    | yes         | live (Phase 2) |
| curve      | ethereum    | sepolia       | https://rpc.sepolia.org            | https://api.curve.fi       | yes         | live (Phase 2) |
| ethena     | ethereum    | sepolia       | https://rpc.sepolia.org            | https://app.ethena.fi      | partial     | live (Phase 2) |
| euler      | ethereum    | sepolia       | https://rpc.sepolia.org            | https://app.euler.finance  | yes         | live (Phase 2) |
| fluid      | ethereum    | sepolia       | https://rpc.sepolia.org            | https://fluid.instadapp.io | partial     | live (Phase 2) |
| etherfi    | ethereum    | holesky       | https://rpc.holesky.ethpandaops.io | https://app.ether.fi       | yes         | live (Phase 2) |
| lido       | ethereum    | holesky       | https://rpc.holesky.ethpandaops.io | https://stake.lido.fi      | yes         | live (Phase 2) |
| morpho     | ethereum    | sepolia       | https://rpc.sepolia.org            | https://app.morpho.org     | yes         | live (Phase 2) |
| uniswap_v2 | ethereum    | sepolia       | https://rpc.sepolia.org            | https://api.uniswap.org    | yes         | live (Phase 2) |
| uniswap_v3 | ethereum    | sepolia       | https://rpc.sepolia.org            | https://api.uniswap.org    | yes         | live (Phase 2) |
| uniswap_v4 | ethereum    | sepolia       | https://rpc.sepolia.org            | https://api.uniswap.org    | partial     | live (Phase 2) |
| instadapp  | ethereum    | sepolia       | https://rpc.sepolia.org            | https://api.instadapp.io   | partial     | live (Phase 2) |
| defillama  | multi-chain | n/a           | n/a                                | https://api.llama.fi       | no          | live (Phase 2) |

## Onchain Perps (1 venue)

| venue_name  | chain    | testnet_chain    | testnet_rpc                            | api_base_url                | has_testnet | status         |
| ----------- | -------- | ---------------- | -------------------------------------- | --------------------------- | ----------- | -------------- |
| hyperliquid | arbitrum | arbitrum-sepolia | https://sepolia-rollup.arbitrum.io/rpc | https://api.hyperliquid.xyz | yes         | live (Phase 2) |

## Notes

- **Testnet chains**: Most DeFi protocols deploy on Sepolia (Ethereum L1 testnet). Staking protocols (Lido, EtherFi) use
  Holesky which has a beacon chain for validator testing.
- **partial has_testnet**: Protocol has limited testnet functionality (e.g., no full pool deployment, read-only, or
  missing features).
- **defillama**: Aggregator API -- no testnet needed (read-only price/TVL data).
- **Market data adapters**: All 14 DeFi adapters are registered in UMI `VENUE_REGISTRY` and accessible via
  `get_adapter(venue, category="defi")`.
- **Execution connectors**: Live execution uses `unified-defi-execution-interface` connectors (AAVEConnector,
  UniswapConnector, LidoConnector, EtherFiConnector).
