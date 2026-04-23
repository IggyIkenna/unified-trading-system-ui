"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface FormState {
  strategyName: string;
  leadResearcher: string;
  email: string;
  phone: string;
  commercialPath: "A" | "B" | "C" | "";
  understandFit: boolean;
  understandIncubation: boolean;
  understandSignals: boolean;
  assetGroups: Set<string>;
  instrumentTypes: Set<string>;
  strategyFamily: string;
  archetypeMarkers: Set<string>;
  pathwayDescription: string;
  dataGranularity: string;
  historicalWindow: string;
  dataGaps: string;
  triggerMethodology: string;
  decisionRule: string;
  positionLogic: string;
  orderTypes: string;
  fillModel: string;
  capacityModel: string;
  feesAndCosts: string;
  latencyAssumptions: string;
  avgTradesPerDay: string;
  instrumentsVenuesLeverage: string;
  backtestMethodologyDoc: string;
  assumptionsDoc: string;
  tearSheet: string;
  tradeLogCsv: string;
  equityCurveCsv: string;
  pipelineSample: string;
  sharpeRatio: string;
  calmarRatio: string;
  maxDrawdown: string;
  totalReturn: string;
  winRate: string;
  winningVsLosingDays: string;
  avgTradeExpectancy: string;
  benchmarkNotes: string;
  strategyOverview: string;
  alphaTesis: string;
  featureSetLogic: string;
  knownWeaknesses: string;
  riskManagement: string;
  pathAReproduce: string;
  pathADartBenefit: string;
  pathBSignalMapping: string;
  pathBExecutionWorkflow: string;
  pathCApiAccess: string;
  pathCReportingViews: string;
  deploymentContinuity: string;
  paperTradedAtLeast7Days: boolean;
  paperUsesRealApis: boolean;
  paperShadowFillsOnly: boolean;
  paperTradingMethodology: string;
  liveTradedAtLeastOneWeek: boolean;
  liveFullMarketDay: boolean;
  livePartialDay: boolean;
  liveValidationNotes: string;
  reportingReadiness: string;
}

type SerializedFormState = Omit<
  FormState,
  "assetGroups" | "instrumentTypes" | "archetypeMarkers"
> & {
  assetGroups: string[];
  instrumentTypes: string[];
  archetypeMarkers: string[];
};

const INITIAL_STATE: FormState = {
  strategyName: "",
  leadResearcher: "",
  email: "",
  phone: "",
  commercialPath: "",
  understandFit: false,
  understandIncubation: false,
  understandSignals: false,
  assetGroups: new Set(),
  instrumentTypes: new Set(),
  strategyFamily: "",
  archetypeMarkers: new Set(),
  pathwayDescription: "",
  dataGranularity: "",
  historicalWindow: "",
  dataGaps: "",
  triggerMethodology: "",
  decisionRule: "",
  positionLogic: "",
  orderTypes: "",
  fillModel: "",
  capacityModel: "",
  feesAndCosts: "",
  latencyAssumptions: "",
  avgTradesPerDay: "",
  instrumentsVenuesLeverage: "",
  backtestMethodologyDoc: "",
  assumptionsDoc: "",
  tearSheet: "",
  tradeLogCsv: "",
  equityCurveCsv: "",
  pipelineSample: "",
  sharpeRatio: "",
  calmarRatio: "",
  maxDrawdown: "",
  totalReturn: "",
  winRate: "",
  winningVsLosingDays: "",
  avgTradeExpectancy: "",
  benchmarkNotes: "",
  strategyOverview: "",
  alphaTesis: "",
  featureSetLogic: "",
  knownWeaknesses: "",
  riskManagement: "",
  pathAReproduce: "",
  pathADartBenefit: "",
  pathBSignalMapping: "",
  pathBExecutionWorkflow: "",
  pathCApiAccess: "",
  pathCReportingViews: "",
  deploymentContinuity: "",
  paperTradedAtLeast7Days: false,
  paperUsesRealApis: false,
  paperShadowFillsOnly: false,
  paperTradingMethodology: "",
  liveTradedAtLeastOneWeek: false,
  liveFullMarketDay: false,
  livePartialDay: false,
  liveValidationNotes: "",
  reportingReadiness: "",
};

