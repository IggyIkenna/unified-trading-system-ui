"use client";

/**
 * Path A — Allocator wizard.
 *
 * Preference-shaped intake for prospects evaluating Odum-managed strategies.
 * NOT for builders running their own strategy on Odum infrastructure (those
 * use the existing 8-step builder wizard in _client.tsx).
 *
 * Four steps, ~15 fields total:
 *   A1. About you — name, firm, email, phone.
 *   A2. Investor profile + appetite — investor type, AUM band, target Sharpe,
 *       max acceptable drawdown, return horizon.
 *   A3. Constraints — allowed venues / geographies / asset_groups, leverage
 *       cap, SMA exchange-fee preferences, instrument-type restrictions.
 *   A4. Capital + structure — capital scaling timeline, deployment preference,
 *       mandate-management interest, reporting cadence preference, preferred
 *       structure (SMA / pooled fund / unsure), regulated/affiliate structure
 *       interest (unknown / no / yes).
 *
 * Allocators do NOT get the regulatory Path C overlay (that's builder-only,
 * gated by the regulatoryWrapperNeeded sub-checkbox in step 2 of the builder
 * wizard).
 */

import * as React from "react";

import { STRUCTURE_OPTIONS as ROUTE_OPTIONS } from "@/lib/marketing/structure-options";

export interface AllocatorFormState {
  strategyName: string;
  leadResearcher: string;
  email: string;
  phone: string;
  // Step A2 — profile + appetite
  allocatorInvestorType: string;
  allocatorAumBand: string;
  allocatorTargetSharpe: string;
  allocatorMaxDrawdown: string;
  allocatorReturnHorizon: string;
  // Step A3 — constraints
  allocatorAllowedVenues: string;
  allocatorLeverageCap: string;
  allocatorSmaFeesPreference: string;
  allocatorInstrumentRestrictions: string;
  // Step A4 — capital + structure
  allocatorCapitalScalingTimeline: string;
  allocatorDeploymentPreference: string;
  allocatorMandateMgmtInterest: string;
  allocatorReportingCadence: string;
  allocatorPreferredStructure: "" | "sma" | "pooled" | "unsure";
  allocatorRegulatedStructureInterest: "" | "unknown" | "no" | "yes";
}

export const ALLOCATOR_INITIAL: AllocatorFormState = {
  strategyName: "",
  leadResearcher: "",
  email: "",
  phone: "",
  allocatorInvestorType: "",
  allocatorAumBand: "",
  allocatorTargetSharpe: "",
  allocatorMaxDrawdown: "",
  allocatorReturnHorizon: "",
  allocatorAllowedVenues: "",
  allocatorLeverageCap: "",
  allocatorSmaFeesPreference: "",
  allocatorInstrumentRestrictions: "",
  allocatorCapitalScalingTimeline: "",
  allocatorDeploymentPreference: "",
  allocatorMandateMgmtInterest: "",
  allocatorReportingCadence: "",
  allocatorPreferredStructure: "",
  allocatorRegulatedStructureInterest: "",
};

const STEPS: readonly { n: number; title: string }[] = [
  { n: 1, title: "About you" },
  { n: 2, title: "Investor profile" },
  { n: 3, title: "Constraints" },
  { n: 4, title: "Capital + structure" },
];

interface AllocatorWizardProps {
  readonly form: AllocatorFormState;
  readonly setField: <K extends keyof AllocatorFormState>(key: K, value: AllocatorFormState[K]) => void;
  readonly submitting: boolean;
  readonly submitted: boolean;
  readonly submitError: boolean;
  readonly validationErrors?: readonly { field: string; message: string }[];
  readonly onSubmit: () => void | Promise<void>;
  readonly onSwitchToBuilder: () => void;
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-foreground">
      {children}
      {required ? <span className="ml-1 text-destructive">*</span> : null}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
    />
  );
}

function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
    >
      <option value="">{placeholder ?? "Select..."}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
    />
  );
}

