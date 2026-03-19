# Glossary

Shared terminology used throughout the Unified Trading Codex. Alphabetical.

---

**Asset class** – Category of financial instrument: equities, crypto, DeFi, options, futures, CFDs, sports betting.

**Batch mode** – Historical/backtest processing using GCS-stored data; no live exchange connectivity.

**Category** – Top-level asset classification: CEFI, TRADFI, DEFI, SPORTS.

**CeFi** – Centralized finance: custodial crypto exchanges (Binance, Coinbase, etc.).

**Client** – An investment management client with their own strategy instance and execution thread.

**CLV** – Closing Line Value; the benchmark odds at market close, used to measure betting edge.

**Cloud-agnostic** – Designed to run on GCP or AWS via CLOUD_PROVIDER abstraction.

**Codex** – This repository; the governing principles for the Unified Trading System.

**Corporate actions** – Dividends, splits, earnings, and other events that affect instrument pricing.

**Databento** – TradFi market data provider.

**Data catalogue** – Registry of what data exists, its dimensions, formats, and locations.

**DATA_READY event** – PubSub event indicating a service has completed processing and downstream consumers can proceed.

**DeFi** – Decentralized finance: non-custodial protocols (Uniswap, Aave, etc.).

**Domain client** – unified-trading-services abstraction for accessing domain data (InstrumentsDomainClient, etc.).

**Domain event** – Service-specific observability event (e.g., INSTRUMENT_PROCESSING_STARTED).

**Embedded package** – Live streaming pattern where downstream services import upstream as a Python package.

**External table** – BigQuery table that queries GCS Parquet files in-place without data duplication, enabled by Hive
partitioning.

**Feature group** – Category of computed features (e.g., momentum, volatility, calendar).

**GCS** – Google Cloud Storage.

**Lifecycle event** – Universal service event: STARTED, STOPPED, FAILED, etc.

**Live mode** – Real-time trading with exchange connectivity.

**log_event()** – unified-trading-services function for emitting standardized events.

**MAX_WORKERS** – Number of dates (batch) or venues (live) a service processes in parallel within one VM/container.

**NautilusTrader** – Execution engine used for tick-level backtesting and live trading.

**Partitioning** – GCS path convention: by_date/day={date}/timeframe={tf}/... (Hive-style for BigQuery compatibility).

**PubSub event bus** – Cloud-agnostic event distribution (GCP Pub/Sub or AWS SNS/SQS) for lifecycle, resource, and
data-ready events.

**Pipeline DAG** – Directed acyclic graph of service dependencies.

**Quality gates** – Automated checks (ruff, pytest) that must pass before merge.

**ripgrep (rg)** – Fast grep tool. Required to run `scripts/check-codex-compliance.sh`. Install: `brew install ripgrep`
(macOS) or `apt install ripgrep` (Linux).

**Quickmerge** – Branch-based merge workflow that enforces quality gates before creating a PR.

**Resource event** – CPU, memory, or disk monitoring event from setup_cloud_logging.

**Schema governance** – Principle that schemas are defined before data is written and validated pre-upload.

**Shard** – A unit of work defined by dimensions (category x venue x date).

**Signal** – A strategy's instruction to execute (direction, venue, symbol, size).

**Tardis** – CeFi market data provider.

**TradFi** – Traditional finance: equities, options, futures on regulated exchanges.

**The Graph** – DeFi data indexing protocol.

**UnifiedCloudServicesConfig** – Base config class all service configs must extend from unified-trading-services.

**USEI** – unified-sports-execution-interface; T2 library providing BaseSportsAdapter for bookmaker/exchange
integration.

**Venue** – A trading exchange or protocol (Binance, NYSE, Uniswap, etc.).

**Walk-forward validation** – ML training methodology: train on window, test on next period, slide forward.
