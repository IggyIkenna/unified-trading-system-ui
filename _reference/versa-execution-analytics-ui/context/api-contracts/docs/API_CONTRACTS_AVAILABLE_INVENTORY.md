# API Contracts Available Inventory

**Source of truth:** `venue_manifest.py`, `endpoints.py`, `SCHEMA_VERSIONS.md`.
**Last updated:** 2026-02-27.

---

## 1. CeFi

### Binance (spot / usdm / coinm / papi)

| Venue Key       | Base URL                 | Schema Count | Key Schemas                                                                                                                    | Gaps                                                                           |
| --------------- | ------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| binance         | api.binance.com/api/v3   | 8            | BinanceTicker, BinanceOrderBook, BinanceTrade, BinanceOrder, BinanceKline, BinanceSymbol, BinanceExchangeInfo, BinancePosition | BinanceSymbol optional fields; withdrawal schema duplication (cex vs binance/) |
| binance-futures | fapi.binance.com/fapi/v1 | (shared)     | BinanceTicker, BinanceFundingRateHistory, BinancePremiumIndex, BinancePositionRisk, BinanceAdlQuantile, BinanceInsuranceFund   | !ticker@arr deprecation 2026-03-26; /fapi/v3 endpoints exist                   |
| binance-coinm   | dapi.binance.com/dapi/v1 | (shared)     | Same as binance-futures                                                                                                        | —                                                                              |
| binance-papi    | papi.binance.com/papi/v1 | (shared)     | BinancePapiAccount, BinancePapiBalance, BinancePapiPosition                                                                    | —                                                                              |

**Error:** BinanceError

### OKX

| Venue Key | Base URL       | Schema Count | Key Schemas                                                                                                                                                                                                                                                                                                | Gaps                                          |
| --------- | -------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| okx       | okx.com/api/v5 | 4+           | OKXMarket, OKXTicker, OKXOrder, OKXPosition, OKXOrderBook, OKXFeeRate, OKXFundingRateHistory, OKXDepositAddress, OKXDepositHistory, OKXWithdrawalHistory, OKXFundTransfer, OKXLongShortRatio, OKXOpenInterest, OKXOpenInterestHistory, OKXRiskLimit, OKXPortfolioMarginAccount, OKXDeliveryExerciseHistory | OKX trades REST (low); OKX candles REST (low) |

**Error:** OKXError

### Bybit

| Venue Key | Base URL         | Schema Count | Key Schemas                                                                                                                                                                                                                                                                | Gaps                                             |
| --------- | ---------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| bybit     | api.bybit.com/v5 | 4+           | BybitMarket, BybitTicker, BybitOrder, BybitPosition, BybitOrderBook, BybitFeeRate, BybitFundingRateHistory, BybitDepositAddress, BybitDepositRecords, BybitWithdrawals, BybitAccountTransfer, BybitLongShortRatio, BybitRiskLimit, BybitInsuranceFund, BybitDeliveryRecord | Bybit trades REST (low); Bybit klines REST (low) |

**Error:** BybitError

### Coinbase

| Venue Key | Base URL                  | Schema Count | Key Schemas                                                                                                                         | Gaps |
| --------- | ------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ---- |
| coinbase  | api.exchange.coinbase.com | 8            | CoinbaseTicker, CoinbaseOrderBook, CoinbaseTrade, CoinbaseCandle, CoinbaseProduct, CoinbaseFeeSchedule, CoinbaseOrder, CoinbaseFill | —    |

**Error:** CoinbaseError

### Upbit

| Venue Key | Base URL         | Schema Count | Key Schemas                                                                                     | Gaps |
| --------- | ---------------- | ------------ | ----------------------------------------------------------------------------------------------- | ---- |
| upbit     | api.upbit.com/v1 | 8            | UpbitMarket, UpbitTicker, UpbitOrder, UpbitBalance, UpbitFeeRate, UpbitDeposit, UpbitWithdrawal | —    |

**Error:** UpbitError

### Deribit

