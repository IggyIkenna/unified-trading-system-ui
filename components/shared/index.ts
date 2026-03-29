/**
 * Barrel for cross-domain shared UI. Prefer direct imports
 * `@/components/shared/<name>` in app code; this file helps discovery and AI tooling.
 */
export { AlertRow, type AlertRowProps, type AlertRowSeverity } from "./alert-row";
export { ApiError } from "./api-error";
export { CollapsibleSection } from "./collapsible-section";
export { DataFreshness } from "./data-freshness";
export { DataTable, type DataTableProps } from "./data-table";
export { DataTableWidget, type DataTableColumn } from "./data-table-widget";
export { EmptyState } from "./empty-state";
export { ErrorBoundary } from "./error-boundary";
export { ExportDropdown } from "./export-dropdown";
export { FilterBar, useFilterState, type FilterDefinition, type FilterOption } from "./filter-bar";
export { FilterBarWidget } from "./filter-bar-widget";
export * from "./finder";
export { GateCheckRow, type GateCheckRowProps } from "./gate-check-row";
export { StatusIcon, statusBg, statusColor, type GateStatus } from "./gate-status";
export { KpiStrip, type KpiMetric } from "./kpi-strip";
export {
  MetricCard,
  type MetricCardProps,
  type MetricCardVariant,
  type MetricDensity,
  type MetricTone,
} from "./metric-card";
export { PageHeader, type PageHeaderProps } from "./page-header";
export { Spinner, type SpinnerProps, type SpinnerSize } from "./spinner";
export { StatusBadge, StatusDot } from "./status-badge";
export { ScrollArea, ScrollBar, WidgetScroll, WidgetScrollBar } from "./widget-scroll";
