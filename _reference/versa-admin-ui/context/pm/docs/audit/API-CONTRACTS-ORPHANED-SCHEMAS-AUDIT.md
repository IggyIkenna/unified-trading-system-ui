# API Contracts Orphaned Schemas Audit

**Date:** 2026-03-03 **Method:** ripgrep for `^class ...` in `unified-api-contracts` (external + root); grep for
`from unified_api_contracts` / `import unified_api_contracts` across the six interfaces; comparison of
`unified_normalised_contracts/normalize.py` against external schema modules.

**Interfaces scanned:** unified-market-interface, unified-trade-execution-interface, unified-sports-execution-interface,
unified-reference-data-interface, unified-position-interface, unified-cloud-interface.

---

## Type 1 — Not normalised

External/venue schemas under `unified_api_contracts_external/<venue>/schemas.py` (or venue-specific schema files) that
**do not** have a corresponding normalised form in `unified_normalised_contracts` or a clear mapping in
`unified_normalised_contracts/normalize.py`.

**Normalised (excluded from Type 1):** Only the following three external types have normalisers in
`unified_normalised_contracts/normalize.py`:

| Module                                                     | Symbol         |
| ---------------------------------------------------------- | -------------- |
| `unified_api_contracts_external/binance/market_schemas.py` | BinanceTrade   |
| `unified_api_contracts_external/databento/schemas.py`      | DatabentoTrade |
| `unified_api_contracts_external/tardis/schemas.py`         | TardisTrade    |

All other external schema classes listed below are **not normalised** (no path to `CanonicalTrade` or other canonical
types in the normalise layer).

### By module and symbol

- **unified_api_contracts_external/fred/schemas.py** FredObservation, FredSeriesObservationsResponse

- **unified_api_contracts_external/arkham/schemas.py** ArkhamEntityType, ArkhamEntity, ArkhamTokenFlow, ArkhamNetFlow,
  ArkhamAlertEvent, ArkhamError

- **unified_api_contracts_external/kalshi/schemas.py** KalshiPriceRange, KalshiSeries, KalshiEvent, KalshiMarket,
  KalshiOrderBook, KalshiTrade, KalshiOrder, KalshiFill, KalshiPosition, KalshiBalance, KalshiCandlestick,
  KalshiHistoricalCutoff, KalshiWebSocketTickerMsg, KalshiWebSocketOrderbookDeltaMsg, KalshiWebSocketTradeMsg,
  KalshiWebSocketMarketLifecycleMsg, KalshiError

- **unified_api_contracts_external/api_football/schemas.py** ApiFootballRateLimit, ApiFootballOddsBookmaker,
  ApiFootballOddsValue, ApiFootballOddsBet, ApiFootballOdds, ApiFootballTeam, ApiFootballLeague, ApiFootballScore,
  ApiFootballVenue, ApiFootballFixtureStatus, ApiFootballPeriods, ApiFootballTeamWithWinner, ApiFootballScoreFull,
  ApiFootballFixture, ApiFootballEventTime, ApiFootballEvent, ApiFootballLineupPlayer, ApiFootballLineup,
  ApiFootballStat, ApiFootballFixtureStatistics, ApiFootballPlayerStat, ApiFootballInjury, ApiFootballStanding,
  ApiFootballError

- **unified_api_contracts_external/ibkr/schemas.py** IBKRBar, IBKRTicker, IBKRBondMarketData, IBKROrder, IBKRPosition,
  IBKRAccountValue, IBKRAccountUpdateMulti, IBKRPortfolioItem, IBKRPnL, IBKRWebSocketClose, IBKRError,
  IBKRContractDetails, IBKRCorporateAction, IBKRScannerSubscription, IBKRScannerData, IBKRExecution,
  IBKRCommissionReport, IBKRPnLSingle, IBKRPnLHistory, IBKRMarketDepth, IBKRHistoricalTick, IBKRHistoricalTickBidAsk,
  IBKRHistoricalTickLast, IBKRSecDefOptParams, IBKROptionGreeks, IBKRHistoricalVolatility, IBKRRealTimeBar,
  IBKRComboLeg, IBKRComboContract, IBKRComboOrderRequest, IBKREfpContract

