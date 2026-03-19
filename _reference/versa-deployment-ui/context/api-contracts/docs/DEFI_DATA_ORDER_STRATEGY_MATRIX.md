# DeFi Data & Order Strategy Matrix

**SSOT for:** per-venue decisions on market data source, dev order routing, and VCR cassette targets across all DeFi protocols.

Aligned with: [CROSS_VENUE_MATRIX.md](CROSS_VENUE_MATRIX.md), [VENUE_DATA_TYPES.md](VENUE_DATA_TYPES.md), [TRANSPORT_AND_ENDPOINTS.md](TRANSPORT_AND_ENDPOINTS.md)

Plan reference: `unified-trading-pm/plans/active/defi_dev_testnet_data_rollout_2026_03_13.plan.md`

---

## Terminology

| Term                   | Meaning                                                                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Market data source** | Where prices and state come from. For DeFi this is **always mainnet/real** — reading the chain is read-only and free.                                                          |
| **Anvil fork**         | Local process (Foundry). Boots in 2s, forks mainnet state, orders execute with real contract math, no real money. Free.                                                        |
| **Tenderly fork**      | Hosted mainnet fork. Persistent, team-shareable, web dashboard. Used for dev Cloud Run deployment. Free tier: 50 txns/day.                                                     |
| **Dry-run**            | Order logged/published as event but no on-chain tx sent. Used when fork unavailable for a protocol.                                                                            |
| **Sepolia**            | Ethereum public testnet (chain_id 11155111). Prices fake, liquidity fake. **Only valid for tx-mechanics testing** (signing, broadcast, receipt parsing). NOT for strategy/PnL. |
| **VCR cassette**       | Real HTTP response recorded from the API and committed to `external/{venue}/mocks/`. Replayed in CI with no live keys.                                                         |

---

## Ethereum DeFi Protocols

