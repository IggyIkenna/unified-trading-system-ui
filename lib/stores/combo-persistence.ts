"use client";

/**
 * Combo/Bundle Persistence — Firestore-backed storage for:
 * - DeFi Atomic Bundles (multi-step DeFi ops saved as templates)
 * - Sports Accumulators (multi-leg bet configs)
 * - Options Combos (spread/straddle/condor configs)
 * - Prediction Aggregators (multi-market positions)
 *
 * If Firestore is unavailable (T0 mock mode, no Firebase config), falls back
 * to localStorage seamlessly.
 *
 * Document path: combos/{userId}
 * Shape: { bundles: ComboConfig[], updatedAt: Timestamp }
 */

import { useEffect, useState, useCallback } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/auth/firebase-config";
import { useAuth } from "@/hooks/use-auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ComboFamily = "defi_bundle" | "sports_accumulator" | "options_combo" | "prediction_aggregator";

export interface ComboConfig {
  id: string;
  name: string;
  family: ComboFamily;
  /** Family-specific config — treated as opaque blob */
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface ComboDoc {
  bundles: ComboConfig[];
  updatedAt: ReturnType<typeof serverTimestamp>;
}

const LOCAL_KEY = "unified-combo-configs";

function loadFromLocalStorage(): ComboConfig[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as ComboConfig[]) : [];
  } catch {
    return [];
  }
}

function saveToLocalStorage(bundles: ComboConfig[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(bundles));
  } catch {
    // ignore quota errors
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseComboPersistenceReturn {
  bundles: ComboConfig[];
  loading: boolean;
  saveBundle: (bundle: Omit<ComboConfig, "createdAt" | "updatedAt">) => void;
  deleteBundle: (id: string) => void;
  updateBundle: (id: string, updates: Partial<Omit<ComboConfig, "id" | "createdAt">>) => void;
}

export function useComboPersistence(): UseComboPersistenceReturn {
  const { user } = useAuth();
  const [bundles, setBundles] = useState<ComboConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const db = getFirebaseDb();
  const userId = user?.id ?? null;
  const enabled = db !== null && userId !== null;

  // ── Load on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled || !db || !userId) {
      // Fallback to localStorage
      setBundles(loadFromLocalStorage());
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const ref = doc(db, "combos", userId);
        const snap = await getDoc(ref);
        if (!cancelled) {
          const data = snap.exists() ? (snap.data() as ComboDoc) : null;
          const remote = data?.bundles ?? [];
          setBundles(remote);
          saveToLocalStorage(remote); // sync local cache
        }
      } catch {
        if (!cancelled) {
          setBundles(loadFromLocalStorage());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, db, userId]);

  // ── Persist to Firestore + localStorage ───────────────────────────────────
  const persist = useCallback(
    (next: ComboConfig[]) => {
      saveToLocalStorage(next);
      if (!enabled || !db || !userId) return;
      const ref = doc(db, "combos", userId);
      void setDoc(ref, { bundles: next, updatedAt: serverTimestamp() }, { merge: false });
    },
    [enabled, db, userId],
  );

  const saveBundle = useCallback(
    (bundle: Omit<ComboConfig, "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString();
      setBundles((prev) => {
        const existing = prev.find((b) => b.id === bundle.id);
        const next = existing
          ? prev.map((b) => (b.id === bundle.id ? { ...b, ...bundle, updatedAt: now } : b))
          : [...prev, { ...bundle, createdAt: now, updatedAt: now }];
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const deleteBundle = useCallback(
    (id: string) => {
      setBundles((prev) => {
        const next = prev.filter((b) => b.id !== id);
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const updateBundle = useCallback(
    (id: string, updates: Partial<Omit<ComboConfig, "id" | "createdAt">>) => {
      const now = new Date().toISOString();
      setBundles((prev) => {
        const next = prev.map((b) =>
          b.id === id ? { ...b, ...updates, updatedAt: now } : b,
        );
        persist(next);
        return next;
      });
    },
    [persist],
  );

  return { bundles, loading, saveBundle, deleteBundle, updateBundle };
}
