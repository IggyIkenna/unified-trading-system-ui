/**
 * Data service (Acquire) — section labels shared by tabs, breadcrumbs, and route mapping.
 * Keep hrefs in `components/shell/service-tabs.tsx` (`DATA_TABS`) aligned with these keys.
 */
export const DATA_SERVICE_SECTION_LABELS = {
  overview: "Overview",
  instruments: "Instruments",
  raw: "Raw Data",
  processing: "Processing",
  events: "Events",
  coverage: "Coverage",
  gaps: "Gaps & Quality",
  valuation: "Valuation",
} as const;

export type DataServiceSectionKey = keyof typeof DATA_SERVICE_SECTION_LABELS;
