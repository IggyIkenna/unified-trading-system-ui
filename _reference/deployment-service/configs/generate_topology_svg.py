"""Generate RUNTIME_DEPLOYMENT_TOPOLOGY_DAG.svg using Graphviz.

Run: python3 generate_topology_svg.py
Requires: graphviz (brew install graphviz), pip install graphviz

Design principles (from RUNTIME_TOPOLOGY_DECISIONS.md):
- 4-line enriched node labels: name+deploy_badge, trigger, sharding dims, sinks badge
- NO dotted sink edges (GCS/PubSub sink shown as badge on node instead)
- Edge labels carry domain data name + protocol shorthand (B:GCS | L:PS)
- Reference panels (record nodes): legend, recovery, circuit breakers, publish+persist
- Tooltips: full PubSub topic templates + recovery methods per node
- Deployment badges: [VM] [CR Svc] [CR Job]
- API auth: all APIs note [OAuth]
"""

import logging

import graphviz

logger = logging.getLogger(__name__)

PLANNED_COLOR = "#ca8a04"

C = {
    "l1": ("#dbeafe", "#3b82f6"),
    "l2": ("#e0f2fe", "#0284c7"),
    "l3": ("#dcfce7", "#16a34a"),
    "l4": ("#fef3c7", "#d97706"),
    "l5": ("#fef3c7", "#d97706"),
    "l6": ("#fee2e2", "#dc2626"),
    "l7": ("#fce7f3", "#db2777"),
    "api": ("#f3e8ff", "#7c3aed"),
    "ui": ("#ecfeff", "#06b6d4"),
    "infra": ("#f1f5f9", "#64748b"),
    "store": ("#f0fdf4", "#16a34a"),
    "planned": ("#fefce8", PLANNED_COLOR),
    "panel": ("#f8fafc", "#64748b"),
}

# Edge style presets
B = {"color": "#2563eb", "penwidth": "2.0"}  # batch
L = {"color": "#7c3aed", "penwidth": "2.0"}  # live
CO = {"color": "#ea580c", "penwidth": "2.0", "style": "dashed"}  # co-located in_memory
H = {"color": "#06b6d4", "penwidth": "1.5"}  # HTTP/SSE
K = {"color": "#dc2626", "penwidth": "2.5", "style": "dashed"}  # circuit breaker / kill switch
PL = {"color": PLANNED_COLOR, "penwidth": "1.5", "style": "dashed"}  # planned
REDIS = {
    "color": "#16a34a",
    "penwidth": "1.0",
    "style": "dotted",
    "arrowsize": "0.6",
    "constraint": "false",
}


def svc(layer, label, planned=False, rename=None, tooltip=""):
    c = C["planned"] if planned else C[layer]
    lbl = label
    if planned:
        lbl += "\\n(PLANNED)"
    if rename:
        lbl += f"\\n[repo: {rename}]"
    attrs = {
        "label": lbl,
        "style": ("dashed,filled" if planned else "filled"),
        "fillcolor": c[0],
        "color": c[1],
        "penwidth": "2",
        "fontsize": "9",
        "fontname": "Arial",
        "shape": "box",
        "margin": "0.15,0.08",
    }
    if tooltip:
        attrs["tooltip"] = tooltip
    return attrs


def panel_node(name, label):
    """Reference panel styled as a record/note box."""
    return {
        "name": name,
        "label": label,
        "shape": "note",
        "style": "filled",
        "fillcolor": C["panel"][0],
        "color": C["panel"][1],
        "penwidth": "1",
        "fontsize": "8",
        "fontname": "Arial Narrow",
        "margin": "0.15,0.1",
    }


