# Deployment Topology Diagrams

Visual reference for batch vs live deployment models, service aggregation patterns, and messaging structure.

---

## Batch Deployment: Independent Containers via GCS

In batch mode, every service is a separate container. Communication is exclusively through GCS Parquet files.

```mermaid
graph TD
    subgraph Layer1[Layer 1: Data Ingestion]
        Instruments[instruments-service<br/>Container]
        Calendar[features-calendar-service<br/>Container]
    end

    subgraph Layer2[Layer 2: Raw Market Data]
        CorporateActions[instruments-service (corporate-actions domain)<br/>Container]
        TickHandler[market-tick-data-service<br/>Container]
    end

    subgraph Layer3[Layer 3: Processed Data]
        MDPS[market-data-processing-service<br/>Container]
    end

    subgraph Layer4[Layer 4: Features]
        FeatDelta[features-delta-one-service<br/>Container]
        FeatVol[features-volatility-service<br/>Container]
        FeatOnchain[features-onchain-service<br/>Container]
    end

    subgraph Layer5[Layer 5: ML]
        MLTrain[ml-training-service<br/>Container]
        MLInfer[ml-inference-service<br/>Container]
    end

    subgraph Layer6[Layer 6: Execution]
        Strategy[strategy-service<br/>Container]
        Execution[execution-service<br/>Container]
    end

    GCS[(GCS Parquet<br/>Message Bus)]

    Instruments -->|write| GCS
    GCS -->|read| CorporateActions
    GCS -->|read| TickHandler

    TickHandler -->|write| GCS
    GCS -->|read| MDPS

    MDPS -->|write| GCS
    Calendar -->|write| GCS

    GCS -->|read| FeatDelta
    GCS -->|read| FeatVol
    GCS -->|read| FeatOnchain

    FeatDelta -->|write| GCS
    FeatVol -->|write| GCS
    FeatOnchain -->|write| GCS

    GCS -->|read| MLTrain
    MLTrain -->|write models| GCS
    GCS -->|read| MLInfer
    MLInfer -->|write predictions| GCS

    GCS -->|read| Strategy
    Strategy -->|write signals| GCS

    GCS -->|read| Execution
    Execution -->|write results| GCS
```

**Key characteristics:**

- Each box is an independent container (VM or Cloud Run job)
- Containers start, read input, process, write output, and exit
- GCS is the only communication mechanism
- Any service can be restarted without affecting others
- Sharding: category x venue x date -- each shard is a separate container

---

## Live Deployment: Package Embedding for Low Latency

In live mode, services embed upstream packages to avoid network hops on the hot path. This creates a 7-8 deployment
topology.

```mermaid
graph TB
    subgraph TARDIS[Deploy 1: TARDIS Persistence]
        TardisPersist[market-tick-data-service<br/>mode: live<br/>source: TARDIS stream<br/>sink: GCS historical]
    end

    subgraph InstrumentsDeploy[Deploy 2: Instruments]
        InstLive[instruments-service<br/>mode: live<br/>venue APIs]
    end

    subgraph FeaturesCalendar[Deploy 3: Calendar Features]
        FeatCalLive[features-calendar-service<br/>mode: live<br/>timer: daily]
    end

    subgraph FeaturesDeltaDeploy[Deploy 4: Delta-One Features]
        FeatDeltaLive[features-delta-one-service<br/>mode: live]
        MDPSPackage1[market-data-processing<br/>EMBEDDED PACKAGE]
        TickPackage1[market-tick-data-service<br/>EMBEDDED in MDPS]

        FeatDeltaLive -.imports.-> MDPSPackage1
        MDPSPackage1 -.imports.-> TickPackage1
    end

    subgraph FeaturesVolDeploy[Deploy 5: Volatility Features]
        FeatVolLive[features-volatility-service<br/>mode: live]
        MDPSPackage2[market-data-processing<br/>EMBEDDED PACKAGE]
        TickPackage2[market-tick-data-service<br/>EMBEDDED in MDPS]

        FeatVolLive -.imports.-> MDPSPackage2
        MDPSPackage2 -.imports.-> TickPackage2
    end

    subgraph FeaturesOnchainDeploy[Deploy 6: Onchain Features]
        FeatOnchainLive[features-onchain-service<br/>mode: live]
        MDPSPackage3[market-data-processing<br/>EMBEDDED PACKAGE]
        TickPackage3[market-tick-data-service<br/>EMBEDDED in MDPS]

        FeatOnchainLive -.imports.-> MDPSPackage3
        MDPSPackage3 -.imports.-> TickPackage3
    end

    subgraph StrategyDeploy[Deploy 7: Strategy]
        StrategyLive[strategy-service<br/>mode: live]
        FeatDeltaPkg[features-delta-one<br/>EMBEDDED PACKAGE]
        MLInferPkg[ml-inference<br/>EMBEDDED PACKAGE]

        StrategyLive -.imports.-> FeatDeltaPkg
        StrategyLive -.imports.-> MLInferPkg
    end

    subgraph ExecutionDeploy[Deploy 8: Execution Per Client]
        ExecLive[execution-service<br/>mode: live<br/>per-client]
        TickPackage4[market-tick-data-service<br/>EMBEDDED PACKAGE<br/>exchange WebSocket]

        ExecLive -.imports.-> TickPackage4
    end

    GCSLive[(GCS<br/>Persistence Only)]
    Exchange[Exchange<br/>WebSocket APIs]
    TardisLive[TARDIS<br/>Live Client]

    TardisLive -->|stream| TardisPersist
    TardisPersist -->|write| GCSLive

    Exchange -->|ticks| TickPackage1
    Exchange -->|ticks| TickPackage2
    Exchange -->|ticks| TickPackage3
    Exchange -->|ticks| TickPackage4

    FeatCalLive -->|features<br/>in-process| FeatDeltaLive

    FeatDeltaLive -->|features<br/>in-process| StrategyLive

    StrategyLive -->|signals<br/>in-process| ExecLive

    InstLive -.persist.-> GCSLive
    FeatCalLive -.persist.-> GCSLive
    FeatDeltaLive -.persist.-> GCSLive
    FeatVolLive -.persist.-> GCSLive
    FeatOnchainLive -.persist.-> GCSLive
    StrategyLive -.persist.-> GCSLive
    ExecLive -.persist.-> GCSLive
```

