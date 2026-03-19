/**
 * @unified-admin/core — shared React-compatible hooks
 *
 * Exports: usePolling, useWebSocket, useAuth state, usePagination.
 * Framework-agnostic signatures — implementations provided by UI repos that
 * bring their own React/Vue dependency.
 */

export interface PollingOptions {
  intervalMs: number;
  enabled?: boolean;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface PaginationActions {
  nextPage: () => void;
  prevPage: () => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

export type PaginationHook = PaginationState & PaginationActions;

export interface WebSocketOptions {
  url: string;
  reconnectDelayMs?: number;
  maxRetries?: number;
}

export type WebSocketStatus = "connecting" | "open" | "closed" | "error";

/** Returns an initial pagination state with sensible defaults. */
export function createPaginationState(pageSize = 25): PaginationState {
  return { page: 1, pageSize, total: 0 };
}

/** Returns true if a next page exists given current state. */
export function hasNextPage(state: PaginationState): boolean {
  return state.page * state.pageSize < state.total;
}

/** Returns true if a previous page exists. */
export function hasPrevPage(state: PaginationState): boolean {
  return state.page > 1;
}
