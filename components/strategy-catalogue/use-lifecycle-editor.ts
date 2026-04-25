"use client";

/**
 * Lifecycle-editor hook — fetches server-side Firestore lifecycle records once,
 * exposes per-instance getters, and wraps the PATCH flow with optimistic
 * update + sonner toast + 5-second undo + error rollback. Also exposes a
 * bulk-apply helper that fans out to up to 5 concurrent PATCHes.
 *
 * Used by `<StrategyCatalogueSurface viewMode="admin-editor">` (mounted at
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

const UNDO_WINDOW_MS = 5_000;
const BULK_PARALLEL_LIMIT = 5;

export interface UseLifecycleEditorOptions {
  /** When false, the hook does nothing (no fetch, no PATCH). */
  readonly enabled: boolean;
}

export interface BulkApplyResult {
  readonly succeeded: readonly string[];
  readonly failed: readonly { instanceId: string; error: string }[];
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
  /**
   * Apply the same patch body to every instance. Runs up to 5 PATCHes in
   * parallel and returns a per-instance success/error breakdown. Each
   * successful PATCH raises its own 5-second undo toast.
   */
  bulkApply: (
    instanceIds: readonly string[],
    body: LifecyclePatchBody,
  ) => Promise<BulkApplyResult>;
}

interface UndoContext {
  readonly instanceId: string;
  readonly previous: LifecycleRecord | null;
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
  const recordsRef = useRef(records);
  useEffect(() => {
    recordsRef.current = records;
  }, [records]);

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

  const scheduleUndoToast = useCallback(
    (label: string, ctx: UndoContext): void => {
      toast.success(`${label} applied`, {
        description: ctx.instanceId,
        duration: UNDO_WINDOW_MS,
        action: {
          label: "Undo",
          onClick: () => {
            void undoTransition(ctx, label);
          },
        },
      });
    },
    [],
  );

  const undoTransition = useCallback(
    async (ctx: UndoContext, originalLabel: string): Promise<void> => {
      if (!mounted.current) return;
      // Reverse PATCH: restore the previous maturity / routing values
      // explicitly. If there was no prior record, we can't meaningfully
      // roll back a server-side create.
      if (!ctx.previous) {
        toast.error("Undo skipped", {
          description: "No prior server record for this instance.",
          duration: 4_000,
        });
        return;
      }
      const reverseBody: LifecyclePatchBody = {
        ...(ctx.previous.maturity_phase !== undefined
          ? { maturity_phase: ctx.previous.maturity_phase }
          : {}),
        ...(ctx.previous.product_routing !== undefined
          ? { product_routing: ctx.previous.product_routing }
          : {}),
        rationale: `undo: ${originalLabel}`,
      };
      try {
        const restored = await patchStrategyInstanceLifecycle(
          ctx.instanceId,
          reverseBody,
        );
        if (!mounted.current) return;
        setRecords((prev) => {
          const next = new Map(prev);
          next.set(ctx.instanceId, restored);
          return next;
        });
        toast.success("Undo applied", {
          description: ctx.instanceId,
          duration: 4_000,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        toast.error("Undo rejected", { description: msg, duration: 8_000 });
      }
    },
    [],
  );

  const applyPatch = useCallback(
    async (
      instanceId: string,
      body: LifecyclePatchBody,
      label: string,
      opts: { silent?: boolean } = {},
    ): Promise<void> => {
      const previous = recordsRef.current.get(instanceId) ?? null;
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
        if (!opts.silent) {
          scheduleUndoToast(label, { instanceId, previous });
        }
      } catch (err: unknown) {
        if (!mounted.current) throw err;
        setRecords((prev) => {
          const next = new Map(prev);
          if (previous === null) next.delete(instanceId);
          else next.set(instanceId, previous);
          return next;
        });
        const msg = err instanceof Error ? err.message : String(err);
        if (!opts.silent) {
          toast.error(`${label} rejected`, { description: msg, duration: 8_000 });
        }
        throw err;
      }
    },
    [scheduleUndoToast],
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

  const bulkApply = useCallback(
    async (
      instanceIds: readonly string[],
      body: LifecyclePatchBody,
    ): Promise<BulkApplyResult> => {
      if (instanceIds.length === 0) {
        return { succeeded: [], failed: [] };
      }
      const queue = [...instanceIds];
      const succeeded: string[] = [];
      const failed: { instanceId: string; error: string }[] = [];
      const label = bulkLabel(body);

      async function worker(): Promise<void> {
        while (queue.length > 0) {
          const id = queue.shift();
          if (id === undefined) return;
          try {
            await applyPatch(id, body, label, { silent: true });
            succeeded.push(id);
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            failed.push({ instanceId: id, error: msg });
          }
        }
      }

      const workers = Array.from(
        { length: Math.min(BULK_PARALLEL_LIMIT, instanceIds.length) },
        () => worker(),
      );
      await Promise.all(workers);

      if (succeeded.length > 0) {
        toast.success(`Bulk ${label} applied to ${succeeded.length} instance(s)`, {
          description:
            failed.length > 0 ? `${failed.length} rejected — see console` : undefined,
          duration: UNDO_WINDOW_MS,
        });
      }
      if (failed.length > 0) {
        toast.error(`Bulk ${label} failed for ${failed.length} instance(s)`, {
          description: failed
            .slice(0, 3)
            .map((f) => `${f.instanceId}: ${f.error}`)
            .join(" · "),
          duration: 10_000,
        });
         
        console.error("bulkApply failures", failed);
      }
      return { succeeded, failed };
    },
    [applyPatch],
  );

  return {
    loading,
    loadError,
    getRecord,
    setMaturity,
    setRouting,
    bulkApply,
  };
}

function bulkLabel(body: LifecyclePatchBody): string {
  const parts: string[] = [];
  if (body.maturity_phase) parts.push(`Maturity → ${body.maturity_phase}`);
  if (body.product_routing) parts.push(`Routing → ${body.product_routing}`);
  return parts.join(" + ") || "lifecycle update";
}
