"use client";

/**
 * TerminalModeTabs — the 5-mode primary nav for the DART Terminal cockpit.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.plan §5.2 + Phase 3 of §17:
 * collapses the 24-tab `TRADING_TABS` sprawl into 5 buyer-facing modes
 * (Command · Markets · Strategies · Explain · Ops). The old per-route
 * pages stay as deep links — this component is the new "category" layer.
 *
 * Behaviour:
 *   - Click a mode → router.push(mode.defaultHref) AND setTerminalMode(mode)
 *     so URL + scope.terminalMode stay in sync.
 *   - Surface auto-flips to "terminal" when the user clicks a mode tab.
 *   - Active mode resolved (in priority order):
 *       1. URL path prefix (terminalModeForPath)
 *       2. scope.terminalMode (when surface=terminal)
 *       3. defaultTerminalMode() (= "command")
 *
 * Phase 3 SCOPE: ship the tabs primitive + sync logic. Old TradingVerticalNav
 * stays — Phase 9 collapses the legacy per-route pages.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import type { TerminalMode } from "@/lib/architecture-v2/workspace-scope";
import {
  TERMINAL_MODES,
  TERMINAL_MODE_META,
  defaultTerminalMode,
  terminalModeForPath,
} from "@/lib/cockpit/terminal-modes";
import { useWorkspaceScope, useWorkspaceScopeStore } from "@/lib/stores/workspace-scope-store";
import { cn } from "@/lib/utils";

interface TerminalModeTabsProps {
  readonly className?: string;
}

export function TerminalModeTabs({ className }: TerminalModeTabsProps) {
  const pathname = usePathname() ?? "";
  const scope = useWorkspaceScope();
  const setTerminalMode = useWorkspaceScopeStore((s) => s.setTerminalMode);
  const setSurface = useWorkspaceScopeStore((s) => s.setSurface);

  // Resolve the currently-active mode from URL → scope → default.
  const activeMode: TerminalMode = React.useMemo(() => {
    const fromPath = terminalModeForPath(pathname);
    if (fromPath !== null) return fromPath;
    if (scope.surface === "terminal" && scope.terminalMode !== null) return scope.terminalMode;
    return defaultTerminalMode();
  }, [pathname, scope.surface, scope.terminalMode]);

  // Auto-sync scope.terminalMode + scope.surface when the URL anchors a mode.
  // This is what makes deep links "just work" — copy a `/services/observe/reconciliation`
  // URL to a colleague, and when they land it, scope.terminalMode flips to
  // "explain" automatically.
  React.useEffect(() => {
    const fromPath = terminalModeForPath(pathname);
    if (fromPath === null) return;
    if (scope.surface !== "terminal") setSurface("terminal", "route-redirect");
    if (scope.terminalMode !== fromPath) setTerminalMode(fromPath, "route-redirect");
  }, [pathname, scope.surface, scope.terminalMode, setSurface, setTerminalMode]);

  // Audit fix #2 — when the user is INSIDE the unified workspace shell, the
  // tabs must mutate the workspace URL (?surface=terminal&tm=…) instead of
  // bouncing them back to the legacy per-route pages. The legacy hrefs stay
  // as fallbacks for deep links from outside the cockpit.
  const insideWorkspace = pathname.startsWith("/services/workspace");

  return (
    <nav
      aria-label="Terminal mode"
      className={cn("flex items-center gap-1 border-b border-border/40 bg-background", className)}
      data-testid="terminal-mode-tabs"
      data-active-mode={activeMode}
      data-inside-workspace={insideWorkspace ? "true" : "false"}
    >
      {TERMINAL_MODES.map((mode) => {
        const meta = TERMINAL_MODE_META[mode];
        const isActive = mode === activeMode;
        const href = insideWorkspace ? `/services/workspace?surface=terminal&tm=${mode}` : meta.defaultHref;
        return (
          <Link
            key={mode}
            href={href}
            aria-current={isActive ? "page" : undefined}
            data-testid={`terminal-mode-tab-${mode}`}
            data-active={isActive}
            onClick={() => {
              // Optimistic scope sync — the route-driven useEffect above
              // will reconcile the canonical state once navigation lands.
              if (scope.surface !== "terminal") setSurface("terminal", "terminal-mode-toggle");
              setTerminalMode(mode, "terminal-mode-toggle");
            }}
            className={cn(
              "relative flex flex-col gap-0 px-4 py-2.5 text-xs transition-colors",
              isActive
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/40",
            )}
          >
            <span className="flex items-center gap-1.5">
              <span className="text-sm font-semibold tracking-tight">{meta.label}</span>
            </span>
            <span className="text-[10px] text-muted-foreground/70 leading-tight">{meta.tagline}</span>
            {isActive ? (
              <span
                aria-hidden
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
                data-testid={`terminal-mode-tab-${mode}-indicator`}
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