| Venue          | Market Data Source (always real mainnet)        | Data Auth Required                      | Dev Order Routing                                                                                                                    | Sepolia contracts?                           | VCR Cassette Target                                          | SM Secret                             |
| -------------- | ----------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- | ------------------------------------------------------------ | ------------------------------------- |
| **Aave V3**    | The Graph gateway subgraph + Alchemy `eth_call` | `THE_GRAPH_API_KEY` + `ALCHEMY_API_KEY` | **Anvil/Tenderly fork** — supply/borrow/repay against real pool state                                                                | ✅ `0x6Ae43d...` (use fork instead)          | `thegraph_aave` GraphQL + `alchemy_eth_call`                 | `thegraph-api-key`, `alchemy-api-key` |
| **Morpho**     | The Graph `morpho-association/morpho-blue`      | None (free subgraph)                    | **Anvil/Tenderly fork** — vault deposit/redeem                                                                                       | ✅ Sepolia (use fork instead)                | `thegraph_morpho` GraphQL                                    | —                                     |
| **EtherFi**    | DefiLlama REST + Alchemy `eth_call`             | `ALCHEMY_API_KEY`                       | **Anvil/Tenderly fork** — deposit ETH → real eETH minted by fork contract                                                            | ❌ Mainnet only                              | `defillama_tvl` + `alchemy_eth_call`                         | `alchemy-api-key`                     |
| **Instadapp**  | The Graph `instadapp/dsa-v2`                    | None (free subgraph)                    | **Anvil/Tenderly fork** — create DSA, cast spells                                                                                    | ✅ Sepolia DSA-V2 (use fork instead)         | `thegraph_instadapp` GraphQL                                 | —                                     |
| **Uniswap V3** | The Graph mainnet + Alchemy                     | `THE_GRAPH_API_KEY` + `ALCHEMY_API_KEY` | **Anvil/Tenderly fork** — real tick math against mainnet liquidity; fills and slippage are real                                      | ✅ Sepolia (use fork instead)                | `thegraph_uniswap_v3` + `alchemy_eth_call`                   | `thegraph-api-key`, `alchemy-api-key` |
| **Uniswap V4** | The Graph gateway                               | `THE_GRAPH_API_KEY`                     | **Anvil/Tenderly fork**                                                                                                              | ✅ Sepolia + Base Sepolia (use fork instead) | `thegraph_uniswap_v4` gateway                                | `thegraph-api-key`                    |
| **Uniswap V2** | The Graph free tier                             | None                                    | **Anvil/Tenderly fork**                                                                                                              | ✅ Sepolia (use fork instead)                | `thegraph_uniswap_v2` free                                   | —                                     |
| **Balancer**   | `api-v3.balancer.fi` GraphQL                    | None (free)                             | **Anvil/Tenderly fork**                                                                                                              | ✅ Sepolia (use fork instead)                | `thegraph_balancer` GraphQL                                  | —                                     |
| **Curve**      | DefiLlama + Alchemy RPC                         | `ALCHEMY_API_KEY`                       | **Anvil/Tenderly fork**                                                                                                              | ⚠️ Partial Sepolia                           | `defillama_yields` + `alchemy_eth_call`                      | `alchemy-api-key`                     |
| **Lido**       | DefiLlama + Alchemy RPC                         | `ALCHEMY_API_KEY`                       | **Anvil/Tenderly fork** — stake ETH → real stETH from fork contract; use Tenderly time-travel API to advance chain for yield accrual | ⚠️ Holešky limited (use fork instead)        | `defillama_tvl` + `alchemy_eth_call`                         | `alchemy-api-key`                     |
| **Euler**      | Alchemy RPC                                     | `ALCHEMY_API_KEY`                       | **Anvil/Tenderly fork**                                                                                                              | ✅ Sepolia                                   | `alchemy_eth_call`                                           | `alchemy-api-key`                     |
| **Fluid**      | Alchemy RPC                                     | `ALCHEMY_API_KEY`                       | **Anvil/Tenderly fork** — mainnet contracts work on fork                                                                             | ❌ Mainnet only                              | `alchemy_eth_call`                                           | `alchemy-api-key`                     |
| **Ethena**     | DefiLlama + Alchemy                             | `ALCHEMY_API_KEY`                       | **Anvil/Tenderly fork** — mint sUSDe on fork                                                                                         | ❌ Mainnet only                              | `defillama_yields` + `alchemy_eth_call`                      | `alchemy-api-key`                     |
| **DefiLlama**  | REST (free, no key, 300 req/min)                | None                                    | N/A — data source only                                                                                                               | N/A                                          | `defillama_tvl`, `defillama_yields`, `defillama_stablecoins` | —                                     |

---

## CeFi / Onchain Perps

| Venue           | Market Data Source                          | Data Auth Required            | Dev Order Routing                                         | Notes                                                                                            | VCR Cassette Target                                             | SM Secret                                                            |
| --------------- | ------------------------------------------- | ----------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Hyperliquid** | S3 (bulk history) + REST + WebSocket (live) | `aws-hyperliquid-s3` ✅ in SM | **Hyperliquid own testnet** `api.hyperliquid-testnet.xyz` | Not EVM — own L1 chain. Cannot fork. Real testnet with real test accounts and testnet liquidity. | `hyperliquid_rest` (partially done), `hyperliquid_testnet_rest` | `hyperliquid-api-credentials`, `hyperliquid-testnet-api-credentials` |

---

## Data Mode × Order Mode Matrix

| Scenario             | Market Data                   | Orders                     | When used                    |
| -------------------- | ----------------------------- | -------------------------- | ---------------------------- |
| `VCR_MODE=playback`  | VCR cassettes (no live calls) | Dry-run (logged only)      | CI, dev without API keys     |
| `VCR_MODE=record`    | Live mainnet APIs             | Dry-run (logged only)      | Recording new cassettes      |
| `FORK_MODE=anvil`    | Live mainnet APIs (real-time) | Anvil local fork           | Local dev, integration tests |
| `FORK_MODE=tenderly` | Live mainnet APIs (real-time) | Tenderly Virtual TestNet   | Dev Cloud Run deployment     |
| `TESTNET_MODE=true`  | Hyperliquid testnet feed      | Hyperliquid testnet orders | Hyperliquid-only testing     |
| prod (no flags)      | Live mainnet APIs             | Real mainnet               | Production only              |

