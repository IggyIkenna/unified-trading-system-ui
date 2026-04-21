"use client";

/**
 * Lifecycle-editor hook — fetches server-side Firestore lifecycle records once,
 * exposes per-instance getters, and wraps the PATCH flow with optimistic
 * update + sonner toast + error rollback.
 *
 * Used by `<StrategyCatalogueSurface viewMode="admin-editor">` (scaffolded in
 * `/admin/strategy-lifecycle-editor`). The GET list is lazy — the hook only
 * makes network calls when `enabled` is true, so admin-universe / client-
 * reality / client-fomo view modes pay no network cost.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  type LifecycleRecord,
  type LifecyclePatchBody,
  listStrategyInstanceLifecycles,
  patchStrategyInstanceLifecycle,
} from "@/lib/admin/api/strategy-lifecycle";
import type {
  ProductRouting,
  StrategyMaturityPhase,
} from "@/lib/architecture-v2/lifecycle";

export interface UseLifecycleEditorOptions {
  /** When false, the hook does nothing (no fetch, no PATCH). */
  readonly enabled: boolean;
}

export interface UseLifecycleEditorResult {
  /** True while the initial list is in flight. */
  readonly loading: boolean;
  /** Non-null when the initial list failed. */
  readonly loadError: string | null;
  /** Current (possibly optimistic) record for an instance. Null = not seeded. */
  getRecord: (instanceId: string) => LifecycleRecord | null;
  /** Set the maturity phase; server validates forward-only + retired rules. */
  setMaturity: (instanceId: string, next: StrategyMaturityPhase) => Promise<void>;
  /** Set the product routing. */
  setRouting: (instanceId: string, next: ProductRouting) => Promise<void>;
}

export function useLifecycleEditor(
  options: UseLifecycleEditorOptions,
): UseLifecycleEditorResult {
  const [records, setRecords] = useState<Map<string, LifecycleRecord>>(
    () => new Map(),
  );
  const [loading, setLoading] = useState<boolean>(options.enabled);
  const [loadError, setLoadError] = useState<string | null>(null);

  const mounted = useRef(true);
  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!options.enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    listStrategyInstanceLifecycles()
      .then((list) => {
        if (!mounted.current) return;
        const next = new Map<string, LifecycleRecord>();
        for (const rec of list) next.set(rec.instance_id, rec);
        setRecords(next);
        setLoadError(null);
      })
      .catch((err: unknown) => {
        if (!mounted.current) return;
        const msg = err instanceof Error ? err.message : String(err);
        setLoadError(msg);
      })
      .finally(() => {
        if (mounted.current) setLoading(false);
      });
  }, [options.enabled]);

  const getRecord = useCallback(
    (instanceId: string): LifecycleRecord | null =>
      records.get(instanceId) ?? null,
    [records],
  );

  const applyPatch = useCallback(
    async (
      instanceId: string,
      body: LifecyclePatchBody,
      label: string,
    ): Promise<void> => {
      const previous = records.get(instanceId) ?? null;
      // Optimistic update
      setRecords((prev) => {
        const next = new Map(prev);
        const base =
          prev.get(instanceId) ?? ({ instance_id: instanceId } as LifecycleRecord);
        next.set(instanceId, { ...base, ...body });
        return next;
      });
      try {
        const updated = await patchStrategyInstanceLifecycle(instanceId, body);
        if (!mounted.current) return;
        setRecords((prev) => {
          const next = new Map(prev);
          next.set(instanceId, updated);
          return next;
        });
        toast.success(`${label} applied`, {
          description: `${instanceId}`,
          duration: 5_000,
        });
      } catch (err: unknown) {
        if (!mounted.current) return;
        // Rollback
        setRecords((prev) => {
          const next = new Map(prev);
          if (previous === null) next.delete(instanceId);
          else next.set(instanceId, previous);
          return next;
        });
        const msg = err instanceof Error ? err.message : String(err);
        toast.error(`${label} rejected`, { description: msg, duration: 8_000 });
        throw err;
      }
    },
    [records],
  );

  const setMaturity = useCallback(
    (instanceId: string, next: StrategyMaturityPhase) =>
      applyPatch(instanceId, { maturity_phase: next }, `Maturity → ${next}`),
    [applyPatch],
  );

  const setRouting = useCallback(
    (instanceId: string, next: ProductRouting) =>
      applyPatch(instanceId, { product_routing: next }, `Routing → ${next}`),
    [applyPatch],
  );

  return {
    loading,
    loadError,
    getRecord,
    setMaturity,
    setRouting,
  };
}
