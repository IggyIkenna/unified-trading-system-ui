/**
 * G1.1 Phase unification — data-source binding per phase.
 *
 * `usePhaseBinding(phase)` returns the fetcher/base URLs that a phased
 * component should use to pull data. The component tree does NOT branch on
 * phase — only the data source does. Consumers render the same JSX under
 * every phase.
 *
 * Paper phase shares URL roots with live but flips a header/query so the
 * data-layer knows to serve paper-trading fills.
 */

"use client";

import * as React from "react";

import { type Phase } from "./types";

export type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface PhaseBinding {
  phase: Phase;
  /** Phase-aware fetch wrapper — injects `X-Trading-Phase` header. */
  fetcher: Fetcher;
  /** Base URL prefix for REST calls under this phase. */
  baseUrl: string;
  /** WebSocket URL for streaming under this phase. */
  wsUrl: string;
  /**
   * Resolve a phase-agnostic segment (e.g. `"/strategy/overview"`) to the
   * fully-qualified URL the current phase should render. Exposed so shell
   * components can emit phase-correct hrefs without string-prefix logic.
   */
  resolvePath: (segment: string) => string;
}

const RESEARCH_PREFIX = "/services/research";
const LIVE_PREFIX = "/services/trading";

function stripLeadingSlash(segment: string): string {
  return segment.startsWith("/") ? segment.slice(1) : segment;
}

function resolveFor(phase: Phase, segment: string): string {
  const clean = stripLeadingSlash(segment);
  if (phase === "research") {
    return `${RESEARCH_PREFIX}/${clean}`;
  }
  if (phase === "paper") {
    return `${LIVE_PREFIX}/${clean}?phase=paper`;
  }
  return `${LIVE_PREFIX}/${clean}`;
}

function makeFetcher(phase: Phase): Fetcher {
  return (input, init) => {
    const headers = new Headers(init?.headers ?? {});
    headers.set("X-Trading-Phase", phase);
    return fetch(input, { ...init, headers });
  };
}

export function usePhaseBinding(phase: Phase): PhaseBinding {
  return React.useMemo<PhaseBinding>(
    () => ({
      phase,
      fetcher: makeFetcher(phase),
      baseUrl: phase === "research" ? "/api/research" : "/api/trading",
      wsUrl: phase === "research" ? "/ws/research" : "/ws/trading",
      resolvePath: (segment: string) => resolveFor(phase, segment),
    }),
    [phase],
  );
}