---

## VCR Cassette Targets (DeFi — not yet recorded)

These entries need to be added to `unified_api_contracts/vcr_endpoints.py` and cassettes recorded:

| Key                        | Endpoint                                                         | Method       | Auth                       | Priority |
| -------------------------- | ---------------------------------------------------------------- | ------------ | -------------------------- | -------- |
| `thegraph_aave`            | `gateway.thegraph.com/api/{key}/subgraphs/id/...`                | POST GraphQL | `THE_GRAPH_API_KEY` in URL | P0       |
| `thegraph_morpho`          | `api.thegraph.com/subgraphs/name/morpho-association/morpho-blue` | POST GraphQL | None                       | P0       |
| `thegraph_uniswap_v3`      | The Graph Uniswap V3 subgraph                                    | POST GraphQL | `THE_GRAPH_API_KEY`        | P0       |
| `thegraph_uniswap_v4`      | The Graph gateway Uniswap V4                                     | POST GraphQL | `THE_GRAPH_API_KEY`        | P0       |
| `thegraph_uniswap_v2`      | The Graph Uniswap V2 (free)                                      | POST GraphQL | None                       | P1       |
| `thegraph_instadapp`       | `api.thegraph.com/subgraphs/name/instadapp/dsa-v2`               | POST GraphQL | None                       | P1       |
| `thegraph_balancer`        | `api-v3.balancer.fi/graphql`                                     | POST GraphQL | None                       | P1       |
| `alchemy_eth_call`         | `eth-mainnet.g.alchemy.com/v2/{key}` JSON-RPC `eth_call`         | POST         | `ALCHEMY_API_KEY` in URL   | P0       |
| `alchemy_eth_getlogs`      | `eth-mainnet.g.alchemy.com/v2/{key}` JSON-RPC `eth_getLogs`      | POST         | `ALCHEMY_API_KEY` in URL   | P1       |
| `defillama_tvl`            | `api.llama.fi/tvl/{protocol}`                                    | GET          | None                       | P0       |
| `defillama_yields`         | `yields.llama.fi/pools`                                          | GET          | None                       | P0       |
| `defillama_stablecoins`    | `stablecoins.llama.fi/stablecoins`                               | GET          | None                       | P2       |
| `aavescan`                 | AaveScan analytics endpoint                                      | GET          | `AAVESCAN_API_KEY`         | P1       |
| `hyperliquid_testnet_rest` | `api.hyperliquid-testnet.xyz/info`                               | POST         | Testnet key                | P1       |

Recording script: `unified-api-contracts/scripts/record_vcr_cassettes.py --venue thegraph_aave`

---

## Position Routing Architecture

The `get_defi_rpc_url()` function in `unified-defi-execution-interface/protocols/base.py` is the single seam:

```
FORK_MODE=anvil    → http://localhost:8545             (local Anvil fork)
FORK_MODE=tenderly → SM: tenderly-fork-rpc-url         (hosted Tenderly VirtualTestNet)
DEFI_RPC_URL set   → use that URL directly             (local override, no SM lookup)
(prod default)     → SM: alchemy-api-key mainnet URL   (real chain)
```

Both `unified-defi-execution-interface` (orders) and `unified-position-interface` (position reads) call this function. Every downstream service (risk, strategy, alerting) is unchanged — they consume UPI without knowing which chain it's reading from.

---

## References

- `unified-trading-pm/plans/active/defi_dev_testnet_data_rollout_2026_03_13.plan.md` — master plan
- `unified-trading-pm/plans/active/ai/api_keys_and_auth.plan.md` — SM secret tracking per venue
- [CROSS_VENUE_MATRIX.md](CROSS_VENUE_MATRIX.md) — CeFi/TradFi/Sports venue comparison
- [VENUE_DATA_TYPES.md](VENUE_DATA_TYPES.md) — per-venue data type availability
- [MOCKS_AND_VCR.md](MOCKS_AND_VCR.md) — VCR cassette recording protocol
- `deployment-service/docs/dev-environment.md` — dev infra provisioning (Terraform)
