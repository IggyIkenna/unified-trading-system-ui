"use client";

/**
 * WorkspaceUrlSync — push canonical scope state into the URL on every change.
 *
 * Per audit fix #6:
 *   "DartScopeBar setters update the Zustand store, not the URL. The
 *    cockpit may visually change, but the URL doesn't become the canonical
 *    shareable URL unless the user navigates through a scoped link."
 *
 * Mounted once at the top of the workspace shell. Subscribes to the
 * `useWorkspaceScopeStore` and `router.replace`-s the search params on every
 * scope mutation. Refresh restores exact cockpit state from the URL; copying
 * the URL gives a colleague the same cockpit shape on a fresh tab.
 *
 * Implementation note: uses `router.replace` (not `push`) so scope chip
 * toggling does NOT pollute browser back/forward history with one entry per
 * keystroke.
 */

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { serializeWorkspaceScope } from "@/lib/architecture-v2/workspace-scope";
import { useWorkspaceScope } from "@/lib/stores/workspace-scope-store";

export function WorkspaceUrlSync() {
  const router = useRouter();
  const pathname = usePathname();
  const currentSearchParams = useSearchParams();
  const scope = useWorkspaceScope();

  React.useEffect(() => {
    if (!pathname || !pathname.startsWith("/services/workspace")) return;

    const desired = serializeWorkspaceScope(scope);
    const desiredParams = new URLSearchParams(desired);

    // Compare against the current URL search params; only push when the
    // canonical serialisation actually differs. Avoids redundant
    // router.replace calls every render.
    const current = currentSearchParams ? new URLSearchParams(currentSearchParams.toString()) : new URLSearchParams();
    if (sameKeys(current, desiredParams)) return;

    const qs = desiredParams.toString();
    const next = qs ? `${pathname}?${qs}` : pathname;
    router.replace(next, { scroll: false });
  }, [scope, pathname, currentSearchParams, router]);

  return null;
}

function sameKeys(a: URLSearchParams, b: URLSearchParams): boolean {
  // Only compare WorkspaceScope-owned keys — leave other query params alone.
  const SCOPE_KEYS = [
    "surface",
    "tm",
    "rs",
    "ag",
    "it",
    "fam",
    "arch",
    "sc",
    "venue",
    "mandate",
    "eng",
    "stream",
    "ws",
    "as",
    "cov",
    "mat",
    "route",
    "avail",
  ];
  for (const key of SCOPE_KEYS) {
    if ((a.get(key) ?? "") !== (b.get(key) ?? "")) return false;
  }
  return true;
}