**Key characteristics:**

- Solid boxes = separate deployments (containers/VMs)
- Dotted "imports" arrows = package embedding (in-process, no network)
- Solid data arrows = data flow (in-process function calls or async persistence)
- Each feature service embeds market-data-processing, which embeds market-tick-data-service
- Each deployment only connects to the venues it needs (selective venue initialization)
- TARDIS persistence is separate from the latency path
- GCS is for persistence only, not for inter-service communication

---

## Messaging Structure: Batch vs Live

### Batch Messaging (GCS Pull Model)

```mermaid
sequenceDiagram
    participant ServiceA as Service A<br/>Container
    participant GCS as GCS<br/>Parquet Files
    participant ServiceB as Service B<br/>Container

    Note over ServiceA: Process data for date X
    ServiceA->>ServiceA: Validate output
    ServiceA->>GCS: Write instruments.parquet<br/>(day=2024-01-15)
    ServiceA->>ServiceA: Exit

    Note over ServiceB: Check upstream ready
    ServiceB->>GCS: Check: instruments.parquet exists?
    GCS-->>ServiceB: Yes
    ServiceB->>GCS: Read instruments.parquet
    GCS-->>ServiceB: DataFrame
    ServiceB->>ServiceB: Process using instruments
    ServiceB->>GCS: Write candles.parquet<br/>(day=2024-01-15)
    ServiceB->>ServiceB: Exit
```

**Pull-based**: Service B pulls data from GCS when it is ready to process. Service A has already exited. No coordination
needed.

### Live Messaging (Package Embedding Push Model)

```mermaid
sequenceDiagram
    participant Exchange as Exchange<br/>WebSocket
    participant TickPkg as market-tick-data-service<br/>EMBEDDED PACKAGE
    participant MDPSEngine as MDPS Engine<br/>Aggregator
    participant FeatEngine as Features Engine<br/>Calculator
    participant GCS as GCS<br/>Async Persistence

    Note over Exchange,FeatEngine: All in same process

    Exchange->>TickPkg: Tick stream (continuous)
    TickPkg->>TickPkg: Buffer ticks

    Note over TickPkg: Timer fires (5m)
    TickPkg->>MDPSEngine: get_candles(last_5m)
    MDPSEngine->>MDPSEngine: Aggregate ticks
    MDPSEngine->>FeatEngine: publish_candles(DataFrame)

    FeatEngine->>FeatEngine: Compute features
    FeatEngine->>FeatEngine: Return features (in-process)

    par Async Persistence (separate thread)
        MDPSEngine-->>GCS: Write candles (async, non-blocking)
        FeatEngine-->>GCS: Write features (async, non-blocking)
    end
```

**Push-based**: Upstream components publish data via in-process function calls. Downstream components receive results
synchronously. Persistence happens asynchronously on a separate thread and never blocks the hot path.

---

## Service Aggregation: Batch vs Live

### Batch: No Aggregation (12 Separate Containers)