const STORAGE_KEY = "odum-strategy-eval-draft";

function serializeState(state: FormState): SerializedFormState {
  return {
    ...state,
    assetGroups: [...state.assetGroups],
    instrumentTypes: [...state.instrumentTypes],
    archetypeMarkers: [...state.archetypeMarkers],
  };
}

function deserializeState(raw: SerializedFormState): FormState {
  return {
    ...raw,
    assetGroups: new Set(raw.assetGroups),
    instrumentTypes: new Set(raw.instrumentTypes),
    archetypeMarkers: new Set(raw.archetypeMarkers),
  };
}

const ASSET_GROUPS = [
  "Traditional Finance",
  "Crypto CeFi",
  "Sports",
  "Prediction Markets",
  "DeFi",
];

const INSTRUMENT_TYPES = [
  "Spot",
  "Perpetuals",
  "Dated futures",
  "Options",
  "Lending",
  "Staking",
  "LP/liquidity provision",
  "Event-settled markets",
];

const STRATEGY_FAMILIES = [
  "ML Directional",
  "Rules Directional",
  "Carry & Yield",
  "Arbitrage/Structural Edge",
  "Market Making",
  "Event-Driven",
  "Vol Trading",
  "Stat Arb/Pairs",
];

const ARCHETYPE_MARKERS = [
  "ML directional (continuous)",
  "ML directional (event-settled)",
  "Rules directional (continuous)",
  "Rules directional (event-settled)",
  "Carry basis (perp or dated)",
  "Staked basis/recursive staking",
  "Yield rotation/staking simple",
  "Arbitrage price dispersion/liquidation capture",
  "Market making (continuous or event-settled)",
  "Vol trading (options/surface/skew)",
  "Stat arb pairs/cross-sectional",
  "Event-driven",
];

interface FieldError {
  field: string;
  message: string;
}

function SectionHeading({
  letter,
  title,
}: {
  letter: string;
  title: string;
}) {
  return (
    <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
      <Badge variant="outline" className="text-xs">
        {letter}
      </Badge>
      {title}
    </h2>
  );
}

function RequiredMarker() {
  return <span className="text-destructive ml-0.5">*</span>;
}

function FieldError({ message }: { message: string }) {
  return <p className="text-destructive text-xs mt-1">{message}</p>;
}