| Venue Key | Base URL           | Schema Count | Key Schemas                                                                                                                                                                                                                                                                                                                                          | Gaps |
| --------- | ------------------ | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| deribit   | deribit.com/api/v2 | 14+          | DeribitInstrument, DeribitTicker, DeribitOrderBook, DeribitOrder, DeribitPosition, DeribitAccountSummary, DeribitPortfolioMarginSummary, DeribitVolatilityIndex, DeribitFundingRateHistory, DeribitSettlementCashFlows, DeribitRiskLimit, DeribitSessionBankruptcyDetails; DeribitInstrumentInfoFull, DeribitUserPortfolio, DeribitSettlementHistory | —    |

**Error:** DeribitError

### Hyperliquid

| Venue Key   | Base URL            | Schema Count | Key Schemas                                                                                                                                                                                                                                                                                                                                                                   | Gaps |
| ----------- | ------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| hyperliquid | api.hyperliquid.xyz | 6+           | HyperliquidMeta, HyperliquidTicker, HyperliquidOrder, HyperliquidPosition, HyperliquidStatsRow; HyperliquidUserState, HyperliquidL2Book, HyperliquidFundingHistoryEntry, HyperliquidFill, HyperliquidOpenOrder, HyperliquidCandle, HyperliquidVaultDetails, HyperliquidLiquidation, HyperliquidSpotMeta, HyperliquidSpotAssetInfo, HyperliquidUserFees, HyperliquidSubAccount | —    |

**Error:** HyperliquidError

### Aster

| Venue Key | Base URL          | Schema Count | Key Schemas                                                                                                                                                                                                                                                                                                                                       | Gaps |
| --------- | ----------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| aster     | api.aster.finance | 4+           | AsterMarket, AsterOrderBook, AsterOrder, AsterPosition; AsterAggTrade, AsterTrade, AsterKline, AsterMarkPrice, AsterFundingRate, AsterOpenInterest, AsterOpenInterestHistory, AsterTicker24hr, AsterExchangeInfo, AsterAccount, AsterBalance, AsterIncome, AsterLeverageBracket, AsterOrderTradeUpdate, AsterAccountUpdate, AsterLiquidationOrder | —    |

**Error:** AsterError

---

## 2. TradFi

### Databento (~506 venues)

| Venue Key | Base URL                               | Schema Count | Key Schemas                                                                                                           | Gaps                                                   |
| --------- | -------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| databento | hist.databento.com, feed.databento.com | 7+           | DatabentoOhlcvBar, DatabentoTrade, DatabentoMbp1, DatabentoMbp10, DatabentoTbbo, DatabentoDefinition, DatabentoSymbol | mbo, bbo-1s, bbo-1m, statistics, status (low priority) |

**Venues via publisher_id:** CME, CBOT, NYMEX, COMEX, GLOBEX, XCME, XNAS, XNYS, BATS, ARCX, IEXG, XPSX, EPRL, XCHI, CBOE, and ~490 more.

**Error:** DatabentoError

### IBKR

| Venue Key | Transport     | Schema Count | Key Schemas                                                                                                                                                                                                                                                                                                                                            | Gaps                                                     |
| --------- | ------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| ibkr      | TWS/ib_insync | 7+           | IBKRBar, IBKRTicker, IBKROrder, IBKRPosition, IBKRAccountValue, IBKRPortfolioItem, IBKRPnL; IBKRContractDetails, IBKRScannerSubscription, IBKRScannerData, IBKRExecution, IBKRCommissionReport, IBKRPnLSingle, IBKRPnLHistory, IBKRMarketDepth, IBKRHistoricalTick\*, IBKRSecDefOptParams, IBKROptionGreeks, IBKRHistoricalVolatility, IBKRRealTimeBar | Execution/Fill dedicated schema (consider IBKRExecution) |

**Error:** IBKRError

### Barchart (VIX 15m)

| Venue Key | Source   | Schema Count | Key Schemas      | Gaps |
| --------- | -------- | ------------ | ---------------- | ---- |
| barchart  | CSV only | 1            | BarchartOhlcv15m | —    |

### Tardis (CeFi market data)

