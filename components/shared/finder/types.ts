import type React from "react";

/** A single item rendered in a finder column */
export interface FinderItem<T = unknown> {
  id: string;
  label: string;
  count?: number;
  status?: string;
  data: T;
}

/** Selection state across all columns, keyed by column id */
export type FinderSelections = Record<string, FinderItem | null>;

/** A single column definition — each page provides an array of these */
export interface FinderColumnDef<T = unknown> {
  id: string;
  label: string;
  /**
   * Layout hint: `w-[NNNpx]` for fixed, resizable columns, or `flex-1` for the last fluid column.
   * Pixel values are parsed for default width and drag-to-resize (see defaultWidthPx / minWidthPx).
   */
  width: string;
  /** Overrides pixel width parsed from `w-[Npx]` for initial size after reset */
  defaultWidthPx?: number;
  /** Minimum width when resizing (default 96) */
  minWidthPx?: number;
  /** Maximum width when resizing (default 560) */
  maxWidthPx?: number;
  getItems: (selections: FinderSelections) => FinderItem<T>[];
  renderIcon?: (item: FinderItem<T>, active: boolean) => React.ReactNode;
  renderLabel?: (item: FinderItem<T>) => React.ReactNode;
  getCount?: (item: FinderItem<T>) => number | null;
  visibleWhen?: (selections: FinderSelections) => boolean;
  paginate?: boolean; // If true, paginate items (default PAGE_SIZE=100)
  showSearch?: boolean; // If true, renders an internal search input within the column
  searchPlaceholder?: string; // Placeholder for the column's internal search
}

/** Context strip stats — each page computes from current selections */
export interface FinderContextStats {
  name: string;
  badges?: { label: string; variant: string; icon?: React.ReactNode }[];
  metrics?: {
    label: string;
    value: string | number;
    format?: "number" | "percent" | "time";
  }[];
  progressBar?: { value: number; color: string };
}

/** Props for the generic FinderBrowser */
export interface FinderBrowserProps {
  columns: FinderColumnDef[];
  detailPanel: (selections: FinderSelections) => React.ReactNode;
  contextStats: (selections: FinderSelections) => FinderContextStats;
  emptyState?: React.ReactNode;
  search?: string;
  detailPanelWidth?: string; // Default: "w-[420px]"
  detailPanelDefaultOpen?: boolean; // Default: true
  detailPanelTitle?: string; // Default: "Detail"
}