- **unified_api_contracts_external/binance/account_schemas.py** BinanceMarginBalanceResponse,
  BinanceRealizedPnlResponse, BinanceWithdrawalRequest, BinanceWithdrawalResponse, BinanceIncome, BinanceDepositAddress,
  BinanceDepositHistory, BinanceWithdrawalHistory, BinanceFeeRate, BinanceInternalTransfer, BinanceSubAccount,
  BinanceSubAccountAssets, BinancePapiAccount, BinancePapiBalance, BinancePapiPosition, BinanceDualInvestmentProduct

- **unified_api_contracts_external/binance/market_schemas.py** BinanceTicker, BinanceOrderBook, BinanceKline,
  BinanceSymbol, BinanceExchangeInfo, BinanceAggTrade, BinanceFundingRateHistory, BinancePremiumIndex,
  BinanceMarkPriceKline, BinanceIndexPriceKline, BinanceDeliveryPrice, BinanceDeliveryHistory, BinanceInstrumentInfo,
  BinanceOptionInstrumentInfo, BinanceOptionTicker, BinanceOptionMarkPrice, BinanceInsuranceFundAsset,
  BinanceInsuranceFund _(BinanceTrade excluded — has normaliser)_

- **unified_api_contracts_external/binance/order_schemas.py** BinanceOrder, BinancePosition,
  BinanceSpotOrderSubmitRequest, BinanceSpotOrderSubmitResponse, BinanceUsdmOrderSubmitRequest,
  BinanceUsdmOrderSubmitResponse, BinanceCoinmOrderSubmitRequest, BinanceCoinmOrderSubmitResponse,
  BinanceOrderCancelRequest, BinanceOrderCancelResponse, BinancePositionQueryResponse, BinancePositionRisk,
  BinanceEapiOrderSubmitRequest, BinanceEapiOrderSubmitResponse, BinanceEapiPosition, BinanceMyTrades,
  BinanceAdlQuantile, BinanceError

- **unified_api_contracts_external/binance/ws_schemas.py** BinanceMarkPriceUpdate, BinanceLiquidationOrder,
  BinanceOrderTradeUpdate, BinanceAccountUpdate, BinanceWebSocketSubscribe, BinanceWebSocketPing, BinanceWebSocketClose,
  BinanceListenKeyCreate

- **unified_api_contracts_external/okx/schemas.py** OKXMarket, OKXOrderBook, OKXTicker, OKXOrder, OKXPosition, OKXError,
  OKXFundingRate, OKXLiquidationOrder, OKXMarkPrice, OKXCandleWS, OKXMarkPriceKline, OKXIndexPriceKline,
  OKXOptionSummary, OKXOptionTicker, OKXOrderUpdateWS, OKXPositionUpdateWS, OKXAccountGreeks, OKXOptionMarketData,
  OKXWebSocketSubscribe, OKXWebSocketLogin, OKXWebSocketPing, OKXWebSocketClose, OKXInstrumentInfo,
  OKXOrderSubmitRequest, OKXOrderSubmitResponse, OKXOrderCancelRequest, OKXOrderCancelResponse,
  OKXPositionQueryResponse, OKXMarginBalanceResponse, OKXRealizedPnlResponse, OKXWithdrawalRequest,
  OKXWithdrawalResponse, OKXFeeRate, OKXFundingRateHistory, OKXDepositAddress, OKXDepositHistory, OKXWithdrawalHistory,
  OKXFundTransfer, OKXLongShortRatio, OKXOpenInterest, OKXOpenInterestHistory, OKXRiskLimit, OKXPortfolioMarginAccount,
  OKXDeliveryExerciseHistory, OKXOptionTickerGreeks, OKXRfqLeg, OKXRfqCreateRequest, OKXRfqResponse, OKXQuoteLeg,
  OKXQuoteResponse