const AUM_BANDS = [
  { value: "lt-25m", label: "Less than $25m" },
  { value: "25-100m", label: "$25m-$100m" },
  { value: "100-500m", label: "$100m-$500m" },
  { value: "500m-1b", label: "$500m-$1bn" },
  { value: "gt-1b", label: "Over $1bn" },
] as const;

const RETURN_HORIZONS = [
  { value: "lt-1y", label: "Less than 12 months" },
  { value: "1-3y", label: "1-3 years" },
  { value: "3-5y", label: "3-5 years" },
  { value: "gt-5y", label: "5+ years" },
] as const;

// Allocator-form-state mapping: legacy `sma` / `pooled` / `unsure` form
// values map to the SSOT route ids `sma-direct` / `pooled-fund-affiliate`
// / `unsure`. We keep the form-state values stable so existing Firestore
// payloads and email templates continue to work; only the displayed
// labels change.
const STRUCTURE_OPTIONS = [
  {
    value: "sma",
    label: `${ROUTE_OPTIONS["sma-direct"].label} (${ROUTE_OPTIONS["sma-direct"].tag})`,
  },
  {
    value: "pooled",
    label: `${ROUTE_OPTIONS["pooled-fund-affiliate"].label} (${ROUTE_OPTIONS["pooled-fund-affiliate"].tag})`,
  },
  {
    value: "unsure",
    label: ROUTE_OPTIONS.unsure.label,
  },
] as const;

const REGULATED_OPTIONS = [
  { value: "unknown", label: "Don't know yet" },
  { value: "no", label: "Not relevant" },
  { value: "yes", label: "Yes, of interest" },
] as const;

