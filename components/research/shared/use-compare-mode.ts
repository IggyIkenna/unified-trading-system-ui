"use client";

import * as React from "react";

/**
 * Shared compare-mode hook for research backtests (Strategy + Execution).
 * Supports selecting up to `maxItems` backtests for side-by-side comparison.
 */
export function useCompareMode(maxItems: number = 3) {
  const [compareSelected, setCompareSelected] = React.useState<string[]>([]);

  const toggleCompare = React.useCallback(
    (id: string) => {
      setCompareSelected((prev) =>
        prev.includes(id)
          ? prev.filter((x) => x !== id)
          : prev.length < maxItems
            ? [...prev, id]
            : prev,
      );
    },
    [maxItems],
  );

  const clearCompare = React.useCallback(() => {
    setCompareSelected([]);
  }, []);

  const isCompareReady = compareSelected.length >= 2;

  return {
    compareSelected,
    toggleCompare,
    clearCompare,
    isCompareReady,
    compareCount: compareSelected.length,
  };
}