| Venue Key | Base URL          | Schema Count | Key Schemas                                                                                                                                         | Gaps                                          |
| --------- | ----------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| tardis    | api.tardis.dev/v1 | 9            | TardisExchange, TardisInstrument, TardisTrade, TardisOrderBook, TardisBookSnapshot5, TardisLiquidations, TardisDerivativeTicker, TardisOptionsChain | book_snapshot_25, incremental_book_L2, quotes |

**Error:** TardisError

### Yahoo Finance

| Venue Key     | Base URL                 | Schema Count | Key Schemas                                                              | Gaps |
| ------------- | ------------------------ | ------------ | ------------------------------------------------------------------------ | ---- |
| yahoo_finance | query1.finance.yahoo.com | 5            | YahooQuote, YahooChartResult, YahooOhlcv24h, YahooSplits, YahooDividends | —    |

**Error:** YahooError

---

## 3. DeFi

### Alchemy

| Venue Key | Base URL                     | Schema Count | Key Schemas                                                                                                                                                                                                                                                                               | Gaps                                               |
| --------- | ---------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| alchemy   | eth-mainnet.g.alchemy.com/v2 | 3+           | AlchemyRpcResponse, AlchemyAssetTransfer, AlchemyTokenBalance; AlchemyBlock, AlchemyTransaction, AlchemyTransactionReceipt, AlchemyLog, AlchemyDecodedLog, AlchemyGasOracle, AlchemyEnsResolution, AlchemyNFTMetadata, AlchemyNFTOwnership, AlchemyTokenMetadata, AlchemySimulationResult | NFT, Portfolio, Prices, Webhooks, Simulation (low) |

**Error:** AlchemyError

### The Graph

| Venue Key | Base URL / Gateway                     | Schema Count | Key Schemas                                                                                                                                                                                                                                                                                                        | Gaps                                                                                   |
| --------- | -------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| thegraph  | api.thegraph.com, gateway.thegraph.com | 5+           | TheGraphResponse, SubgraphPool, SubgraphSwap, SubgraphToken, SubgraphReserve; SubgraphAaveUserPosition, SubgraphUniV3Position, SubgraphUniV3PoolTick, SubgraphCurveGauge, SubgraphCurveVotingEscrow, SubgraphMorphoPosition, SubgraphLidoRebase, SubgraphEthenaYield, SubgraphERC20Transfer, SubgraphERC20Approval | Pair, Gauge (Sushi, Curve, Balancer); BASE_URLS → gateway (Hosted deprecated Jun 2024) |

**Error:** GraphQLError

### Flashbots / MEV Blocker

| Provider    | Base URL / Endpoint     | Schema Count | Key Schemas                                                                                                                                                                   | Gaps                                       |
| ----------- | ----------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Flashbots   | relay.flashbots.net     | 6+           | FlashbotsBundleParams, FlashbotsBundleResult, FlashbotsCallBundleParams, FlashbotsCallBundleResult, FlashbotsPrivateTransactionParams, FlashbotsPrivateTransactionPreferences | eth_cancelPrivateTransaction params/result |
| MEV-Share   | mev-share.flashbots.net | 2            | MevShareBundleParams, MevShareBundleResult                                                                                                                                    | —                                          |
| MEV Blocker | RPC endpoints           | 1            | MevBlockerEndpoints                                                                                                                                                           | —                                          |

### bloXroute BDN

| Venue Key | Base URL / Endpoint                          | Schema Count | Key Schemas                                                                                                                                               | Gaps                                                        |
| --------- | -------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| bloxroute | api.blxrbdn.com, eth-protect.rpc.blxrbdn.com | 7            | BloxrouteTxSubmitParams, BloxrouteTxSubmitResult, BloxrouteJsonRpcResponse, BloxrouteBdnBlocksParams, BloxrouteSubscribeParams, BloxrouteProtectEndpoints | bdnBlocks/newTxs stream payload schemas (need live samples) |

**Error:** BloxrouteError

### Protocol SDKs (Aave, Compound, Morpho, Euler)

