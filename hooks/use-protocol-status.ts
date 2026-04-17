"use client";

import { useState, useEffect } from "react";
import { isMockDataMode } from "@/lib/runtime/data-mode";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProtocolKind = "WS" | "SSE" | "REST" | "Mock";

export interface ProtocolStatus {
  protocol: ProtocolKind;
  isConnected: boolean;
}

// ---------------------------------------------------------------------------
// Global connection registry — hooks across the app register their status
// here so the indicator can aggregate without prop drilling.
// ---------------------------------------------------------------------------

type Listener = () => void;

interface ConnectionEntry {
  protocol: "WS" | "SSE";
  isConnected: boolean;
}

const entries = new Map<string, ConnectionEntry>();
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((fn) => fn());
}

/**
 * Register a live connection (WS or SSE) so the protocol indicator can
 * reflect current state. Call with `isConnected` updates; call `unregister`
 * on unmount.
 */
export function registerConnection(
  id: string,
  protocol: "WS" | "SSE",
  isConnected: boolean,
): void {
  const prev = entries.get(id);
  if (prev?.protocol === protocol && prev?.isConnected === isConnected) return;
  entries.set(id, { protocol, isConnected });
  notify();
}

export function unregisterConnection(id: string): void {
  if (entries.delete(id)) notify();
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Returns the aggregate protocol status for the current page.
 *
 * Priority:
 * 1. Mock mode → always { protocol: "Mock", isConnected: true }
 * 2. Any registered WS/SSE connections → highest-priority connected one
 * 3. Fallback → REST polling (always "connected")
 */
export function useProtocolStatus(): ProtocolStatus {
  const isMock = typeof window !== "undefined" && isMockDataMode();

  const [, bump] = useState(0);

  useEffect(() => {
    return subscribe(() => bump((n) => n + 1));
  }, []);

  if (isMock) {
    return { protocol: "Mock", isConnected: true };
  }

  // Prefer WS > SSE if both exist
  let bestProtocol: "WS" | "SSE" | null = null;
  let anyConnected = false;
  let anyRegistered = false;

  for (const entry of entries.values()) {
    anyRegistered = true;
    if (entry.isConnected) {
      anyConnected = true;
      if (entry.protocol === "WS") {
        bestProtocol = "WS";
        break; // WS is highest priority
      }
      if (!bestProtocol) bestProtocol = "SSE";
    } else if (!bestProtocol) {
      bestProtocol = entry.protocol;
    }
  }

  if (anyRegistered && bestProtocol) {
    return { protocol: bestProtocol, isConnected: anyConnected };
  }

  // No live connections registered — page uses REST polling
  return { protocol: "REST", isConnected: true };
}
