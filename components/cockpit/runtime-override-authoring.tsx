"use client";

/**
 * RuntimeOverrideAuthoring — typed, audited live override form.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.md §4.8.3 (configuration
 * lifecycle — runtime overrides).
 *
 * This is the daily-trader configuration surface. The user does not edit the
 * underlying `StrategyReleaseBundle` (immutable, approved). They author a
 * bounded `RuntimeOverride` that the system records, validates against the
 * bundle's `runtimeOverrideGuardrails`, and applies on top of the running
 * strategy. Examples:
 *
 *   - "Reduce size to 50% during the weekend"
 *   - "Disable OKX while the gateway is degraded"
 *   - "Switch to passive execution preset"
 *   - "Pause entries / exit-only"
 *   - "Kill switch — flatten now"
 *
 * Surfaced inline in Terminal/Command and Terminal/Strategies modes alongside
 * the ReleaseBundlePanel — the user sees the immutable artifact and can
 * propose a typed live mutation in the same view.
 *
 * Validation flow:
 *   1. User picks an override type.
 *   2. Per-type form renders typed fields (size multiplier slider, venue
 *      picker constrained to bundle.venueSetVersion, preset picker
 *      constrained to bundle.runtimeOverrideGuardrails.executionPresets, etc.)
 *   3. On every keystroke, `validateOverrideAgainstGuardrails(...)` runs and
 *      the submit button reflects allowed/rejected with the precise rejection
 *      code surfaced inline.
 *   4. Submit creates a new `RuntimeOverride` with audit metadata and (in this
 *      cockpit demo) appends it to local component state. Production wires
 *      this to the override-store API.
 */

import { AlertTriangle, CheckCircle2, ShieldAlert, ShieldCheck } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import {
  GUARDRAIL_REJECTION_MESSAGE,
  RUNTIME_OVERRIDE_TYPES,
  validateOverrideAgainstGuardrails,
  type GuardrailRejectionCode,
  type GuardrailValidationResult,
  type RuntimeOverride,
  type RuntimeOverrideType,
  type RuntimeOverrideValue,
} from "@/lib/architecture-v2/runtime-override";
import type { StrategyReleaseBundle } from "@/lib/architecture-v2/strategy-release-bundle";
import { EMPTY_WORKSPACE_SCOPE } from "@/lib/architecture-v2/workspace-scope";
import { useCockpitOpsStore } from "@/lib/mocks/cockpit-ops-store";
import { cn } from "@/lib/utils";

const OVERRIDE_LABEL: Record<RuntimeOverrideType, string> = {
  size_multiplier: "Scale size",
  venue_disable: "Disable venue",
  execution_preset: "Switch execution preset",
  risk_limit_tightening: "Tighten risk limit",
  treasury_route: "Reroute treasury",
  pause_entries: "Pause entries",
  exit_only: "Exit-only",
  kill_switch: "Kill switch",
};

const OVERRIDE_DESCRIPTION: Record<RuntimeOverrideType, string> = {
  size_multiplier: "Reduce or hold position size while the strategy keeps running. Bounded by the bundle's range.",
  venue_disable: "Stop routing to a specific venue or protocol. Bundle re-routes around it.",
  execution_preset: "Swap to an approved execution preset (passive / aggressive / conservative).",
  risk_limit_tightening: "Lower a risk limit. Loosening is forbidden — promote a new bundle for higher limits.",
  treasury_route: "Redirect treasury flows to an alternate whitelisted wallet.",
  pause_entries: "Block new entries while existing positions remain. No payload.",
  exit_only: "Reduce-only mode — close positions, no new entries.",
  kill_switch: "Flatten everything immediately. Always allowed regardless of guardrails. Always audited.",
};

const REJECTION_DETAIL: Record<GuardrailRejectionCode, string> = {
  size_multiplier_out_of_range: "Multiplier outside the bundle's allowed range.",
  size_multiplier_above_one: "Cannot scale above 1.0× — that would be a new bundle, not an override.",
  venue_disable_not_allowed: "This bundle does not allow venue-disable overrides.",
  execution_preset_not_approved: "Preset is not in the bundle's approved list.",
  risk_loosening_forbidden: "This bundle does not allow risk-limit overrides.",
  treasury_route_not_allowed: "This bundle does not allow treasury-route overrides.",
  pause_entries_not_allowed: "This bundle does not allow pause-entries overrides.",
  exit_only_not_allowed: "This bundle does not allow exit-only overrides.",
};