- **unified_api_contracts_external/cloud_sdks/quota_broker.py** QuotaBrokerAcquireRequest, QuotaBrokerAcquireResult,
  QuotaBrokerReleaseRequest, QuotaBrokerReleaseResponse, QuotaBrokerLiveQuotasRequest, QuotaBrokerLiveQuotasResponse,
  QuotaExceededMessage

- **unified_api_contracts_external/openbb/schemas.py** OpenBBTreasuryPrice, OpenBBTreasuryPricesResponse

- **unified_api_contracts_external/glassnode/schemas.py** GlassnodeTimeseriesPoint, GlassnodeMetricResponse,
  StockToFlowData, HalvingEvent, MvrvRatio, MvrvZScore, SoprMetric, AsoprMetric, NvtRatio, NvtSignal, HodlWave,
  ExchangeReserves, RealizedCap, ThermoCap, GlassnodeError

- **unified_api_contracts_external/cloud_sdks/aws.py** PaginatorProtocol, S3ClientProtocol, SecretsManagerClientProtocol

- **unified_api_contracts_external/bloxroute/schemas.py** BloxrouteTxSubmitParams, BloxrouteTxSubmitResult,
  BloxrouteJsonRpcResponse, BloxrouteError, BloxrouteBdnBlocksParams, BloxrouteSubscribeParams,
  BloxrouteProtectEndpoints _(BloxrouteMempoolNotification used by UMI; other symbols not normalised)_

- **unified_api_contracts_external/pyth/schemas.py** PythPriceFeed, PythWsNotification

- **unified_api_contracts_external/cloud_sdks/gcp.py** BucketProtocol, BlobProtocol, StorageClientProtocol,
  QueryJobProtocol, BigQueryClientProtocol, SecretProtocol, SecretManagerServiceClientProtocol

- **unified_api_contracts_external/coingecko/schemas.py** GlobalMarketData, GlobalMarketResponse

- **unified_api_contracts_external/ccxt/schemas.py** CcxtFee, CcxtMarketPrecision, CcxtMarketLimits, CcxtMarketFees,
  CcxtOrder, CcxtTrade, CcxtBalance, CcxtBalanceResponse, CcxtPosition, CcxtMarket, CcxtTicker, CcxtOrderBook,
  CcxtFundingRate, CcxtFundingRateHistory, CcxtOpenInterest, CcxtOpenInterestHistory, CcxtOhlcv, CcxtAggTrade,
  CcxtLeverageTier, CcxtLeverageTiers, CcxtLongShortRatio, CcxtGreeks, CcxtWithdrawal, CcxtDeposit, CcxtDepositAddress,
  CcxtLedger, CcxtTransfer, CcxtTradingFee, CcxtBorrowRate, CcxtBorrowInterest, CcxtMarginAdjustment, CcxtInsuranceFund,
  CcxtLiquidation, CcxtSettlementHistory, CcxtSubaccount, CcxtCurrencyNetwork, CcxtCurrency, CcxtOption, CcxtFees,
  CcxtVolatilityHistory, CcxtLeverage, CcxtErrorPayload

- **unified_api_contracts_external/polymarket/schemas.py** PolymarketIdentifiers, PolymarketToken, PolymarketMarket,
  PolymarketOrderBook, PolymarketTrade, PolymarketOrder, PolymarketCLOBOrder, PolymarketFill, PolymarketMarketResult,
  PolymarketError, PolymarketResolutionSource, PolymarketGammaTag, PolymarketGammaMarket, PolymarketGammaSeries,
  PolymarketGammaEvent, PolymarketNegRiskEvent, PolymarketResolution, NegRiskOutcome, PolymarketNegRiskMarket,
  PolymarketSplit, PolymarketMerge, PolymarketL1AuthParams, PolymarketL2Headers, PolymarketPricePoint,
  PolymarketPriceHistory

