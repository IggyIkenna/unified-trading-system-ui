"use client";

/**
 * SystemMap — buyer-facing IA explainer.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.plan §15.2 + Phase 7 of §17.
 *
 * Single shared renderer used by the Phase 6 wizard step 0 + the
 * /help/system-map page. Sources from `lib/cockpit/ia-explainer-content.ts`
 * so wording can't drift between the two surfaces.
 */

import { ArrowRight } from "lucide-react";
import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import {
  OWNERSHIP_TABLE,
  RESEARCH_STAGE_EXPLAINERS,
  SURFACE_EXPLAINERS,
  SYSTEM_MAP_HEADLINE,
  SYSTEM_MAP_SUBHEAD,
  TERMINAL_MODE_EXPLAINERS,
} from "@/lib/cockpit/ia-explainer-content";
import { cn } from "@/lib/utils";

interface SystemMapProps {
  readonly className?: string;
  /** Render in compact form (used inside the wizard step 0). */
  readonly compact?: boolean;
}

export function SystemMap({ className, compact = false }: SystemMapProps) {
  return (
    <div className={cn("space-y-6", className)} data-testid="system-map" data-compact={compact}>
      <header className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">{SYSTEM_MAP_HEADLINE}</h2>
        <p className="text-sm text-muted-foreground">{SYSTEM_MAP_SUBHEAD}</p>
      </header>

      {/* Surfaces */}
      <section className="space-y-2" data-testid="system-map-surfaces">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Six surfaces</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {SURFACE_EXPLAINERS.map((s) => (
            <Card key={s.id} className="border-border/50" data-testid={`system-map-surface-${s.id}`}>
              <CardContent className="p-3 space-y-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold tracking-tight">{s.label}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">{s.tagline}</span>
                </div>
                <p className="text-[11px] text-muted-foreground/80 leading-snug">{s.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Terminal modes — left-to-right narrative */}
      <section className="space-y-2" data-testid="system-map-terminal-modes">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          DART Terminal · 5 modes
        </h3>
        <div className="flex flex-wrap items-stretch gap-2">
          {TERMINAL_MODE_EXPLAINERS.map((m, idx) => (
            <React.Fragment key={m.id}>
              <Card className="border-border/50 flex-1 min-w-[10rem]" data-testid={`system-map-mode-${m.id}`}>
                <CardContent className="p-2.5 space-y-1">
                  <span className="text-xs font-semibold tracking-tight">{m.label}</span>
                  <p className="text-[10px] text-muted-foreground/70 leading-tight">{m.description}</p>
                </CardContent>
              </Card>
              {idx < TERMINAL_MODE_EXPLAINERS.length - 1 ? (
                <div className="flex items-center text-muted-foreground/40">
                  <ArrowRight className="size-3" aria-hidden />
                </div>
              ) : null}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* Research stages — left-to-right journey */}
      <section className="space-y-2" data-testid="system-map-research-stages">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          DART Research · 6 stages (left to right)
        </h3>
        <div className="flex flex-wrap items-stretch gap-2">
          {RESEARCH_STAGE_EXPLAINERS.map((s, idx) => (
            <React.Fragment key={s.id}>
              <Card className="border-border/50 flex-1 min-w-[10rem]" data-testid={`system-map-stage-${s.id}`}>
                <CardContent className="p-2.5 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className="size-4 rounded-full border border-primary/40 bg-primary/10 flex items-center justify-center text-[9px] font-mono text-primary"
                    >
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold tracking-tight">{s.label}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/70 leading-tight">{s.description}</p>
                </CardContent>
              </Card>
              {idx < RESEARCH_STAGE_EXPLAINERS.length - 1 ? (
                <div className="flex items-center text-muted-foreground/40">
                  <ArrowRight className="size-3" aria-hidden />
                </div>
              ) : null}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* Ownership table */}
      {!compact ? (
        <section className="space-y-2" data-testid="system-map-ownership">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Where things live</h3>
          <Card className="border-border/50">
            <CardContent className="p-3">
              <ul className="divide-y divide-border/30">
                {OWNERSHIP_TABLE.map((row) => (
                  <li
                    key={row.concept}
                    className="flex items-center justify-between gap-2 py-1.5 text-xs"
                    data-testid={`system-map-ownership-row`}
                  >
                    <span className="text-muted-foreground/80">{row.concept}</span>
                    <span className="font-medium">{row.owner}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      ) : null}
    </div>
  );
}