def build():
    g = graphviz.Digraph(
        "topology",
        format="svg",
        engine="dot",
        graph_attr={
            "rankdir": "TB",
            "fontname": "Arial",
            "fontsize": "10",
            "label": (
                "Runtime Deployment Topology DAG v10\\n"
                "7-layer pipeline | L1-L5 shared data plane | L6-L7 client-specific plane\\n"
                "Deploy: [VM]=co-located VM  [CR Svc]=Cloud Run Service  [CR Job]=Cloud Run Job\\n"
                "SSOT: RUNTIME_TOPOLOGY_DECISIONS.md | Machine-readable: runtime-topology.yaml"
            ),
            "labelloc": "t",
            "labeljust": "l",
            "pad": "0.4",
            "nodesep": "0.45",
            "ranksep": "0.65",
            "compound": "true",
            "newrank": "true",
            "bgcolor": "#fafbfc",
            "splines": "polyline",
        },
        node_attr={"fontname": "Arial", "fontsize": "8"},
        edge_attr={"fontname": "Arial", "fontsize": "7"},
    )

    # -- L1: Data Ingestion --
    with g.subgraph(name="cluster_l1") as s:
        s.attr(
            label="L1 - Data Ingestion  [Shared Data Plane]",
            style="rounded",
            color="#3b82f6",
            bgcolor="#f0f7ff",
        )
        s.node(
            "IS",
            **svc(
                "l1",
                "instruments-service  [CR Job]\\n~15min poll -> PubSub instrument events\\nB: cat x venue x date | L: venue\\nSinks: GCS + PubSub (instrument-events-{venue})",
                tooltip=(
                    "PubSub topic: instrument-events-{venue}\\n"
                    "Batch dims: category x venue x date\\n"
                    "Live trigger: ~15min timer poll\\n"
                    "Recovery: full re-fetch from venue REST APIs on restart"
                ),
            ),
        )
        s.node(
            "MTDH",
            **svc(
                "l1",
                "market-tick-data-service  [VM co-loc]\\ncontinuous WebSocket stream\\nB: cat x venue x inst_type x data_type x date\\nSinks: GCS + PubSub (raw-ticks-{venue}-{inst_type}-{data_type})",
                tooltip=(
                    "PubSub topic: raw-ticks-{venue}-{inst_type}-{data_type}\\n"
                    "Batch dims: category x venue x instrument_type x data_type x date\\n"
                    "Live trigger: continuous WebSocket message arrival\\n"
                    "Recovery: 1) WS reconnect exp-backoff 1s-32s 2) venue REST backfill 3) Tardis replay 4) GCS"
                ),
            ),
        )

    # -- L2: Market Data Processing --
    with g.subgraph(name="cluster_l2") as s:
        s.attr(
            label="L2 - Market Data Processing  [Shared Data Plane]",
            style="rounded",
            color="#0284c7",
            bgcolor="#f0f9ff",
        )
        s.node(
            "MDPS",
            **svc(
                "l2",
                "market-data-processing-service  [VM co-loc]\\n~15s timer (1m/5m/15m/1h/4h/24h on boundaries; clock-aligned)\\nB: cat x venue x inst_type x date x tf | L: venue x inst_type\\nRedis: ~1yr rolling candle window | Sinks: GCS + PubSub (candles-{venue}-{inst_type}-{tf})",
                tooltip=(
                    "PubSub topic: candles-{venue}-{inst_type}-{timeframe}\\n"
                    "Batch dims: category x venue x instrument_type x date x timeframe\\n"
                    "Live trigger: ~15s timer; 1m(x4), 5m(x20), 15m(x60), 1h(x240), 4h(x960), 24h(x5760)\\nClock-alignment: starts at even time boundary since midnight (ensures full candle blocks)\\n"
                    "Redis: ~1yr rolling candle window survives restarts (warmup from GCS on start)\\n"
                    "Recovery: subscribe live PubSub + replay GCS on separate thread; deduplicate by timestamp"
                ),
            ),
        )

    # -- L3: Feature Computation --
    with g.subgraph(name="cluster_l3") as s:
        s.attr(
            label="L3 - Feature Computation  [Shared Data Plane]  (MDPS-event-driven, not timer)",
            style="rounded",
            color="#16a34a",
            bgcolor="#f0fdf4",
        )
        s.node(
            "FCS",
            **svc(
                "l3",
                "features-calendar-svc  [CR Job]\\ndaily 00:05 UTC (Cloud Scheduler)\\nB: cat x date (batch only)\\nSinks: GCS only",
                tooltip=(
                    "Batch only -- no live mode\\nBatch dims: category x date\\nRecovery: re-run batch job"
                ),
            ),
        )
        s.node(
            "FDS",
            **svc(
                "l3",
                "features-delta-one-svc  [CR Svc]\\nMDPS completion event (event-driven)\\nB: cat x venue x feat_cat x date | L: venue x feat_cat\\nSinks: GCS + PubSub (features-{cat}-{venue})",
                tooltip=(
                    "PubSub topic: features-{category}-{venue}\\n"
                    "Batch dims: category x venue x feature_category x date\\n"
                    "Live trigger: MDPS completion PubSub event (NOT a timer)\\n"
                    "Recovery: subscribe live + replay GCS; deduplicate by timestamp"
                ),
            ),
        )
        s.node(
            "FVS",
            **svc(
                "l3",
                "features-volatility-svc  [CR Svc]\\nMDPS completion event (event-driven)\\nB: cat x venue x feat_cat x date | L: venue x feat_cat\\nSinks: GCS + PubSub (features-{cat}-{venue})",
                tooltip=(
                    "PubSub topic: features-{category}-{venue}\\n"
                    "Batch dims: category x venue x feature_category x date\\n"
                    "Live trigger: MDPS completion PubSub event\\n"
                    "Recovery: subscribe live + replay GCS; deduplicate by timestamp"
                ),
            ),
        )
        s.node(
            "FOS",
            **svc(
                "l3",
                "features-onchain-svc  [CR Job]\\nevery 60s (Cloud Scheduler, config-driven)\\nB: protocol x chain x date (batch only)\\nSinks: GCS only",
                tooltip=(
                    "Batch only -- no live mode\\nBatch dims: protocol x chain x date\\nRecovery: re-run batch job"
                ),
            ),
        )

    # -- L4: Cross-Instrument + Multi-Timeframe --
    with g.subgraph(name="cluster_l4") as s:
        s.attr(
            label="L4 - Cross-Instrument + Multi-Timeframe  [Shared Data Plane]  (aggregates L3)",
            style="rounded",
            color="#d97706",
            bgcolor="#fffbeb",
        )
        s.node(
            "FCIS",
            **svc(
                "l4",
                "features-cross-instrument-svc  [CR Svc]\\nFDS + FVS event (many-to-one agg per underlying)\\nB: underlying x date | L: underlying\\nSinks: GCS + PubSub (features-cross-instrument-{underlying})",
                tooltip=(
                    "PubSub topic: features-cross-instrument-{underlying}\\n"
                    "Batch dims: underlying x date\\n"
                    "Live trigger: FDS + FVS events (subscribes to ALL instruments of one underlying)\\n"
                    "Key: many-to-one aggregation - subscribes to multiple topics, publishes to one per underlying\\n"
                    "Recovery: subscribe live + replay GCS; maintain in-memory state per underlying"
                ),
            ),
        )
        s.node(
            "FMTS",
            **svc(
                "l4",
                "features-multi-timeframe-svc  [CR Svc]\\nFDS event per timeframe boundary\\nB: cat x venue x inst x tf x date | L: cat x venue x inst x tf\\nSinks: GCS + PubSub (features-mtf-{cat}-{venue}-{inst}-{tf})",
                tooltip=(
                    "repo: features-multi-timeframe-service\\n"
                    "PubSub topic: features-multi-timeframe-{category}-{venue}-{instrument}-{timeframe}\\n"
                    "Features: tf_momentum_alignment, tf_structure_context, tf_vol_compression, tf_session_context\\n"
                    "Timeframes: 5m, 15m, 1h, 4h, 1d\\n"
                    "Category sharding included (unlike FCIS which is cross-category)"
                ),
            ),
        )

    # -- L5: ML Pipeline --
    with g.subgraph(name="cluster_l5") as s:
        s.attr(
            label="L5 - ML Pipeline  [Shared Data Plane]",
            style="rounded",
            color="#d97706",
            bgcolor="#fffbeb",
        )
        s.node(
            "MLTR",
            **svc(
                "l5",
                "ml-training-service  [VM standalone]\\n~quarterly batch (Cloud Scheduler or manual)\\nB: model x inst x tf x target x cfg (batch only)\\nSinks: GCS only (model_artifacts_registry)",
                tooltip=(
                    "Batch only -- no live mode\\n"
                    "Batch dims: model x instrument x timeframe x target_type x config\\n"
                    "Deploy: standalone VM (~2hr training runs; Cloud Run max timeout insufficient)\\n"
                    "Recovery: re-run batch job from checkpoint"
                ),
            ),
        )
        s.node(
            "MLIN",
            **svc(
                "l5",
                "ml-inference-service  [CR Svc]\\nevent-driven (on feature events)\\nB: model x venue x inst x date | L: model x venue x inst\\nSinks: GCS + PubSub (predictions-{model}-{venue}-{inst})",
                tooltip=(
                    "PubSub topic: predictions-{model}-{venue}-{instrument}\\n"
                    "Batch dims: model x venue x instrument x date\\n"
                    "Live trigger: feature events from FDS/FVS/FCIS via PubSub\\n"
                    "Models: loaded from GCS (infrequent reload ~quarterly)\\n"
                    "GAP: currently reads features from BigQuery (target: PubSub subscription)\\n"
                    "Recovery: reload model from GCS, subscribe live PubSub features"
                ),
            ),
        )

    # -- L6: Strategy and Execution --
    with g.subgraph(name="cluster_l6") as s:
        s.attr(
            label="L6 - Strategy and Execution  [Client-Specific Plane]\\nco-located group: MTDH + MDPS + execution on same VM (in_memory transport)",
            style="rounded",
            color="#dc2626",
            bgcolor="#fef2f2",
        )
        s.node(
            "STR",
            **svc(
                "l6",
                "strategy-service  [CR Svc]\\nevent-driven (predictions + mktdata + positions)\\nB: strategy_id x client x date | L: strategy_id x client\\nSinks: GCS + PubSub (signals-{strategy}-{client})",
                tooltip=(
                    "PubSub topic: signals-{strategy_id}-{client}\\n"
                    "Batch dims: strategy_id x client x date\\n"
                    "Live trigger: predictions (ML inference) + market data (MDPS) + positions (PBM) via PubSub\\n"
                    "GAP: position monitoring still internal PositionMonitor (target: subscribe to PBM)\\n"
                    "Recovery: subscribe PBM for initial position snapshot, then ML + MDPS PubSub"
                ),
            ),
        )
        s.node(
            "EXEC",
            **svc(
                "l6",
                "execution-service  [VM co-loc]\\nevent-driven (on trade signals)\\nB: client x subaccount x date | L: client x subaccount\\nRedis: hot order state | Sinks: GCS + PubSub (orders-{client}-{sub}-{venue})",
                tooltip=(
                    "PubSub topic: orders-{client}-{subaccount}-{venue}\\n"
                    "Batch dims: client x subaccount x date\\n"
                    "Live trigger: trade signals from strategy-service via PubSub\\n"
                    "Redis: hot transient order state (NOT persistence - ephemeral)\\n"
                    "Order lifecycle events: ORDER_CREATED, ORDER_UPDATED, ORDER_CANCELLED, ORDER_FILLED, ORDER_REJECTED\\n"
                    "GAP: currently only publishes fills externally (target: full order lifecycle)\\n"
                    "Recovery: query exchange REST for open orders, restore Redis state"
                ),
            ),
        )

    # -- L7: Risk, PnL, Monitoring --
    with g.subgraph(name="cluster_l7") as s:
        s.attr(
            label="L7 - Risk, PnL, Monitoring  [Client-Specific Plane]",
            style="rounded",
            color="#db2777",
            bgcolor="#fdf2f8",
        )
        s.node(
            "PBM",
            **svc(
                "l7",
                "position-balance-monitor  [CR Svc]\\nevent-driven (fills + exchange recon)\\nB: client x venue x date | L: client x venue\\nPBM = authoritative position truth\\nSinks: GCS + PubSub (positions-{client}-{venue})",
                tooltip=(
                    "PubSub topic: positions-{client}-{venue}\\n"
                    "Batch dims: client x venue x date\\n"
                    "Live trigger: fill events from execution + direct exchange position feed\\n"
                    "Role: reconciles execution fills vs exchange-reported positions (authoritative source)\\n"
                    "Startup: queries exchange REST for current positions -> publishes initial state\\n"
                    "Recovery: query exchange REST positions+balances, publish initial snapshot"
                ),
            ),
        )
        s.node(
            "RAE",
            **svc(
                "l7",
                "risk-and-exposure-svc  [CR Svc]\\nevent-driven (positions + mktdata)\\nB: client x date | L: client\\nVaR, Greeks, DeFi LTV\\nSinks: GCS + PubSub (risk-{client})",
                tooltip=(
                    "PubSub topic: risk-{client}\\n"
                    "Batch dims: client x date\\n"
                    "Live trigger: position updates from PBM + market data from MDPS via PubSub\\n"
                    "Also publishes risk alerts to alerting-service (circuit breaker triggers)\\n"
                    "Recovery: subscribe PBM + MDPS PubSub"
                ),
            ),
        )
        s.node(
            "PNL",
            **svc(
                "l7",
                "pnl-attribution-svc  [CR Svc]\\nevent-driven (exec + risk + positions)\\nB: client x date | L: client\\ndelta, basis, funding, Greeks dims\\nSinks: GCS + PubSub (pnl-{client})",
                tooltip=(
                    "PubSub topic: pnl-{client}\\n"
                    "Batch dims: client x date\\n"
                    "Live trigger: execution events + risk metrics + position updates via PubSub\\n"
                    "Recovery: load GCS historical, subscribe execution + risk PubSub"
                ),
            ),
        )
        s.node(
            "ALT",
            **svc(
                "l7",
                "alerting-service  [CR Svc]\\nsingleton (no sharding)\\ncloud-logging crash subscription\\ncircuit breakers | Slack | PagerDuty",
                tooltip=(
                    "Singleton -- no sharding, no topic template\\n"
                    "Consumes: ALL lifecycle events from all services (unified events topic)\\n"
                    "Also receives: risk alerts, PBM balance alerts, execution rejection spikes\\n"
                    "Publishes: circuit-breaker-commands (halt execution+strategy) + external notifications\\n"
                    "Recovery: Cloud Run auto-restart + PubSub message retention"
                ),
            ),
        )

    # -- API Services --
    with g.subgraph(name="cluster_api") as s:
        s.attr(
            label="API Services  [CR Svc, OAuth, auto-scale]\\nUI -> API (HTTP REST + SSE) -> Service -> Storage  |  APIs never own data",
            style="rounded",
            color="#7c3aed",
            bgcolor="#faf5ff",
        )
        s.node(
            "MDA",
            **svc(
                "api",
                tooltip=(
                    "Port 8003 | OAuth authenticated\\n"
                    "Batch: serves historical order book snapshots and candles via HTTP REST from GCS\\n"
                    "Live: SSE orderbook from MTDH PubSub; SSE candles from MDPS PubSub\\n"
                    "GAP: currently orderbook only (target: orderbook + candles SSE)"
                ),
            ),
        )
        s.node(
            "ERA",
            **svc(
                "api",
                "execution-results-api  :8002  [CR Svc, OAuth]\\nHTTP REST + SSE fills + order lifecycle\\nB: reads execution results (GCS)\\nL: SSE fills (exec-svc PS)",
                tooltip=(
                    "Port 8002 | OAuth authenticated\\n"
                    "Batch: historical execution results from GCS\\n"
                    "Live: SSE fills and order lifecycle events from execution-service PubSub\\n"
                    "Consumed by: trading-analytics-ui, execution-analytics-ui, settlement-ui"
                ),
            ),
        )
        s.node(
            "CRS",
            **svc(
                "api",
                "client-reporting-api  :8005  [CR Job, OAuth]\\nbatch reports + live SSE P&L\\nB: reads PnL+risk+positions (GCS)\\nL: SSE P&L (pnl-svc PS) [target]",
                tooltip=(
                    "Port 8005 | OAuth authenticated\\n"
                    "Batch: historical P&L reports, portfolio summaries, invoices from GCS\\n"
                    "Live target: SSE P&L updates from pnl-attribution PubSub\\n"
                    "GAP: batch only currently"
                ),
            ),
        )
        s.node(
            "DEPAPI",
            **svc(
                "api",
                "deployment-api  :8001  [CR Svc, OAuth]\\nHTTP REST + SSE health events\\norchestration + kill-switch\\nReads: deployment-engine",
                tooltip=(
                    "Port 8001 | OAuth authenticated\\n"
                    "Endpoints: deployments, services, config, data-status, service-status, cloud-builds, checklists\\n"
                    "Live: SSE endpoint for health monitoring events (-> live-health-monitor-ui)\\n"
                    "Kill switch: /kill-switch/{service}/activate (OAuth-gated, state in Secret Manager)"
                ),
            ),
        )
        s.node(
            "STRAPI",
            **svc(
                "api",
                "strategy-api  :8004  [CR Svc, OAuth]\\nbacktest results + signal configs\\nB: reads signals (GCS)\\nThin FastAPI gateway over strategy-svc outputs",
                planned=True,
                tooltip=(
                    "PLANNED - new repo: strategy-api\\n"
                    "Port 8004 | OAuth authenticated\\n"
                    "Thin FastAPI gateway over strategy-service batch outputs (signals_backtest_results GCS)"
                ),
            ),
        )

    # -- UIs --
    with g.subgraph(name="cluster_ui") as s:
        s.attr(
            label="UIs  [CR Svc, auto-scale]  React/TypeScript static build\\nUI and API are SEPARATE Cloud Run Services (separate repos, separate scaling)",
            style="rounded",
            color="#06b6d4",
            bgcolor="#ecfeff",
        )

        with s.subgraph(name="cluster_ui_batch") as b:
            b.attr(
                label="Batch Research (3 tiers)",
                style="rounded,dashed",
                color="#94a3b8",
                bgcolor="#f0fdfa",
            )
            b.node(
                "MLUI",
                **svc(
                    "ui",
                ),
            )
            b.node(
                "STUI",
                **svc(
                    "ui",
                    "strategy-ui  [CR Svc]\\nstrategy backtest + param tuning\\n-> strategy-api :8004",
                    tooltip="Consumes: strategy-api (backtest results, signal configs)",
                ),
            )
            b.node(
                "EXANI",
                **svc(
                    "ui",
                    tooltip=(
                        "Content migration (execution-service/visualizer-ui/ extraction) tracked separately"
                    ),
                ),
            )

        with s.subgraph(name="cluster_ui_trade") as t:
            t.attr(
                label="Trading + Monitoring",
                style="rounded,dashed",
                color="#94a3b8",
                bgcolor="#f0fdfa",
            )
            t.node(
                "TAUI",
                **svc(
                    "ui",
                    "trading-analytics-ui  [CR Svc]\\nSSE fills + live P&L\\n-> execution-results-api :8002",
                    tooltip="Consumes: execution-results-api (live fills SSE)",
                ),
            )
            t.node(
                "LHMU",
                **svc(
                    "ui",
                    "live-health-monitor-ui  [CR Svc]\\nSSE health + kill switch status\\n-> deployment-api :8001",
                    tooltip="Consumes: deployment-api (SSE health events, kill switch status)",
                ),
            )

        with s.subgraph(name="cluster_ui_ops") as o:
            o.attr(
                label="Ops + Deployment", style="rounded,dashed", color="#94a3b8", bgcolor="#f0fdfa"
            )
            o.node(
                "DEPUI",
                **svc(
                    "ui", "deployment-ui  [CR Svc]\\nbatch vs live deploy\\n-> deployment-api :8001"
                ),
            )
            o.node("BAUI", **svc("ui", "batch-audit-ui  [CR Svc]\\n-> deployment-api :8001"))
            o.node("LGUI", **svc("ui", "logs-dashboard-ui  [CR Svc]\\n-> deployment-api :8001"))
            o.node(
                "OBUI",
                **svc("ui", "onboarding-ui  [CR Svc]\\nclient wizard\\n-> deployment-api :8001"),
            )

        with s.subgraph(name="cluster_ui_client") as c:
            c.attr(
                label="Client + Reporting",
                style="rounded,dashed",
                color="#94a3b8",
                bgcolor="#f0fdfa",
            )
            c.node(
                "CRUI", **svc("ui", "client-reporting-ui  [CR Svc]\\n-> client-reporting-api :8005")
            )
            c.node(
                "SETU",
                **svc(
                    "ui",
                    "settlement-ui  [CR Svc]\\n-> execution-results-api :8002\\n(not yet built)",
                    planned=True,
                ),
            )

    # -- Infrastructure --
    with g.subgraph(name="cluster_infra") as s:
        s.attr(label="Infrastructure", style="rounded", color="#64748b", bgcolor="#f8fafc")
        s.node("DEPENG", **svc("infra", "deployment-engine\\norchestrator + CLI + Terraform"))
        s.node("SIT", **svc("infra", "system-integration-tests\\nL3a smoke + L3b full E2E"))

    # -- Storage (no dotted edges -- shown as sinks badge on each node) --
    with g.subgraph(name="cluster_store") as s:
        s.attr(
            label="Storage + Transport Primitives\\n"
            "Rule: ALL services persist to GCS. Publish + persist in PARALLEL.\\n"
            "Consumer deduplicates by timestamp. See publish+persist panel.",
            style="rounded",
            color="#16a34a",
            bgcolor="#f0fdf4",
        )
        s.node(
            "GCS",
            shape="cylinder",
            label=(
                "GCS  (universal persistence sink)\\n"
                "instruments | ticks | candles | features\\n"
                "models | predictions | signals | fills\\n"
                "positions | risk | PnL | audit"
            ),
            fillcolor="#f0fdf4",
            color="#16a34a",
            style="filled",
            penwidth="2",
            fontsize="8",
            fontname="Arial",
            tooltip="Every service writes to GCS regardless of transport mode. In batch: GCS is also the transport. In live: GCS is persistence-only (PubSub is transport).",
        )
        s.node(
            "PS",
            shape="cylinder",
            label=(
                "PubSub  (live event bus)\\n"
                "scope: CROSS_VM\\n"
                "topics: see service node tooltips\\n"
                "retention: configurable (recovery support)"
            ),
            fillcolor="#f0fdf4",
            color="#16a34a",
            style="filled",
            penwidth="2",
            fontsize="8",
            fontname="Arial",
            tooltip="Live transport only -- ephemeral. Data published to PubSub MUST also be persisted to GCS separately. Topic templates per service in node tooltips.",
        )
        s.node(
            "REDIS",
            shape="cylinder",
            label=(
                "Redis  (hot transient state)\\nscope: SAME_VM\\nexec-svc: hot order state\\nMDPS: ~1yr candle cache"
            ),
            fillcolor="#f0fdf4",
            color="#16a34a",
            style="filled",
            penwidth="2",
            fontsize="8",
            fontname="Arial",
            tooltip="NOT persistence, NOT transport. Execution-service: hot order state (ephemeral). MDPS: ~1yr rolling candle window (survives restarts via GCS warmup).",
        )

    _add_reference_panels(g)
    _add_edges(g)

    return g