export default function StrategyEvaluationPage() {
  const [form, setForm] = React.useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = React.useState<FieldError[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [submitError, setSubmitError] = React.useState(false);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SerializedFormState;
        setForm(deserializeState(parsed));
      }
    } catch {
      // ignore corrupt storage
    }
  }, []);

  React.useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState(form)));
      } catch {
        // ignore storage errors
      }
    }, 1000);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [form]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleSetItem(key: "assetGroups" | "instrumentTypes" | "archetypeMarkers", item: string) {
    setForm((prev) => {
      const next = new Set(prev[key]);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return { ...prev, [key]: next };
    });
  }

  function getError(field: string): string | undefined {
    return errors.find((e) => e.field === field)?.message;
  }

  function validate(): FieldError[] {
    const errs: FieldError[] = [];
    if (!form.strategyName.trim()) errs.push({ field: "strategyName", message: "Strategy name is required." });
    if (!form.leadResearcher.trim()) errs.push({ field: "leadResearcher", message: "Lead researcher is required." });
    if (!form.email.trim()) errs.push({ field: "email", message: "Email is required." });
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.push({ field: "email", message: "Enter a valid email address." });
    if (!form.commercialPath) errs.push({ field: "commercialPath", message: "Select a commercial path." });
    if (!form.understandFit) errs.push({ field: "understandFit", message: "You must acknowledge this statement." });
    if (!form.understandIncubation) errs.push({ field: "understandIncubation", message: "You must acknowledge this statement." });
    if (!form.understandSignals) errs.push({ field: "understandSignals", message: "You must acknowledge this statement." });
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (errs.length > 0) {
      const firstField = document.getElementById(errs[0].field);
      if (firstField) firstField.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSubmitting(true);
    setSubmitError(false);
    try {
      const payload = serializeState(form);
      const res = await fetch("/api/strategy-evaluation/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Non-OK response");
      localStorage.removeItem(STORAGE_KEY);
      setSubmitted(true);
    } catch {
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 md:px-6">
        <div className="rounded-xl border border-border bg-card p-8 text-center space-y-4">
          <Badge variant="outline">Received</Badge>
          <h1 className="text-2xl font-bold">Thank you — your evaluation has been received.</h1>
          <p className="text-muted-foreground">
            Your evaluation of{" "}
            <span className="font-medium text-foreground">
              &lsquo;{form.strategyName}&rsquo;
            </span>{" "}
            has been received. We&apos;ll review it and be in touch within 3 business days.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:px-6">
      <div className="mb-8">
        <Badge variant="outline" className="mb-3">
          Strategy Evaluation
        </Badge>
        <h1 className="text-2xl font-bold">Odum Strategy Evaluation Pack</h1>
        <p className="mt-2 text-muted-foreground">
          We use this pack to assess whether a strategy is suitable for incubation inside Odum,
          for signal-based integration into our execution stack, or for regulatory-umbrella coverage.
          This is not a request for unrestricted IP transfer.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Fields marked <span className="text-destructive">*</span> are required.
        </p>
      </div>

      <p className="text-sm text-muted-foreground mb-8">
        Sections A–P below. Starred fields are required.
      </p>

      {submitError && (
        <div className="mb-6 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Submission failed — please try again. If the problem persists, email{" "}
          <a href="mailto:info@odum-research.com" className="underline">
            info@odum-research.com
          </a>
          .
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-0">

        {/* Section A */}
        <section className="space-y-4 pt-0 first:border-t-0 first:pt-0">
          <SectionHeading letter="A" title="Submission details" />

          <div className="space-y-1">
            <Label htmlFor="strategyName" className="text-sm font-medium">
              Strategy / programme name<RequiredMarker />
            </Label>
            <Input
              id="strategyName"
              value={form.strategyName}
              onChange={(e) => setField("strategyName", e.target.value)}
              aria-invalid={!!getError("strategyName")}
            />
            {getError("strategyName") && <FieldError message={getError("strategyName")!} />}
          </div>

          <div className="space-y-1">
            <Label htmlFor="leadResearcher" className="text-sm font-medium">
              Lead researcher / owner<RequiredMarker />
            </Label>
            <Input
              id="leadResearcher"
              value={form.leadResearcher}
              onChange={(e) => setField("leadResearcher", e.target.value)}
              aria-invalid={!!getError("leadResearcher")}
            />
            {getError("leadResearcher") && <FieldError message={getError("leadResearcher")!} />}
          </div>

          <div className="space-y-1">
            <Label htmlFor="email" className="text-sm font-medium">
              Email<RequiredMarker />
            </Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              aria-invalid={!!getError("email")}
            />
            {getError("email") && <FieldError message={getError("email")!} />}
          </div>

          <div className="space-y-1">
            <Label htmlFor="phone" className="text-sm font-medium">
              Phone / Telegram / Signal
            </Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
            />
          </div>
        </section>

        {/* Section B */}
        <section className="space-y-4 pt-8 border-t border-border/40">
          <SectionHeading letter="B" title="Primary commercial path" />
          {getError("commercialPath") && <FieldError message={getError("commercialPath")!} />}

          <div id="commercialPath" className="space-y-3">
            {(
              [
                {
                  value: "A" as const,
                  label: "DART Full — incubation and rebuild within Odum",
                  description:
                    "Odum reconstructs the strategy inside the DART stack. We preserve the alpha thesis and operational methodology, then rebuild for production deployment within our regulated infrastructure. IP remains with the originating researcher.",
                },
                {
                  value: "B" as const,
                  label: "DART Signals-In — client signals, Odum execution and post-trade",
                  description:
                    "The researcher delivers signals via an agreed payload schema. Odum handles execution, position management, risk oversight, and post-trade reporting. The signal-generation IP stays entirely with the client.",
                },
                {
                  value: "C" as const,
                  label: "Regulatory Umbrella — read-only API integration",
                  description:
                    "Odum provides regulatory coverage, reporting, and oversight via API integration. The client retains full operational control. Odum acts as the appointed representative or regulatory anchor.",
                },
              ] as { value: "A" | "B" | "C"; label: string; description: string }[]
            ).map(({ value, label, description }) => (
              <label
                key={value}
                className="flex items-start gap-3 cursor-pointer rounded-lg border border-border/60 p-4 hover:border-border transition-colors"
              >
                <input
                  type="radio"
                  name="commercialPath"
                  value={value}
                  checked={form.commercialPath === value}
                  onChange={() => setField("commercialPath", value)}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{description}</p>
                </div>
              </label>
            ))}
          </div>
        </section>

        {/* Section C */}
        <section className="space-y-4 pt-8 border-t border-border/40">
          <SectionHeading letter="C" title="Relationship understanding" />

          <div className="space-y-3">
            <div>
              <label id="understandFit" className="flex items-start gap-3 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={form.understandFit}
                  onChange={(e) => setField("understandFit", e.target.checked)}
                  className="mt-0.5"
                  aria-invalid={!!getError("understandFit")}
                />
                <span>
                  I understand this process is intended to establish architectural fit, operating fit, and capital-allocation readiness.
                  <RequiredMarker />
                </span>
              </label>
              {getError("understandFit") && <FieldError message={getError("understandFit")!} />}
            </div>

            <div>
              <label className="flex items-start gap-3 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={form.understandIncubation}
                  onChange={(e) => setField("understandIncubation", e.target.checked)}
                  className="mt-0.5"
                  aria-invalid={!!getError("understandIncubation")}
                />
                <span>
                  I understand that, where incubation applies, the objective is to preserve and operationalise the strategy.
                  <RequiredMarker />
                </span>
              </label>
              {getError("understandIncubation") && <FieldError message={getError("understandIncubation")!} />}
            </div>

            <div>
              <label className="flex items-start gap-3 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={form.understandSignals}
                  onChange={(e) => setField("understandSignals", e.target.checked)}
                  className="mt-0.5"
                  aria-invalid={!!getError("understandSignals")}
                />
                <span>
                  I understand that Odum may route or execute signals if they map into the agreed payload schema.
                  <RequiredMarker />
                </span>
              </label>
              {getError("understandSignals") && <FieldError message={getError("understandSignals")!} />}
            </div>
          </div>
        </section>

        {/* Section D */}
        <section className="space-y-4 pt-8 border-t border-border/40">
          <SectionHeading letter="D" title="Architecture fit and taxonomy" />

          <div className="space-y-1">
            <Label className="text-sm font-medium">Asset groups</Label>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {ASSET_GROUPS.map((group) => (
                <label key={group} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.assetGroups.has(group)}
                    onChange={() => toggleSetItem("assetGroups", group)}
                  />
                  {group}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">Instrument types</Label>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {INSTRUMENT_TYPES.map((type) => (
                <label key={type} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.instrumentTypes.has(type)}
                    onChange={() => toggleSetItem("instrumentTypes", type)}
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">Primary strategy family</Label>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {STRATEGY_FAMILIES.map((family) => (
                <label key={family} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="strategyFamily"
                    value={family}
                    checked={form.strategyFamily === family}
                    onChange={() => setField("strategyFamily", family)}
                  />
                  {family}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">Archetype / style markers</Label>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {ARCHETYPE_MARKERS.map((marker) => (
                <label key={marker} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.archetypeMarkers.has(marker)}
                    onChange={() => toggleSetItem("archetypeMarkers", marker)}
                  />
                  {marker}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">Pathway description</Label>
            <Textarea
              rows={3}
              placeholder="Describe whether this looks like a clean rebuild, a partial integration, or a bespoke pathway."
              value={form.pathwayDescription}
              onChange={(e) => setField("pathwayDescription", e.target.value)}
            />
          </div>
        </section>

        {/* Section E */}
        <section className="space-y-4 pt-8 border-t border-border/40">
          <SectionHeading letter="E" title="Backtest methodology" />

          <div className="space-y-1">
            <Label className="text-sm font-medium">Data granularity</Label>
            <Input
              placeholder="Tick / L2 / OHLCV / other"
              value={form.dataGranularity}
              onChange={(e) => setField("dataGranularity", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">Historical window</Label>
            <Input
              placeholder="Start date, end date, number of years"
              value={form.historicalWindow}
              onChange={(e) => setField("historicalWindow", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">Data gaps / missing periods</Label>
            <Textarea
              rows={3}
              value={form.dataGaps}
              onChange={(e) => setField("dataGaps", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">Trigger methodology</Label>
            <Input
              placeholder="Time-based, event-based, hybrid"
              value={form.triggerMethodology}
              onChange={(e) => setField("triggerMethodology", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">Final decision rule</Label>
            <Textarea
              rows={3}
              value={form.decisionRule}
              onChange={(e) => setField("decisionRule", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">Position logic</Label>
            <Input
              placeholder="Position-dependent or position-independent"
              value={form.positionLogic}
              onChange={(e) => setField("positionLogic", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">Order types assumed</Label>
            <Input
              placeholder="Market, limit, passive, aggressive, hybrid"
              value={form.orderTypes}
              onChange={(e) => setField("orderTypes", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">Fill model</Label>
            <Input
              placeholder="Spread crossing, book matching, queue assumptions"
              value={form.fillModel}
              onChange={(e) => setField("fillModel", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">Capacity / market-impact model</Label>
            <Textarea
              rows={3}
              value={form.capacityModel}
              onChange={(e) => setField("capacityModel", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">Fees and execution costs</Label>
            <Input
              placeholder="Maker/taker, funding, borrow, gas, commissions"
              value={form.feesAndCosts}
              onChange={(e) => setField("feesAndCosts", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">Latency assumptions</Label>
            <Input
              placeholder="Signal-to-order delay, exchange ack, fill timing"
              value={form.latencyAssumptions}
              onChange={(e) => setField("latencyAssumptions", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">Average trades per day and typical holding period</Label>
            <Input
              value={form.avgTradesPerDay}
              onChange={(e) => setField("avgTradesPerDay", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">Instruments, venues, leverage</Label>
            <Textarea
              rows={3}
              value={form.instrumentsVenuesLeverage}
              onChange={(e) => setField("instrumentsVenuesLeverage", e.target.value)}
            />
          </div>
        </section>

        {/* Section F */}
        <section className="space-y-4 pt-8 border-t border-border/40">
          <SectionHeading letter="F" title="Tear sheet and evidence" />

          {(
            [
              { key: "backtestMethodologyDoc" as const, label: "Backtest methodology document (URL or file reference)" },
              { key: "assumptionsDoc" as const, label: "Assumptions document" },
              { key: "tearSheet" as const, label: "Performance tear sheet (PDF/charts)" },
              { key: "tradeLogCsv" as const, label: "Trade log CSV" },
              { key: "equityCurveCsv" as const, label: "Equity curve CSV" },
            ] as { key: keyof Pick<FormState, "backtestMethodologyDoc" | "assumptionsDoc" | "tearSheet" | "tradeLogCsv" | "equityCurveCsv">; label: string }[]
          ).map(({ key, label }) => (
            <div key={key} className="space-y-1">
              <Label className="text-sm font-medium">{label}</Label>
              <Input
                value={form[key] as string}
                onChange={(e) => setField(key, e.target.value)}
              />
            </div>
          ))}

          <div className="space-y-1">
            <Label className="text-sm font-medium">One-day pipeline sample description</Label>
            <Textarea
              rows={3}
              value={form.pipelineSample}
              onChange={(e) => setField("pipelineSample", e.target.value)}
            />
          </div>
        </section>

        {/* Section G */}
        <section className="space-y-4 pt-8 border-t border-border/40">
          <SectionHeading letter="G" title="Key performance metrics" />

          {(
            [
              { key: "sharpeRatio" as const, label: "Sharpe ratio" },
              { key: "calmarRatio" as const, label: "Calmar ratio" },
              { key: "maxDrawdown" as const, label: "Max drawdown" },
              { key: "totalReturn" as const, label: "Total return / CAGR" },
              { key: "winRate" as const, label: "Win rate" },
              { key: "winningVsLosingDays" as const, label: "Winning days vs losing days" },
              { key: "avgTradeExpectancy" as const, label: "Average trade expectancy" },
            ] as { key: keyof Pick<FormState, "sharpeRatio" | "calmarRatio" | "maxDrawdown" | "totalReturn" | "winRate" | "winningVsLosingDays" | "avgTradeExpectancy">; label: string }[]
          ).map(({ key, label }) => (
            <div key={key} className="space-y-1">
              <Label className="text-sm font-medium">{label}</Label>
              <Input
                value={form[key] as string}
                onChange={(e) => setField(key, e.target.value)}
              />
            </div>
          ))}

          <div className="space-y-1">
            <Label className="text-sm font-medium">Benchmark / comparison notes</Label>
            <Textarea
              rows={3}
              value={form.benchmarkNotes}
              onChange={(e) => setField("benchmarkNotes", e.target.value)}
            />
          </div>
        </section>

        {/* Section H */}
        <section className="space-y-4 pt-8 border-t border-border/40">
          <SectionHeading letter="H" title="Strategy documentation" />

          <div className="space-y-1">
            <Label className="text-sm font-medium">Strategy overview in plain English</Label>
            <Textarea
              rows={4}
              value={form.strategyOverview}
              onChange={(e) => setField("strategyOverview", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">Alpha thesis / inefficiency exploited</Label>
            <Textarea
              rows={4}
              value={form.alphaTesis}
              onChange={(e) => setField("alphaTesis", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">Feature set / signal inputs / model logic</Label>
            <Textarea
              rows={4}
              value={form.featureSetLogic}
              onChange={(e) => setField("featureSetLogic", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">Known weaknesses, failure modes, or regime dependencies</Label>
            <Textarea
              rows={3}
              value={form.knownWeaknesses}
              onChange={(e) => setField("knownWeaknesses", e.target.value)}
            />
          </div>
        </section>

        {/* Section I */}
        <section className="space-y-4 pt-8 border-t border-border/40">
          <SectionHeading letter="I" title="Risk management" />

          <div className="space-y-1">
            <Label className="text-sm font-medium">
              Position sizing, concentration, stops, drawdown controls, leverage, and kill-switch logic
            </Label>
            <Textarea
              rows={4}
              value={form.riskManagement}
              onChange={(e) => setField("riskManagement", e.target.value)}
            />
          </div>
        </section>

        {/* Section J — Path A only */}
        {form.commercialPath === "A" && (
          <section className="space-y-4 pt-8 border-t border-border/40">
            <SectionHeading letter="J" title="Path A — DART Full specific" />

            <div className="space-y-1">
              <Label className="text-sm font-medium">
                What should be reproduced exactly from the existing methodology and results?
              </Label>
              <Textarea
                rows={4}
                value={form.pathAReproduce}
                onChange={(e) => setField("pathAReproduce", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-medium">
                Which parts of the strategy are expected to benefit most from iteration inside DART?
              </Label>
              <Textarea
                rows={4}
                value={form.pathADartBenefit}
                onChange={(e) => setField("pathADartBenefit", e.target.value)}
              />
            </div>
          </section>
        )}

        {/* Section K — Path B only */}
        {form.commercialPath === "B" && (
          <section className="space-y-4 pt-8 border-t border-border/40">
            <SectionHeading letter="K" title="Path B — DART Signals-In specific" />

            <div className="space-y-1">
              <Label className="text-sm font-medium">
                Can signals map cleanly into the agreed payload schema and related execution workflow?
              </Label>
              <Textarea
                rows={4}
                value={form.pathBSignalMapping}
                onChange={(e) => setField("pathBSignalMapping", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-medium">
                Describe the expected execution, fills, and post-trade analytics workflow.
              </Label>
              <Textarea
                rows={4}
                value={form.pathBExecutionWorkflow}
                onChange={(e) => setField("pathBExecutionWorkflow", e.target.value)}
              />
            </div>
          </section>
        )}

        {/* Section L — Path C only */}
        {form.commercialPath === "C" && (
          <section className="space-y-4 pt-8 border-t border-border/40">
            <SectionHeading letter="L" title="Path C — Regulatory Umbrella specific" />

            <div className="space-y-1">
              <Label className="text-sm font-medium">
                What API keys, permissions, or data access are expected to be provided?
              </Label>
              <Textarea
                rows={4}
                value={form.pathCApiAccess}
                onChange={(e) => setField("pathCApiAccess", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-medium">
                Which reporting, position, P&amp;L, order-ledger, trade-ledger, or oversight views are required?
              </Label>
              <Textarea
                rows={4}
                value={form.pathCReportingViews}
                onChange={(e) => setField("pathCReportingViews", e.target.value)}
              />
            </div>
          </section>
        )}

        {/* Section M */}
        <section className="space-y-4 pt-8 border-t border-border/40">
          <SectionHeading letter="M" title="Deployment and operational continuity" />

          <div className="space-y-1">
            <Label className="text-sm font-medium">
              Where the code runs, how 24/7 continuity is maintained, monitoring / restart / failover
            </Label>
            <Textarea
              rows={4}
              value={form.deploymentContinuity}
              onChange={(e) => setField("deploymentContinuity", e.target.value)}
            />
          </div>
        </section>

        {/* Section N */}
        <section className="space-y-4 pt-8 border-t border-border/40">
          <SectionHeading letter="N" title="Paper trading validation" />

          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.paperTradedAtLeast7Days}
                onChange={(e) => setField("paperTradedAtLeast7Days", e.target.checked)}
              />
              Paper traded continuously for at least 7 days
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.paperUsesRealApis}
                onChange={(e) => setField("paperUsesRealApis", e.target.checked)}
              />
              Uses real APIs / testnet interaction
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.paperShadowFillsOnly}
                onChange={(e) => setField("paperShadowFillsOnly", e.target.checked)}
              />
              Shadow or assumed fills only
            </label>
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">Paper trading methodology and market-session coverage</Label>
            <Textarea
              rows={3}
              value={form.paperTradingMethodology}
              onChange={(e) => setField("paperTradingMethodology", e.target.value)}
            />
          </div>
        </section>

        {/* Section O */}
        <section className="space-y-4 pt-8 border-t border-border/40">
          <SectionHeading letter="O" title="Live trading validation" />

          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.liveTradedAtLeastOneWeek}
                onChange={(e) => setField("liveTradedAtLeastOneWeek", e.target.checked)}
              />
              Live traded for at least 1 week
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.liveFullMarketDay}
                onChange={(e) => setField("liveFullMarketDay", e.target.checked)}
              />
              Trades the full market day/session
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.livePartialDay}
                onChange={(e) => setField("livePartialDay", e.target.checked)}
              />
              Trades only part of the day/session
            </label>
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">
              How opens, closes, illiquid periods, and retrospective backtest-vs-live comparison are handled
            </Label>
            <Textarea
              rows={3}
              value={form.liveValidationNotes}
              onChange={(e) => setField("liveValidationNotes", e.target.value)}
            />
          </div>
        </section>

        {/* Section P */}
        <section className="space-y-4 pt-8 border-t border-border/40">
          <SectionHeading letter="P" title="Signal, reporting, and analytics readiness" />

          <div className="space-y-1">
            <Label className="text-sm font-medium">
              Describe what you expect to see in analytics, reporting, position, P&amp;L, trade, and order views.
            </Label>
            <Textarea
              rows={4}
              value={form.reportingReadiness}
              onChange={(e) => setField("reportingReadiness", e.target.value)}
            />
          </div>
        </section>

        {/* Submit */}
        <div className="pt-8 border-t border-border/40">
          {errors.length > 0 && (
            <p className="text-destructive text-sm mb-4">
              Please fix the {errors.length} error{errors.length > 1 ? "s" : ""} above before submitting.
            </p>
          )}
          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? "Submitting..." : "Submit evaluation"}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-4">
            This form is confidential. Odum Capital Ltd — FCA authorised · FRN 975797
          </p>
        </div>
      </form>
    </div>
  );
}
