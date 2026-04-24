"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Term } from "@/components/marketing/term";
import { FileUploadField } from "@/components/strategy-evaluation/file-upload-field";
import { isUploadedFileRef, type UploadedFileRef } from "@/lib/strategy-evaluation/upload";

interface FormState {
  strategyName: string;
  leadResearcher: string;
  email: string;
  phone: string;
  entityStructure: string;
  fundJurisdiction: string;
  entityLocation: string;
  entityLocationNotes: string;
  trackRecordTiming: string;
  planToRaiseExternalCapital: string;
  fundraisingChannels: Set<string>;
  fundraisingNotes: string;
  investorClassification: string;
  minSubscription: string;
  performanceFee: string;
  managementFee: string;
  rebalancingModel: string;
  rebalancingNotes: string;
  commercialPath: "A" | "B" | "C" | "";
  commercialPathSecondary: Set<string>;
  commercialPathTertiary: Set<string>;
  understandFit: boolean;
  understandIncubation: boolean;
  understandSignals: boolean;
  assetGroups: Set<string>;
  instrumentTypes: Set<string>;
  strategyFamily: string;
  archetypeMarkers: Set<string>;
  pathwayDescription: string;
  hasBacktest: string;
  hasPaperTraded: string;
  hasLiveTraded: string;
  dataGranularities: Set<string>;
  historicalWindow: string;
  dataGaps: string;
  triggerMethodology: string;
  triggerMethodologyOther: string;
  decisionRule: string;
  positionLogic: string;
  positionLogicOther: string;
  orderTypes: Set<string>;
  orderTypesOther: string;
  fillModel: string;
  fillModelOther: string;
  capacityModel: string;
  feesAndCosts: Set<string>;
  feesAndCostsOther: string;
  latencyAssumptions: string;
  avgTradesPerDay: string;
  instrumentsVenuesLeverage: string;
  draftSubmissionId: string;
  backtestMethodologyDoc: UploadedFileRef | null;
  assumptionsDoc: UploadedFileRef | null;
  tearSheet: UploadedFileRef | null;
  tradeLogCsv: UploadedFileRef | null;
  equityCurveCsv: UploadedFileRef | null;
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
  executionRiskControls: string;
  feeSensitivity: string;
  depositWithdrawal: string;
  treasuryManagement: string;
  pathAReproduce: string;
  pathADartBenefit: string;
  pathBSignalMapping: string;
  pathBExecutionWorkflow: string;
  pathCApiKeyOwnership: string;
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
  | "assetGroups"
  | "instrumentTypes"
  | "archetypeMarkers"
  | "commercialPathSecondary"
  | "commercialPathTertiary"
  | "fundraisingChannels"
  | "dataGranularities"
  | "orderTypes"
  | "feesAndCosts"
> & {
  assetGroups: string[];
  instrumentTypes: string[];
  archetypeMarkers: string[];
  commercialPathSecondary: string[];
  commercialPathTertiary: string[];
  fundraisingChannels: string[];
  dataGranularities: string[];
  orderTypes: string[];
  feesAndCosts: string[];
};

const INITIAL_STATE: FormState = {
  strategyName: "",
  leadResearcher: "",
  email: "",
  phone: "",
  entityStructure: "",
  fundJurisdiction: "",
  entityLocation: "",
  entityLocationNotes: "",
  trackRecordTiming: "",
  planToRaiseExternalCapital: "",
  fundraisingChannels: new Set(),
  fundraisingNotes: "",
  investorClassification: "",
  minSubscription: "",
  performanceFee: "",
  managementFee: "",
  rebalancingModel: "",
  rebalancingNotes: "",
  commercialPath: "",
  commercialPathSecondary: new Set(),
  commercialPathTertiary: new Set(),
  understandFit: false,
  understandIncubation: false,
  understandSignals: false,
  assetGroups: new Set(),
  instrumentTypes: new Set(),
  strategyFamily: "",
  archetypeMarkers: new Set(),
  pathwayDescription: "",
  hasBacktest: "",
  hasPaperTraded: "",
  hasLiveTraded: "",
  dataGranularities: new Set(),
  historicalWindow: "",
  dataGaps: "",
  triggerMethodology: "",
  triggerMethodologyOther: "",
  decisionRule: "",
  positionLogic: "",
  positionLogicOther: "",
  orderTypes: new Set(),
  orderTypesOther: "",
  fillModel: "",
  fillModelOther: "",
  capacityModel: "",
  feesAndCosts: new Set(),
  feesAndCostsOther: "",
  latencyAssumptions: "",
  avgTradesPerDay: "",
  instrumentsVenuesLeverage: "",
  draftSubmissionId: "",
  backtestMethodologyDoc: null,
  assumptionsDoc: null,
  tearSheet: null,
  tradeLogCsv: null,
  equityCurveCsv: null,
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
  executionRiskControls: "",
  feeSensitivity: "",
  depositWithdrawal: "",
  treasuryManagement: "",
  pathAReproduce: "",
  pathADartBenefit: "",
  pathBSignalMapping: "",
  pathBExecutionWorkflow: "",
  pathCApiKeyOwnership: "",
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
    commercialPathSecondary: [...state.commercialPathSecondary],
    commercialPathTertiary: [...state.commercialPathTertiary],
    fundraisingChannels: [...state.fundraisingChannels],
    dataGranularities: [...state.dataGranularities],
    orderTypes: [...state.orderTypes],
    feesAndCosts: [...state.feesAndCosts],
  };
}

