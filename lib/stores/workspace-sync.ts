"use client";

import { useEffect, useRef, useCallback } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/auth/firebase-config";
import { useWorkspaceStore } from "./workspace-store";
import type { Workspace, CustomPanel, WorkspaceSnapshot } from "./workspace-store";
import { useAuth } from "@/hooks/use-auth";

/** Shape of the Firestore document at workspaces/{userId}. */
interface WorkspaceDoc {
  workspaces: Record<string, Workspace[]>;
  activeWorkspaceId: Record<string, string>;
  customPanels: CustomPanel[];
  snapshots: Record<string, WorkspaceSnapshot[]>;
  updatedAt: ReturnType<typeof serverTimestamp>;
}

const DEBOUNCE_MS = 500;

/**
 * Syncs the zustand workspace store with Firestore.
 *
 * - On mount (if authenticated + Firestore available): loads the remote
 *   document and overwrites the local store (Firestore is source of truth
 *   on first load).
 * - On every subsequent workspace change: debounced save to Firestore.
 * - If Firebase is not configured or user is not authenticated, this is a
 *   complete no-op — localStorage-only fallback works as before.
 * - All Firestore operations are fire-and-forget; they never block the UI.
 */
export function useWorkspaceSync(): void {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const dbRef = useRef<Firestore | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedRef = useRef(false);
  const suppressNextSave = useRef(false);

  // Lazy-grab the Firestore instance once.
  if (dbRef.current === null) {
    dbRef.current = getFirebaseDb();
  }

  const db = dbRef.current;
  const enabled = db !== null && userId !== null;

  // ── Load from Firestore on mount ──────────────────────────────────
  useEffect(() => {
    if (!enabled || !db || !userId) {
      loadedRef.current = false;
      return;
    }

    let cancelled = false;

    async function loadRemote() {
      try {
        const ref = doc(db!, "workspaces", userId!);
        const snap = await getDoc(ref);
        if (cancelled) return;

        if (snap.exists()) {
          const data = snap.data() as Partial<WorkspaceDoc>;
          const remoteWorkspaces = data.workspaces;
          const remoteActiveIds = data.activeWorkspaceId;
          const remoteCustomPanels = data.customPanels;

          if (remoteWorkspaces && typeof remoteWorkspaces === "object") {
            // Suppress the next save triggered by the store update so we
            // don't immediately write back what we just loaded.
            suppressNextSave.current = true;

            const store = useWorkspaceStore.getState();
            const remoteSnapshots = data.snapshots;

            // Overwrite local state with remote data.
            useWorkspaceStore.setState({
              workspaces: remoteWorkspaces,
              activeWorkspaceId: remoteActiveIds ?? store.activeWorkspaceId,
              customPanels: Array.isArray(remoteCustomPanels)
                ? remoteCustomPanels
                : store.customPanels,
              snapshots: remoteSnapshots && typeof remoteSnapshots === "object"
                ? remoteSnapshots
                : store.snapshots,
              syncStatus: "synced",
            });
          }
        }
      } catch {
        // Firestore unavailable or permission denied — fall back silently.
      } finally {
        if (!cancelled) {
          loadedRef.current = true;
        }
      }
    }

    void loadRemote();

    return () => {
      cancelled = true;
    };
  }, [enabled, db, userId]);

  // ── Debounced save to Firestore on workspace changes ──────────────
  const saveToFirestore = useCallback(() => {
    if (!db || !userId) return;

    const state = useWorkspaceStore.getState();
    const ref = doc(db, "workspaces", userId);

    const payload: WorkspaceDoc = {
      workspaces: state.workspaces,
      activeWorkspaceId: state.activeWorkspaceId,
      customPanels: state.customPanels,
      snapshots: state.snapshots,
      updatedAt: serverTimestamp(),
    };

    useWorkspaceStore.getState().setSyncStatus("syncing");

    // Fire-and-forget — never block the UI.
    void setDoc(ref, payload, { merge: true })
      .then(() => useWorkspaceStore.getState().setSyncStatus("synced"))
      .catch(() => useWorkspaceStore.getState().setSyncStatus("error"));
  }, [db, userId]);

  useEffect(() => {
    if (!enabled) return;

    const unsub = useWorkspaceStore.subscribe(() => {
      // Skip the save that was triggered by the initial remote load.
      if (suppressNextSave.current) {
        suppressNextSave.current = false;
        return;
      }

      // Don't save until the initial load has completed.
      if (!loadedRef.current) return;

      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(saveToFirestore, DEBOUNCE_MS);
    });

    return () => {
      unsub();
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, saveToFirestore]);
}
