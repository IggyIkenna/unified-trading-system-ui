/**
 * @unified-admin/core — shared UI components
 *
 * Exports: layout components, navigation, error boundaries, tables, chart base configs.
 * All 11 UI repos import from here instead of maintaining local duplicates.
 */

export interface LayoutProps {
  title: string;
  children: unknown;
}

export interface NavItem {
  label: string;
  href: string;
  active?: boolean;
}

export interface TableColumn<T> {
  key: keyof T;
  header: string;
  width?: number;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

/** Produces a typed column config for a given data shape. */
export function defineColumns<T>(columns: TableColumn<T>[]): TableColumn<T>[] {
  return columns;
}

/** Returns a default nav item with active=false. */
export function createNavItem(label: string, href: string): NavItem {
  return { label, href, active: false };
}
