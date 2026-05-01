"use client";

/**
 * PromoteBundleForm — author a `StrategyReleaseBundle` from a research
 * experiment.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.plan.md §4.8 (configuration
 * lifecycle) + Phase 4 (Research/Promote stage UI).
 *
 * Surfaced inline in Research/Promote alongside the (read-only) demo
 * ReleaseBundlePanel so the user sees the artifact they would create AND
 * the form that creates it. The form pins all 12 versioned components +
 * declares the override guardrails the operating bundle will permit.
 *
 * Real Promote flow validates connectivity (`hasCefiAccountsForVenues`,
 * `hasDefiWalletsForProtocols`) and treasury policy before transitioning
 * the bundle to `candidate`. This demo mounts those validations live so
 * the buyer sees the pre-flight gate in action.
 */

import * as React from "react";
import { CheckCircle2, FileSignature, GitBranch, ShieldCheck, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  hasCefiAccountsForVenues,
  hasDefiWalletsForProtocols,
  type AccountConnectivityConfig,
} from "@/lib/architecture-v2/account-connectivity-config";
import { type ShareClass } from "@/lib/architecture-v2/enums";
import { DEFAULT_BUNDLE_GUARDRAILS, type StrategyReleaseBundle } from "@/lib/architecture-v2/strategy-release-bundle";
import { useCockpitOpsStore } from "@/lib/mocks/cockpit-ops-store";
import { cn } from "@/lib/utils";

interface PromoteBundleFormProps {
  /** Connectivity to validate against — gates approval. */
  readonly connectivity: AccountConnectivityConfig;
  /** Required CeFi venues for the new bundle (would come from research config). */
  readonly defaultRequiredVenues?: readonly string[];
  /** Required DeFi protocols for the new bundle. */
  readonly defaultRequiredProtocols?: readonly string[];
  readonly className?: string;
  readonly onSubmit?: (bundle: StrategyReleaseBundle) => void;
}