```mermaid
graph LR
    subgraph Batch[Batch Pipeline - 12 Independent Deployments]
        direction TB
        B1[instruments-service]
        B2[instruments-service (corporate-actions domain)]
        B3[market-tick-data-service]
        B4[market-data-processing]
        B5[features-calendar]
        B6[features-delta-one]
        B7[features-volatility]
        B8[features-onchain]
        B9[ml-training]
        B10[ml-inference]
        B11[strategy-service]
        B12[execution-service]
    end

    GCSBatch[(GCS<br/>All Communication)]

    B1 --> GCSBatch
    GCSBatch --> B2
    GCSBatch --> B3
    GCSBatch --> B4
    GCSBatch --> B5
    GCSBatch --> B6
    GCSBatch --> B7
    GCSBatch --> B8
    GCSBatch --> B9
    GCSBatch --> B10
    GCSBatch --> B11
    GCSBatch --> B12
```

**12 separate deployments**, each reading from and writing to GCS. No shared memory, no process coupling.

### Live: Package Aggregation (7 Deployments via Embedding)

```mermaid
graph TB
    subgraph Live[Live Pipeline - 7 Deployments with Package Embedding]
        direction TB

        subgraph D1[Deploy 1: TARDIS Persistence]
            L1[market-tick-data-service<br/>standalone<br/>TARDIS stream]
        end

        subgraph D2[Deploy 2: Instruments]
            L2[instruments-service<br/>standalone<br/>venue APIs]
        end

        subgraph D3[Deploy 3: Calendar Features]
            L3[features-calendar-service<br/>standalone<br/>deterministic]
        end

        subgraph D4[Deploy 4: Delta-One Features]
            L4[features-delta-one-service<br/>+ market-data-processing pkg<br/>+ market-tick-data-service pkg]
        end

        subgraph D5[Deploy 5: Volatility Features]
            L5[features-volatility-service<br/>+ market-data-processing pkg<br/>+ market-tick-data-service pkg]
        end

        subgraph D6[Deploy 6: Onchain Features]
            L6[features-onchain-service<br/>+ market-data-processing pkg<br/>+ market-tick-data-service pkg]
        end

        subgraph D7[Deploy 7: Strategy]
            L7[strategy-service<br/>+ features-delta-one pkg<br/>+ ml-inference pkg]
        end

        subgraph D8[Deploy 8: Execution Per Client]
            L8[execution-service<br/>+ market-tick-data-service pkg<br/>per-client instance]
        end
    end

    Exchange[Exchange APIs]
    GCSLive[(GCS<br/>Persistence)]

    Exchange -->|WebSocket| L4
    Exchange -->|WebSocket| L5
    Exchange -->|WebSocket| L6
    Exchange -->|WebSocket| L8

    L1 -.persist.-> GCSLive
    L2 -.persist.-> GCSLive
    L3 -.persist.-> GCSLive
    L4 -.persist.-> GCSLive
    L5 -.persist.-> GCSLive
    L6 -.persist.-> GCSLive
    L7 -.persist.-> GCSLive
    L8 -.persist.-> GCSLive

    L4 -->|in-process| L7
    L7 -->|in-process| L8
```

**8 deployments** (7 core + 1 per-client execution). Market-tick-data-handler runs as an embedded package in 4 places.
Market-data-processing runs as an embedded package in 3 feature services. Each deployment only initializes venues it
needs.

---

## Persistence vs Live Path

```mermaid
graph TB
    subgraph Persistence[Persistence Path - Not Latency Critical]
        TardisStream[TARDIS<br/>Live Client]
        TardisHandler[market-tick-data-service<br/>standalone deploy<br/>mode: live]
        GCSStorage[(GCS<br/>Historical Storage)]

        TardisStream -->|complete tick stream| TardisHandler
        TardisHandler -->|write all ticks| GCSStorage
    end

    subgraph LivePath[Live Path - Latency Critical Under 2s]
        ExchangeWS[Exchange<br/>WebSocket]
        TickPkg[market-tick-data-service<br/>EMBEDDED in consumer]
        Consumer[Consumer Service<br/>MDPS or Features or Execution]
        PersistQueue[Persistence Queue<br/>separate thread]

        ExchangeWS -->|ticks| TickPkg
        TickPkg -->|buffered data| Consumer
        Consumer -->|processed results| PersistQueue
        PersistQueue -.async write.-> GCSStorage
    end

    style Persistence fill:#f0f0f0
    style LivePath fill:#ffe0e0
```

**Two independent paths:**

- **Persistence path** (TARDIS): complete historical-grade data, stored for replay and compliance. Runs continuously but
  not latency-sensitive.
- **Live path** (Exchange WebSocket): real-time data for trading, embedded as packages, latency-critical (<2s
  end-to-end). Async persistence on separate thread.

We store data once (TARDIS persistence) but consume it in two places (embedded packages for speed). GCP doesn't charge
for data ingestion, so duplicate WebSocket connections are cost-acceptable.