| Protocol    | Source                   | Schema Count | Key Schemas                                                     | Gaps |
| ----------- | ------------------------ | ------------ | --------------------------------------------------------------- | ---- |
| Aave V3     | Contract reads, subgraph | 3            | AaveV3ReserveData, AaveV3UserAccountData, AaveV3UserReserveData | —    |
| Compound V3 | Contract reads, subgraph | 2            | CompoundV3MarketInfo, CompoundV3UserPosition                    | —    |
| Morpho      | Contract reads, subgraph | 2            | MorphoMarketParams, MorphoUserPosition                          | —    |
| Euler       | Contract reads, subgraph | 2            | EulerVaultData, EulerUserPosition                               | —    |

**Protocol payload schemas** (protocol_sdks.py): AaveDepositParams, AaveBorrowParams, AaveRepayParams, AaveFlashLoanParams; MorphoSupplyParams, MorphoBorrowParams, MorphoRepayParams; EulerDepositParams, EulerWithdrawParams; FluidDepositParams, FluidWithdrawParams; LidoStakeParams; CurveSwapParams.

---

## 4. Sports

### Betfair

| Venue Key | Base URL                                   | Schema Count | Key Schemas                                                                                                                | Gaps |
| --------- | ------------------------------------------ | ------------ | -------------------------------------------------------------------------------------------------------------------------- | ---- |
| betfair   | api.betfair.com/exchange/betting/rest/v1.0 | 6            | BetfairAuthResponse, BetfairMarketBook, BetfairMarketChangeMessage, BetfairOrderUpdate, BetfairRunner, BetfairRunnerChange | —    |

**Error:** BetfairError

### Pinnacle

| Venue Key | Base URL         | Schema Count | Key Schemas                                                                                                                                        | Gaps |
| --------- | ---------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| pinnacle  | api.pinnacle.com | 8            | PinnacleLeague, PinnacleEvent, PinnaclePeriod, PinnacleMoneyline, PinnacleTotals, PinnacleSpread, PinnacleOddsResponse, PinnacleSettlementResponse | —    |

**Error:** PinnacleError

### Polymarket

| Venue Key  | Base URL            | Schema Count | Key Schemas                                                                                                                      | Gaps |
| ---------- | ------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------- | ---- |
| polymarket | clob.polymarket.com | 7            | PolymarketMarket, PolymarketToken, PolymarketOrderBook, PolymarketTrade, PolymarketOrder, PolymarketFill, PolymarketMarketResult | —    |

**Error:** PolymarketError

### Odds API

| Venue Key | Base URL                | Schema Count | Key Schemas                                                                            | Gaps |
| --------- | ----------------------- | ------------ | -------------------------------------------------------------------------------------- | ---- |
| odds_api  | api.the-odds-api.com/v4 | 5            | OddsApiFixture, OddsApiBookmaker, OddsApiMarket, OddsApiOutcome, OddsApiHistoricalOdds | —    |

**Error:** OddsApiError

### API-Football

| Venue Key    | Base URL                  | Schema Count | Key Schemas                                                                                                                                              | Gaps |
| ------------ | ------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| api_football | v3.football.api-sports.io | 8            | ApiFootballFixture, ApiFootballTeam, ApiFootballLeague, ApiFootballLineup, ApiFootballStat, ApiFootballScore, ApiFootballPlayerStat, ApiFootballStanding | —    |

**Error:** ApiFootballError

---

## 5. Cloud

### GCP

| SDK / Service | Package               | Schema Coverage                                                                                                                                                                  | Gaps                                                                     |
| ------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Compute       | google-cloud-compute  | InsertInstanceRequest, ComputeOperation, GetInstanceRequest, ComputeInstance, ListInstancesRequest, InstanceListResponse, Delete/Start/StopInstanceRequest, GcpComputeQuotaUsage | ComputeInstance: disks, networkInterfaces, labels, metadata              |
| Cloud Run     | google-cloud-run      | CreateServiceRequest, CloudRunService, UpdateServiceRequest, UpdateTrafficSplitRequest, ListRevisionsRequest, RevisionListResponse, GcpCloudRunQuotaUsage                        | template, scaling, traffic                                               |
| GCS           | google-cloud-storage  | BucketCreateRequest, BlobListRequest, BlobListResponse, GcsBlobInfo, BlobUploadRequest, BlobDownloadRequest, GcsQuotaUsage                                                       | GcsBlobInfo: generation, metageneration, storage_class, crc32c, md5_hash |
| BigQuery      | google-cloud-bigquery | QueryRequest, QueryJobResult, TableCreateRequest, TableInfo, ExternalTableConfig, ExternalTableCreateRequest, HivePartitioningOptions, BqQuotaUsage                              | QueryJobResult, TableInfo simplified                                     |