function deserializeState(raw: SerializedFormState): FormState {
  return {
    ...raw,
    assetGroups: new Set(raw.assetGroups),
    instrumentTypes: new Set(raw.instrumentTypes),
    archetypeMarkers: new Set(raw.archetypeMarkers),
    commercialPathSecondary: new Set(raw.commercialPathSecondary ?? []),
    commercialPathTertiary: new Set(raw.commercialPathTertiary ?? []),
    fundraisingChannels: new Set(raw.fundraisingChannels ?? []),
    dataGranularities: new Set(raw.dataGranularities ?? []),
    // Legacy drafts may still have strings where arrays are expected — guard.
    orderTypes: new Set(Array.isArray(raw.orderTypes) ? raw.orderTypes : []),
    feesAndCosts: new Set(Array.isArray(raw.feesAndCosts) ? raw.feesAndCosts : []),
    // Evidence upload fields: legacy drafts had strings here. Drop strings.
    backtestMethodologyDoc: isUploadedFileRef(raw.backtestMethodologyDoc) ? raw.backtestMethodologyDoc : null,
    assumptionsDoc: isUploadedFileRef(raw.assumptionsDoc) ? raw.assumptionsDoc : null,
    tearSheet: isUploadedFileRef(raw.tearSheet) ? raw.tearSheet : null,
    tradeLogCsv: isUploadedFileRef(raw.tradeLogCsv) ? raw.tradeLogCsv : null,
    equityCurveCsv: isUploadedFileRef(raw.equityCurveCsv) ? raw.equityCurveCsv : null,
    draftSubmissionId: typeof raw.draftSubmissionId === "string" ? raw.draftSubmissionId : "",
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

type FileFieldKey =
  | "backtestMethodologyDoc"
  | "assumptionsDoc"
  | "tearSheet"
  | "tradeLogCsv"
  | "equityCurveCsv";

export default function StrategyEvaluationPage() {
  const [form, setForm] = React.useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = React.useState<FieldError[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [submitError, setSubmitError] = React.useState(false);
  const [uploadStatus, setUploadStatus] = React.useState<string>("");
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  // Files cached in-memory between pick and submit. Not serialised to
  // localStorage — abandoning a draft never produces orphan uploads.
  const pendingFilesRef = React.useRef<Map<FileFieldKey, File>>(new Map());

  const handleFileChange = React.useCallback(
    (fieldKey: FileFieldKey, file: File | null) => {
      if (file) pendingFilesRef.current.set(fieldKey, file);
      else pendingFilesRef.current.delete(fieldKey);
    },
    [],
  );

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SerializedFormState;
        const restored = deserializeState(parsed);
        if (!restored.draftSubmissionId) {
          restored.draftSubmissionId = `draft-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        }
        // Blob URLs are scoped to the session that created them — anything
        // rehydrated with url starting blob: is dead. Mark as stale so the
        // FileUploadField prompts re-selection instead of silently lying.
        const stalify = (r: UploadedFileRef | null): UploadedFileRef | null => {
          if (r && r.url.startsWith("blob:")) return { ...r, path: "stale" };
          return r;
        };
        restored.backtestMethodologyDoc = stalify(restored.backtestMethodologyDoc);
        restored.assumptionsDoc = stalify(restored.assumptionsDoc);
        restored.tearSheet = stalify(restored.tearSheet);
        restored.tradeLogCsv = stalify(restored.tradeLogCsv);
        restored.equityCurveCsv = stalify(restored.equityCurveCsv);
        setForm(restored);
      } else {
        setForm((prev) => ({
          ...prev,
          draftSubmissionId: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        }));
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

  function toggleSetItem(
    key:
      | "assetGroups"
      | "instrumentTypes"
      | "archetypeMarkers"
      | "commercialPathSecondary"
      | "commercialPathTertiary"
      | "fundraisingChannels"
      | "dataGranularities"
      | "orderTypes"
      | "feesAndCosts",
    item: string,
  ) {
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
      // 1. Upload any in-memory Files to Firebase Storage (or record mock
      //    refs in local dev). We can't mutate `form` in place because
      //    setState is async — build a fresh snapshot.
      const { uploadStrategyEvalFile } = await import("@/lib/strategy-evaluation/upload");
      const uploadedRefs = new Map<FileFieldKey, UploadedFileRef>();
      const pending = Array.from(pendingFilesRef.current.entries());
      for (const [fieldKey, file] of pending) {
        setUploadStatus(`Uploading ${file.name}…`);
        const ref = await uploadStrategyEvalFile(file, form.draftSubmissionId, fieldKey);
        uploadedRefs.set(fieldKey, ref);
      }
      setUploadStatus("");

      const finalForm: FormState = { ...form };
      for (const [fieldKey, ref] of uploadedRefs.entries()) {
        // Release the prior blob URL before overwriting
        const prev = finalForm[fieldKey];
        if (prev?.url.startsWith("blob:")) URL.revokeObjectURL(prev.url);
        finalForm[fieldKey] = ref;
      }
      // Strip any remaining blob: URLs in fields that never uploaded (e.g.
      // user in mock mode with no Firebase Storage) — don't send a useless
      // URL to the backend.
      (Object.keys(finalForm) as (keyof FormState)[]).forEach((k) => {
        const v = finalForm[k];
        if (v && typeof v === "object" && "url" in v && typeof v.url === "string" && v.url.startsWith("blob:")) {
          (finalForm[k] as UploadedFileRef | null) = { ...(v as UploadedFileRef), url: "" };
        }
      });
      setForm(finalForm);

      const payload = serializeState(finalForm);
      const res = await fetch("/api/strategy-evaluation/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Non-OK response");
      localStorage.removeItem(STORAGE_KEY);
      pendingFilesRef.current.clear();
      setSubmitted(true);
    } catch {
      setSubmitError(true);
      setUploadStatus("");
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
        <div className="mt-4 rounded-md border border-border/60 bg-card/40 px-4 py-3">
          <p className="text-sm font-medium">No strategy yet? Fill it in anyway.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            If you&rsquo;re exploring rather than submitting a specific strategy, answer each section
            in terms of the <em>kind</em> of strategy you&rsquo;d want to build or allocate to — asset
            groups, archetypes, typical performance you&rsquo;d target, operational shape. We&rsquo;ll
            use it to tailor the demo and surface the right capabilities.
          </p>
        </div>
        <div className="mt-3 rounded-md border border-border/60 bg-card/40 px-4 py-3">
          <p className="text-sm font-medium">Going DART Full? Leave details light if you prefer.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            If your primary interest is DART Full — where Odum rebuilds the strategy inside our stack —
            you can answer the deep-detail sections with high-level preferences or options rather than
            finalised specifics. We&rsquo;ll shape the rebuild together.
          </p>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Fields marked <span className="text-destructive">*</span> are required. For anything else
          that doesn&rsquo;t apply to your strategy, write <strong>N/A</strong> or leave it blank —
          don&rsquo;t force-fit an answer.
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

          <div className="space-y-1">
            <Label className="text-sm font-medium">Preferred capital structure</Label>
            <p className="text-xs text-muted-foreground">
              What structure are you targeting or open to? Select the closest match.
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-1">
              {(
                [
                  { value: "prop", label: "Proprietary / principal capital" },
                  { value: "sma", label: "Separately Managed Account (SMA)" },
                  { value: "fund", label: "Pooled fund / AIF" },
                  { value: "other", label: "Open to options / not yet decided" },
                ] as { value: string; label: string }[]
              ).map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="entityStructure"
                    value={value}
                    checked={form.entityStructure === value}
                    onChange={() => setField("entityStructure", value)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Where is the management entity based (or planned to be)?
            </Label>
            <p className="text-xs text-muted-foreground">
              The firm / operating entity itself, not the fund vehicle. If the entity doesn&rsquo;t
              exist yet, select the intended jurisdiction.
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {(
                [
                  { value: "uk", label: "UK" },
                  { value: "eu", label: "EU (specify below)" },
                  { value: "us", label: "US (specify state below)" },
                  { value: "cayman", label: "Cayman" },
                  { value: "bvi", label: "BVI" },
                  { value: "singapore", label: "Singapore" },
                  { value: "hong_kong", label: "Hong Kong" },
                  { value: "switzerland", label: "Switzerland" },
                  { value: "uae", label: "UAE (DIFC / ADGM)" },
                  { value: "other", label: "Other (specify below)" },
                  { value: "exploring", label: "Not yet incorporated — exploring" },
                ] as { value: string; label: string }[]
              ).map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="entityLocation"
                    value={value}
                    checked={form.entityLocation === value}
                    onChange={() => setField("entityLocation", value)}
                  />
                  {label}
                </label>
              ))}
            </div>
            {(form.entityLocation === "eu" ||
              form.entityLocation === "us" ||
              form.entityLocation === "other" ||
              form.entityLocation === "exploring") && (
              <Input
                placeholder="e.g. Luxembourg, Delaware, or 'planning UK with FCA application Q3'"
                value={form.entityLocationNotes}
                onChange={(e) => setField("entityLocationNotes", e.target.value)}
              />
            )}
          </div>

          {form.entityStructure === "fund" && (
            <div className="space-y-2 rounded-md border border-border/60 bg-card/30 p-4">
              <Label className="text-sm font-medium">Fund jurisdiction preference</Label>
              <p className="text-xs text-muted-foreground">
                For pooled funds, Odum&rsquo;s most cost-effective setup runs through our affiliate in an
                offshore jurisdiction. If you have a preference or constraint, indicate it here.
              </p>
              <div className="flex flex-col gap-2">
                {(
                  [
                    { value: "uk", label: "UK-domiciled" },
                    { value: "cayman", label: "Cayman Islands" },
                    { value: "bvi", label: "BVI" },
                    { value: "other", label: "Other / specify in notes" },
                    { value: "open", label: "Open to Odum&rsquo;s recommendation" },
                  ] as { value: string; label: string }[]
                ).map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="fundJurisdiction"
                      value={value}
                      checked={form.fundJurisdiction === value}
                      onChange={() => setField("fundJurisdiction", value)}
                    />
                    <span dangerouslySetInnerHTML={{ __html: label }} />
                  </label>
                ))}
              </div>
            </div>
          )}

          {form.entityStructure && form.entityStructure !== "prop" && (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Track-record timing</Label>
                <p className="text-xs text-muted-foreground">
                  When do you want to stand the external capital structure up relative to proving the strategy?
                </p>
                <div className="flex flex-col gap-2">
                  {(
                    [
                      { value: "build_first", label: "Build a live track record first (typically 12+ months), then stand up the fund / SMA mandate" },
                      { value: "launch_now", label: "Launch the capital-raising structure immediately alongside live trading" },
                      { value: "already_have", label: "Already have a live track record" },
                    ] as { value: string; label: string }[]
                  ).map(({ value, label }) => (
                    <label key={value} className="flex items-start gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="trackRecordTiming"
                        value={value}
                        checked={form.trackRecordTiming === value}
                        onChange={() => setField("trackRecordTiming", value)}
                        className="mt-0.5"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Do you plan to raise external capital yourself?</Label>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {(
                    [
                      { value: "yes", label: "Yes — we'll fundraise independently" },
                      { value: "no", label: "No — capital is already committed" },
                      { value: "exploring", label: "Exploring — no decision yet" },
                    ] as { value: string; label: string }[]
                  ).map(({ value, label }) => (
                    <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="planToRaiseExternalCapital"
                        value={value}
                        checked={form.planToRaiseExternalCapital === value}
                        onChange={() => setField("planToRaiseExternalCapital", value)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {(form.planToRaiseExternalCapital === "yes" ||
                form.planToRaiseExternalCapital === "exploring") && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Primary fundraising channels</Label>
                  <p className="text-xs text-muted-foreground">
                    How do you plan to reach LPs? Select all that apply.
                  </p>
                  <div className="flex flex-col gap-2">
                    {(
                      [
                        "Own network / direct LP relationships",
                        "Placement agents",
                        "Fund administrator / prime broker introductions",
                        "Family office / wealth manager network",
                        "Open to Odum distribution assistance (cross-cutting; see Section B)",
                        "Not yet determined",
                      ] as string[]
                    ).map((label) => (
                      <label key={label} className="flex items-start gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.fundraisingChannels.has(label)}
                          onChange={() => toggleSetItem("fundraisingChannels", label)}
                          className="mt-0.5"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                  <Textarea
                    rows={2}
                    placeholder="Optional notes on LP targets, existing soft-circled capital, timing, etc."
                    value={form.fundraisingNotes}
                    onChange={(e) => setField("fundraisingNotes", e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium">Investor classification</Label>
                <p className="text-xs text-muted-foreground">
                  Odum does not take retail investors. Which classifications do your target LPs fall under?
                </p>
                <div className="flex flex-col gap-2">
                  {(
                    [
                      { value: "hnwi", label: "HNWI / sophisticated investors only" },
                      { value: "institutional", label: "Institutional only (pension funds, endowments, FoFs)" },
                      { value: "mixed", label: "Mix of HNWI and institutional" },
                      { value: "tbd", label: "Not yet determined" },
                    ] as { value: string; label: string }[]
                  ).map(({ value, label }) => (
                    <label key={value} className="flex items-start gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="investorClassification"
                        value={value}
                        checked={form.investorClassification === value}
                        onChange={() => setField("investorClassification", value)}
                        className="mt-0.5"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium">Minimum subscription expectations</Label>
                <p className="text-xs text-muted-foreground">
                  Target minimum ticket size and any flexibility notes. Odum does not impose a fixed minimum —
                  this is a commercial conversation based on your LP mix.
                </p>
                <Input
                  placeholder="e.g. $500k standard min, willing to take $250k for strategic LPs; or TBD"
                  value={form.minSubscription}
                  onChange={(e) => setField("minSubscription", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Target gross performance fee</Label>
                  <Input
                    placeholder="e.g. 20%"
                    value={form.performanceFee}
                    onChange={(e) => setField("performanceFee", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Target management fee</Label>
                  <Input
                    placeholder="e.g. 2% p.a."
                    value={form.managementFee}
                    onChange={(e) => setField("managementFee", e.target.value)}
                  />
                </div>
              </div>
            </>
          )}
        </section>

        {/* Section B */}
        <section className="space-y-4 pt-8 border-t border-border/40">
          <SectionHeading letter="B" title="Commercial paths" />
          <p className="text-xs text-muted-foreground -mt-2">
            Select your <span className="font-medium text-foreground">primary</span> interest first,
            then mark any secondary or tertiary interest. This helps us design the right demo and
            understand where there may be additional fit.
          </p>
          {getError("commercialPath") && <FieldError message={getError("commercialPath")!} />}

          <div id="commercialPath" className="space-y-3">
            {(
              [
                {
                  value: "A" as const,
                  label: "DART Full — incubation and rebuild within Odum",
                  description:
                    "Odum reconstructs the strategy inside the DART stack. We preserve the alpha thesis and operational methodology, then rebuild for production deployment within our regulated infrastructure. Strategy IP remains with the originating researcher, protected by NDA and an exclusivity agreement that prevents Odum from sharing any sensitive strategy information or running any trading operations — on its own capital or client capital — that conflict with the submitted strategy design. Full access to DART research, ML, strategy promotion, execution, analytics, and reporting surfaces.",
                },
                {
                  value: "B" as const,
                  label: "DART Signals-In — client signals, Odum execution and analytics",
                  description:
                    "The researcher delivers signals via an agreed payload schema. Odum handles execution, position management, risk oversight, treasury management, and the full post-trade suite. This is not a standard OMS: DART provides advanced execution alpha through smart routing, latency optimisation, TCA, TWAP/VWAP algorithms, and real-time P&L analytics. Signal-generation IP stays entirely with the client.",
                },
                {
                  value: "C" as const,
                  label: "Regulatory Umbrella — FCA coverage and oversight",
                  description:
                    "Cross-cutting: Odum provides FCA regulatory coverage, reporting, and oversight. Compatible with any engagement shape — whether the client holds their own API keys and faces exchanges directly, or Odum operates the keys. The client retains full operational control; Odum acts as the appointed representative or regulatory anchor.",
                },
              ] as { value: "A" | "B" | "C"; label: string; description: string }[]
            ).map(({ value, label, description }) => {
              const isPrimary = form.commercialPath === value;
              const isSecondary = !isPrimary && form.commercialPathSecondary.has(value);
              const isTertiary =
                !isPrimary && !isSecondary && form.commercialPathTertiary.has(value);
              const borderClass = isPrimary
                ? "border-foreground"
                : isSecondary || isTertiary
                  ? "border-border"
                  : "border-border/60";
              return (
                <div key={value} className={`rounded-lg border ${borderClass} p-4 transition-colors`}>
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col gap-1 mt-0.5 min-w-[100px]">
                      <label className="flex items-center gap-1.5 text-[11px] font-medium cursor-pointer">
                        <input
                          type="radio"
                          name="commercialPath"
                          value={value}
                          checked={isPrimary}
                          onChange={() => {
                            setField("commercialPath", value);
                            setForm((prev) => {
                              const sec = new Set(prev.commercialPathSecondary);
                              const ter = new Set(prev.commercialPathTertiary);
                              sec.delete(value);
                              ter.delete(value);
                              return { ...prev, commercialPathSecondary: sec, commercialPathTertiary: ter };
                            });
                          }}
                        />
                        Primary
                      </label>
                      {!isPrimary && (
                        <>
                          <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSecondary}
                              onChange={() => {
                                if (isTertiary) toggleSetItem("commercialPathTertiary", value);
                                toggleSetItem("commercialPathSecondary", value);
                              }}
                            />
                            Secondary
                          </label>
                          <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isTertiary}
                              onChange={() => {
                                if (isSecondary) toggleSetItem("commercialPathSecondary", value);
                                toggleSetItem("commercialPathTertiary", value);
                              }}
                            />
                            Tertiary
                          </label>
                        </>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{label}</p>
                        {isPrimary && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide bg-foreground text-background rounded px-1.5 py-0.5">
                            Primary
                          </span>
                        )}
                        {isSecondary && (
                          <span className="text-[10px] font-medium text-muted-foreground border border-border rounded px-1.5 py-0.5">
                            Secondary
                          </span>
                        )}
                        {isTertiary && (
                          <span className="text-[10px] font-medium text-muted-foreground/80 border border-border/60 rounded px-1.5 py-0.5">
                            Tertiary
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground border-l-2 border-border pl-3 py-1 mt-2">
            <span className="font-medium text-foreground">Distribution assistance:</span>{" "}
            If requested by the manager, Odum may engage in distribution assistance to help with fundraising,
            but not under contract and with no standing expectation unless separately agreed.
          </p>
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
                  I understand that, under <Term id="dart-signals-in">DART Signals-In</Term>, Odum may route or
                  execute signals that map into the agreed payload schema, and display those signals and their
                  analytics solely so that the client can use Odum&rsquo;s execution and post-trade software.
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
          <p className="text-xs text-muted-foreground -mt-2">
            Odum will conduct its own technical taxonomy mapping. Your selections here help us pre-route
            the evaluation to the right team and design the demo to your use case. Hover any term for a
            definition.
          </p>

          <div className="space-y-1">
            <Label className="text-sm font-medium">Asset groups</Label>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {(
                [
                  { label: "Traditional Finance", termId: "tradfi" },
                  { label: "Crypto CeFi", termId: "cefi" },
                  { label: "Sports", termId: null },
                  { label: "Prediction Markets", termId: "prediction-markets" },
                  { label: "DeFi", termId: "defi" },
                ] as { label: string; termId: string | null }[]
              ).map(({ label, termId }) => (
                <label key={label} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.assetGroups.has(label)}
                    onChange={() => toggleSetItem("assetGroups", label)}
                  />
                  {termId ? <Term id={termId}>{label}</Term> : label}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">
              <Term id="spot">Instrument</Term> types
            </Label>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {(
                [
                  { label: "Spot", termId: "spot" },
                  { label: "Perpetuals", termId: "perpetual" },
                  { label: "Dated futures", termId: "dated-future" },
                  { label: "Options", termId: "options" },
                  { label: "Lending", termId: "lending" },
                  { label: "Staking", termId: "staking" },
                  { label: "LP/liquidity provision", termId: "lp" },
                  { label: "Event-settled markets", termId: "event-settled" },
                ] as { label: string; termId: string }[]
              ).map(({ label, termId }) => (
                <label key={label} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.instrumentTypes.has(label)}
                    onChange={() => toggleSetItem("instrumentTypes", label)}
                  />
                  <Term id={termId}>{label}</Term>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">
              Primary <Term id="ml-directional">strategy family</Term>
            </Label>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {(
                [
                  { label: "ML Directional", termId: "ml-directional" },
                  { label: "Rules Directional", termId: "rules-directional" },
                  { label: "Carry & Yield", termId: "carry-yield" },
                  { label: "Arbitrage/Structural Edge", termId: "arbitrage" },
                  { label: "Market Making", termId: "market-making" },
                  { label: "Event-Driven", termId: "event-driven" },
                  { label: "Vol Trading", termId: "vol-trading" },
                  { label: "Stat Arb/Pairs", termId: "stat-arb" },
                ] as { label: string; termId: string }[]
              ).map(({ label, termId }) => (
                <label key={label} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="strategyFamily"
                    value={label}
                    checked={form.strategyFamily === label}
                    onChange={() => setField("strategyFamily", label)}
                  />
                  <Term id={termId}>{label}</Term>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">
              <Term id="archetype">Archetype</Term> / style markers{" "}
              <span className="text-muted-foreground font-normal text-xs">(select all that apply)</span>
            </Label>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {(
                [
                  { label: "ML directional (continuous)", termId: "ml-directional" },
                  { label: "ML directional (event-settled)", termId: "ml-directional" },
                  { label: "Rules directional (continuous)", termId: "rules-directional" },
                  { label: "Rules directional (event-settled)", termId: "rules-directional" },
                  { label: "Carry basis (perp or dated)", termId: "carry-basis-perp" },
                  { label: "Staked basis/recursive staking", termId: "staked-basis" },
                  { label: "Yield rotation/staking simple", termId: "yield-rotation" },
                  { label: "Arbitrage price dispersion/liquidation capture", termId: "arb-price-dispersion" },
                  { label: "Market making (continuous or event-settled)", termId: "market-making" },
                  { label: "Vol trading (options/surface/skew)", termId: "vol-trading-archetype" },
                  { label: "Stat arb pairs/cross-sectional", termId: "stat-arb-pairs" },
                  { label: "Event-driven", termId: "event-driven" },
                ] as { label: string; termId: string }[]
              ).map(({ label, termId }) => (
                <label key={label} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.archetypeMarkers.has(label)}
                    onChange={() => toggleSetItem("archetypeMarkers", label)}
                  />
                  <Term id={termId}>{label}</Term>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">How do you see this fitting into our system?</Label>
            <p className="text-xs text-muted-foreground">
              Optional — share any context on your current tech stack, how standalone the strategy is,
              or what level of integration you&rsquo;re expecting. Odum will map the taxonomy formally.
            </p>
            <Textarea
              rows={3}
              placeholder="e.g. fully standalone Python strategy, outputs a signals CSV daily; or embedded in existing execution infra and needs API bridging only."
              value={form.pathwayDescription}
              onChange={(e) => setField("pathwayDescription", e.target.value)}
            />
          </div>
        </section>

        {/* Section E */}
        <section className="space-y-4 pt-8 border-t border-border/40">
          <SectionHeading letter="E" title="Backtest methodology" />

          <div className="space-y-2 rounded-md border border-border/60 bg-card/40 px-4 py-3">
            <Label className="text-sm font-medium">Has this strategy been backtested?</Label>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {(
                [
                  { value: "yes", label: "Yes — full backtest completed" },
                  { value: "partial", label: "Partial — early prototype / in progress" },
                  { value: "no", label: "Not yet backtested" },
                ] as { value: string; label: string }[]
              ).map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="hasBacktest"
                    value={value}
                    checked={form.hasBacktest === value}
                    onChange={() => setField("hasBacktest", value)}
                  />
                  {label}
                </label>
              ))}
            </div>
            {form.hasBacktest === "no" && (
              <p className="text-xs text-muted-foreground italic">
                That&rsquo;s fine — skip the backtest-methodology, evidence, and performance sections.
                For DART Full, Odum rebuilds the strategy including the backtest.
              </p>
            )}
          </div>

          {form.hasBacktest !== "no" && form.hasBacktest !== "" && (
          <>

          <div className="space-y-1">
            <Label className="text-sm font-medium">Data granularity</Label>
            <p className="text-xs text-muted-foreground">
              Select every granularity the backtest relies on. Strategies often use L2 for signal generation
              and trades for fill simulation — pick all that apply.
            </p>
            <div className="flex flex-col gap-2">
              {(
                [
                  {
                    value: "ohlcv",
                    label: "OHLCV bars",
                    hint: "Aggregated open/high/low/close/volume bars (1m / 5m / 1h / 1d etc.)",
                  },
                  {
                    value: "trades",
                    label: "Trades only (prints, no quotes)",
                    hint: "Executed-print stream only — common for VWAP/TWAP algos and bar-generating systems",
                  },
                  {
                    value: "l1",
                    label: "L1 / top of book (BBO + trades)",
                    hint: "Best bid + best ask + last trade, streaming",
                  },
                  {
                    value: "l2",
                    label: "L2 (aggregated depth + trades)",
                    hint: "Multiple price levels per side, total size at each level, plus trade stream",
                  },
                  {
                    value: "l3",
                    label: "L3 (order-by-order, or per-block for on-chain)",
                    hint: "Full order-level book (CeFi) or per-block state reconstruction (DeFi)",
                  },
                ] as { value: string; label: string; hint: string }[]
              ).map(({ value, label, hint }) => (
                <label key={value} className="flex items-start gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.dataGranularities.has(value)}
                    onChange={() => toggleSetItem("dataGranularities", value)}
                    className="mt-0.5"
                  />
                  <span>
                    {label}
                    <span className="block text-xs text-muted-foreground">{hint}</span>
                  </span>
                </label>
              ))}
            </div>
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
            <p className="text-xs text-muted-foreground">What prompts a decision to evaluate or trade?</p>
            <div className="flex flex-col gap-2">
              {(
                [
                  { value: "time_based", label: "Time-based", hint: "Periodic / scheduled evaluation (e.g. every minute, every bar close)" },
                  { value: "event_based", label: "Event-based", hint: "Reacts to specific market events (fills, regime shifts, news, on-chain events)" },
                  { value: "hybrid", label: "Hybrid", hint: "Mixes periodic cadence with event triggers" },
                  { value: "other", label: "Other (describe below)" },
                ] as { value: string; label: string; hint?: string }[]
              ).map(({ value, label, hint }) => (
                <label key={value} className="flex items-start gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="triggerMethodology"
                    value={value}
                    checked={form.triggerMethodology === value}
                    onChange={() => setField("triggerMethodology", value)}
                    className="mt-0.5"
                  />
                  <span>
                    {label}
                    {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
                  </span>
                </label>
              ))}
            </div>
            {form.triggerMethodology === "other" && (
              <Input
                className="mt-2"
                placeholder="Describe the trigger mechanism"
                value={form.triggerMethodologyOther}
                onChange={(e) => setField("triggerMethodologyOther", e.target.value)}
              />
            )}
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
            <p className="text-xs text-muted-foreground">
              Does each decision depend on current inventory, or does it stand alone?
            </p>
            <div className="flex flex-col gap-2">
              {(
                [
                  { value: "dependent", label: "Position-dependent", hint: "Each decision considers existing position, leverage, unrealised P&L" },
                  { value: "independent", label: "Position-independent", hint: "Each decision stands alone regardless of inventory (stateless signals)" },
                  { value: "hybrid", label: "Hybrid", hint: "Some decisions stateless, others depend on state (e.g. sizing)" },
                  { value: "other", label: "Other (describe below)" },
                ] as { value: string; label: string; hint?: string }[]
              ).map(({ value, label, hint }) => (
                <label key={value} className="flex items-start gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="positionLogic"
                    value={value}
                    checked={form.positionLogic === value}
                    onChange={() => setField("positionLogic", value)}
                    className="mt-0.5"
                  />
                  <span>
                    {label}
                    {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
                  </span>
                </label>
              ))}
            </div>
            {form.positionLogic === "other" && (
              <Input
                className="mt-2"
                placeholder="Describe the position logic"
                value={form.positionLogicOther}
                onChange={(e) => setField("positionLogicOther", e.target.value)}
              />
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">Order types assumed</Label>
            <p className="text-xs text-muted-foreground">Select all order types the backtest simulates.</p>
            <div className="flex flex-col gap-2">
              {(
                [
                  { value: "market", label: "Market orders", hint: "Cross the spread immediately" },
                  { value: "limit_passive", label: "Limit — passive (post on book)", hint: "Join the queue; earn maker fees / spread" },
                  { value: "limit_aggressive", label: "Limit — aggressive (crossing)", hint: "Cross through the book at a limit price" },
                  { value: "ioc_fok", label: "IOC / FOK", hint: "Immediate-or-Cancel / Fill-or-Kill" },
                  { value: "stop", label: "Stop / stop-limit", hint: "Triggered on price breach" },
                  { value: "post_only", label: "Post-only", hint: "Reject if would cross the spread" },
                  { value: "iceberg", label: "Iceberg / hidden", hint: "Size concealed from book" },
                  { value: "algo", label: "Algorithmic (TWAP / VWAP / POV)", hint: "Slicing + pacing algorithms" },
                  { value: "other", label: "Other (describe below)" },
                ] as { value: string; label: string; hint?: string }[]
              ).map(({ value, label, hint }) => (
                <label key={value} className="flex items-start gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.orderTypes.has(value)}
                    onChange={() => toggleSetItem("orderTypes", value)}
                    className="mt-0.5"
                  />
                  <span>
                    {label}
                    {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
                  </span>
                </label>
              ))}
            </div>
            {form.orderTypes.has("other") && (
              <Input
                className="mt-2"
                placeholder="Describe the additional order types"
                value={form.orderTypesOther}
                onChange={(e) => setField("orderTypesOther", e.target.value)}
              />
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">Fill model</Label>
            <p className="text-xs text-muted-foreground">
              How does the backtest decide when and at what price an order fills?
            </p>
            <div className="flex flex-col gap-2">
              {(
                [
                  { value: "always_fill", label: "Always-fill at signal price", hint: "Zero execution alpha baseline — fills at the price requested" },
                  { value: "spread_crossing", label: "Spread crossing", hint: "Pay the full bid-ask spread on every fill" },
                  { value: "book_matching", label: "Book matching (L2 depth walk)", hint: "Walk L2 depth; larger orders pay worse prices" },
                  { value: "queue_model", label: "Queue-position model", hint: "Simulates FIFO queue; maker fills depend on queue position at time of arrival" },
                  { value: "participation", label: "Participation (% of volume)", hint: "Fill rate capped as a fraction of observed venue volume" },
                  { value: "probabilistic", label: "Probabilistic / venue-historical", hint: "Fills drawn from a statistical model fitted to historical venue liquidity" },
                  { value: "other", label: "Other (describe below)" },
                ] as { value: string; label: string; hint?: string }[]
              ).map(({ value, label, hint }) => (
                <label key={value} className="flex items-start gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="fillModel"
                    value={value}
                    checked={form.fillModel === value}
                    onChange={() => setField("fillModel", value)}
                    className="mt-0.5"
                  />
                  <span>
                    {label}
                    {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
                  </span>
                </label>
              ))}
            </div>
            {form.fillModel === "other" && (
              <Input
                className="mt-2"
                placeholder="Describe the fill model"
                value={form.fillModelOther}
                onChange={(e) => setField("fillModelOther", e.target.value)}
              />
            )}
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
            <p className="text-xs text-muted-foreground">Select every cost component the backtest models.</p>
            <div className="flex flex-col gap-2">
              {(
                [
                  { value: "maker_taker", label: "Maker / taker fees", hint: "Venue fee schedule; may include tier-based rebates" },
                  { value: "funding", label: "Funding rates (perpetuals)", hint: "Periodic funding paid / received on perpetual positions" },
                  { value: "borrow", label: "Borrow / financing costs", hint: "Short borrow fees, margin financing, leverage costs" },
                  { value: "gas", label: "Gas / network fees (on-chain)", hint: "EVM gas, priority fees, bridge costs" },
                  { value: "commissions", label: "Commissions", hint: "TradFi broker / prime commission schedules" },
                  { value: "slippage", label: "Slippage model", hint: "Explicit slippage charge per trade (separate from fill model)" },
                  { value: "spread", label: "Spread cost", hint: "Half-spread charged on every fill, regardless of order type" },
                  { value: "settlement", label: "Settlement / clearing", hint: "Exchange clearing, DvP settlement, T+N financing" },
                  { value: "other", label: "Other (describe below)" },
                ] as { value: string; label: string; hint?: string }[]
              ).map(({ value, label, hint }) => (
                <label key={value} className="flex items-start gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.feesAndCosts.has(value)}
                    onChange={() => toggleSetItem("feesAndCosts", value)}
                    className="mt-0.5"
                  />
                  <span>
                    {label}
                    {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
                  </span>
                </label>
              ))}
            </div>
            {form.feesAndCosts.has("other") && (
              <Input
                className="mt-2"
                placeholder="Describe the additional costs"
                value={form.feesAndCostsOther}
                onChange={(e) => setField("feesAndCostsOther", e.target.value)}
              />
            )}
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

          </>
          )}
        </section>

        {/* Section F — gated on backtest existing */}
        {form.hasBacktest !== "no" && form.hasBacktest !== "" && (
        <section className="space-y-4 pt-8 border-t border-border/40">
          <SectionHeading letter="F" title="Tear sheet and evidence" />
          <p className="text-xs text-muted-foreground -mt-2">
            Attach the supporting documents. Files cache in your browser until you submit —
            you can view / download them immediately to verify they&rsquo;re correct. Upload to
            Odum&rsquo;s regulated storage happens when you press <strong>Submit evaluation</strong>.
            On localhost nothing is uploaded; filename and size are recorded as a draft only.
          </p>

          {(
            [
              {
                key: "backtestMethodologyDoc" as const,
                label: "Backtest methodology document",
                hint: "PDF, Word, or Markdown — describes how the backtest was run",
                accept: ".pdf,.doc,.docx,.md,.txt",
              },
              {
                key: "assumptionsDoc" as const,
                label: "Assumptions document",
                hint: "Signal-to-order delays, fill assumptions, cost model, data caveats",
                accept: ".pdf,.doc,.docx,.md,.txt",
              },
              {
                key: "tearSheet" as const,
                label: "Performance tear sheet",
                hint: "PDF / image bundle with the core return, risk, and drawdown charts",
                accept: ".pdf,.png,.jpg,.jpeg",
              },
              {
                key: "tradeLogCsv" as const,
                label: "Trade log CSV",
                hint: "One row per trade or fill — at minimum timestamp, side, instrument, size, price",
                accept: ".csv,.tsv,.parquet",
              },
              {
                key: "equityCurveCsv" as const,
                label: "Equity curve CSV",
                hint: "Timestamp + cumulative equity / NAV",
                accept: ".csv,.tsv,.parquet",
              },
            ] as {
              key: "backtestMethodologyDoc" | "assumptionsDoc" | "tearSheet" | "tradeLogCsv" | "equityCurveCsv";
              label: string;
              hint: string;
              accept: string;
            }[]
          ).map(({ key, label, hint, accept }) => (
            <FileUploadField
              key={key}
              label={label}
              hint={hint}
              accept={accept}
              value={form[key]}
              onChange={(ref) => setField(key, ref)}
              onFileChange={(file) => handleFileChange(key, file)}
            />
          ))}

          <div className="space-y-1">
            <Label className="text-sm font-medium">One-day pipeline sample description</Label>
            <p className="text-xs text-muted-foreground">
              Narrative — how a single trading day flows end-to-end through the pipeline.
            </p>
            <Textarea
              rows={3}
              value={form.pipelineSample}
              onChange={(e) => setField("pipelineSample", e.target.value)}
            />
          </div>
        </section>
        )}

        {/* Section G — gated on backtest existing */}
        {form.hasBacktest !== "no" && form.hasBacktest !== "" && (
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
        )}

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
            <Label className="text-sm font-medium">Strategy-level controls</Label>
            <p className="text-xs text-muted-foreground">
              Position sizing, concentration limits, drawdown controls, signal filters, leverage caps, and kill-switch logic
              built into the strategy decision layer.
            </p>
            <Textarea
              rows={4}
              value={form.riskManagement}
              onChange={(e) => setField("riskManagement", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">Execution-level controls</Label>
            <p className="text-xs text-muted-foreground">
              Order-level guardrails: fat-finger checks, max-order-size limits, pre-trade risk checks,
              venue-level exposure caps, or circuit breakers applied at the execution layer
              (separate from the strategy&rsquo;s own logic).
            </p>
            <Textarea
              rows={4}
              placeholder="e.g. max single-order size = 1% NAV, venue exposure cap $200k, hard stop if open P&L < -3% in a session."
              value={form.executionRiskControls}
              onChange={(e) => setField("executionRiskControls", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">Fee sensitivity</Label>
            <p className="text-xs text-muted-foreground">
              How sensitive is the strategy to trading costs? Does it require maker rebates, or can it absorb taker fees?
              Any constraints on commissions, funding rates, or gas costs.
            </p>
            <Textarea
              rows={3}
              placeholder="e.g. strategy breaks even below 3bps per side; requires maker-only fills; funding cost must not exceed 0.01% per 8h."
              value={form.feeSensitivity}
              onChange={(e) => setField("feeSensitivity", e.target.value)}
            />
          </div>
        </section>

        {/* Section I² — Treasury and operational flows */}
        <section className="space-y-4 pt-8 border-t border-border/40">
          <SectionHeading letter="I²" title="Treasury and operational flows" />

          <div className="space-y-1">
            <Label className="text-sm font-medium">
              <Term id="treasury-management">Treasury management</Term> requirements
            </Label>
            <p className="text-xs text-muted-foreground">
              Does the strategy require active management of idle capital across venues or chains?
              Stablecoin sweeps, collateral optimisation, cross-venue transfer flows?
            </p>
            <Textarea
              rows={3}
              placeholder="e.g. idle USDC swept to yield protocol daily; collateral rebalanced across three perp venues weekly."
              value={form.treasuryManagement}
              onChange={(e) => setField("treasuryManagement", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">Deposit / withdrawal timing</Label>
            <p className="text-xs text-muted-foreground">
              Are instant or same-day deposits and withdrawals required? Any constraints on settlement timing,
              lock-up periods, or liquidity buffers?
            </p>
            <Textarea
              rows={3}
              placeholder="e.g. weekly redemption window with 48h notice; or no lock-up, instant withdrawal required at all times."
              value={form.depositWithdrawal}
              onChange={(e) => setField("depositWithdrawal", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Inter-venue rebalancing model</Label>
            <p className="text-xs text-muted-foreground">
              When capital moves between exchanges or chains for rebalancing, what controls apply?
              This shapes the custody and operational-approval flow.
            </p>
            <div className="flex flex-col gap-2">
              {(
                [
                  { value: "whitelist", label: "Whitelisted addresses / destinations only" },
                  { value: "approval_required", label: "Operational approval required before each transfer" },
                  { value: "automated_limits", label: "Automated within pre-agreed size / frequency limits" },
                  { value: "na", label: "N/A — no cross-venue rebalancing expected" },
                  { value: "other", label: "Other / needs discussion (note below)" },
                ] as { value: string; label: string }[]
              ).map(({ value, label }) => (
                <label key={value} className="flex items-start gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="rebalancingModel"
                    value={value}
                    checked={form.rebalancingModel === value}
                    onChange={() => setField("rebalancingModel", value)}
                    className="mt-0.5"
                  />
                  {label}
                </label>
              ))}
            </div>
            <Textarea
              rows={2}
              placeholder="Optional notes — e.g. withdrawal destinations, cold-wallet anchor, approver list, typical rebalance cadence."
              value={form.rebalancingNotes}
              onChange={(e) => setField("rebalancingNotes", e.target.value)}
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

            <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-sm space-y-2 text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">
                  <Term id="dart-signals-in">DART Signals-In</Term>
                </span>{" "}
                is not a standard OMS. Beyond receiving and executing your signals, DART provides:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>
                  <Term id="execution-alpha">Execution alpha</Term> — smart order routing, latency
                  optimisation, passive/aggressive fill selection
                </li>
                <li>
                  Full <Term id="tca">TCA</Term> suite — slippage analysis, fill quality benchmarking,
                  venue comparison
                </li>
                <li>
                  <Term id="twap">TWAP</Term> / <Term id="vwap">VWAP</Term> and custom execution algorithms
                </li>
                <li>
                  <Term id="treasury-management">Treasury management</Term> — idle capital sweeps,
                  cross-venue collateral optimisation
                </li>
                <li>
                  Real-time and end-of-day <Term id="pnl">P&amp;L</Term>, position, and order-ledger views
                </li>
                <li>Post-trade analytics — regime attribution, drawdown decomposition, fee breakdown</li>
              </ul>
              <p className="text-xs">
                The questions below help us understand how your signals arrive and what execution and
                analytics surfaces will be most relevant to your use case.
              </p>
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-medium">Signal format and delivery</Label>
              <p className="text-xs text-muted-foreground">
                Can signals map into the agreed payload schema? Describe how signals are generated and
                delivered — batch file, webhook push, REST pull, or other — and the expected latency
                from decision to delivery.
              </p>
              <Textarea
                rows={4}
                value={form.pathBSignalMapping}
                onChange={(e) => setField("pathBSignalMapping", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-medium">Expected execution and analytics workflow</Label>
              <p className="text-xs text-muted-foreground">
                Which DART surfaces are most important? Describe the expected execution style
                (passive/aggressive, algorithmic, venue routing), and which post-trade or analytics
                views you need most.
              </p>
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

            <p className="text-sm text-muted-foreground">
              The <Term id="regulatory-umbrella">Regulatory Umbrella</Term> is cross-cutting and does
              not prescribe a specific API key or entity setup. The questions below help us understand
              the operational arrangement so we can configure oversight and reporting appropriately.
            </p>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Who holds the API keys / faces the exchange?</Label>
              <p className="text-xs text-muted-foreground">
                This does not affect eligibility for regulatory coverage — it just determines the oversight model.
              </p>
              <div className="flex flex-col gap-2">
                {(
                  [
                    { value: "client", label: "Client — we hold our own API keys and face the exchange directly" },
                    { value: "odum", label: "Odum — we prefer Odum to operate the keys and face the exchange" },
                    { value: "mixed", label: "Mixed / not yet decided" },
                  ] as { value: string; label: string }[]
                ).map(({ value, label }) => (
                  <label key={value} className="flex items-start gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="pathCApiKeyOwnership"
                      value={value}
                      checked={form.pathCApiKeyOwnership === value}
                      onChange={() => setField("pathCApiKeyOwnership", value)}
                      className="mt-0.5"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-medium">Data access and integration scope</Label>
              <p className="text-xs text-muted-foreground">
                What data — positions, orders, trades, balances — does Odum need read access to in order to
                fulfil the regulatory and reporting obligations?
              </p>
              <Textarea
                rows={4}
                value={form.pathCApiAccess}
                onChange={(e) => setField("pathCApiAccess", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-medium">Reporting and oversight views required</Label>
              <p className="text-xs text-muted-foreground">
                Which reporting, position, P&amp;L, order-ledger, trade-ledger, or regulatory oversight views
                are required from Odum&rsquo;s side?
              </p>
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

          <div className="space-y-2 rounded-md border border-border/60 bg-card/40 px-4 py-3">
            <Label className="text-sm font-medium">Has this strategy been paper traded?</Label>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {(
                [
                  { value: "yes", label: "Yes — ran in a paper / shadow environment" },
                  { value: "no", label: "Not paper traded" },
                ] as { value: string; label: string }[]
              ).map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="hasPaperTraded"
                    value={value}
                    checked={form.hasPaperTraded === value}
                    onChange={() => setField("hasPaperTraded", value)}
                  />
                  {label}
                </label>
              ))}
            </div>
            {form.hasPaperTraded === "no" && (
              <p className="text-xs text-muted-foreground italic">
                Fine to skip — paper trading is validation, not a prerequisite. If you&rsquo;re going
                DART Full, Odum runs the paper phase during incubation.
              </p>
            )}
          </div>

          {form.hasPaperTraded === "yes" && (
            <>
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
            </>
          )}
        </section>

        {/* Section O */}
        <section className="space-y-4 pt-8 border-t border-border/40">
          <SectionHeading letter="O" title="Live trading validation" />

          <div className="space-y-2 rounded-md border border-border/60 bg-card/40 px-4 py-3">
            <Label className="text-sm font-medium">Has this strategy been live traded?</Label>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {(
                [
                  { value: "yes", label: "Yes — traded with real capital" },
                  { value: "no", label: "Not live traded" },
                ] as { value: string; label: string }[]
              ).map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="hasLiveTraded"
                    value={value}
                    checked={form.hasLiveTraded === value}
                    onChange={() => setField("hasLiveTraded", value)}
                  />
                  {label}
                </label>
              ))}
            </div>
            {form.hasLiveTraded === "no" && (
              <p className="text-xs text-muted-foreground italic">
                No live track record yet — that&rsquo;s expected for many submissions. DART Full includes
                the live-tiny to live-allocated progression as part of incubation.
              </p>
            )}
          </div>

          {form.hasLiveTraded === "yes" && (
            <>
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
            </>
          )}
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
          {uploadStatus && (
            <p className="text-xs text-muted-foreground mt-2">{uploadStatus}</p>
          )}
          <p className="text-xs text-muted-foreground text-center mt-4">
            This form is confidential. Odum Capital Ltd — FCA authorised · FRN 975797
          </p>
        </div>
      </form>
    </div>
  );
}
