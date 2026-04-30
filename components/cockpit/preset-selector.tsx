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
import { useWorkspaceScope, useWorkspaceScopeStore } from "@/lib/stores/workspace-scope-store";
import { cn } from "@/lib/utils";

const SURFACE_DEFAULT_HREF: Record<string, string> = {
  terminal: "/services/trading/overview",
  research: "/services/research/strategies",
  reports: "/services/reports/overview",
  signals: "/services/signals/dashboard",
  ops: "/services/observe/risk",
  dashboard: "/dashboard",
};

interface PresetSelectorProps {
  readonly className?: string;
}

export function PresetSelector({ className }: PresetSelectorProps) {
  const { user } = useAuth();
  const scope = useWorkspaceScope();
  const replaceScope = useWorkspaceScopeStore((s) => s.replaceScope);

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
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
          {recommendation.reason}
        </span>
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
