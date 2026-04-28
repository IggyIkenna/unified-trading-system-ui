/**
 * Cross-asset-group market-data view primitives.
 *
 * Single import surface for the DART terminal's borrowed CoinMarketCap /
 * Coinglass / Deribit / DefiLlama / Polymarket-style views. Per the
 * "no orphans, all in DART" constraint of the cross-asset-group market-data
 * terminal plan, every market-data widget MUST consume one of these
 * primitives — do not introduce parallel chart components.
 *
 * Phase 0 ships six primitives:
 *   - ScatterPlot              (XY plot, term structures, time-series curves)
 *   - CategoricalMatrix        (discrete × discrete, e.g. funding-rate matrix)
 *   - ContinuousHeatmap        (continuous × continuous, e.g. liquidation map)
 *   - FlowChart                (inflow/outflow with cumulative net overlay)
 *   - DepthAreaChart           (Coinglass-style cumulative depth curve)
 *   - RankingListPreset        (sortable, virtualised ranking with sparkline)
 *
 * Remaining (deferred): OptionsChainPreset, MetricGauge — and migration of
 * existing matrix widgets (defi-funding-matrix, monthly-returns-heatmap) to
 * consume CategoricalMatrix.
 */

export { ScatterPlot, type ScatterPlotProps, type ScatterPlotPoint, type ScatterPlotSeries } from "./scatter-plot";
export { CategoricalMatrix, type CategoricalMatrixProps, type CategoricalMatrixCell } from "./categorical-matrix";
export { ContinuousHeatmap, type ContinuousHeatmapProps, type ContinuousHeatmapPoint } from "./continuous-heatmap";
export { FlowChart, type FlowChartProps, type FlowChartBucket } from "./flow-chart";
export { DepthAreaChart, type DepthAreaChartProps, type DepthLevel } from "./depth-area-chart";
export { MetricGauge, type MetricGaugeProps } from "./metric-gauge";
export { OptionsChainPreset, type OptionsChainPresetProps } from "./options-chain-preset";
export {
  RankingListPreset,
  type RankingListPresetProps,
  type RankingListItem,
  type RankingListExtraColumn,
} from "./ranking-list-preset";
