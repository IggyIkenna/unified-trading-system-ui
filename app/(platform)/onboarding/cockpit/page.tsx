"use client";

/**
 * Onboarding wizard — four-step "build my cockpit" flow.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.plan.md §9 + audit polish #4.
 *
 * Steps:
 *   0. System map        — read the IA explainer (Discover→Promote / Command→Ops)
 *   1. Preset            — pick from 8 starter cockpits, persona-recommended first
 *   2. Scope             — choose asset_group / family / archetype / share_class chips
 *   3. Engagement+Stream — Monitor vs Replicate; Paper vs Live (Live disabled
 *                          for personas without execution-full per §4.3)
 *
 * On submit: applyPresetToScope() + replaceScope() + router.push to the
 * preset's primary action (which routes to /services/workspace?surface=…).
 *
 * Reuses:
 *   - components/cockpit/system-map.tsx   (IA explainer SSOT)
 *   - lib/cockpit/presets.ts               (8 presets)
 *   - lib/cockpit/derive-preset-from-persona.ts (recommendation)
 *   - lib/architecture-v2/workspace-scope.ts    (scope shape)
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronRight, Lock, Map, Sparkles } from "lucide-react";

import { SystemMap } from "@/components/cockpit/system-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { VENUE_ASSET_GROUPS_V2, STRATEGY_FAMILIES_V2 } from "@/lib/architecture-v2/enums";
import { applyPresetToScope, COCKPIT_PRESETS, getPreset } from "@/lib/cockpit/presets";
import { recommendPresetForPersona } from "@/lib/cockpit/derive-preset-from-persona";
import {
  type WorkspaceEngagement,
  type WorkspaceExecutionStream,
  type WorkspaceScope,
} from "@/lib/architecture-v2/workspace-scope";
import { useWorkspaceScope, useWorkspaceScopeStore } from "@/lib/stores/workspace-scope-store";
import { cn } from "@/lib/utils";

const STEPS = ["system-map", "preset", "scope", "engagement"] as const;
type Step = (typeof STEPS)[number];
const STEP_LABEL: Record<Step, string> = {
  "system-map": "0. System map",
  preset: "1. Recommended starter",
  scope: "2. Initial scope",
  engagement: "3. Mode + engagement + stream",
};

const SHARE_CLASS_OPTIONS = ["USDT", "USDC", "USD", "GBP", "EUR", "BTC", "ETH"] as const;

export default function OnboardingCockpitPage() {
  const router = useRouter();
  const baseScope = useWorkspaceScope();
  const replaceScope = useWorkspaceScopeStore((s) => s.replaceScope);
  const { user, hasEntitlement } = useAuth();
  const hasLiveEntitlement = React.useMemo(() => hasEntitlement?.("execution-full") ?? false, [hasEntitlement]);

  const [step, setStep] = React.useState<Step>("system-map");

  const recommendation = React.useMemo(
    () =>
      recommendPresetForPersona({
        id: user?.id,
        role: user?.role,
        entitlements: user?.entitlements as ReadonlyArray<string | { domain: string; tier: string }> | undefined,
      }),
    [user?.id, user?.role, user?.entitlements],
  );

  const [presetId, setPresetId] = React.useState<string>(recommendation.presetId);
  const preset = React.useMemo(() => getPreset(presetId) ?? COCKPIT_PRESETS[0], [presetId]);

  // Scope step state — start from the preset's defaults, mutate as the user edits.
  const [assetGroups, setAssetGroups] = React.useState<readonly string[]>(preset.defaultScope.assetGroups ?? []);
  const [families, setFamilies] = React.useState<readonly string[]>(preset.defaultScope.families ?? []);
  const [shareClasses, setShareClasses] = React.useState<readonly string[]>([]);

  // Re-seed scope when preset changes.
  React.useEffect(() => {
    setAssetGroups(preset.defaultScope.assetGroups ?? []);
    setFamilies(preset.defaultScope.families ?? []);
  }, [preset]);

  const [engagement, setEngagement] = React.useState<WorkspaceEngagement>(preset.defaultEngagement);
  const [stream, setStream] = React.useState<WorkspaceExecutionStream>(preset.defaultExecutionStream);

  // Re-seed engagement / stream when preset changes.
  React.useEffect(() => {
    setEngagement(preset.defaultEngagement);
    setStream(preset.defaultExecutionStream);
  }, [preset]);

  const stepIndex = STEPS.indexOf(step);
  const goNext = () => {
    if (stepIndex < STEPS.length - 1) setStep(STEPS[stepIndex + 1]!);
  };
  const goBack = () => {
    if (stepIndex > 0) setStep(STEPS[stepIndex - 1]!);
  };

  const handleSubmit = React.useCallback(() => {
    const next: WorkspaceScope = applyPresetToScope(preset, baseScope);
    const finalScope: WorkspaceScope = {
      ...next,
      assetGroups,
      families,
      shareClasses,
      engagement,
      // §4.3 safety contract — never persist live for replicate without
      // explicit live entitlement; downgrade silently here too.
      executionStream: stream === "live" && hasLiveEntitlement ? "live" : "paper",
    };
    replaceScope(finalScope, "wizard");
    const dest =
      preset.primaryAction?.href ??
      (preset.defaultSurface === "research"
        ? "/services/workspace?surface=research&rs=discover"
        : preset.defaultSurface === "signals"
          ? "/services/workspace?surface=signals"
          : preset.defaultSurface === "ops"
            ? "/services/workspace?surface=ops"
            : "/services/workspace?surface=terminal&tm=command");
    router.push(dest);
  }, [
    preset,
    baseScope,
    assetGroups,
    families,
    shareClasses,
    engagement,
    stream,
    hasLiveEntitlement,
    replaceScope,
    router,
  ]);

  return (
    <div className="container mx-auto max-w-4xl py-8 space-y-6" data-testid="onboarding-cockpit-wizard">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Build your cockpit</h1>
        <p className="text-sm text-muted-foreground">
          Four short steps. We&apos;ll set you up with a recommended workspace shape and you can change anything.
        </p>
      </header>

      {/* Step rail */}
      <ol className="flex flex-wrap gap-2" data-testid="wizard-steps">
        {STEPS.map((s, i) => {
          const isActive = s === step;
          const isDone = i < stepIndex;
          return (
            <li
              key={s}
              data-testid={`wizard-step-${s}`}
              data-active={isActive}
              data-done={isDone}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/40"
                  : "text-muted-foreground border border-border/40",
                isDone && "text-emerald-300/80",
              )}
            >
              {isDone ? <CheckCircle2 className="size-3" aria-hidden /> : <span className="font-mono">{i}</span>}
              {STEP_LABEL[s]}
            </li>
          );
        })}
      </ol>

      {/* Step body */}
      <Card className="border-border/40">
        <CardContent className="p-5 space-y-4">
          {step === "system-map" ? (
            <section className="space-y-3" data-testid="wizard-step-body-system-map">
              <div className="flex items-center gap-2">
                <Map className="size-4 text-primary" aria-hidden />
                <h2 className="text-lg font-semibold tracking-tight">How DART is laid out</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                One-screen IA: Research has six stages (Discover → Build → Train → Validate → Allocate → Promote);
                Terminal has five modes (Command · Markets · Strategies · Explain · Ops). Click Continue when ready.
              </p>
              <SystemMap />
            </section>
          ) : null}

          {step === "preset" ? (
            <section className="space-y-3" data-testid="wizard-step-body-preset">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" aria-hidden />
                <h2 className="text-lg font-semibold tracking-tight">Recommended starter</h2>
                <span className="text-xs text-muted-foreground">{recommendation.reason}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {COCKPIT_PRESETS.map((p) => {
                  const recommended = p.id === recommendation.presetId;
                  const selected = p.id === presetId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPresetId(p.id)}
                      data-testid={`wizard-preset-${p.id}`}
                      data-selected={selected}
                      data-recommended={recommended}
                      className={cn(
                        "rounded border p-3 text-left transition-colors",
                        selected ? "border-primary bg-primary/5" : "border-border/40 bg-card hover:border-border",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold tracking-tight">{p.label}</span>
                        {recommended ? (
                          <Badge variant="outline" className="text-[9px] border-primary/40 bg-primary/10 text-primary">
                            Recommended
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-[11px] text-muted-foreground/80 leading-snug mt-1 line-clamp-2">
                        {p.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-[9px] font-mono">
                          {p.defaultSurface}
                        </Badge>
                        <Badge variant="secondary" className="text-[9px] font-mono">
                          {p.defaultEngagement}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          {step === "scope" ? (
            <section className="space-y-3" data-testid="wizard-step-body-scope">
              <h2 className="text-lg font-semibold tracking-tight">Initial scope</h2>
              <p className="text-sm text-muted-foreground">
                Seeded from <span className="font-mono">{preset.label}</span>. Toggle any chip to change.
              </p>
              <ChipRow
                label="Asset group"
                axis="ag"
                options={[...VENUE_ASSET_GROUPS_V2]}
                values={assetGroups}
                onChange={setAssetGroups}
              />
              <ChipRow
                label="Strategy family"
                axis="fam"
                options={[...STRATEGY_FAMILIES_V2]}
                values={families}
                onChange={setFamilies}
              />
              <ChipRow
                label="Share class"
                axis="sc"
                options={[...SHARE_CLASS_OPTIONS]}
                values={shareClasses}
                onChange={setShareClasses}
              />
            </section>
          ) : null}

          {step === "engagement" ? (
            <section className="space-y-3" data-testid="wizard-step-body-engagement">
              <h2 className="text-lg font-semibold tracking-tight">Mode + engagement + stream</h2>
              <p className="text-sm text-muted-foreground">
                Are you here to watch your strategy run, or walk through it piece by piece?
              </p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Engagement</p>
                  <SegmentedToggle
                    axis="engagement"
                    options={[
                      { value: "monitor", label: "Monitor — watch automation" },
                      { value: "replicate", label: "Replicate — walk through manually" },
                    ]}
                    value={engagement}
                    onChange={(v) => {
                      setEngagement(v as WorkspaceEngagement);
                      // Switching to replicate forces paper per §4.3.
                      if (v === "replicate" && stream === "live") setStream("paper");
                    }}
                  />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Execution stream</p>
                  <SegmentedToggle
                    axis="stream"
                    options={[
                      { value: "paper", label: "Paper" },
                      {
                        value: "live",
                        label: "Live",
                        disabled: !hasLiveEntitlement,
                        disabledReason: "Live execution is unavailable on demo accounts.",
                      },
                    ]}
                    value={stream}
                    onChange={(v) => setStream(v as WorkspaceExecutionStream)}
                  />
                </div>
              </div>
            </section>
          ) : null}
        </CardContent>
      </Card>

      {/* Footer nav */}
      <footer className="flex items-center justify-between gap-3" data-testid="wizard-footer">
        <Button variant="outline" size="sm" onClick={goBack} disabled={stepIndex === 0} data-testid="wizard-back">
          <ArrowLeft className="size-3 mr-1" aria-hidden />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="text-[11px] text-muted-foreground/80 hover:text-foreground"
            data-testid="wizard-skip"
          >
            Skip — go to dashboard
          </Link>
          {stepIndex < STEPS.length - 1 ? (
            <Button size="sm" onClick={goNext} data-testid="wizard-next">
              Continue
              <ArrowRight className="size-3 ml-1" aria-hidden />
            </Button>
          ) : (
            <Button size="sm" onClick={handleSubmit} data-testid="wizard-build-cockpit">
              Build my cockpit
              <ChevronRight className="size-3 ml-1" aria-hidden />
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}

interface ChipRowProps {
  readonly label: string;
  readonly axis: string;
  readonly options: readonly string[];
  readonly values: readonly string[];
  readonly onChange: (next: readonly string[]) => void;
}

function ChipRow({ label, axis, options, values, onChange }: ChipRowProps) {
  return (
    <div className="space-y-1.5" data-testid={`wizard-chip-row-${axis}`}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const selected = values.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(selected ? values.filter((v) => v !== opt) : [...values, opt])}
              data-testid={`wizard-chip-${axis}-${opt}`}
              data-selected={selected}
              className={cn(
                "px-2 py-0.5 rounded text-[10px] font-mono border transition-colors",
                selected
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border/40 bg-muted/10 text-muted-foreground hover:text-foreground hover:border-border",
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface SegmentedToggleProps {
  readonly axis: string;
  readonly options: readonly { value: string; label: string; disabled?: boolean; disabledReason?: string }[];
  readonly value: string;
  readonly onChange: (next: string) => void;
}

function SegmentedToggle({ axis, options, value, onChange }: SegmentedToggleProps) {
  return (
    <div role="radiogroup" className="flex flex-wrap items-center gap-1.5" data-testid={`wizard-toggle-${axis}`}>
      {options.map((opt) => {
        const isActive = opt.value === value;
        const isDisabled = opt.disabled === true;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-disabled={isDisabled}
            disabled={isDisabled}
            title={isDisabled ? opt.disabledReason : undefined}
            onClick={() => {
              if (!isDisabled) onChange(opt.value);
            }}
            data-testid={`wizard-toggle-${axis}-${opt.value}`}
            data-active={isActive}
            className={cn(
              "px-3 py-1 rounded text-xs border transition-colors inline-flex items-center gap-1",
              isActive && !isDisabled && "border-primary/50 bg-primary/10 text-primary",
              !isActive &&
                !isDisabled &&
                "border-border/40 bg-muted/10 text-muted-foreground hover:text-foreground hover:border-border",
              isDisabled && "border-border/30 bg-muted/5 text-muted-foreground/40 cursor-not-allowed",
            )}
          >
            {isDisabled ? <Lock className="size-2.5" aria-hidden /> : null}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