export function PromoteBundleForm({
  connectivity,
  defaultRequiredVenues = ["binance", "deribit"],
  defaultRequiredProtocols = ["aave_v3"],
  className,
  onSubmit,
}: PromoteBundleFormProps) {
  const appendBundleCandidate = useCockpitOpsStore((s) => s.appendBundleCandidate);
  const recentCandidates = useCockpitOpsStore((s) => s.bundleCandidates);

  // Identity.
  const [strategyId, setStrategyId] = React.useState("ARBITRAGE_PRICE_DISPERSION");
  const [strategyVersion, setStrategyVersion] = React.useState("3.3.0");
  const [shareClass, setShareClass] = React.useState<ShareClass>("USDT");
  const [accountOrMandateId, setAccountOrMandateId] = React.useState("mandate-arbitrage-001");

  // Versioned component pins.
  const [researchConfigVersion, setResearchConfigVersion] = React.useState("rc-2026.04.29");
  const [featureSetVersion, setFeatureSetVersion] = React.useState("fs-cross-venue-spread-v8");
  const [modelVersion, setModelVersion] = React.useState("mdl-spread-classifier-v5");
  const [executionConfigVersion, setExecutionConfigVersion] = React.useState("ec-2026.04.29");
  const [riskConfigVersion, setRiskConfigVersion] = React.useState("rk-2026.04.29");
  const [treasuryPolicyConfigVersion, setTreasuryPolicyConfigVersion] = React.useState("tp-1.3.0");
  const [venueSetVersion, setVenueSetVersion] = React.useState("vs-cefi-defi-2026.04.29");
  const [instrumentUniverseVersion, setInstrumentUniverseVersion] = React.useState("iu-btc-eth-2026.04.29");
  const [dataAssumptionVersion, setDataAssumptionVersion] = React.useState("da-2026.04.29");

  // Validation evidence.
  const [validationRunIds, setValidationRunIds] = React.useState("vr-004,vr-005");
  const [backtestRunIds, setBacktestRunIds] = React.useState("bt-003");
  const [paperRunIds, setPaperRunIds] = React.useState("pp-003");

  // Override guardrails.
  const [sizeMaxMultiplier, setSizeMaxMultiplier] = React.useState(1);
  const [venueDisableAllowed, setVenueDisableAllowed] = React.useState(true);
  const [pauseEntriesAllowed, setPauseEntriesAllowed] = React.useState(true);
  const [exitOnlyAllowed, setExitOnlyAllowed] = React.useState(true);

  // Required venues / protocols (would normally come from research config).
  const [requiredVenues] = React.useState(defaultRequiredVenues);
  const [requiredProtocols] = React.useState(defaultRequiredProtocols);

  // Pre-flight gates — these run live as the user fills the form.
  const cefiOk = React.useMemo(
    () => hasCefiAccountsForVenues(connectivity, requiredVenues),
    [connectivity, requiredVenues],
  );
  const defiOk = React.useMemo(
    () => hasDefiWalletsForProtocols(connectivity, requiredProtocols),
    [connectivity, requiredProtocols],
  );
  const evidenceOk =
    validationRunIds.trim().length > 0 && (backtestRunIds.trim().length > 0 || paperRunIds.trim().length > 0);

  const allGatesPass = cefiOk && defiOk && evidenceOk;

  const handleSubmit = React.useCallback(() => {
    if (!allGatesPass) return;
    const releaseId = `rb-${strategyId.toLowerCase().replace(/_/g, "-")}-v${strategyVersion}`;
    const bundle: StrategyReleaseBundle = {
      releaseId,
      strategyId,
      strategyVersion,
      researchConfigVersion,
      featureSetVersion,
      modelVersion,
      executionConfigVersion,
      riskConfigVersion,
      treasuryPolicyConfigVersion,
      venueSetVersion,
      instrumentUniverseVersion,
      dataAssumptionVersion,
      signalSchemaVersion: "ssv-internal-v3",
      instructionSchemaVersion: "is-v4",
      shareClass,
      accountOrMandateId,
      validationRunIds: validationRunIds
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      backtestRunIds: backtestRunIds
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      paperRunIds: paperRunIds
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      pilotRunIds: [],
      promotionStatus: "candidate",
      runtimeOverrideGuardrails: {
        ...DEFAULT_BUNDLE_GUARDRAILS,
        sizeMultiplierRange: [0, sizeMaxMultiplier],
        venueDisableAllowed,
        pauseEntriesAllowed,
        exitOnlyAllowed,
        executionPresets: ["passive", "aggressive", "conservative"],
        riskTighteningAllowed: true,
        treasuryRouteOverridesAllowed: true,
      },
      maturityPhase: "smoke",
      createdBy: "research-agent",
      createdAt: new Date().toISOString(),
      contentHash: `sha256:${releaseId}-${Date.now().toString(16)}`,
      lineageHash: `sha256:lineage-${releaseId}`,
    };
    appendBundleCandidate(bundle);
    onSubmit?.(bundle);
  }, [
    allGatesPass,
    appendBundleCandidate,
    strategyId,
    strategyVersion,
    researchConfigVersion,
    featureSetVersion,
    modelVersion,
    executionConfigVersion,
    riskConfigVersion,
    treasuryPolicyConfigVersion,
    venueSetVersion,
    instrumentUniverseVersion,
    dataAssumptionVersion,
    shareClass,
    accountOrMandateId,
    validationRunIds,
    backtestRunIds,
    paperRunIds,
    sizeMaxMultiplier,
    venueDisableAllowed,
    pauseEntriesAllowed,
    exitOnlyAllowed,
    onSubmit,
  ]);

  return (
    <Card
      className={cn("border-border/50 bg-gradient-to-br from-background to-muted/15", className)}
      data-testid="promote-bundle-form"
    >
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileSignature className="size-3.5 text-emerald-400" aria-hidden />
            <h3 className="text-sm font-semibold tracking-tight">Promote: author release bundle</h3>
          </div>
          <Badge variant="outline" className="text-[9px] font-mono">
            target status: candidate
          </Badge>
        </div>

        <p className="text-[11px] leading-snug text-muted-foreground">
          Promote freezes a research experiment into an immutable bundle. The bundle pins every versioned component
          (research / features / model / execution / risk / treasury / venues / instruments / data) and declares the
          override guardrails the operating bundle will permit.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <Field id="strategy-id" label="Strategy id" value={strategyId} onChange={setStrategyId} />
          <Field id="strategy-version" label="Version" value={strategyVersion} onChange={setStrategyVersion} />
          <Field
            id="share-class"
            label="Share class"
            value={shareClass}
            onChange={(v) => setShareClass(v as ShareClass)}
          />
          <Field
            id="mandate-id"
            label="Mandate / account"
            value={accountOrMandateId}
            onChange={setAccountOrMandateId}
          />
        </div>

        <SectionHeader icon={<GitBranch className="size-3" />} label="Version pins" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <Field
            id="research-cfg"
            label="Research config"
            value={researchConfigVersion}
            onChange={setResearchConfigVersion}
            mono
          />
          <Field id="feature-set" label="Feature set" value={featureSetVersion} onChange={setFeatureSetVersion} mono />
          <Field id="model" label="Model" value={modelVersion} onChange={setModelVersion} mono />
          <Field
            id="exec-cfg"
            label="Execution config"
            value={executionConfigVersion}
            onChange={setExecutionConfigVersion}
            mono
          />
          <Field id="risk-cfg" label="Risk config" value={riskConfigVersion} onChange={setRiskConfigVersion} mono />
          <Field
            id="treasury-cfg"
            label="Treasury policy"
            value={treasuryPolicyConfigVersion}
            onChange={setTreasuryPolicyConfigVersion}
            mono
          />
          <Field id="venue-set" label="Venue set" value={venueSetVersion} onChange={setVenueSetVersion} mono />
          <Field
            id="instrument-univ"
            label="Instrument universe"
            value={instrumentUniverseVersion}
            onChange={setInstrumentUniverseVersion}
            mono
          />
          <Field
            id="data-assumptions"
            label="Data assumptions"
            value={dataAssumptionVersion}
            onChange={setDataAssumptionVersion}
            mono
          />
        </div>

        <SectionHeader
          icon={<ShieldCheck className="size-3" />}
          label="Validation evidence (≥1 validation run + ≥1 backtest or paper run)"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <Field
            id="validation-runs"
            label="Validation run ids (comma-sep)"
            value={validationRunIds}
            onChange={setValidationRunIds}
            mono
            placeholder="vr-004, vr-005"
          />
          <Field
            id="backtest-runs"
            label="Backtest run ids"
            value={backtestRunIds}
            onChange={setBacktestRunIds}
            mono
            placeholder="bt-003"
          />
          <Field
            id="paper-runs"
            label="Paper run ids"
            value={paperRunIds}
            onChange={setPaperRunIds}
            mono
            placeholder="pp-003"
          />
        </div>

        <SectionHeader icon={<ShieldCheck className="size-3" />} label="Override guardrails" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          <div className="space-y-1">
            <Label htmlFor="size-max" className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
              Max size multiplier
            </Label>
            <Input
              id="size-max"
              type="number"
              step={0.1}
              min={0}
              max={1}
              value={sizeMaxMultiplier}
              onChange={(e) => setSizeMaxMultiplier(Number(e.target.value))}
              className="h-8 text-xs font-mono"
              data-testid="promote-size-max-input"
            />
          </div>
          <ToggleField
            id="venue-disable"
            label="Allow venue-disable"
            checked={venueDisableAllowed}
            onChange={setVenueDisableAllowed}
          />
          <ToggleField
            id="pause"
            label="Allow pause-entries"
            checked={pauseEntriesAllowed}
            onChange={setPauseEntriesAllowed}
          />
          <ToggleField id="exit-only" label="Allow exit-only" checked={exitOnlyAllowed} onChange={setExitOnlyAllowed} />
        </div>

        <SectionHeader icon={<ShieldCheck className="size-3" />} label="Pre-flight gates" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <Gate
            label={`CeFi connectivity (${requiredVenues.join(", ")})`}
            ok={cefiOk}
            okText="all venues connected"
            failText="missing connected accounts"
            testid="gate-cefi"
          />
          <Gate
            label={`DeFi connectivity (${requiredProtocols.join(", ")})`}
            ok={defiOk}
            okText="all protocols reachable"
            failText="missing connected wallets"
            testid="gate-defi"
          />
          <Gate
            label="Validation evidence"
            ok={evidenceOk}
            okText="evidence attached"
            failText="≥1 validation + (backtest OR paper) required"
            testid="gate-evidence"
          />
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-[10px] font-mono text-muted-foreground/70">
            All 3 gates must pass before the bundle transitions to candidate.
          </span>
          <Button
            size="sm"
            disabled={!allGatesPass}
            onClick={handleSubmit}
            data-testid="promote-bundle-submit"
            className="h-7 text-xs"
          >
            Author candidate bundle
          </Button>
        </div>

        {/* Recently authored candidates — proves the click did something. */}
        {recentCandidates.length > 0 ? (
          <div
            className="rounded border border-emerald-500/30 bg-emerald-500/5 p-2 space-y-1.5"
            data-testid="promote-recent-candidates"
          >
            <p className="text-[10px] uppercase tracking-wider text-emerald-300">
              Authored this session ({recentCandidates.length})
            </p>
            <ul className="space-y-1">
              {recentCandidates
                .slice(-3)
                .reverse()
                .map(({ bundle: candidate, authoredAt }) => (
                  <li
                    key={candidate.releaseId}
                    className="flex items-center justify-between gap-2 text-[10px] font-mono"
                    data-testid={`promote-candidate-${candidate.releaseId}`}
                  >
                    <span className="text-emerald-300/90 truncate">{candidate.releaseId}</span>
                    <span className="text-muted-foreground/70 shrink-0">
                      {new Date(authoredAt).toLocaleTimeString()}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SectionHeader({ icon, label }: { readonly icon: React.ReactNode; readonly label: string }) {
  return (
    <div className="flex items-center gap-1.5 pt-1.5">
      <span className="text-muted-foreground/70" aria-hidden>
        {icon}
      </span>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">{label}</span>
    </div>
  );
}

interface FieldProps {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (v: string) => void;
  readonly mono?: boolean;
  readonly placeholder?: string;
}

function Field({ id, label, value, onChange, mono, placeholder }: FieldProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
        {label}
      </Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn("h-8 text-xs", mono ? "font-mono" : "")}
        placeholder={placeholder}
      />
    </div>
  );
}

interface ToggleFieldProps {
  readonly id: string;
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: (v: boolean) => void;
}

function ToggleField({ id, label, checked, onChange }: ToggleFieldProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
        {label}
      </Label>
      <button
        type="button"
        id={id}
        onClick={() => onChange(!checked)}
        className={cn(
          "h-8 w-full rounded border text-xs font-mono",
          checked
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
            : "border-border/40 bg-muted/20 text-muted-foreground/70",
        )}
      >
        {checked ? "allowed" : "blocked"}
      </button>
    </div>
  );
}

interface GateProps {
  readonly label: string;
  readonly ok: boolean;
  readonly okText: string;
  readonly failText: string;
  readonly testid: string;
}

function Gate({ label, ok, okText, failText, testid }: GateProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded border px-2.5 py-2",
        ok ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5",
      )}
      data-testid={testid}
      data-ok={ok ? "true" : "false"}
    >
      {ok ? (
        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-400" aria-hidden />
      ) : (
        <XCircle className="mt-0.5 size-3.5 shrink-0 text-amber-400" aria-hidden />
      )}
      <div className="space-y-0.5 min-w-0">
        <p className="text-[10px] font-medium text-foreground/90 truncate">{label}</p>
        <p className={cn("text-[10px] leading-snug", ok ? "text-emerald-300/80" : "text-amber-300/80")}>
          {ok ? okText : failText}
        </p>
      </div>
    </div>
  );
}
