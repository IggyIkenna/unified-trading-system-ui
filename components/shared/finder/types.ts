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
  width: string; // Tailwind width class (e.g., "w-[168px]", "flex-1")
  getItems: (selections: FinderSelections) => FinderItem<T>[];
  renderIcon?: (item: FinderItem<T>, active: boolean) => React.ReactNode;
  renderLabel?: (item: FinderItem<T>) => React.ReactNode;
  getCount?: (item: FinderItem<T>) => number | null;
  visibleWhen?: (selections: FinderSelections) => boolean;
  paginate?: boolean; // If true, paginate items (default PAGE_SIZE=100)
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
