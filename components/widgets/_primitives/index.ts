/**
 * Cross-asset-group market-data view primitives.
 *
 * Single import surface for the DART terminal's borrowed CoinMarketCap /
 * Coinglass / Deribit / DefiLlama / Polymarket-style views. Per the
 * "no orphans, all in DART" constraint of the cross-asset-group market-data
 * terminal plan, every market-data widget MUST consume one of these
 * primitives — do not introduce parallel chart components.
 *
 * Phase 0 ships three primitives. The remaining four (FlowChart,
 * ContinuousHeatmap, DepthAreaChart, OptionsChainPreset, MetricGauge) and
 * the migration of existing matrix widgets to CategoricalMatrix are
 * follow-up work — see plan P0.3.
 */

export { ScatterPlot, type ScatterPlotProps, type ScatterPlotPoint, type ScatterPlotSeries } from "./scatter-plot";
export { CategoricalMatrix, type CategoricalMatrixProps, type CategoricalMatrixCell } from "./categorical-matrix";
export {
  RankingListPreset,
  type RankingListPresetProps,
  type RankingListItem,
  type RankingListExtraColumn,
} from "./ranking-list-preset";
