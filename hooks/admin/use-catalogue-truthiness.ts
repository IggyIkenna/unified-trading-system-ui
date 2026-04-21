"use client";

import { useEffect, useState } from "react";

import {
  CatalogueTruthinessAdapter,
  catalogueTruthiness,
  type CatalogueSnapshot,
} from "@/lib/admin/truthiness";

interface HookState {
  readonly snapshot: CatalogueSnapshot | null;
  readonly isLoading: boolean;
  readonly error: Error | null;
}

const INITIAL_STATE: HookState = {
  snapshot: null,
  isLoading: true,
  error: null,
};

/**
 * Lightweight React hook around CatalogueTruthinessAdapter.
 *
 * Fetches a snapshot once on mount (or whenever the adapter instance
 * changes). Callers that need richer caching should wrap with TanStack
 * Query — this is the shim for pages that don't yet have Query wired.
 */
export function useCatalogueTruthiness(
  adapter: CatalogueTruthinessAdapter = catalogueTruthiness,
): HookState {
  const [state, setState] = useState<HookState>(INITIAL_STATE);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setState(INITIAL_STATE);
    adapter
      .fetchSnapshot(controller.signal)
      .then((snapshot) => {
        if (cancelled) return;
        setState({ snapshot, isLoading: false, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          snapshot: null,
          isLoading: false,
          error: err instanceof Error ? err : new Error(String(err)),
        });
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [adapter]);

  return state;
}