### AWS

| SDK / Service  | Package | Schema Coverage                                                                                                                                                    | Gaps                                                                                   |
| -------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| EC2            | boto3   | EC2RunInstancesRequest/Response, EC2DescribeInstancesRequest/Response, EC2Reservation, EC2Instance, EC2Start/Stop/TerminateInstancesRequest/Response, EC2QuotaInfo | EC2Instance: BlockDeviceMappings, NetworkInterfaces, etc.                              |
| ECS            | boto3   | ECSRunTaskRequest/Response, ECSDescribeTasksRequest/Response, ECSQuotaInfo                                                                                         | ECSTask: containers, attachments, connectivity                                         |
| Lambda         | boto3   | LambdaInvokeRequest, LambdaInvokeResponse, LambdaQuotaInfo                                                                                                         | —                                                                                      |
| S3             | boto3   | S3CreateBucketRequest/Response, S3ListObjectsV2Request/Response, S3ObjectSummary, S3PutObjectRequest/Response, S3GetObjectRequest/Response, S3QuotaInfo            | S3GetObjectResponse Body (streaming); S3ObjectSummary ChecksumAlgorithm, RestoreStatus |
| Glue           | boto3   | GlueCreateTableRequest/Response, GlueGetTableRequest/Response, GlueTable, GlueGetTablesRequest/Response, GlueGetDatabaseRequest/Response, GlueDatabase             | GlueTable: Owner, TableType, Parameters, ViewDefinition                                |
| Service Quotas | boto3   | ServiceQuotasGetServiceQuotaRequest/Response, ServiceQuotasListServiceQuotasRequest/Response                                                                       | —                                                                                      |

---

## 6. CCXT vs Direct Access

**CCXT** provides a unified API across many exchanges. We have both **direct venue schemas** (Binance, OKX, Bybit, etc.) and **CCXT unified schemas** (CcxtOrder, CcxtTrade, etc.). Venues may be accessed via CCXT or direct REST/WebSocket.

| Venue / Data Source                                   | Access Method | unified-api-contracts Module                          | Notes                                                             |
| ----------------------------------------------------- | ------------- | ----------------------------------------------------- | ----------------------------------------------------------------- |
| Binance (spot, futures)                               | Direct + CCXT | binance                                               | Direct REST/WS preferred for full coverage; CCXT for unified path |
| OKX                                                   | Direct + CCXT | okx                                                   | Direct v5 REST/WS; CCXT for unified                               |
| Bybit                                                 | Direct + CCXT | bybit                                                 | Direct v5 REST/WS; CCXT for unified                               |
| Coinbase                                              | Direct + CCXT | coinbase                                              | Direct Exchange API; CCXT for unified                             |
| Upbit                                                 | Direct + CCXT | upbit                                                 | Direct REST/WS; CCXT for unified                                  |
| Deribit                                               | Direct only   | deribit                                               | No CCXT; TWS-style options/futures                                |
| Hyperliquid                                           | Direct only   | hyperliquid                                           | On-chain perps; no CCXT                                           |
| Aster                                                 | Direct only   | aster                                                 | Binance Futures-compatible; no CCXT                               |
| Databento                                             | Direct only   | databento                                             | TradFi market data; no CCXT                                       |
| Tardis                                                | Direct only   | tardis                                                | CeFi market data; no CCXT                                         |
| IBKR                                                  | Direct only   | ibkr                                                  | TWS/ib_insync; no CCXT                                            |
| Yahoo Finance                                         | Direct only   | yahoo_finance                                         | REST; no CCXT                                                     |
| Barchart                                              | Direct only   | barchart                                              | CSV; no CCXT                                                      |
| The Graph                                             | Direct only   | thegraph                                              | GraphQL; no CCXT                                                  |
| Alchemy                                               | Direct only   | alchemy                                               | JSON-RPC; no CCXT                                                 |
| Kucoin, Gate.io, Bitfinex, Huobi                      | CCXT only     | ccxt                                                  | No direct schemas; use Ccxt\* unified schemas                     |
| Betfair, Pinnacle, Polymarket, Odds API, API-Football | Direct only   | betfair, pinnacle, polymarket, odds_api, api_football | Sports; no CCXT                                                   |

