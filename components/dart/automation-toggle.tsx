"use client";

/**
 * DART Automation Toggle (option-c narrow scope, 2026-05-10).
 *
 * Renders the current OperationalMode for an archetype and offers
 * transitions through the workspace transition graph:
 *   MANUAL → PAPER → LIVE  (forward)
 *   LIVE   → MANUAL        (kill-switch path; emergency)
 *   PAPER  → MANUAL        (revert)
 *
 * The transition graph itself is enforced server-side by the
 * strategy-service `operational_mode_router.py` route shipped at
 * strategy-service@8bdc19c1; the UI renders 409 responses as the
 * informative error message returned by the route. No transition
 * graph duplication on the client.
 *
 * Auth: pulls the bearer token from `useAuth()` and forwards via
 * `apiFetch`; admin entitlement is enforced server-side by the
 * route. The `X-Admin-Token` header is forwarded when an explicit
 * env-injected admin token is exposed via `useAuth().adminToken`
 * (operator-set in admin sessions only). Outside admin sessions
 * the bearer token alone authenticates the operator.
 *
 * Per workspace CLAUDE.md "Batch = Live": there is no separate
 * "live-only" or "manual-only" archetype — every archetype runs
 * the same code path; OperationalMode just routes execution fills.
 *
 * Reference plan:
 *   unified-trading-pm/plans/active/issues/dart_manual_trade_ui_build_2026_05_10.md
 *   (Phase C — option-c narrow scope).
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";
import { AlertTriangle, Pause, Play, Shield } from "lucide-react";
import * as React from "react";

export type OperationalMode = "MANUAL" | "PAPER" | "LIVE" | "BACKTEST";

export interface AutomationToggleProps {
  readonly archetypeId: string;
  readonly initialMode: OperationalMode;
  /** Optional callback fired after a successful transition. */
  readonly onModeChanged?: (next: OperationalMode) => void;
  /** Test-injection: override the fetch implementation. */
  readonly fetcher?: (url: string, token: string | null, options?: RequestInit) => Promise<unknown>;
}

interface TransitionResponse {
  readonly archetype_id: string;
  readonly operational_mode: OperationalMode;
  readonly transitioned_at: string;
}

const MODE_BADGE_VARIANT: Record<OperationalMode, "default" | "secondary" | "destructive" | "outline"> = {
  BACKTEST: "outline",
  MANUAL: "outline",
  PAPER: "secondary",
  LIVE: "default",
};

const MODE_DESCRIPTION: Record<OperationalMode, string> = {
  BACKTEST: "Replay historical data; no live execution.",
  MANUAL: "Operator-driven trades only; archetype signals do not fire.",
  PAPER: "Archetype signals fire against the matching engine; no real fills.",
  LIVE: "Archetype signals fire against real venues with real capital.",
};

export function AutomationToggle({ archetypeId, initialMode, onModeChanged, fetcher }: AutomationToggleProps) {
  const { token } = useAuth();
  const [mode, setMode] = React.useState<OperationalMode>(initialMode);
  const [pending, setPending] = React.useState<OperationalMode | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const transitionTo = React.useCallback(
    async (target: OperationalMode) => {
      setPending(target);
      setErrorMessage(null);
      try {
        const fn = fetcher ?? apiFetch;
        const response = (await fn(
          `/api/archetypes/${encodeURIComponent(archetypeId)}/operational-mode`,
          token,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ operational_mode: target }),
          },
        )) as TransitionResponse;
        setMode(response.operational_mode);
        onModeChanged?.(response.operational_mode);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setErrorMessage(message);
      } finally {
        setPending(null);
      }
    },
    [archetypeId, fetcher, onModeChanged, token],
  );

  // Allowed forward transitions per workspace transition graph.
  // Server enforces the actual policy; UI just surfaces buttons that map
  // to legal next-mode targets. 409s show as errorMessage.
  const forwardTargets = React.useMemo<OperationalMode[]>(() => {
    if (mode === "MANUAL") return ["PAPER"];
    if (mode === "PAPER") return ["LIVE", "MANUAL"];
    if (mode === "LIVE") return [];
    return [];
  }, [mode]);

  const killSwitchVisible = mode === "LIVE";

  return (
    <Card data-testid="automation-toggle" data-archetype-id={archetypeId} data-current-mode={mode}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-2">
            <Shield className="size-4" aria-hidden />
            Automation · <code className="font-mono text-xs">{archetypeId}</code>
          </span>
          <Badge
            variant={MODE_BADGE_VARIANT[mode]}
            data-testid="automation-toggle-current-mode"
            data-mode={mode}
          >
            {mode}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground" data-testid="automation-toggle-description">
          {MODE_DESCRIPTION[mode]}
        </p>

        {errorMessage ? (
          <div
            className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive"
            data-testid="automation-toggle-error"
            role="alert"
          >
            <AlertTriangle className="size-4 shrink-0 mt-0.5" aria-hidden />
            <span>{errorMessage}</span>
          </div>
        ) : null}

        {forwardTargets.length > 0 ? (
          <div className="flex flex-wrap gap-2" data-testid="automation-toggle-forward-actions">
            {forwardTargets.map((target) => (
              <Button
                key={target}
                size="sm"
                variant={target === "LIVE" ? "default" : "outline"}
                disabled={pending !== null}
                onClick={() => void transitionTo(target)}
                data-testid={`automation-toggle-transition-${target.toLowerCase()}`}
              >
                <Play className="mr-1 size-3" aria-hidden />
                {pending === target ? `Transitioning to ${target}…` : `Transition to ${target}`}
              </Button>
            ))}
          </div>
        ) : null}

        {killSwitchVisible ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2">
            <p className="text-xs font-medium text-destructive">
              Kill-switch · revert to MANUAL immediately
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Stops archetype signal execution. Open positions are NOT closed by this action; use
              manual-trade flow to flatten exposure.
            </p>
            <Button
              size="sm"
              variant="destructive"
              className="mt-2"
              disabled={pending !== null}
              onClick={() => void transitionTo("MANUAL")}
              data-testid="automation-toggle-kill-switch"
            >
              <Pause className="mr-1 size-3" aria-hidden />
              {pending === "MANUAL" ? "Reverting…" : "Revert to MANUAL"}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