def _add_reference_panels(g: graphviz.Digraph) -> None:
    """Add architecture reference panel nodes to the graph."""

    # Legend panel
    g.node(
        "LEGEND",
        label=(
            "LEGEND\\l"
            "--------------------------------------\\l"
            "-- solid blue (2px)    batch flow  B:GCS\\l"
            "-- solid purple (2px)  live flow   L:PubSub\\l"
            "-- dashed orange (2px) co-located  CoLoc:in_memory (same VM)\\l"
            "-- solid cyan (1.5px)  HTTP / SSE  (API->UI or API->svc)\\l"
            "-- dashed red (2.5px)  CIRCUIT BREAKER / kill-switch\\l"
            "-- dashed amber (1.5px) planned (not yet built)\\l"
            "-- dotted green (1px)  Redis sink (exceptional)\\l"
            "--------------------------------------\\l"
            "Sinks badge on node label (no dotted edges to GCS/PubSub):\\l"
            "  'Sinks: GCS + PubSub' = publishes live + persists batch\\l"
            "  'Sinks: GCS only'     = batch/infrequent service\\l"
            "--------------------------------------\\l"
            "Deploy badges:  [VM co-loc]  [VM standalone]\\l"
            "               [CR Svc]  [CR Job]\\l"
        ),
        shape="note",
        style="filled",
        fillcolor="#fffbeb",
        color="#d97706",
        penwidth="1.5",
        fontsize="8",
        fontname="Arial Narrow",
        margin="0.15,0.1",
    )

    # Recovery chains panel
    g.node(
        "RECOVERY",
        label=(
            "RECOVERY CHAINS  (SSOT: sec.13)\\l"
            "--------------------------------------\\l"
            "CeFi crypto:\\l"
            "  1. UMI WS reconnect (exp-backoff 1s-32s, max 10)\\l"
            "  2. Venue REST backfill (<3mo most exchanges)\\l"
            "  3. Tardis replay (~7yr, WS-identical format)\\l"
            "  4. GCS historical (last resort)\\l"
            "TradFi:\\l"
            "  1. Venue reconnect\\l"
            "  2. Databento (7yr, live-identical, CME/Nasdaq/NYSE)\\l"
            "  3. IBKR TWS backfill (6mo tick, rate-limited)\\l"
            "  4. GCS historical\\l"
            "DeFi:\\l"
            "  1. RPC reconnect (The Graph / Alchemy / direct node)\\l"
            "  2. Block replay (blockchain = immutable, full history)\\l"
            "Internal svc (MDPS/features/ML/strategy/risk/PnL):\\l"
            "  concurrent replay GCS + live PubSub; deduplicate by ts\\l"
        ),
        shape="note",
        style="filled",
        fillcolor="#f0f7ff",
        color="#3b82f6",
        penwidth="1.5",
        fontsize="8",
        fontname="Arial Narrow",
        margin="0.15,0.1",
    )

    # Circuit breakers + kill switch panel
    g.node(
        "CIRCUIT",
        label=(
            "CIRCUIT BREAKERS + KILL SWITCH  (SSOT: sec.16)\\l"
            "--------------------------------------\\l"
            "Manual kill switch (human-initiated):\\l"
            "  deployment-api /kill-switch/{svc}/activate  (OAuth)\\l"
            "  -> PubSub: kill-switch-commands\\l"
            "  -> targets: execution-service + strategy-service\\l"
            "  -> state persisted in Secret Manager\\l"
            "Automated circuit breaker (alerting-initiated):\\l"
            "  alerting-service publishes CIRCUIT_BREAKER_OPEN\\l"
            "  -> PubSub: circuit-breaker-commands\\l"
            "  triggers: risk breach | order rejection spike\\l"
            "            balance discrepancy | connectivity loss\\l"
            "  escalation: PubSub -> Slack -> PagerDuty\\l"
            "Reset policy:\\l"
            "  position mismatch  -> auto-reset after recon\\l"
            "  network            -> auto-reset on reconnect\\l"
            "  risk breach        -> MANUAL reset only\\l"
            "  rate limit         -> auto-reset after cooldown\\l"
        ),
        shape="note",
        style="filled",
        fillcolor="#fef2f2",
        color="#dc2626",
        penwidth="1.5",
        fontsize="8",
        fontname="Arial Narrow",
        margin="0.15,0.1",
    )

    # Publish + Persist policy panel
    g.node(
        "PPOLICY",
        label=(
            "PUBLISH + PERSIST POLICY  (SSOT: sec.14)\\l"
            "--------------------------------------\\l"
            "Rule: publish PubSub + persist GCS in PARALLEL\\l"
            "  (not sequentially; GCS write must not block live publish)\\l"
            "Result: small overlap window at live->batch merge point\\l"
            "  -> consumer deduplicates by exchange_timestamp\\l"
            "Timestamps per message:\\l"
            "  exchange_timestamp  = canonical ordering key\\l"
            "  local_timestamp     = latency monitoring\\l"
            "  sequence_number     = gap detection per stream\\l"
            "Switchover (live start):\\l"
            "  1. Subscribe live PubSub (messages queue)\\l"
            "  2. Replay GCS up to last persisted ts (separate thread)\\l"
            "  3. Drain queued PubSub messages\\l"
            "  4. Merge point: live takes over, replay stops\\l"
        ),
        shape="note",
        style="filled",
        fillcolor="#f0fdf4",
        color="#16a34a",
        penwidth="1.5",
        fontsize="8",
        fontname="Arial Narrow",
        margin="0.15,0.1",
    )

    # Deployment modes summary panel
    g.node(
        "DEPLOYSUM",
        label=(
            "DEPLOYMENT MODES  (SSOT: sec.21 / runtime-topology.yaml)\\l"
            "--------------------------------------\\l"
            "VM co-located (always-on):\\l"
            "  MTDH + MDPS + execution-svc  (in_memory transport)\\l"
            "VM standalone (manual/scheduled):\\l"
            "  ml-training-svc  (~2hr runs, Cloud Run timeout N/A)\\l"
            "Cloud Run Svc (always-on):\\l"
            "  strategy | PBM | risk | alerting\\l"
            "Cloud Run Svc (mode-dependent):\\l"
            "  ml-inference | features-d1 | features-vol | features-xI\\l"
            "  batch=scale-to-zero | live=always-on\\l"
            "Cloud Run Job (scale-to-zero):\\l"
            "  instruments | features-calendar | features-onchain\\l"
            "  pnl-attribution | strategy-validation\\l"
            "Cloud Run Svc (auto-scale, OAuth):\\l"
            "  deployment-api :8001 | client-reporting-api :8005\\l"
            "Cloud Run Svc (auto-scale) - UIs:\\l"
            "  ALL UIs serve React static build\\l"
            "  UI and API are SEPARATE services (separate repos/scaling)\\l"
        ),
        shape="note",
        style="filled",
        fillcolor="#f8fafc",
        color="#64748b",
        penwidth="1.5",
        fontsize="8",
        fontname="Arial Narrow",
        margin="0.15,0.1",
    )