interface RuntimeOverrideAuthoringProps {
  readonly bundle: StrategyReleaseBundle;
  readonly className?: string;
  /** Callback fired with the validated override on submit (audit metadata layered by parent). */
  readonly onSubmit?: (value: RuntimeOverrideValue, reason: string) => void;
}

export function RuntimeOverrideAuthoring({ bundle, className, onSubmit }: RuntimeOverrideAuthoringProps) {
  const { user } = useAuth();
  const appendRuntimeOverride = useCockpitOpsStore((s) => s.appendRuntimeOverride);
  const [overrideType, setOverrideType] = React.useState<RuntimeOverrideType>("size_multiplier");
  const [reason, setReason] = React.useState<string>("");

  // Per-type field state (kept independent so switching types preserves
  // already-entered fields per type).
  const [sizeMultiplier, setSizeMultiplier] = React.useState<number>(1);
  const [venueId, setVenueId] = React.useState<string>("");
  const [presetId, setPresetId] = React.useState<string>(bundle.runtimeOverrideGuardrails.executionPresets[0] ?? "");
  const [riskLimit, setRiskLimit] = React.useState<"max_loss_usd" | "max_drawdown_pct" | "max_concentration_pct">(
    "max_loss_usd",
  );
  const [riskNewValue, setRiskNewValue] = React.useState<number>(0);
  const [treasuryWalletId, setTreasuryWalletId] = React.useState<string>("");

  const candidate: RuntimeOverrideValue | null = React.useMemo(() => {
    // The discriminated union has variants whose `value` shapes are
    // mutually-incompatible (e.g. PauseEntriesValue = Record<string, never>).
    // TS's useMemo inference widens each branch's value with every other
    // branch's keys as optional-undefined, which then conflicts with
    // Record<string, never>'s index-signature constraint. Help it by
    // typing each return as RuntimeOverrideValue at the construction site.
    switch (overrideType) {
      case "size_multiplier": {
        const next: RuntimeOverrideValue = {
          overrideType: "size_multiplier",
          value: { multiplier: sizeMultiplier },
        };
        return next;
      }
      case "venue_disable": {
        if (!venueId.trim()) return null;
        const next: RuntimeOverrideValue = {
          overrideType: "venue_disable",
          value: { venueOrProtocolId: venueId.trim() },
        };
        return next;
      }
      case "execution_preset": {
        if (!presetId.trim()) return null;
        const next: RuntimeOverrideValue = {
          overrideType: "execution_preset",
          value: { presetId: presetId.trim() },
        };
        return next;
      }
      case "risk_limit_tightening": {
        const next: RuntimeOverrideValue = {
          overrideType: "risk_limit_tightening",
          value: { limit: riskLimit, newValue: riskNewValue },
        };
        return next;
      }
      case "treasury_route": {
        if (!treasuryWalletId.trim()) return null;
        const next: RuntimeOverrideValue = {
          overrideType: "treasury_route",
          value: { toWalletId: treasuryWalletId.trim() },
        };
        return next;
      }
      case "pause_entries": {
        const next: RuntimeOverrideValue = { overrideType: "pause_entries", value: {} };
        return next;
      }
      case "exit_only": {
        const next: RuntimeOverrideValue = { overrideType: "exit_only", value: {} };
        return next;
      }
      case "kill_switch": {
        const next: RuntimeOverrideValue = {
          overrideType: "kill_switch",
          value: { haltNewEntries: true },
        };
        return next;
      }
    }
  }, [overrideType, sizeMultiplier, venueId, presetId, riskLimit, riskNewValue, treasuryWalletId]);

  const validation: GuardrailValidationResult = React.useMemo(() => {
    if (!candidate) return { allowed: false, reason: "size_multiplier_out_of_range" as const };
    return validateOverrideAgainstGuardrails(candidate, bundle.runtimeOverrideGuardrails);
  }, [candidate, bundle.runtimeOverrideGuardrails]);

  const canSubmit = candidate !== null && validation.allowed && reason.trim().length >= 8;

  const handleSubmit = React.useCallback(() => {
    if (!candidate || !validation.allowed) return;
    // Layer audit metadata on top of the typed value, then dispatch into the
    // cockpit ops store. The ReleaseBundlePanel reads the merged overrides
    // list from the store so the new override appears immediately below.
    const fullOverride: RuntimeOverride = {
      overrideId: `ov-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
      releaseId: bundle.releaseId,
      scope: EMPTY_WORKSPACE_SCOPE,
      reason: reason.trim(),
      createdBy: user?.email ?? user?.id ?? "trader-anon",
      createdAt: new Date().toISOString(),
      requiresApproval: false,
      preOverrideState: {},
      postOverrideState: {},
      auditEventId: `evt-${Date.now().toString(36)}`,
      ...candidate,
    };
    appendRuntimeOverride(fullOverride);
    onSubmit?.(candidate, reason.trim());
    setReason("");
  }, [candidate, validation.allowed, reason, onSubmit, appendRuntimeOverride, bundle.releaseId, user]);

  const guardrails = bundle.runtimeOverrideGuardrails;

  return (
    <Card
      className={cn("border-border/50 bg-gradient-to-br from-background to-muted/15", className)}
      data-testid="runtime-override-authoring"
    >
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-3.5 text-amber-400" aria-hidden />
            <h3 className="text-sm font-semibold tracking-tight">Author runtime override</h3>
          </div>
          <Badge variant="outline" className="text-[9px] font-mono">
            bundle {bundle.releaseId.split("-").slice(-1)[0]}
          </Badge>
        </div>

        <p className="text-[11px] leading-snug text-muted-foreground">
          The release bundle is immutable. Live mutations flow through this typed form, get validated against the
          bundle&apos;s guardrails, and append an audit record.{" "}
          {overrideType === "kill_switch" ? (
            <span className="text-rose-400">Kill switch is always allowed.</span>
          ) : null}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <Label htmlFor="override-type" className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
              Override type
            </Label>
            <Select value={overrideType} onValueChange={(v: string) => setOverrideType(v as RuntimeOverrideType)}>
              <SelectTrigger id="override-type" className="h-8 text-xs" data-testid="override-type-trigger">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RUNTIME_OVERRIDE_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs" data-testid={`override-type-option-${t}`}>
                    {OVERRIDE_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Per-type input rendering */}
          {overrideType === "size_multiplier" ? (
            <div className="space-y-1">
              <Label
                htmlFor="size-multiplier"
                className="text-[10px] uppercase tracking-wider text-muted-foreground/70"
              >
                Multiplier (allowed {guardrails.sizeMultiplierRange[0]}–{guardrails.sizeMultiplierRange[1]})
              </Label>
              <Input
                id="size-multiplier"
                type="number"
                step={0.05}
                min={0}
                max={2}
                value={sizeMultiplier}
                onChange={(e) => setSizeMultiplier(Number(e.target.value))}
                className="h-8 text-xs font-mono"
                data-testid="override-size-multiplier-input"
              />
            </div>
          ) : null}

          {overrideType === "venue_disable" ? (
            <div className="space-y-1">
              <Label htmlFor="venue-id" className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                Venue / protocol id
              </Label>
              <Input
                id="venue-id"
                value={venueId}
                onChange={(e) => setVenueId(e.target.value)}
                placeholder="e.g. okx, aave_v3, deribit"
                className="h-8 text-xs font-mono"
                data-testid="override-venue-input"
              />
            </div>
          ) : null}

          {overrideType === "execution_preset" ? (
            <div className="space-y-1">
              <Label htmlFor="preset-id" className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                Preset (approved list)
              </Label>
              <Select value={presetId} onValueChange={setPresetId}>
                <SelectTrigger id="preset-id" className="h-8 text-xs" data-testid="override-preset-trigger">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {guardrails.executionPresets.length === 0 ? (
                    <SelectItem value="" disabled>
                      No approved presets in this bundle
                    </SelectItem>
                  ) : (
                    guardrails.executionPresets.map((p) => (
                      <SelectItem key={p} value={p} className="text-xs">
                        {p}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {overrideType === "risk_limit_tightening" ? (
            <>
              <div className="space-y-1">
                <Label htmlFor="risk-limit" className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                  Limit
                </Label>
                <Select
                  value={riskLimit}
                  onValueChange={(v: string) =>
                    setRiskLimit(v as "max_loss_usd" | "max_drawdown_pct" | "max_concentration_pct")
                  }
                >
                  <SelectTrigger id="risk-limit" className="h-8 text-xs" data-testid="override-risk-limit-trigger">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="max_loss_usd" className="text-xs">
                      max_loss_usd
                    </SelectItem>
                    <SelectItem value="max_drawdown_pct" className="text-xs">
                      max_drawdown_pct
                    </SelectItem>
                    <SelectItem value="max_concentration_pct" className="text-xs">
                      max_concentration_pct
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="risk-new-value"
                  className="text-[10px] uppercase tracking-wider text-muted-foreground/70"
                >
                  New value (must be lower)
                </Label>
                <Input
                  id="risk-new-value"
                  type="number"
                  value={riskNewValue}
                  onChange={(e) => setRiskNewValue(Number(e.target.value))}
                  className="h-8 text-xs font-mono"
                  data-testid="override-risk-value-input"
                />
              </div>
            </>
          ) : null}

          {overrideType === "treasury_route" ? (
            <div className="space-y-1">
              <Label
                htmlFor="treasury-wallet"
                className="text-[10px] uppercase tracking-wider text-muted-foreground/70"
              >
                To wallet id
              </Label>
              <Input
                id="treasury-wallet"
                value={treasuryWalletId}
                onChange={(e) => setTreasuryWalletId(e.target.value)}
                placeholder="bundle-whitelisted alternate wallet"
                className="h-8 text-xs font-mono"
                data-testid="override-treasury-wallet-input"
              />
            </div>
          ) : null}

          {overrideType === "pause_entries" || overrideType === "exit_only" ? (
            <div className="flex items-end pb-1">
              <span className="text-[10px] text-muted-foreground italic">No payload — toggle override.</span>
            </div>
          ) : null}

          {overrideType === "kill_switch" ? (
            <div className="flex items-end pb-1">
              <span className="text-[10px] text-rose-400">Always allowed. Always audited.</span>
            </div>
          ) : null}
        </div>

        <p className="text-[10px] leading-snug text-muted-foreground/80">{OVERRIDE_DESCRIPTION[overrideType]}</p>

        <div className="space-y-1">
          <Label htmlFor="override-reason" className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
            Reason (audit, ≥8 chars)
          </Label>
          <Textarea
            id="override-reason"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Reducing size during low-liquidity weekend window"
            className="text-xs"
            data-testid="override-reason-input"
          />
        </div>

        {/* Live guardrail validation feedback */}
        <ValidationStrip validation={validation} />

        <div className="flex items-center justify-between gap-2">
          <div className="text-[10px] font-mono text-muted-foreground/70">
            Guardrails: size {guardrails.sizeMultiplierRange.join("–")}× · venue-disable{" "}
            {guardrails.venueDisableAllowed ? "✓" : "✕"} · risk-tighten {guardrails.riskTighteningAllowed ? "✓" : "✕"} ·{" "}
            pause {guardrails.pauseEntriesAllowed ? "✓" : "✕"} · exit-only {guardrails.exitOnlyAllowed ? "✓" : "✕"} ·{" "}
            treasury {guardrails.treasuryRouteOverridesAllowed ? "✓" : "✕"}
          </div>
          <Button
            size="sm"
            disabled={!canSubmit}
            onClick={handleSubmit}
            data-testid="override-submit-button"
            className="h-7 text-xs"
          >
            Author override
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ValidationStrip({ validation }: { readonly validation: GuardrailValidationResult }) {
  if (validation.allowed) {
    return (
      <div
        className="flex items-center gap-2 rounded border border-emerald-500/30 bg-emerald-500/5 px-2.5 py-1.5"
        data-testid="override-validation-allowed"
      >
        <ShieldCheck className="size-3.5 text-emerald-400" aria-hidden />
        <span className="text-[11px] text-emerald-300">Allowed by bundle guardrails.</span>
      </div>
    );
  }
  const detail = validation.reason ? REJECTION_DETAIL[validation.reason] : "Override is not yet valid.";
  return (
    <div
      className="flex items-start gap-2 rounded border border-amber-500/30 bg-amber-500/5 px-2.5 py-1.5"
      data-testid="override-validation-blocked"
      data-reason={validation.reason ?? ""}
    >
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-400" aria-hidden />
      <div className="space-y-0.5">
        <p className="text-[11px] font-medium text-amber-200">{detail}</p>
        {validation.reason ? (
          <p className="text-[10px] leading-snug text-amber-200/70">{GUARDRAIL_REJECTION_MESSAGE}</p>
        ) : null}
      </div>
    </div>
  );
}

/** Convenience badge that surfaces guardrail allow/block state without form. */
export function OverrideValidationBadge({ validation }: { readonly validation: GuardrailValidationResult }) {
  if (validation.allowed) {
    return (
      <Badge
        variant="outline"
        className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-mono text-[9px]"
      >
        <CheckCircle2 className="mr-1 size-3" aria-hidden /> guardrail-ok
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-300 font-mono text-[9px]">
      <AlertTriangle className="mr-1 size-3" aria-hidden /> {validation.reason ?? "blocked"}
    </Badge>
  );
}