- **unified_api_contracts_external/coinbase/schemas.py** CoinbaseTicker, CoinbaseOrderBook, CoinbaseTrade,
  CoinbaseCandle, CoinbaseProduct, CoinbaseError, CoinbaseWebSocketSubscribe, CoinbaseWebSocketHeartbeat,
  CoinbaseWebSocketClose, CoinbaseProductInfo, CoinbaseOrderSubmitRequest, CoinbaseOrderSubmitResponse,
  CoinbaseOrderCancelRequest, CoinbaseOrderCancelResponse, CoinbasePositionQueryResponse, CoinbaseMarginBalanceResponse,
  CoinbaseWithdrawalRequest, CoinbaseWithdrawalResponse, CoinbaseFeeSchedule, CoinbaseOrder, CoinbaseFill

- **unified_api_contracts_external/transfermarkt/schemas.py** TransfermarktPlayer, TransfermarktTransfer,
  TransfermarktTeamSquad, TransfermarktLeagueTable, TransfermarktError

- **unified_api_contracts_external/cloud_sdks/schemas/** (multiple files) LogEntry, ListLogEntriesRequest,
  ListLogEntriesResponse, LogSink, LogMetric, WriteLogEntriesRequest, CloudLoggingQuotaUsage; InsertInstanceRequest,
  DeleteInstanceRequest, GetInstanceRequest, ListInstancesRequest, StartInstanceRequest, StopInstanceRequest,
  ComputeInstance, ComputeOperation, InstanceListResponse, GcpComputeQuotaUsage; FirestoreDocument, FirestoreQuery,
  FirestoreWriteResult, FirestoreBatchWriteRequest, RealtimeDbEntry, FirebaseAuthUser, FirebaseAuthToken,
  FirebaseCustomToken, FirebaseCreateUserRequest, FcmMessage, FcmSendResponse, FirebaseStorageObject, FirebaseError;
  ArtifactRepository, ArtifactPackage, ArtifactVersion, ArtifactTag, PythonPackage, ListRepositoriesResponse,
  ListPackagesResponse, ArtifactRegistryQuotaUsage, DockerImage, ListDockerImagesResponse, NpmPackage,
  ArtifactRegistryCleanupPolicy; CloudSchedulerJob, CloudSchedulerCreateJobRequest, CloudSchedulerPauseJobRequest,
  CloudSchedulerResumeJobRequest, CloudSchedulerRunJobRequest, CloudSchedulerListJobsResponse, CloudSchedulerAttempt;
  and remaining cloud*sdks/schemas/* and cloud*sdks/aws/* classes (GCS, pubsub, secret*manager, cloud_build,
  cloud_monitoring, cloud_run, cloud_billing, bigquery, iam, oauth2; AWS cloudwatch, codebuild, cognito, cost_explorer,
  dynamodb, ec2, ecr, ecs, eventbridge, glue, lambda*, s3, secrets_manager, service_quotas, sns, sqs, etc.).

- **unified_api_contracts_external/aster/schemas.py** AsterAggTrade, AsterTrade, AsterKline, AsterMarkPrice,
  AsterFundingRate, AsterOpenInterest, AsterOpenInterestHistory, AsterTicker24hr, AsterExchangeInfo, AsterAccountAsset,
  AsterAccountPosition, AsterAccount, AsterBalance, AsterIncome, AsterLeverageBracketItem, AsterLeverageBracket,
  AsterOrderTradeUpdate, AsterAccountUpdate, AsterLiquidationOrder, AsterMarket, AsterOrderBook, AsterOrder,
  AsterPosition, AsterError, AsterWebSocketSubscribe, AsterListenKeyCreate, AsterWebSocketClose

- **unified_api_contracts_external/bybit/schemas.py** BybitMarket, BybitOrderBook, BybitTicker, BybitMarkPriceKline,
  BybitIndexPriceKline, BybitOrder, BybitPosition, BybitError, BybitOrderUpdateWS, BybitExecutionWS, BybitPositionWS,
  BybitWalletWS, BybitWebSocketSubscribe, BybitWebSocketPing, BybitWebSocketPong, BybitWebSocketClose,
  BybitInstrumentInfo, BybitOrderSubmitRequest, BybitOrderSubmitResponse, BybitOrderCancelRequest,
  BybitOrderCancelResponse, BybitPositionQueryResponse, BybitMarginBalanceResponse, BybitRealizedPnlResponse,
  BybitWithdrawalRequest, BybitWithdrawalResponse, BybitFeeRate, BybitFundingRateHistory, BybitDepositAddress,
  BybitDepositRecords, BybitWithdrawals, BybitAccountTransfer, BybitLongShortRatio, BybitRiskLimit, BybitInsuranceFund,
  BybitDeliveryRecord, BybitLiquidationOrder

- **unified_api_contracts_external/databento/schemas.py** All symbols except **DatabentoTrade** (e.g. DatabentoOhlcvBar,
  DatabentoBbo1m, DatabentoMbp1, DatabentoMbo, DatabentoError, etc.) _(DatabentoTrade excluded — has normaliser)_

- **unified_api_contracts_external/tardis/schemas.py** All symbols except **TardisTrade** (e.g. TardisExchange,
  TardisBookSnapshot5, TardisOrderBook, TardisError, etc.) _(TardisTrade excluded — has normaliser)_

- **unified_api_contracts_external/deribit/schemas.py** DeribitInstrument, DeribitOrder, DeribitOrderBook,
  DeribitTicker, DeribitPosition, DeribitError, DeribitAccountSummary, DeribitFundingRateHistory,
  DeribitMarkPriceOption, DeribitOptionsGreeks, DeribitWebSocketSubscribe, DeribitWebSocketAuth, DeribitWebSocketClose,
  DeribitWebSocketHeartbeat, and remaining Deribit\* classes.

- **unified_api_contracts_external/thegraph/schemas.py** GraphQLError, SubgraphPool, SubgraphReserve, SubgraphToken,
  SubgraphSwap, and other TheGraph/Subgraph\* classes.

- **unified_api_contracts_external/** (other venues) All schema classes in: hyperliquid, upbit, barchart, understat,
  open_meteo, footystats, smarkets, matchbook, betfair, betdaq, pinnacle, odds_api, predictit, manifold, defillama,
  instadapp, alchemy, mev, fear_greed, ecb, ofr, soccer_football_info, yahoo_finance, databento (non-Trade), onchain
  (cryptoquant, etc.), sentiment (cryptopanic, lunarcrush), macro, github, coinglass, and any other
  `unified_api_contracts_external/<venue>/*.py` not listed above — **none** have a normaliser in
  `unified_normalised_contracts/normalize.py`.

**Summary Type 1:** ~956 external schema classes across all venue modules; only **BinanceTrade**, **DatabentoTrade**,
and **TardisTrade** have a normalised form. All others are Type 1 (not normalised).

---

## Type 2 — Not used by any interface

Pydantic models/schemas (and related types) defined in **unified-api-contracts** that are **never** imported by any of
the six interfaces.

**Method:** Grep for `from unified_api_contracts` and `import unified_api_contracts` in the six repos; collect symbol
names from import lines; list AC modules/symbols that do not appear.

**Used by interfaces (summary):**

- **unified-market-interface:** DataSourceMapping; VENUE_ERROR_MAP, ErrorAction, VenueErrorClassification,
  classify_venue_error; many `unified_api_contracts_external.<venue>.schemas` (binance, bybit, okx, ccxt, deribit,
  kalshi, polymarket, alchemy, defillama, bloxroute, thegraph, predictit, open_meteo, api_football, matchbook, ibkr,
  odds_api, barchart, fred, ofr, footystats, betdaq, coinbase, fear_greed, smarkets, pinnacle, betfair, transfermarkt,
  ecb, upbit, glassnode, arkham, mev, soccer_football_info, instadapp, manifold); sports: CanonicalOdds, OddsType,
  BookmakerUnavailableError; SubgraphPool, SubgraphReserve; OpenMeteoResponse; PythPriceFeed, PythWsNotification;
  BarchartOhlcv15m; BloxrouteMempoolNotification; and venue-specific symbols from the listed adapters.
- **unified-trade-execution-interface:** VENUE_ERROR_MAP, ErrorAction, VenueErrorClassification, classify_venue_error;
  CcxtOrder, CcxtPosition, CcxtTrade; DeribitOrder, BybitOrder, OKXOrder.
- **unified-sports-execution-interface:** BetExecution, BetOrder, CanonicalOdds, OddsType, BOOKMAKER_REGISTRY,
  ScraperError, BookmakerInfo, BookmakerUnavailableError (sports and sports.errors).
- **unified-reference-data-interface:** CcxtMarket, CcxtTicker (integration test only).
- **unified-position-interface:** No `unified_api_contracts` imports found.
- **unified-cloud-interface:** No `unified_api_contracts` imports found.

### Modules with no interface usage (all symbols orphaned)

All Pydantic/typed schema symbols in these modules are **not used** by any of the six interfaces:

| Module (under unified_api_contracts) | Notes                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **internal/**                        | config, domain, events, execution, features, health, ml, pubsub, risk, signals, sor — entire tree (canonical types re-exported via unified_normalised_contracts; internal/ not imported by interfaces)                                                                                                                                                                      |
| **fix/schemas.py**                   | FixVersion, FixMsgType, FixSide, FixOrdType, FixTimeInForce, FixOrdStatus, FixExecType, FixHeader, FixTrailer, FixSessionConfig, FixLogon, FixLogout, FixHeartbeat, FixReject, FixNewOrderSingle, FixExecutionReport, FixOrderCancelRequest, FixOrderCancelReject, FixMdEntryType, FixMarketDataRequest, FixMdEntry, FixMarketDataSnapshot, FixMarketDataIncrementalRefresh |
| **nautilus/**                        | cache, clock, schemas (Order, Position, Instrument, Fill, Account)                                                                                                                                                                                                                                                                                                          |
| **prime_broker/schemas.py**          | PrimeBrokerProvider, CollateralAsset, PrimeBrokerAccount, PrimeBrokerPosition, PrimeBrokerMarginCall, NetClearingInstruction, CrossMarginNettingResult, PrimeBrokerFill, PrimeBrokerError                                                                                                                                                                                   |
| **regulatory/schemas.py**            | ReportingRegime, TradeReportStatus, MifidIIWaiverFlag, MifidIITradeReport, BestExecutionRecord, EmirProductClassification, EmirTradeReport, DoddFrankSwapReport, SurveillancePatternType, TradeSurveillanceAlert, BestExecutionMonitoringRecord, TradeReportingError                                                                                                        |
| **shared/**                          | error_action, quota_types (ComputeType, VmQuotaShape, GcpQuotaUsage, etc.)                                                                                                                                                                                                                                                                                                  |
| **schemas/**                         | accounts, analytics, cex_withdrawals, defi, derivatives, errors, latency, prediction_market_arb, protocol_sdks, rate_limits, risk, transfers, websocket                                                                                                                                                                                                                     |
| **endpoint_registry.py**             | AccessMode, DataAvailability, ResponseFormat, EndpointSpec                                                                                                                                                                                                                                                                                                                  |
| **domain_config.py**                 | DomainConfigProtocol, DataTypeConfigProtocol, ExchangeInstrumentConfigProtocol, MLConfigProtocol                                                                                                                                                                                                                                                                            |
| **canonical_mappings.py**            | ContractSpec (TypedDict); DataSourceMapping class is used                                                                                                                                                                                                                                                                                                                   |
| **internal_execution_services/**     | If present — not imported by interfaces                                                                                                                                                                                                                                                                                                                                     |

### Partially used modules (unused symbols only)

- **unified_api_contracts_external/ccxt/schemas.py** Used: CcxtOrder, CcxtPosition, CcxtTrade, CcxtMarket, CcxtTicker.
  **Not used by any interface:** CcxtFee, CcxtMarketPrecision, CcxtMarketLimits, CcxtMarketFees, CcxtBalance,
  CcxtBalanceResponse, CcxtOrderBook, CcxtFundingRate, CcxtFundingRateHistory, CcxtOpenInterest,
  CcxtOpenInterestHistory, CcxtOhlcv, CcxtAggTrade, CcxtLeverageTier, CcxtLeverageTiers, CcxtLongShortRatio, CcxtGreeks,
  CcxtWithdrawal, CcxtDeposit, CcxtDepositAddress, CcxtLedger, CcxtTransfer, CcxtTradingFee, CcxtBorrowRate,
  CcxtBorrowInterest, CcxtMarginAdjustment, CcxtInsuranceFund, CcxtLiquidation, CcxtSettlementHistory, CcxtSubaccount,
  CcxtCurrencyNetwork, CcxtCurrency, CcxtOption, CcxtFees, CcxtVolatilityHistory, CcxtLeverage, CcxtErrorPayload.

- **unified_api_contracts_external/binance/** Used by UMI adapters (various Binance* from schemas). **Not used:** Many
  account_schemas, order_schemas, ws_schemas, and market_schemas symbols beyond what adapters import (e.g.
  BinanceMarginBalanceResponse, BinanceRealizedPnlResponse, BinanceWithdrawalRequest/Response, BinanceIncome,
  BinanceDepositAddress, BinanceDepositHistory, BinanceWithdrawalHistory, BinanceFeeRate, BinanceInternalTransfer,
  BinanceSubAccount, BinanceSubAccountAssets, BinancePapiAccount, BinancePapiBalance, BinancePapiPosition,
  BinanceDualInvestmentProduct, BinanceSpotOrderSubmitRequest/Response, BinanceUsdmOrderSubmitRequest/Response,
  BinanceCoinmOrderSubmitRequest/Response, BinanceOrderCancelRequest/Response, BinancePositionQueryResponse,
  BinancePositionRisk, BinanceEapi*, BinanceMyTrades, BinanceAdlQuantile, BinanceError, BinanceMarkPriceUpdate,
  BinanceLiquidationOrder, BinanceOrderTradeUpdate, BinanceAccountUpdate, BinanceWebSocket\*, BinanceListenKeyCreate,
  BinanceTicker, BinanceOrderBook, BinanceKline, BinanceSymbol, BinanceExchangeInfo, BinanceAggTrade,
  BinanceFundingRateHistory, BinancePremiumIndex, BinanceMarkPriceKline, BinanceIndexPriceKline, BinanceDeliveryPrice,
  BinanceDeliveryHistory, BinanceInstrumentInfo, BinanceOptionInstrumentInfo, BinanceOptionTicker,
  BinanceOptionMarkPrice, BinanceInsuranceFundAsset, BinanceInsuranceFund).

- **unified_api_contracts_external/okx/schemas.py** Used: OKXOrder (UTEI). **Not used:** OKXMarket, OKXOrderBook,
  OKXTicker, OKXPosition, OKXError, OKXFundingRate, OKXLiquidationOrder, OKXMarkPrice, OKXCandleWS, OKXMarkPriceKline,
  OKXIndexPriceKline, OKXOptionSummary, OKXOptionTicker, OKXOrderUpdateWS, OKXPositionUpdateWS, OKXAccountGreeks,
  OKXOptionMarketData, OKXWebSocket*, OKXInstrumentInfo, OKXOrderSubmitRequest/Response, OKXOrderCancelRequest/Response,
  OKXPositionQueryResponse, OKXMarginBalanceResponse, OKXRealizedPnlResponse, OKXWithdrawalRequest/Response, OKXFeeRate,
  OKXFundingRateHistory, OKXDepositAddress, OKXDepositHistory, OKXWithdrawalHistory, OKXFundTransfer, OKXLongShortRatio,
  OKXOpenInterest, OKXOpenInterestHistory, OKXRiskLimit, OKXPortfolioMarginAccount, OKXDeliveryExerciseHistory,
  OKXOptionTickerGreeks, OKXRfq*, OKXQuoteLeg, OKXQuoteResponse.

- **unified_api_contracts_external/deribit/schemas.py** Used: DeribitOrder (UTEI); UMI deribit adapter imports
  additional Deribit* types. **Not used:** All Deribit* symbols not imported by UMI/UTEI adapters (e.g.
  DeribitInstrument, DeribitOrderBook, DeribitTicker, DeribitPosition, DeribitError, DeribitAccountSummary,
  DeribitFundingRateHistory, DeribitMarkPriceOption, DeribitOptionsGreeks, DeribitWebSocket*, and remaining Deribit*
  classes).

- **unified_api_contracts_external/bybit/schemas.py** Used: BybitOrder (UTEI); UMI bybit adapter imports Bybit* and
  CcxtTrade. **Not used:** All Bybit* symbols not imported by UMI/UTEI (e.g. BybitMarket, BybitOrderBook, BybitTicker,
  BybitMarkPriceKline, BybitIndexPriceKline, BybitPosition, BybitError, BybitOrderUpdateWS, BybitExecutionWS,
  BybitPositionWS, BybitWalletWS, BybitWebSocket\*, BybitInstrumentInfo, BybitOrderSubmitRequest/Response,
  BybitOrderCancelRequest/Response, BybitPositionQueryResponse, BybitMarginBalanceResponse, BybitRealizedPnlResponse,
  BybitWithdrawalRequest/Response, BybitFeeRate, BybitFundingRateHistory, BybitDepositAddress, BybitDepositRecords,
  BybitWithdrawals, BybitAccountTransfer, BybitLongShortRatio, BybitRiskLimit, BybitInsuranceFund, BybitDeliveryRecord,
  BybitLiquidationOrder).

- **sports/** Used: CanonicalOdds, OddsType, BetExecution, BetOrder, BOOKMAKER*REGISTRY, BookmakerInfo,
  BookmakerUnavailableError, ScraperError; sports.sources.oddsjam.schemas, sports.sources.opticodds.schemas. **Not
  used:** All other sports/canonical/*, sports/sources/\_ (e.g. api_football, betfair, footystats, odds_api, pinnacle,
  soccer_football_info, understat, open_meteo), sports/errors (except BookmakerUnavailableError, ScraperError) — e.g.
  BetRejectedError, OddsChangedError, MarketClosedError, FixtureNotFoundError; and all schema classes in
  sports/canonical (ArbitrageStatus, ArbitrageMarket, ExpectedValue, ArbitrageOpportunity, BetStatus, SignalSource,
  BettingSignal, BetOrder, BetExecution, BookmakerCategory, BookmakerInfo, CanonicalFixtureEvent, SportsFeatureVector,
  CanonicalVenue, CanonicalReferee, CanonicalPlayer, CanonicalTeam, CanonicalLeague, CanonicalFixture,
  CanonicalFixtureStatsDetail, CanonicalInjury, LineupPlayer, CanonicalLineup, MatchPeriod, LiveOddsUpdate,
  LiveMatchState, ScraperVersionMeta, TeamMapping, FixtureMapping, PlayerMapping, OutcomeType, MarketStatus,
  CanonicalBookmakerMarket, CanonicalOdds, CanonicalPlayerMatchStats, ProcessedOddsOutput, CanonicalProgressiveStats,
  CanonicalProgressiveOdds) and sports/sources/\* that are not oddsjam or opticodds.

- **unified_api_contracts_external/** (other venues) For each venue module (e.g. aster, cloud_sdks, coingecko,
  coinglass, cryptoquant, databento except as above, fear_greed, github, hyperliquid, macro, mev, onchain, sentiment,
  yahoo_finance, etc.): **all** symbols are unused by the six interfaces unless explicitly referenced in the “Used by
  interfaces” list above. Example: **cloud_sdks/** (quota_broker, aws, gcp, schemas/\*) — no interface imports;
  **aster**, **coingecko**, **hyperliquid**, **yahoo_finance**, **onchain/cryptoquant**, **sentiment/cryptopanic**,
  **sentiment/lunarcrush**, **macro/yahoo_finance**, **github** — no interface imports.

**Summary Type 2:** Entire trees `internal/`, `fix/`, `nautilus/`, `prime_broker/`, `regulatory/`, `shared/`,
`schemas/`, and `endpoint_registry`, `domain_config` (except DataSourceMapping) are unused by the six interfaces. In
`unified_api_contracts_external`, only a subset of venue modules and a subset of symbols within them are imported; the
remainder (hundreds of symbols across cloud_sdks, aster, coingecko, and all other non-adapter venues) are Type 2 (not
used by any interface).
