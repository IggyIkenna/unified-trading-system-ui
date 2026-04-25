"use client";

/**
 * useStrategyScopedInstruments — narrows a base instrument list to those
 * declared in the catalogue's strategy_instruments.json for a given
 * strategy / slot key.
 *
 * Behaviour:
 *  - strategyId = "manual" or empty → return base list unchanged
 *  - strategyId looks like a slot key (`{archetype}@{...}`) → fetch the
 *    slot's instruments, intersect with base list (so we don't surface
 *    instruments the venue panel doesn't know about)
 *  - strategyId is bare archetype id → union the instruments across all
 *    slots beginning with `{archetype}@` and intersect with base
 *  - any unresolved id → fall through with base list (no scoping)
 *
 * Cached via the envelope-loader's in-memory cache.
 */

import * as React from "react";
import { loadStrategyInstruments } from "./envelope-loader";

/**
 * Identifier extractor — given an arbitrary instrument row shape, returns
 * the canonical string used to match against strategy_instruments.json
 * `instruments[]`. The hook tries `key`, then `id`, then `symbol`, then
 * falls back to JSON.stringify (which won't match anything — effective
 * pass-through when the row shape is unknown).
 */
function defaultIdentifier(row: unknown): string {
  if (typeof row === "object" && row !== null) {
    const obj = row as Record<string, unknown>;
    if (typeof obj.key === "string") return obj.key;
    if (typeof obj.id === "string") return obj.id;
    if (typeof obj.symbol === "string") return obj.symbol;
  }
  return "";
}

export function useStrategyScopedInstruments<T>(
  strategyId: string,
  base: readonly T[],
  identifier: (row: T) => string = defaultIdentifier,
): readonly T[] {
  const [scoped, setScoped] = React.useState<readonly T[] | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const trimmed = strategyId.trim();
    if (!trimmed || trimmed === "manual") {
      setScoped(null);
      return;
    }
    loadStrategyInstruments()
      .then((data) => {
        if (cancelled) return;
        let matchingInstruments: readonly string[] = [];
        if (trimmed.includes("@")) {
          matchingInstruments = data.slots[trimmed]?.instruments ?? [];
        } else {
          const accumulator: string[] = [];
          for (const [slotKey, slot] of Object.entries(data.slots)) {
            if (slotKey.startsWith(`${trimmed}@`)) {
              accumulator.push(...slot.instruments);
            }
          }
          matchingInstruments = accumulator;
        }
        if (matchingInstruments.length === 0) {
          setScoped(null);
          return;
        }
        const allowed = new Set(matchingInstruments);
        const intersection = base.filter((row) => {
          const id = identifier(row);
          return id !== "" && allowed.has(id);
        });
        // If intersection is empty, fall through (don't trap user with 0 options).
        setScoped(intersection.length > 0 ? intersection : null);
      })
      .catch(() => {
        setScoped(null);
      });
    return () => {
      cancelled = true;
    };
  }, [strategyId, base]);

  return scoped ?? base;
}
