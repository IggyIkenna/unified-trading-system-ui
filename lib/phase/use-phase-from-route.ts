/**
 * G1.1 Phase unification — route-to-phase inference.
 *
 * Routes map to phases deterministically:
 *   /services/research/**                                  -> "research"
 *   /services/trading/**  (no ?phase=paper)                -> "live"
 *   /services/trading/**  with ?phase=paper                -> "paper"
 *   /services/execution/**                                 -> "live"
 *   anything else                                          -> "research" (default)
 *
 * `usePhaseFromRoute` is a client hook; `phaseForPath` is pure and usable
 * without React context for testing and non-hook callers.
 */

"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { type Phase, isPhase } from "./types";

export function phaseForPath(pathname: string, searchParams?: URLSearchParams | null): Phase {
  const paperQuery = searchParams?.get("phase");
  if (paperQuery && isPhase(paperQuery)) {
    return paperQuery;
  }
  if (pathname.startsWith("/services/research")) return "research";
  if (pathname.startsWith("/services/trading")) return "live";
  if (pathname.startsWith("/services/execution")) return "live";
  return "research";
}

export function usePhaseFromRoute(): Phase {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  return phaseForPath(pathname, searchParams);
}
