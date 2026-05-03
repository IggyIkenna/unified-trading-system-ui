"use client";

/**
 * PresetSelector — 8-preset chooser. Phase 6 of dart_ux_cockpit_refactor §8.
 *
 * Shown on /dashboard so a fresh demo prospect can land in a populated
 * cockpit with one click. Persona-recommended preset gets a "Recommended"
 * badge + leading position; the user can pick any of the 8.
 *
 * Click → applyPresetToScope() flips the scope + routes to the preset's
 * primary action.
 */

import * as React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { COCKPIT_PRESETS, applyPresetToScope, getPreset } from "@/lib/cockpit/presets";
import { recommendPresetForPersona } from "@/lib/cockpit/derive-preset-from-persona";
import { useStrategyVisibility } from "@/lib/cockpit/use-strategy-visibility";
import { useWorkspaceScope, useWorkspaceScopeStore } from "@/lib/stores/workspace-scope-store";
import { cn } from "@/lib/utils";

// 2026-04-30 audit fix #4: every preset routes into the unified workspace
// shell, never back to legacy per-route pages. The shell consumes the
// surface / terminalMode / researchStage from the URL and reshapes around
// it. Reports / Dashboard fall back to their dedicated pages because the
// cockpit shell does not own those surfaces yet.
const SURFACE_DEFAULT_HREF: Record<string, string> = {
  terminal: "/services/workspace?surface=terminal&tm=command",
  research: "/services/workspace?surface=research&rs=discover",
  reports: "/services/reports/overview",
  signals: "/services/workspace?surface=signals",
  ops: "/services/workspace?surface=ops",
  dashboard: "/dashboard",
};

interface PresetSelectorProps {
  readonly className?: string;
}

export function PresetSelector({ className }: PresetSelectorProps) {
  const { user } = useAuth();
  const scope = useWorkspaceScope();
  const replaceScope = useWorkspaceScopeStore((s) => s.replaceScope);
  const visibility = useStrategyVisibility();

  const recommendation = React.useMemo(
    () =>
      recommendPresetForPersona({
        id: user?.id,
        role: user?.role,
        entitlements: user?.entitlements as ReadonlyArray<string | { domain: string; tier: string }> | undefined,
      }),
    [user?.id, user?.role, user?.entitlements],
  );

  const handlePick = React.useCallback(
    (presetId: string) => {
      const preset = getPreset(presetId);
      if (!preset) return;
      const next = applyPresetToScope(preset, scope);
      replaceScope(next, "preset");
    },
    [scope, replaceScope],
  );

  // Order: recommended preset first, then the rest in registry order.
  const ordered = React.useMemo(() => {
    const recommended = COCKPIT_PRESETS.find((p) => p.id === recommendation.presetId);
    const rest = COCKPIT_PRESETS.filter((p) => p.id !== recommendation.presetId);
    return recommended ? [recommended, ...rest] : COCKPIT_PRESETS;
  }, [recommendation.presetId]);

  return (
    <div
      className={cn("space-y-3", className)}
      data-testid="preset-selector"
      data-recommended-preset={recommendation.presetId}
    >
      <div className="flex items-center gap-2">
        <Sparkles className="size-3.5 text-primary/70" aria-hidden />
        <h3 className="text-sm font-semibold tracking-tight">Recommended cockpit</h3>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">{recommendation.reason}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
        {ordered.map((preset) => {
          const isRecommended = preset.id === recommendation.presetId;
          const targetHref = preset.primaryAction?.href ?? SURFACE_DEFAULT_HREF[preset.defaultSurface] ?? "/dashboard";
          return (
            <Link
              key={preset.id}
              href={targetHref}
              onClick={() => handlePick(preset.id)}
              data-testid={`preset-card-${preset.id}`}
              data-recommended={isRecommended}
              className={cn(
                "group block rounded-md border transition-all hover:shadow-sm",
                isRecommended
                  ? "border-primary/50 bg-primary/5 hover:border-primary"
                  : "border-border/50 bg-card hover:border-border",
              )}
            >
              <Card className="h-full border-0 bg-transparent shadow-none">
                <CardContent className="p-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-semibold tracking-tight">{preset.label}</span>
                    {isRecommended ? (
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1.5 py-0 border-primary/40 bg-primary/10 text-primary"
                      >
                        Recommended
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-muted-foreground/80 leading-snug line-clamp-2">{preset.description}</p>
                  {/* Polish #3 — resolver-driven visibility badge so the
                      buyer sees how many strategies they can actually
                      access for this preset without leaving the dashboard. */}
                  <div
                    className="text-[9px] font-mono text-muted-foreground/70 flex items-center gap-1"
                    data-testid={`preset-card-${preset.id}-visibility`}
                  >
                    <span className="text-emerald-300/80">{visibility.counts.owned}</span>
                    <span>owned</span>
                    {visibility.counts.available_to_request > 0 ? (
                      <>
                        <span className="text-muted-foreground/30">·</span>
                        <span className="text-cyan-300/80">{visibility.counts.available_to_request}</span>
                        <span>available</span>
                      </>
                    ) : null}
                    {visibility.counts.locked_by_tier > 0 ? (
                      <>
                        <span className="text-muted-foreground/30">·</span>
                        <span className="text-amber-300/80">{visibility.counts.locked_by_tier}</span>
                        <span>locked</span>
                      </>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-[9px] font-mono">
                        {preset.defaultSurface}
                      </Badge>
                      {preset.defaultTerminalMode ? (
                        <Badge variant="secondary" className="text-[9px] font-mono">
                          {preset.defaultTerminalMode}
                        </Badge>
                      ) : null}
                      {preset.defaultResearchStage ? (
                        <Badge variant="secondary" className="text-[9px] font-mono">
                          {preset.defaultResearchStage}
                        </Badge>
                      ) : null}
                      <Badge variant="secondary" className="text-[9px] font-mono">
                        {preset.defaultEngagement}
                      </Badge>
                    </div>
                    <ArrowRight className="size-3 text-muted-foreground/60 group-hover:text-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