**CCXT unified schemas (unified_api_contracts.ccxt):** CcxtOrder, CcxtTrade, CcxtBalance, CcxtBalanceResponse, CcxtPosition, CcxtMarket, CcxtTicker, CcxtOrderBook, CcxtFundingRate, CcxtFundingRateHistory, CcxtOpenInterest, CcxtOpenInterestHistory, CcxtOhlcv, CcxtAggTrade, CcxtLeverageTiers, CcxtLongShortRatio, CcxtGreeks, CcxtWithdrawal, CcxtDeposit, CcxtDepositAddress, CcxtLedger, CcxtTransfer, CcxtTradingFee, CcxtErrorPayload.

---

## 7. Planned / Not Yet Contracted

From full expansion plan and institutional gaps analysis. APIs we intend to support but do not yet have schemas for.

### CeFi / Data

| API / Venue                                       | Status  | Notes                                                                                    |
| ------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------- |
| Binance Options (EAPI)                            | Partial | BinanceOptionInstrumentInfo, BinanceOptionTicker, BinanceOptionMarkPrice; some endpoints |
| Tardis book_snapshot_25                           | Gap     | 25-level book; some exchanges                                                            |
| Tardis incremental_book_L2                        | Gap     | L2 updates; book reconstruction                                                          |
| Databento mbo, bbo-1s, bbo-1m, statistics, status | Gap     | Low priority                                                                             |

### DeFi

| API / Protocol                                       | Status         | Notes                                                     |
| ---------------------------------------------------- | -------------- | --------------------------------------------------------- |
| Alchemy NFT, Portfolio, Prices, Webhooks, Simulation | Gap            | Add when integrating                                      |
| The Graph Pair, Gauge (Sushi, Curve, Balancer)       | Gap            | Subgraph-specific entities                                |
| Flashbots eth_cancelPrivateTransaction               | Gap            | Simple params/result                                      |
| bloXroute, Titan (MEV)                               | Not contracted | Reverse-engineer specs into unified_api_contracts/mev/    |
| Instadapp, Morpho flash loans (atomic)               | Partial        | Protocol payloads in protocol_sdks; full flow schemas TBD |

### TradFi

| API / Venue                          | Status   | Notes                            |
| ------------------------------------ | -------- | -------------------------------- |
| Direct CME/NASDAQ/NYSE               | Not used | We use Databento for market data |
| VIX live (Databento index, IBKR TWS) | Research | Barchart batch only; live in dev |

### Cloud

| API / Service                 | Status  | Notes                                            |
| ----------------------------- | ------- | ------------------------------------------------ |
| GCP/AWS full resource schemas | Partial | Core fields only; 50+ field resources simplified |

### Institutional Gaps (from expansion plan)

- Fee schemas (all venues)
- Borrow rates (Binance, Bybit, OKX, Deribit, IBKR)
- Long/short ratio, OI history (all CeFi venues)
- Insurance fund, ADL quantile, risk limit tiers
- Deposits/withdrawals/transfers/sub-accounts (100% missing across venues)
- My fills REST, aggregate trades, mark price OHLC
- Funding rate history REST, settlement/delivery lifecycle
- Vol surface (Deribit DVOL, OKXOptionSummary, IBKROptionComputation)
- CCXT ~90% surface (currently ~12%): ~50 method schemas + field expansions

---

## File References

- **Venue manifest:** `unified_api_contracts/venue_manifest.py`
- **Base URLs & endpoint map:** `unified_api_contracts/endpoints.py`
- **Schema versions & pins:** `SCHEMA_VERSIONS.md`
- **VCR endpoints:** `unified_api_contracts/vcr_endpoints.py`
- **Canonical mappings:** `unified_api_contracts/canonical_mappings.py`
- **Chain of events:** `docs/API_CONTRACTS_CHAIN_OF_EVENTS.md`
