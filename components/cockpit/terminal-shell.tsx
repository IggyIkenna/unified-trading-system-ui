"use client";

/**
 * TerminalShell — the cockpit-wide chrome for the DART Terminal surface.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.plan.md §5.2 + Phase 3 of §17.
 *
 * Renders the 5-mode TerminalModeTabs primitive above the Terminal layout's
 * existing chrome. The TradingVerticalNav (legacy 24-tab sprawl) stays as
 * deep-link affordance until Phase 9; this shell just adds the new
 * cockpit-level mode-tabs primary nav above it.
 */

import * as React from "react";

import { TerminalModeTabs } from "./terminal-mode-tabs";

interface TerminalShellProps {
  readonly children: React.ReactNode;
  readonly className?: string;
}

export function TerminalShell({ children, className }: TerminalShellProps) {
  return (
    <div className={className} data-testid="terminal-shell">
      <TerminalModeTabs />
      {children}
    </div>
  );
}