---

## Package Embedding Pattern

```mermaid
graph LR
    subgraph FeatureService[features-delta-one-service Deploy]
        direction TB
        FeatMain[Main Process]

        subgraph MDPSPkg[market-data-processing-service<br/>PACKAGE]
            MDPSCode[MDPS Engine<br/>aggregation logic]

            subgraph TickPkg[market-tick-data-service<br/>PACKAGE]
                TickCode[Tick Handler<br/>venue adapters]
            end

            MDPSCode -.imports.-> TickCode
        end

        FeatMain -.imports.-> MDPSPkg
    end

    Exchange[Exchange WebSocket]

    Exchange -->|ticks| TickCode
    TickCode -->|buffered ticks| MDPSCode
    MDPSCode -->|candles| FeatMain
    FeatMain -->|features| StrategyService

    StrategyService[strategy-service<br/>separate deploy]
```

**Nested package embedding:**

- `features-delta-one-service` imports `market-data-processing-service` as a package
- `market-data-processing-service` imports `market-tick-data-service` as a package
- All three run in the same process
- Exchange ticks flow: WebSocket -> tick handler package -> MDPS package -> features main process
- Zero network hops, all in-memory function calls

---

## Selective Venue Initialization

Both batch and live use the same sharding/filtering principle: **only initialize venues you need**.

```mermaid
graph TB
    subgraph BatchShard[Batch Shard]
        BatchCLI[CLI Args:<br/>--venues BINANCE-FUTURES<br/>--category CEFI]
        BatchInit[Initialize only<br/>BINANCE-FUTURES adapter]
        BatchProcess[Process only<br/>BINANCE instruments]
    end

    subgraph LiveDeploy[Live Deploy]
        LiveConfig[Config:<br/>venues: BINANCE-FUTURES<br/>category: CEFI]
        LiveInit[Initialize only<br/>BINANCE-FUTURES adapter]
        LiveStream[Stream only<br/>BINANCE WebSocket]
    end

    BatchCLI --> BatchInit --> BatchProcess
    LiveConfig --> LiveInit --> LiveStream

    style BatchShard fill:#e0f0ff
    style LiveDeploy fill:#ffe0e0
```

**Same principle, different input:**

- Batch: CLI args specify venues (shard dimension)
- Live: config specifies venues (deployment parameter)
- Result: both modes only initialize the venue adapters they need, minimizing resource usage and connection overhead

Already implemented in instruments-service. Being applied to market-tick-data-service. Should be universal across all
services with venue-specific logic.

---

## Sports Pipeline — Batch Deployment (Consolidated, 2026-03-01)

Sports data flows through the **existing** batch pipeline services, not separate sports-specific services. The 4
sports-specific pipeline services (`sports-reference-data-service`, `sports-odds-processing-service`,
`sports-strategy-service`, `sports-execution-service`) are **DEPRECATED/ARCHIVED** as of 2026-03-01. Only
`features-sports-service` and `unified-sports-execution-interface` (USEI) remain as standalone.

```mermaid
graph TD
    subgraph BatchA [Batch A: Reference Data]
        Instruments[instruments-service<br/>asset_class=SPORTS<br/>sports parser + fixture matching]
    end

    subgraph BatchB [Batch B: Odds + Processing]
        MDP[market-data-processing-service<br/>asset_class=SPORTS<br/>Odds API + Betfair + API-Football]
    end

    subgraph BatchC [Batch C: Features]
        FeatSports[features-sports-service<br/>NEW standalone<br/>19 categories + horizons]
    end

    subgraph BatchD [Batch D: Strategy]
        Strategy[strategy-service<br/>asset_class=SPORTS<br/>arbitrage + value betting + Kelly]
    end

    subgraph BatchE [Batch E: Execution]
        Execution[execution-service<br/>asset_class=SPORTS<br/>Betfair + Pinnacle + Polymarket via USEI]
    end

    GCS[(GCS + PubSub)]

    Instruments -->|canonical fixtures/teams/leagues| GCS
    GCS -->|fixture list| MDP
    MDP -->|snapshots + ProcessedOddsOutput + arb| GCS
    GCS -->|reference + processed odds| FeatSports
    FeatSports -->|SportsFeatureVector| GCS
    GCS -->|features + opportunities| Strategy
    Strategy -->|BetOrder| GCS
    GCS -->|orders| Execution
    Execution -->|BetExecution| GCS
```

**Ordering:** Batch A D5 -> Batch B D5 -> Batch C D5 -> Batch D D5 -> Batch E D5. See
`04-architecture/sports-integration-plan.md` Phase 3 (consolidated).

**Key difference from original plan:** No separate sports service containers. Sports is a category/asset_class within
each existing service, following the same sharding model (category x venue x date).