def _add_edges(g: graphviz.Digraph) -> None:
    """Add pipeline flow edges and reference panel positioning to the graph."""

    # L1 internal
    g.edge("IS", "MTDH", label="instruments_universe\\nB:GCS | L:PS", **B)
    g.edge("IS", "FMTS", label="instruments_universe\\nB:GCS | L:PS", **B, constraint="false")

    # L1 -> L2 (co-located group)
    g.edge("MTDH", "MDPS", label="raw_tick_data\\nB:GCS", **B)
    g.edge("MTDH", "MDPS", label="raw_tick_data\\nL:PS", **L)
    g.edge("MTDH", "MDPS", label="raw_tick_data\\nCoLoc:in_memory", **CO)

    # L2 -> L3
    g.edge("MDPS", "FDS", label="processed_candles_ohlcv\\nB:GCS | L:PS", **B)
    g.edge("MDPS", "FVS", label="processed_candles_ohlcv\\nL:PS", **L)

    # L3 -> L4
    g.edge("FDS", "FCIS", label="delta_one_features\\nB:GCS | L:PS", **B)
    g.edge("FVS", "FCIS", label="volatility_features\\nL:PS", **L)
    g.edge("FDS", "FMTS", label="delta_one_features\\nB:GCS | L:PS", **B)

    # L4 -> L5
    g.edge("FCIS", "MLTR", label="cross_instrument_features\\nB:GCS", **B)
    g.edge("FCIS", "MLIN", label="cross_instrument_features\\nL:PS", **L)
    g.edge("FMTS", "MLTR", label="mtf_features  B:GCS", **B, constraint="false")
    g.edge("FMTS", "MLIN", label="mtf_features  L:PS", **L, constraint="false")

    # L3 -> L5 direct (live features to inference)
    g.edge("FDS", "MLIN", label="delta_one_features\\nlive L:PS", **L, constraint="false")
    g.edge("FVS", "MLIN", label="vol_features  L:PS", **L, constraint="false")

    # L5 internal
    g.edge("MLTR", "MLIN", label="model_artifacts_registry\\nB:GCS (~quarterly)", **B)

    # L5 -> L6
    g.edge("MLIN", "STR", label="predictions\\nB:GCS | L:PS", **B)

    # MDPS -> L6 (market data to strategy live)
    g.edge("MDPS", "STR", label="processed_candles\\nL:PS", **L, constraint="false")

    # L6 internal
    g.edge("STR", "EXEC", label="trade_signals\\nB:GCS | L:PS", **B)

    # Co-located market feed to execution
    g.edge("MTDH", "EXEC", label="live market feed\\nCoLoc:in_memory", **CO, constraint="false")

    # L6 -> L7
    g.edge("EXEC", "PBM", label="order_lifecycle_events\\nL:PS", **L)
    g.edge("EXEC", "PNL", label="execution_results\\nB:GCS | L:PS", **B, constraint="false")
    g.edge("PBM", "RAE", label="position_updates\\nB:GCS | L:PS", **B)
    g.edge("RAE", "PNL", label="risk_metrics\\nB:GCS | L:PS", **B)

    # L7 feedback loop (position authority)
    g.edge("PBM", "STR", label="position_snapshots\\nL:PS (authority)", **L, constraint="false")

    # Risk -> alerting (circuit breaker triggers)
    g.edge(
        "RAE",
        "ALT",
        label="risk_alerts (circuit\\nbreaker triggers)  L:PS",
        **L,
        constraint="false",
    )
    g.edge("PBM", "ALT", label="balance_alerts  L:PS", **L, constraint="false")

    # Circuit breakers (alerting -> services)
    g.edge(
        "ALT",
        "EXEC",
        label="CIRCUIT BREAKER HALT\\nkill-switch-commands PS",
        **K,
        constraint="false",
    )
    g.edge("ALT", "STR", label="CIRCUIT BREAKER HALT", **K, constraint="false")

    # Service -> API (data source connections)
    g.edge("EXEC", "ERA", label="execution_results\\nB:GCS | L:PS", **B, constraint="false")
    g.edge("MDPS", "MDA", label="candles\\nB:GCS | L:PS (SSE)", **B, constraint="false")
    g.edge("MTDH", "MDA", label="orderbook_stream\\nL:PS (SSE)", **L, constraint="false")
    g.edge("PNL", "CRS", label="pnl_reports\\nB:GCS | L:PS (SSE)", **B, constraint="false")
    g.edge("DEPENG", "DEPAPI", label="orchestration", **H)
    g.edge("STR", "STRAPI", label="signals_backtest_results\\nB:GCS", **PL, constraint="false")

    # API -> UI (HTTP/SSE)
    g.edge("ERA", "TAUI", label="fills SSE", **H)
    g.edge("ERA", "EXANI", label="exec results", **H)
    g.edge("ERA", "SETU", **H)
    g.edge("MDA", "EXANI", label="mktdata", **H, constraint="false")
    g.edge("MDA", "MLUI", label="feature/candle plots", **H, constraint="false")
    g.edge("STRAPI", "STUI", label="backtest results", **H, style="dashed")
    g.edge("CRS", "CRUI", label="reports", **H)
    g.edge("DEPAPI", "DEPUI", **H)
    g.edge("DEPAPI", "LHMU", label="health SSE", **H)
    g.edge("DEPAPI", "BAUI", **H)
    g.edge("DEPAPI", "LGUI", **H)
    g.edge("DEPAPI", "OBUI", **H)
    g.edge("DEPAPI", "MLUI", label="deploy hook", **H)
    g.edge("DEPAPI", "STUI", label="deploy hook", **H)

    # Infra
    g.edge(
        "DEPAPI",
        "SIT",
        label="post-deploy trigger",
        style="dashed",
        color="#64748b",
        constraint="false",
    )

    # Exceptional Redis sinks (not shown via badge; Redis is not all-services)
    g.edge("EXEC", "REDIS", label="hot order state", **REDIS)
    g.edge("MDPS", "REDIS", label="~1yr candle cache", **REDIS)

    # Reference panel positioning (invisible edges to sink rank)
    with g.subgraph(name="cluster_panels") as p:
        p.attr(
            label="Architecture Reference",
            style="rounded,dashed",
            color="#94a3b8",
            bgcolor="#f9fafb",
            rank="sink",
        )
        p.node("LEGEND")
        p.node("RECOVERY")
        p.node("CIRCUIT")
        p.node("PPOLICY")
        p.node("DEPLOYSUM")

    # Invisible edges to push panels to bottom
    g.edge("ALT", "LEGEND", style="invis", constraint="false")
    g.edge("CRUI", "RECOVERY", style="invis", constraint="false")
    g.edge("REDIS", "CIRCUIT", style="invis", constraint="false")
    g.edge("GCS", "PPOLICY", style="invis", constraint="false")
    g.edge("PS", "DEPLOYSUM", style="invis", constraint="false")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    import os

    outdir = os.path.dirname(os.path.abspath(__file__))
    g = build()
    outpath = os.path.join(outdir, "RUNTIME_DEPLOYMENT_TOPOLOGY_DAG")
    g.render(outpath, cleanup=True)
    logger.info("Generated: %s.svg", outpath)