export default function AllocatorWizard({
  form,
  setField,
  submitting,
  submitted,
  submitError,
  validationErrors,
  onSubmit,
  onSwitchToBuilder,
}: AllocatorWizardProps) {
  const [step, setStep] = React.useState<number>(1);
  const ALLOCATOR_FIELD_TO_STEP: Readonly<Record<string, number>> = {
    strategyName: 1,
    leadResearcher: 1,
    email: 1,
    allocatorInvestorType: 2,
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-border bg-card/40 p-8 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Submission received</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Thanks {form.leadResearcher.trim() || "for your submission"}. We&rsquo;ve received your allocator intake and
          will be in touch shortly with next steps. A confirmation email is on its way to {form.email || "your inbox"}.
        </p>
      </div>
    );
  }

  const totalSteps = STEPS.length;
  const canAdvance =
    step === 1
      ? Boolean(form.strategyName.trim()) && Boolean(form.leadResearcher.trim()) && Boolean(form.email.trim())
      : step === 2
        ? Boolean(form.allocatorInvestorType.trim())
        : true;

  function next() {
    setStep((s) => Math.min(totalSteps, s + 1));
  }
  function prev() {
    setStep((s) => Math.max(1, s - 1));
  }
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // If parent's validate() is going to reject this submission, jump to the
    // step that holds the first failing field so the user sees the gap. The
    // parent still re-runs validate() and is the authority — this is just a
    // pre-jump for UX.
    const firstField = validationErrors?.[0]?.field;
    const targetStep = firstField ? ALLOCATOR_FIELD_TO_STEP[firstField] : undefined;
    if (targetStep && targetStep !== step) {
      setStep(targetStep);
    }
    void onSubmit();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Path A: Allocator</p>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Strategy Evaluation</h1>
        <p className="text-sm text-muted-foreground">
          Preference-shaped intake for allocators evaluating Odum-managed strategies. About 5 minutes.{" "}
          <button type="button" onClick={onSwitchToBuilder} className="underline hover:text-foreground">
            I&rsquo;m a builder running my own strategy &rarr;
          </button>
        </p>
      </header>

      <ol className="flex flex-wrap gap-2 text-xs">
        {STEPS.map((s) => (
          <li
            key={s.n}
            className={`rounded border px-3 py-1.5 font-medium ${
              s.n === step
                ? "border-primary bg-primary/10 text-foreground"
                : s.n < step
                  ? "border-border/80 bg-muted/30 text-muted-foreground"
                  : "border-border/40 text-muted-foreground/60"
            }`}
          >
            <span className="font-mono">0{s.n}</span> &middot; {s.title}
          </li>
        ))}
      </ol>

      <form onSubmit={handleSubmit} noValidate className="space-y-8">
        {step === 1 && (
          <section className="space-y-5 rounded-lg border border-border/80 bg-card/40 p-6 md:p-8">
            <div>
              <h2 className="text-lg font-semibold">About you</h2>
              <p className="text-sm text-muted-foreground">Who are we talking to.</p>
            </div>
            <div>
              <FieldLabel required>Strategy or mandate name</FieldLabel>
              <TextInput
                value={form.strategyName}
                onChange={(v) => setField("strategyName", v)}
                placeholder="e.g. Pension allocation, Family office mandate"
              />
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <FieldLabel required>Your name</FieldLabel>
                <TextInput value={form.leadResearcher} onChange={(v) => setField("leadResearcher", v)} />
              </div>
              <div>
                <FieldLabel required>Email</FieldLabel>
                <TextInput type="email" value={form.email} onChange={(v) => setField("email", v)} />
              </div>
            </div>
            <div>
              <FieldLabel>Phone (optional)</FieldLabel>
              <TextInput value={form.phone} onChange={(v) => setField("phone", v)} />
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-5 rounded-lg border border-border/80 bg-card/40 p-6 md:p-8">
            <div>
              <h2 className="text-lg font-semibold">Investor profile + appetite</h2>
              <p className="text-sm text-muted-foreground">What are you allocating against.</p>
            </div>
            <div>
              <FieldLabel required>Investor type</FieldLabel>
              <TextInput
                value={form.allocatorInvestorType}
                onChange={(v) => setField("allocatorInvestorType", v)}
                placeholder="e.g. Family office, Pension, Endowment, HNW, Fund of funds"
              />
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <FieldLabel>AUM band</FieldLabel>
                <Select
                  value={form.allocatorAumBand}
                  onChange={(v) => setField("allocatorAumBand", v)}
                  options={AUM_BANDS}
                />
              </div>
              <div>
                <FieldLabel>Return horizon</FieldLabel>
                <Select
                  value={form.allocatorReturnHorizon}
                  onChange={(v) => setField("allocatorReturnHorizon", v)}
                  options={RETURN_HORIZONS}
                />
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <FieldLabel>Target Sharpe</FieldLabel>
                <TextInput
                  value={form.allocatorTargetSharpe}
                  onChange={(v) => setField("allocatorTargetSharpe", v)}
                  placeholder="e.g. 1.5+, range 1.0-2.0"
                />
              </div>
              <div>
                <FieldLabel>Max acceptable drawdown</FieldLabel>
                <TextInput
                  value={form.allocatorMaxDrawdown}
                  onChange={(v) => setField("allocatorMaxDrawdown", v)}
                  placeholder="e.g. 10%, 15%"
                />
              </div>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-5 rounded-lg border border-border/80 bg-card/40 p-6 md:p-8">
            <div>
              <h2 className="text-lg font-semibold">Constraints</h2>
              <p className="text-sm text-muted-foreground">What&rsquo;s in / out of scope for your mandate.</p>
            </div>
            <div>
              <FieldLabel>Allowed venues / geographies</FieldLabel>
              <TextArea
                value={form.allocatorAllowedVenues}
                onChange={(v) => setField("allocatorAllowedVenues", v)}
                placeholder="e.g. EU+UK only, no US persons; CME + LSE allowed; no Russia / sanctions"
              />
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <FieldLabel>Leverage cap</FieldLabel>
                <TextInput
                  value={form.allocatorLeverageCap}
                  onChange={(v) => setField("allocatorLeverageCap", v)}
                  placeholder="e.g. 2x, no leverage, 5x notional"
                />
              </div>
              <div>
                <FieldLabel>SMA exchange-fee preference</FieldLabel>
                <TextInput
                  value={form.allocatorSmaFeesPreference}
                  onChange={(v) => setField("allocatorSmaFeesPreference", v)}
                  placeholder="e.g. pass-through, capped, internalised"
                />
              </div>
            </div>
            <div>
              <FieldLabel>Instrument-type restrictions</FieldLabel>
              <TextArea
                value={form.allocatorInstrumentRestrictions}
                onChange={(v) => setField("allocatorInstrumentRestrictions", v)}
                placeholder="e.g. spot only, no options, no leveraged perps"
              />
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="space-y-5 rounded-lg border border-border/80 bg-card/40 p-6 md:p-8">
            <div>
              <h2 className="text-lg font-semibold">Capital + structure</h2>
              <p className="text-sm text-muted-foreground">How and when you&rsquo;d deploy.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <FieldLabel>Capital scaling timeline</FieldLabel>
                <TextInput
                  value={form.allocatorCapitalScalingTimeline}
                  onChange={(v) => setField("allocatorCapitalScalingTimeline", v)}
                  placeholder="e.g. seed $5m → ramp to $25m over 12mo"
                />
              </div>
              <div>
                <FieldLabel>Deployment preference</FieldLabel>
                <TextInput
                  value={form.allocatorDeploymentPreference}
                  onChange={(v) => setField("allocatorDeploymentPreference", v)}
                  placeholder="e.g. fully-funded, ramp, milestone-gated"
                />
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <FieldLabel>Reporting cadence</FieldLabel>
                <TextInput
                  value={form.allocatorReportingCadence}
                  onChange={(v) => setField("allocatorReportingCadence", v)}
                  placeholder="e.g. monthly NAV, weekly position, daily risk"
                />
              </div>
              <div>
                <FieldLabel>Mandate-management interest</FieldLabel>
                <TextInput
                  value={form.allocatorMandateMgmtInterest}
                  onChange={(v) => setField("allocatorMandateMgmtInterest", v)}
                  placeholder="e.g. fully delegated, advisory, co-managed"
                />
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Two main client-facing operating routes are available; engagements can also combine both. The fit call
                walks the choice against your jurisdiction, distribution posture, and permissions.
              </p>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <FieldLabel>Preferred client-facing route</FieldLabel>
                  <Select
                    value={form.allocatorPreferredStructure}
                    onChange={(v) =>
                      setField("allocatorPreferredStructure", v as AllocatorFormState["allocatorPreferredStructure"])
                    }
                    options={STRUCTURE_OPTIONS}
                  />
                </div>
                <div>
                  <FieldLabel>Regulated / affiliate structure interest</FieldLabel>
                  <Select
                    value={form.allocatorRegulatedStructureInterest}
                    onChange={(v) =>
                      setField(
                        "allocatorRegulatedStructureInterest",
                        v as AllocatorFormState["allocatorRegulatedStructureInterest"],
                      )
                    }
                    options={REGULATED_OPTIONS}
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {validationErrors && validationErrors.length > 0 && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            <p className="font-medium">
              Please fix {validationErrors.length} field{validationErrors.length > 1 ? "s" : ""} before submitting:
            </p>
            <ul className="mt-1 list-disc pl-5">
              {validationErrors.map((e) => (
                <li key={e.field}>{e.message}</li>
              ))}
            </ul>
          </div>
        )}
        {submitError && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            Submission failed. Please retry or email us if it persists.
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={prev}
            disabled={step === 1 || submitting}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted/30 disabled:opacity-40"
          >
            Back
          </button>
          {step < totalSteps ? (
            <button
              type="button"
              onClick={next}
              disabled={!canAdvance || submitting}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={
                submitting ||
                !form.strategyName.trim() ||
                !form.leadResearcher.trim() ||
                !form.email.trim() ||
                !form.allocatorInvestorType.trim()
              }
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
            >
              {submitting ? "Submitting…" : "Submit allocator intake"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
