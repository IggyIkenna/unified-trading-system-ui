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
import { validateStrategyEvaluation } from "@/lib/strategy-evaluation/validate";
import PreStepGate from "./_pre-step-gate";
import AllocatorWizard, { type AllocatorFormState } from "./_allocator-wizard";
import { persistSeed, seedFiltersFromQuestionnaire } from "@/lib/questionnaire/seed-catalogue-filters";

interface FormState {
  /**
   * Pre-step gate (Funnel Coherence plan Workstream A).
   * "" = unset, gate is shown. "allocator" = Path A, allocator wizard renders.
   * "builder" = Path B, the existing 8-step builder wizard renders.
   */
  engagementIntent: "" | "allocator" | "builder";
  /** Path B regulatory-wrapper sub-checkbox (replaces the old Path C primary option). */
  regulatoryWrapperNeeded: boolean;
  /**
   * Cross-cutting overlays for the engagement, picked alongside the primary
   * commercial path. Replaces the Primary/Secondary/Tertiary hierarchy and
   * the legalistic understanding-checkboxes — see Step 2 redesign 2026-04-26.
   * Possible values: "regulatory" / "odum-signals" / "post-trade-reporting" /
   * "fund-or-sma" / "not-sure".
   */
  engagementOverlays: Set<string>;
  // Allocator (Path A) fields — preference-shaped intake.
  allocatorInvestorType: string;
  allocatorAumBand: string;
  allocatorTargetSharpe: string;
  allocatorMaxDrawdown: string;
  allocatorReturnHorizon: string;
  allocatorAllowedVenues: string;
  allocatorLeverageCap: string;
  allocatorSmaFeesPreference: string;
  allocatorInstrumentRestrictions: string;
  allocatorCapitalScalingTimeline: string;
  allocatorDeploymentPreference: string;
  allocatorMandateMgmtInterest: string;
  allocatorReportingCadence: string;
  allocatorPreferredStructure: "" | "sma" | "pooled" | "unsure";
  allocatorRegulatedStructureInterest: "" | "unknown" | "no" | "yes";
  // Builder (Path B) fields — existing 8-step DDQ.
  strategyName: string;
  leadResearcher: string;
  email: string;
  phone: string;
  referralSource: string;
  referralSourceNotes: string;
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
  commercialPath: "A" | "B" | "C" | "D" | "";
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
  holdingPeriod: string;
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
  pathDDeliveryMechanism: string;
  pathDDeliveryNotes: string;
  pathDSchemaChoice: string;
  pathDSchemaNotes: string;
  pathDLatencyTolerance: string;
  pathDExecutionContext: string;
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
  | "engagementOverlays"
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
  engagementOverlays: string[];
};

const INITIAL_STATE: FormState = {
  engagementIntent: "",
  regulatoryWrapperNeeded: false,
  engagementOverlays: new Set(),
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
  strategyName: "",
  leadResearcher: "",
  email: "",
  phone: "",
  referralSource: "",
  referralSourceNotes: "",
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
  holdingPeriod: "",
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
  pathDDeliveryMechanism: "",
  pathDDeliveryNotes: "",
  pathDSchemaChoice: "",
  pathDSchemaNotes: "",
  pathDLatencyTolerance: "",
  pathDExecutionContext: "",
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

interface StepConfig {
  n: number;
  title: string;
  /** A,B,C,...P — the section letters this step renders. Used as a label hint only. */
  sections: string;
}

const STEPS: readonly StepConfig[] = [
  { n: 1, title: "About you", sections: "A" },
  { n: 2, title: "What you’re trying to do", sections: "B-C" },
  { n: 3, title: "Strategy profile", sections: "D" },
  { n: 4, title: "Evidence", sections: "E" },
  { n: 5, title: "Operating setup", sections: "F" },
  { n: 6, title: "Risk and controls", sections: "G" },
  { n: 7, title: "Odum fit", sections: "H" },
  { n: 8, title: "Readiness", sections: "I" },
] as const;

const TOTAL_STEPS = STEPS.length;

/**
 * Required field IDs mapped to the wizard step that contains them. When the final
 * Submit hits a validation error, we jump to the step holding the first offending
 * field so the inline error is actually visible.
 */
const FIELD_TO_STEP: Record<string, number> = {
  strategyName: 1,
  leadResearcher: 1,
  email: 1,
  commercialPath: 2,
  understandFit: 2,
  understandIncubation: 2,
  understandSignals: 2,
};

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
    engagementOverlays: [...state.engagementOverlays],
  };
}

function deserializeState(raw: SerializedFormState): FormState {
  // Merge with INITIAL_STATE so new fields default cleanly when a partial
  // pre-seed payload arrives (e.g. URL-param-driven engagementIntent +
  // regulatoryWrapperNeeded from page.tsx) and old cached drafts that
  // predate field additions still hydrate without violating FormState types.
  return {
    ...INITIAL_STATE,
    ...raw,
    // New fields default to empty so older cached drafts don't violate FormState string types
    referralSource: typeof raw.referralSource === "string" ? raw.referralSource : "",
    referralSourceNotes: typeof raw.referralSourceNotes === "string" ? raw.referralSourceNotes : "",
    holdingPeriod: typeof raw.holdingPeriod === "string" ? raw.holdingPeriod : "",
    assetGroups: new Set(raw.assetGroups ?? []),
    instrumentTypes: new Set(raw.instrumentTypes ?? []),
    archetypeMarkers: new Set(raw.archetypeMarkers ?? []),
    commercialPathSecondary: new Set(raw.commercialPathSecondary ?? []),
    commercialPathTertiary: new Set(raw.commercialPathTertiary ?? []),
    fundraisingChannels: new Set(raw.fundraisingChannels ?? []),
    dataGranularities: new Set(raw.dataGranularities ?? []),
    engagementOverlays: new Set(raw.engagementOverlays ?? []),
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

const ASSET_GROUPS = ["Traditional Finance", "Crypto CeFi", "Sports", "Prediction Markets", "DeFi"];

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

function SectionHeading({ letter, title }: { letter: string; title: string }) {
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

/**
 * "Already submitted? Resend my access link" — for prospects who lost the magic
 * link from their original confirmation email. Always shows a generic confirmation
 * (we don't tell the world whether an email has a submission); the server only
 * actually sends an email when a matching submission exists.
 */
function ResendLinkRow({ email }: { email: string }) {
  const [state, setState] = React.useState<"idle" | "sending" | "sent">("idle");
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function onResend() {
    if (!valid || state !== "idle") return;
    setState("sending");
    try {
      await fetch("/api/strategy-evaluation/resend-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
        cache: "no-store",
      });
    } catch {
      // ignore — always show the generic confirmation
    }
    setState("sent");
  }

  if (state === "sent") {
    return (
      <p className="text-xs text-muted-foreground mt-1">
        If we have a submission for that email, we&rsquo;ve sent the access link to your inbox. Open it to edit your
        existing submission instead of starting a new one.
      </p>
    );
  }
  return (
    <p className="text-xs text-muted-foreground mt-1">
      Already submitted before?{" "}
      <button
        type="button"
        onClick={onResend}
        disabled={!valid || state !== "idle"}
        className="underline disabled:no-underline disabled:opacity-60"
      >
        {state === "sending" ? "Sending…" : "Resend my access link →"}
      </button>
    </p>
  );
}

type FileFieldKey = "backtestMethodologyDoc" | "assumptionsDoc" | "tearSheet" | "tradeLogCsv" | "equityCurveCsv";

export interface StrategyEvaluationFormClientProps {
  /** When the page is opened with `?token=...` and the server resolves it to
   * a stored submission, the serialized payload arrives here so useState can
   * initialise with it on the very first render — no client-side fetch race. */
  initialData?: Record<string, unknown> | null;
  /** The raw token from the URL, regardless of whether `initialData` resolved.
   * Used to display the "Editing your earlier submission" banner / pass through
   * to refile submissions. */
  initialToken?: string | null;
}

export default function StrategyEvaluationFormClient({
  initialData = null,
  initialToken = null,
}: StrategyEvaluationFormClientProps = {}) {
  const [form, setForm] = React.useState<FormState>(() => {
    if (initialData) {
      try {
        const restored = deserializeState(initialData as unknown as SerializedFormState);
        if (!restored.draftSubmissionId) {
          restored.draftSubmissionId = `draft-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        }
        return restored;
      } catch {
        // fall through to INITIAL_STATE if the persisted shape is too far gone
      }
    }
    return INITIAL_STATE;
  });
  const [errors, setErrors] = React.useState<FieldError[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [submittedSubmissionId, setSubmittedSubmissionId] = React.useState<string | null>(null);
  const [submitError, setSubmitError] = React.useState(false);
  const [submitErrorDetail, setSubmitErrorDetail] = React.useState<string>("");
  const [uploadStatus, setUploadStatus] = React.useState<string>("");
  const [editingFromToken, setEditingFromToken] = React.useState<string | null>(initialToken);
  const [previousSubmissionId, setPreviousSubmissionId] = React.useState<string | null>(
    initialData && typeof (initialData as Record<string, unknown>).id === "string"
      ? ((initialData as Record<string, unknown>).id as string)
      : null,
  );
  const [prefillState, setPrefillState] = React.useState<"idle" | "loading" | "loaded" | "failed">(
    initialData ? "loaded" : initialToken ? "failed" : "idle",
  );
  const [currentStep, setCurrentStep] = React.useState<number>(1);
  const [draftSavedAt, setDraftSavedAt] = React.useState<number | null>(null);
  const [uploadErrors, setUploadErrors] = React.useState<Partial<Record<FileFieldKey, string>>>({});
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  // Files cached in-memory between pick and submit. Not serialised to
  // localStorage — abandoning a draft never produces orphan uploads.
  const pendingFilesRef = React.useRef<Map<FileFieldKey, File>>(new Map());

  const handleFileChange = React.useCallback((fieldKey: FileFieldKey, file: File | null) => {
    // Picking a new file (or removing) clears the prior upload error for that field
    setUploadErrors((prev) => {
      if (!(fieldKey in prev)) return prev;
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
    if (file) pendingFilesRef.current.set(fieldKey, file);
    else pendingFilesRef.current.delete(fieldKey);
  }, []);

  React.useEffect(() => {
    // Token-based prefill is now resolved server-side and arrives via
    // initialData props. Don't replay the fetch here, and don't read
    // localStorage when in editing-from-token mode (the server data wins).
    if (initialToken) {
      return;
    }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only
  }, []);

  React.useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState(form)));
        setDraftSavedAt(Date.now());
      } catch {
        // ignore storage errors
      }
      // Server-side draft mirror — only fires once an email is set so we have
      // a key. Stays fire-and-forget; localStorage is the authoritative cache,
      // server-side is for cross-device resume via the resend-link flow.
      const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
      if (emailValid && !submitted) {
        fetch("/api/strategy-evaluation/save-draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email, payload: serializeState(form) }),
          cache: "no-store",
        }).catch(() => {
          // non-critical
        });
      }
    }, 1500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [form, submitted]);

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
    return validateStrategyEvaluation(form).map((e) => ({ field: e.field, message: e.message }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (errs.length > 0) {
      // Wizard mode: jump to the step that holds the first failing field so the
      // inline error is actually on screen, then scroll to the field after the
      // step has rendered.
      const firstFieldName = errs[0].field;
      const targetStep = FIELD_TO_STEP[firstFieldName];
      if (targetStep && targetStep !== currentStep) {
        setCurrentStep(targetStep);
        // Defer scroll until React has flushed the new step's DOM.
        setTimeout(() => {
          const el = document.getElementById(firstFieldName);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 50);
      } else {
        const firstField = document.getElementById(firstFieldName);
        if (firstField) firstField.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    setSubmitting(true);
    setSubmitError(false);
    setSubmitErrorDetail("");
    try {
      // 1. Upload any in-memory Files to Firebase Storage (or record mock
      //    refs in local dev). We can't mutate `form` in place because
      //    setState is async — build a fresh snapshot.
      const { uploadStrategyEvalFile } = await import("@/lib/strategy-evaluation/upload");
      const uploadedRefs = new Map<FileFieldKey, UploadedFileRef>();
      const pending = Array.from(pendingFilesRef.current.entries());
      // Reset stale per-field upload errors at the start of each submit.
      setUploadErrors({});
      for (const [fieldKey, file] of pending) {
        setUploadStatus(`Uploading ${file.name}…`);
        try {
          const ref = await uploadStrategyEvalFile(file, form.draftSubmissionId, fieldKey);
          uploadedRefs.set(fieldKey, ref);
        } catch (uploadErr: unknown) {
          const msg =
            uploadErr instanceof Error
              ? uploadErr.message
              : typeof uploadErr === "string"
                ? uploadErr
                : "unknown upload error";
          // Surface the failure inline at the upload field (Step 5) so the
          // user can re-attach a different file without scrolling back from
          // the Submit button. Jump back to the evidence step too.
          setUploadErrors((prev) => ({ ...prev, [fieldKey]: msg }));
          setCurrentStep(5);
          window.scrollTo({ top: 0, behavior: "smooth" });
          throw new Error(`Upload of "${file.name}" failed: ${msg}`);
        }
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
      const enriched = previousSubmissionId ? { ...payload, parentSubmissionId: previousSubmissionId } : payload;
      const res = await fetch("/api/strategy-evaluation/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enriched),
        cache: "no-store",
      });
      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        throw new Error(`Server returned ${res.status}${errBody ? `: ${errBody.slice(0, 200)}` : ""}`);
      }
      // Server must have echoed a submissionId — otherwise Firestore silently
      // failed and the form would otherwise claim success on nothing.
      const responseBody = (await res.json().catch(() => ({}))) as { ok?: boolean; submissionId?: string };
      if (!responseBody.submissionId) {
        throw new Error("Server returned 200 but no submission ID: persistence likely failed. Please try again.");
      }
      localStorage.removeItem(STORAGE_KEY);
      pendingFilesRef.current.clear();
      // Funnel Coherence plan Workstream E5 — persist a catalogue seed
      // computed from the evaluation answers. The signed-in catalogue
      // and the demo/UAT walkthrough Reality view both hydrate from this
      // seed. Public flow does NOT redirect into /services/* — the
      // success state below stays on /strategy-evaluation.
      try {
        const seed = seedFiltersFromQuestionnaire({
          assetGroups: finalForm.assetGroups,
          instrumentTypes: finalForm.instrumentTypes,
          allocatorAllowedVenues: finalForm.allocatorAllowedVenues,
          allocatorLeverageCap: finalForm.allocatorLeverageCap,
        });
        persistSeed(seed);
      } catch (err) {
        console.error("[strategy-evaluation] persistSeed failed", err);
      }
      setSubmittedSubmissionId(responseBody.submissionId);
      setSubmitted(true);
    } catch (err: unknown) {
      const detail = err instanceof Error ? err.message : "unknown error";
      setSubmitError(true);
      setSubmitErrorDetail(detail);
      setUploadStatus("");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    // First-time submit: the email needs verification + the magic link from
    // the confirmation email is what unlocks the status page later.
    // Refile (editingFromToken or previousSubmissionId set): the email was
    // already verified on the original submission, so the second-time copy
    // skips the "confirm email" framing and just acknowledges the edit.
    const isRefile = Boolean(editingFromToken || previousSubmissionId);
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 md:px-6">
        <div className="rounded-xl border border-border bg-card p-8 space-y-4">
          <div className="text-center space-y-2">
            <Badge variant="outline">{isRefile ? "Updated" : "Received"}</Badge>
            <h1 className="text-2xl font-bold">
              {isRefile ? "Your evaluation has been updated." : "Thank you: your evaluation has been received."}
            </h1>
            <p className="text-muted-foreground">
              {isRefile ? (
                <>
                  Your edits to <span className="font-medium text-foreground">&lsquo;{form.strategyName}&rsquo;</span>{" "}
                  are filed alongside the original submission. We&rsquo;ll pick up the latest version on review.
                </>
              ) : (
                <>
                  Your evaluation of{" "}
                  <span className="font-medium text-foreground">&lsquo;{form.strategyName}&rsquo;</span> has been
                  received. We&apos;ll review it and be in touch within 3 business days.
                </>
              )}
            </p>
          </div>
          <div className="rounded-md border border-border/60 bg-card/40 px-4 py-3 text-sm space-y-1">
            {isRefile ? (
              <>
                <p className="font-medium">Your status page</p>
                <p className="text-muted-foreground">
                  Use the magic link in your original confirmation email to view or edit the submission again. It
                  remains valid: we don&rsquo;t re-send a new link on every edit.
                </p>
              </>
            ) : (
              <>
                <p className="font-medium">Check your inbox.</p>
                <p className="text-muted-foreground">
                  We&rsquo;ve sent a confirmation email to{" "}
                  <span className="font-medium text-foreground">{form.email}</span>. Click the link inside to confirm
                  your email and view a private status page where you can download your uploaded documents and refile if
                  anything needs to change.
                </p>
              </>
            )}
            {submittedSubmissionId && (
              <p className="text-xs text-muted-foreground pt-1">
                Submission ID: <code className="font-mono text-foreground/80">{submittedSubmissionId}</code>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Engagement-intent gate (Funnel Coherence plan Workstream A0).
  // Show the Path A vs Path B chooser as the very first surface a prospect
  // sees on /strategy-evaluation. If we already have prior data (refile via
  // ?token= or draft refile) we skip the gate — the user has already
  // committed to one branch.
  const hasPriorData = Boolean(
    initialData ||
    form.engagementIntent ||
    // Any builder-only field already populated → it's a builder draft, skip the gate.
    form.strategyName ||
    form.alphaTesis,
  );
  if (form.engagementIntent === "" && !hasPriorData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 md:px-6">
        <PreStepGate
          onPickAllocator={() => setForm((f) => ({ ...f, engagementIntent: "allocator" }))}
          onPickBuilder={() => setForm((f) => ({ ...f, engagementIntent: "builder" }))}
        />
      </div>
    );
  }

  // Path A — allocator wizard. Renders a separate, lighter intake (~4 steps,
  // 15 fields) and reuses handleSubmit for persistence. The submit payload
  // includes engagementIntent: "allocator" so the server can branch
  // validation + email template.
  if (form.engagementIntent === "allocator") {
    const allocatorForm: AllocatorFormState = {
      strategyName: form.strategyName,
      leadResearcher: form.leadResearcher,
      email: form.email,
      phone: form.phone,
      allocatorInvestorType: form.allocatorInvestorType,
      allocatorAumBand: form.allocatorAumBand,
      allocatorTargetSharpe: form.allocatorTargetSharpe,
      allocatorMaxDrawdown: form.allocatorMaxDrawdown,
      allocatorReturnHorizon: form.allocatorReturnHorizon,
      allocatorAllowedVenues: form.allocatorAllowedVenues,
      allocatorLeverageCap: form.allocatorLeverageCap,
      allocatorSmaFeesPreference: form.allocatorSmaFeesPreference,
      allocatorInstrumentRestrictions: form.allocatorInstrumentRestrictions,
      allocatorCapitalScalingTimeline: form.allocatorCapitalScalingTimeline,
      allocatorDeploymentPreference: form.allocatorDeploymentPreference,
      allocatorMandateMgmtInterest: form.allocatorMandateMgmtInterest,
      allocatorReportingCadence: form.allocatorReportingCadence,
      allocatorPreferredStructure: form.allocatorPreferredStructure,
      allocatorRegulatedStructureInterest: form.allocatorRegulatedStructureInterest,
    };
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 md:px-6">
        <AllocatorWizard
          form={allocatorForm}
          setField={(k, v) => setForm((f) => ({ ...f, [k]: v }))}
          submitting={submitting}
          submitted={submitted}
          submitError={submitError}
          validationErrors={errors}
          onSubmit={async () => {
            // Synthesize a form-event-like submit through the existing
            // pipeline so we get the same persistence + email behaviour.
            const fakeEvent = {
              preventDefault: () => {},
            } as unknown as React.FormEvent;
            await handleSubmit(fakeEvent);
          }}
          onSwitchToBuilder={() => setForm((f) => ({ ...f, engagementIntent: "builder" }))}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:px-6">
      <div className="mb-8">
        <Badge variant="outline" className="mb-3">
          Strategy Evaluation
        </Badge>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Strategy Evaluation</h1>
        <p className="mt-3 text-muted-foreground md:text-base">
          Help us understand what you want to run, allocate to, or structure. We use this to prepare the right review
          and walkthrough.{" "}
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, engagementIntent: "allocator" }))}
            className="underline hover:text-foreground"
          >
            I&rsquo;m an allocator evaluating Odum-managed strategies &rarr;
          </button>
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          You do not need final details yet. High-level answers are enough at this stage. Fields marked{" "}
          <span className="text-destructive">*</span> are required.
        </p>
      </div>

      {editingFromToken && prefillState === "loading" && (
        <div className="mb-6 rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          <p className="font-medium">Loading your earlier submission…</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Pulling your prior answers from our records. The form will populate in a second.
          </p>
        </div>
      )}
      {editingFromToken && prefillState === "loaded" && (
        <div className="mb-6 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm">
          <p className="font-medium text-emerald-200">Editing your earlier submission</p>
          <p className="mt-1 text-xs text-emerald-200/80">
            Your previous answers are loaded below. Make any changes and submit again: we&rsquo;ll file the new version
            alongside the original. Uploaded files carry over; re-attach a file to overwrite that slot.
          </p>
        </div>
      )}
      {editingFromToken && prefillState === "failed" && (
        <div className="mb-6 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
          <p className="font-medium text-destructive">Couldn&rsquo;t load your earlier submission</p>
          <p className="mt-1 text-xs text-destructive/90">
            The link may have expired. You can fill the form fresh and submit, or email{" "}
            <a href="mailto:info@odum-research.com" className="underline">
              info@odum-research.com
            </a>{" "}
            with the link from your email and we&rsquo;ll pick it up manually.
          </p>
        </div>
      )}

      {/* Wizard stepper — shows progress + lets the user jump back to any earlier step. */}
      <div className="mb-8">
        <div className="flex items-center gap-1 mb-3" aria-label="Form progress">
          {STEPS.map((step) => {
            const isActive = currentStep === step.n;
            const isDone = currentStep > step.n;
            return (
              <button
                key={step.n}
                type="button"
                onClick={() => setCurrentStep(step.n)}
                aria-current={isActive ? "step" : undefined}
                aria-label={`Step ${step.n}: ${step.title}`}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  isActive ? "bg-foreground" : isDone ? "bg-foreground/60" : "bg-border hover:bg-border/80"
                }`}
              />
            );
          })}
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm">
            <span className="text-muted-foreground">
              Step {currentStep} of {TOTAL_STEPS} ·{" "}
            </span>
            <span className="font-medium">{STEPS[currentStep - 1]?.title}</span>
            <span className="text-muted-foreground text-xs ml-2">(Sections {STEPS[currentStep - 1]?.sections})</span>
          </p>
          <p className="text-xs text-muted-foreground hidden sm:block">
            {draftSavedAt ? (
              <span className="text-emerald-500/80">Draft saved · stays in this browser</span>
            ) : (
              "Tap any bar above to jump"
            )}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-0">
        {/* === STEP 1 === */}
        {currentStep === 1 && (
          <>
            {/* Section A */}
            <section className="space-y-4 pt-0 first:border-t-0 first:pt-0">
              <SectionHeading letter="A" title="Submission details" />

              <div className="space-y-1">
                <Label htmlFor="strategyName" className="text-sm font-medium">
                  Strategy or project name
                  <RequiredMarker />
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
                  Main contact / strategy owner
                  <RequiredMarker />
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
                  Email
                  <RequiredMarker />
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  aria-invalid={!!getError("email")}
                />
                {getError("email") && <FieldError message={getError("email")!} />}
                {!editingFromToken && <ResendLinkRow email={form.email} />}
              </div>

              <div className="space-y-1">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone / Telegram / Signal
                </Label>
                <Input id="phone" value={form.phone} onChange={(e) => setField("phone", e.target.value)} />
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium">How did you hear about us?</Label>
                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-1">
                  {(
                    [
                      { value: "referral", label: "Personal referral / introduction" },
                      { value: "linkedin", label: "LinkedIn" },
                      { value: "x", label: "X / Twitter" },
                      { value: "search", label: "Google / search" },
                      { value: "event", label: "Industry event / conference" },
                      { value: "publication", label: "Newsletter / publication" },
                      { value: "existing", label: "Existing relationship with Odum" },
                      { value: "other", label: "Other" },
                    ] as { value: string; label: string }[]
                  ).map(({ value, label }) => (
                    <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="referralSource"
                        value={value}
                        checked={form.referralSource === value}
                        onChange={() => setField("referralSource", value)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                {(form.referralSource === "referral" ||
                  form.referralSource === "event" ||
                  form.referralSource === "publication" ||
                  form.referralSource === "other") && (
                  <Input
                    className="mt-2"
                    placeholder={
                      form.referralSource === "referral"
                        ? "Who introduced you?"
                        : form.referralSource === "event"
                          ? "Which event?"
                          : form.referralSource === "publication"
                            ? "Which publication?"
                            : "Tell us a bit more"
                    }
                    value={form.referralSourceNotes}
                    onChange={(e) => setField("referralSourceNotes", e.target.value)}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Where is the management entity based (or planned to be)?</Label>
                <p className="text-xs text-muted-foreground">
                  The firm / operating entity itself, not the fund vehicle. If the entity doesn&rsquo;t exist yet,
                  select the intended jurisdiction.
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-3 mt-2">
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
                      { value: "exploring", label: "Not yet incorporated: exploring" },
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
                {(form.entityLocation === "eu" || form.entityLocation === "us" || form.entityLocation === "other") && (
                  <Input
                    placeholder="e.g. Luxembourg or Delaware"
                    value={form.entityLocationNotes}
                    onChange={(e) => setField("entityLocationNotes", e.target.value)}
                  />
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium">Current or intended client-facing route</Label>
                <p className="text-xs text-muted-foreground">
                  Two main client-facing operating routes are available; engagements can also combine both. Pick the
                  closest match: the final operating model is agreed at the fit call.
                </p>
                <div className="flex flex-col gap-2 mt-2">
                  {(
                    [
                      {
                        value: "prop",
                        label: "Own capital",
                        blurb: "Trading the firm's own capital; no external investors.",
                      },
                      {
                        value: "sma",
                        label: "SMA route (UK / direct)",
                        blurb:
                          "Client-owned venue / broker / custodian accounts; Odum acts as investment manager where appointed under a direct mandate.",
                      },
                      {
                        value: "fund",
                        label: "Pooled Fund route (EU / affiliate-supported)",
                        blurb:
                          "Pooled fund or share-class structure operated by an approved affiliate; Odum acts as delegated trading manager or sub-adviser.",
                      },
                      {
                        value: "other",
                        label: "Not sure yet",
                        blurb: "Decide at the fit call once scope, jurisdiction, and permissions are clear.",
                      },
                    ] as { value: string; label: string; blurb: string }[]
                  ).map(({ value, label, blurb }) => (
                    <label
                      key={value}
                      className="flex items-start gap-2 text-sm cursor-pointer rounded border border-border/60 px-3 py-2"
                    >
                      <input
                        type="radio"
                        name="entityStructure"
                        value={value}
                        className="mt-1"
                        checked={form.entityStructure === value}
                        onChange={() => setField("entityStructure", value)}
                      />
                      <span className="flex flex-col gap-0.5">
                        <span className="font-medium">{label}</span>
                        <span className="text-xs text-muted-foreground">{blurb}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {form.entityStructure === "fund" && (
                <div className="space-y-2 rounded-md border border-border/60 bg-card/30 p-4">
                  <Label className="text-sm font-medium">Fund jurisdiction preference</Label>
                  <p className="text-xs text-muted-foreground">
                    The Pooled Fund route runs through an approved affiliate manager / AIFM / fund administrator
                    (typically EU / offshore). If you have a jurisdiction preference or constraint, indicate it here.
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
                          {
                            value: "build_first",
                            label:
                              "Build a live track record first (typically 12+ months), then stand up the fund / SMA mandate",
                          },
                          {
                            value: "launch_now",
                            label: "Launch the capital-raising structure immediately alongside live trading",
                          },
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
                    <div className="flex flex-wrap gap-x-6 gap-y-3">
                      {(
                        [
                          { value: "yes", label: "Yes: we'll fundraise independently" },
                          { value: "no", label: "No: capital is already committed" },
                          { value: "exploring", label: "Exploring: no decision yet" },
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

                  {(form.planToRaiseExternalCapital === "yes" || form.planToRaiseExternalCapital === "exploring") && (
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
                      Target minimum ticket size and any flexibility notes. Odum does not impose a fixed minimum: this
                      is a commercial conversation based on your LP mix.
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
          </>
        )}

        {/* === STEP 2 === */}
        {currentStep === 2 && (
          <>
            {/* Section B — single-select primary route. Replaces the previous
                Primary/Secondary/Tertiary hierarchy + legalistic understanding-
                checkboxes block. The 4 cards are plain-English; deep mechanics
                belong in the gated briefing or Strategy Review, not the intake.
                Picking the IM allocator card flips the wizard back to the
                allocator branch (matches the pre-step gate). The four primary
                routes are mutually exclusive; cross-cutting concerns (regulatory
                wrapper, Odum-provided signals, fund/SMA setup) live in the
                follow-up overlay group below. */}
            <section className="space-y-4 pt-0 first:pt-0">
              <SectionHeading letter="B" title="What are you trying to do?" />
              <p className="text-xs text-muted-foreground -mt-2">
                Choose the closest fit. You can add context later, and you can keep answers high-level: we use this to
                prepare the right review, not to make a final decision from the form alone.
              </p>
              {getError("commercialPath") && <FieldError message={getError("commercialPath")!} />}

              <div id="commercialPath" className="space-y-3">
                {(
                  [
                    {
                      value: "B" as const,
                      label: "Send signals into Odum",
                      description:
                        "We receive your trading instructions and provide execution, monitoring, reconciliation, and reporting.",
                    },
                    {
                      value: "A" as const,
                      label: "Run more of the strategy through DART",
                      description:
                        "You want research, testing, promotion, execution, and reporting in one controlled workflow.",
                    },
                    {
                      value: "C" as const,
                      label: "Use Odum’s regulated operating model",
                      description:
                        "You may need governance, reporting, permissions, SMA/fund structuring, or supervisory coverage.",
                    },
                  ] as {
                    value: "A" | "B" | "C";
                    label: string;
                    description: string;
                  }[]
                ).map(({ value, label, description }) => {
                  const isSelected = form.commercialPath === value;
                  return (
                    <button
                      type="button"
                      key={value}
                      onClick={() => {
                        setField("commercialPath", value);
                        // Clear residual secondary/tertiary from old hierarchy + auto-
                        // tick the educational checkboxes so we don't fail validation
                        // on a UX that no longer renders them.
                        setForm((prev) => ({
                          ...prev,
                          commercialPathSecondary: new Set(),
                          commercialPathTertiary: new Set(),
                          understandFit: true,
                          understandIncubation: true,
                          understandSignals: true,
                        }));
                      }}
                      className={`w-full rounded-lg border p-4 text-left transition-colors ${
                        isSelected
                          ? "border-foreground bg-foreground/5"
                          : "border-border/60 hover:border-border hover:bg-card/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium md:text-base">{label}</p>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground md:text-sm">{description}</p>
                        </div>
                        {isSelected && (
                          <span className="shrink-0 rounded bg-foreground px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-background">
                            Selected
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}

                {/* Allocator escape-hatch — read-only panel, NOT clickable.
                    Only the explicit "Switch to allocator intake" button at
                    the bottom flips engagementIntent. Stops a stray click on
                    a card-shaped surface from yanking the user out of the
                    8-step DDQ they're partway through. */}
                <div className="w-full rounded-lg border border-dashed border-border/60 bg-card/20 p-4 text-left">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium md:text-base">Evaluate Odum-managed strategies</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground md:text-sm">
                        You are allocating to selected strategies managed by Odum: this is the wrong form for you.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        engagementIntent: "allocator",
                        commercialPath: "",
                        commercialPathSecondary: new Set(),
                        commercialPathTertiary: new Set(),
                      }));
                    }}
                    className="mt-3 inline-flex items-center text-sm font-medium underline hover:text-foreground"
                  >
                    Switch to allocator intake &rarr;
                  </button>
                </div>
              </div>
            </section>

            {/* Engagement overlays — replaces the Primary/Secondary/Tertiary
                hierarchy with a single multi-select for cross-cutting concerns.
                Plain-English options; sets the engagementOverlays Set + (when
                applicable) flips regulatoryWrapperNeeded so legacy server logic
                that still reads that flag continues to work. */}
            <section className="space-y-3 pt-6">
              <SectionHeading letter="C" title="What else may be relevant?" />
              <p className="text-xs text-muted-foreground -mt-2">Optional. Tick anything that applies.</p>
              <div className="space-y-2">
                {(
                  [
                    { value: "execution-support", label: "Execution support" },
                    { value: "reporting-reconciliation", label: "Reporting and reconciliation" },
                    { value: "regulatory", label: "Regulatory or governance structure" },
                    { value: "treasury-venues", label: "Treasury / venue operations" },
                    { value: "research-backtesting", label: "Research and backtesting" },
                    { value: "not-sure", label: "Not sure yet" },
                  ] as { value: string; label: string }[]
                ).map(({ value, label }) => {
                  const checked = form.engagementOverlays.has(value);
                  return (
                    <label key={value} className="flex cursor-pointer items-start gap-2.5 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setForm((prev) => {
                            const next = new Set(prev.engagementOverlays);
                            if (checked) next.delete(value);
                            else next.add(value);
                            // Mirror "regulatory" overlay onto the legacy
                            // regulatoryWrapperNeeded flag so server-side
                            // logic that still reads that field continues to
                            // work without churn.
                            const regNow = next.has("regulatory");
                            return { ...prev, engagementOverlays: next, regulatoryWrapperNeeded: regNow };
                          });
                        }}
                        className="mt-0.5"
                      />
                      <span className="text-foreground/85">{label}</span>
                    </label>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {/* === STEP 3 === */}
        {currentStep === 3 && (
          <>
            {/* Section D */}
            <section className="space-y-4 pt-0 first:pt-0">
              <SectionHeading letter="D" title="Strategy profile" />
              <p className="text-xs text-muted-foreground -mt-2">
                These answers help us understand the markets, instruments, and style of the strategy so we can prepare
                the right review and walkthrough. High-level answers are fine: hover any term for a definition.
              </p>

              <div className="space-y-1">
                <Label className="text-sm font-medium">Asset groups</Label>
                <div className="flex flex-wrap gap-x-6 gap-y-3">
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
                <div className="flex flex-wrap gap-x-6 gap-y-3">
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
                  Primary <Term id="strategy-family">strategy family</Term>
                </Label>
                <div className="flex flex-wrap gap-x-6 gap-y-3">
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
                <div className="flex flex-wrap gap-x-6 gap-y-3">
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
                <Label className="text-sm font-medium">Holding period</Label>
                <p className="text-xs text-muted-foreground">How long does a typical position stay open?</p>
                <div className="flex flex-wrap gap-x-6 gap-y-3 mt-2">
                  {(
                    [
                      { value: "intraday", label: "Intraday: closes by session end" },
                      {
                        value: "stbt",
                        label: "Overnight: ~1 day",
                        hint: "a.k.a. STBT (sell-today-buy-tomorrow)",
                      },
                      { value: "positional", label: "Positional: multi-day to weeks" },
                      { value: "long_term", label: "Long-term: weeks to months" },
                      { value: "mixed", label: "Mixed / variable" },
                    ] as { value: string; label: string; hint?: string }[]
                  ).map(({ value, label, hint }) => (
                    <label key={value} className="flex items-start gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="holdingPeriod"
                        value={value}
                        checked={form.holdingPeriod === value}
                        onChange={() => setField("holdingPeriod", value)}
                        className="mt-0.5"
                      />
                      <span>
                        {label}
                        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium">How do you see this fitting into our system?</Label>
                <p className="text-xs text-muted-foreground">
                  Optional: share any context on your current tech stack, how standalone the strategy is, or what level
                  of integration you&rsquo;re expecting. Odum will map the taxonomy formally.
                </p>
                <Textarea
                  rows={3}
                  placeholder="e.g. fully standalone Python strategy, outputs a signals CSV daily; or embedded in existing execution infra and needs API bridging only."
                  value={form.pathwayDescription}
                  onChange={(e) => setField("pathwayDescription", e.target.value)}
                />
              </div>
            </section>
          </>
        )}

        {/* === STEP 4 === */}
        {currentStep === 4 && (
          <>
            {/* Section E — Evidence (simplified from "Backtest methodology") */}
            <section className="space-y-4 pt-0 first:pt-0">
              <SectionHeading letter="E" title="Evidence" />
              <p className="text-xs text-muted-foreground -mt-2">
                What evidence exists today that the strategy works? It&rsquo;s fine if there&rsquo;s very little:
                early-stage strategies are why we have a research environment. Be honest, not perfect.
              </p>

              <div className="space-y-2 rounded-md border border-border/60 bg-card/40 px-4 py-3">
                <Label className="text-sm font-medium">Has this strategy been backtested?</Label>
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                  {(
                    [
                      { value: "yes", label: "Yes: full backtest completed" },
                      { value: "partial", label: "Partial: early prototype / in progress" },
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
                    That&rsquo;s fine: skip the backtest-methodology, evidence, and performance sections. For DART Full,
                    Odum rebuilds the strategy including the backtest.
                  </p>
                )}
              </div>

              {form.hasBacktest !== "no" && form.hasBacktest !== "" && (
                <>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Data granularity</Label>
                    <p className="text-xs text-muted-foreground">
                      Select every granularity the backtest relies on. Strategies often use L2 for signal generation and
                      trades for fill simulation: pick all that apply.
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
                            hint: "Executed-print stream only: common for VWAP/TWAP algos and bar-generating systems",
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
                    <Textarea rows={3} value={form.dataGaps} onChange={(e) => setField("dataGaps", e.target.value)} />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Trigger methodology</Label>
                    <p className="text-xs text-muted-foreground">What prompts a decision to evaluate or trade?</p>
                    <div className="flex flex-col gap-2">
                      {(
                        [
                          {
                            value: "time_based",
                            label: "Time-based",
                            hint: "Periodic / scheduled evaluation (e.g. every minute, every bar close)",
                          },
                          {
                            value: "event_based",
                            label: "Event-based",
                            hint: "Reacts to specific market events (fills, regime shifts, news, on-chain events)",
                          },
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
                          {
                            value: "dependent",
                            label: "Position-dependent",
                            hint: "Each decision considers existing position, leverage, unrealised P&L",
                          },
                          {
                            value: "independent",
                            label: "Position-independent",
                            hint: "Each decision stands alone regardless of inventory (stateless signals)",
                          },
                          {
                            value: "hybrid",
                            label: "Hybrid",
                            hint: "Some decisions stateless, others depend on state (e.g. sizing)",
                          },
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
                          {
                            value: "limit_passive",
                            label: "Limit: passive (post on book)",
                            hint: "Join the queue; earn maker fees / spread",
                          },
                          {
                            value: "limit_aggressive",
                            label: "Limit: aggressive (crossing)",
                            hint: "Cross through the book at a limit price",
                          },
                          { value: "ioc_fok", label: "IOC / FOK", hint: "Immediate-or-Cancel / Fill-or-Kill" },
                          { value: "stop", label: "Stop / stop-limit", hint: "Triggered on price breach" },
                          { value: "post_only", label: "Post-only", hint: "Reject if would cross the spread" },
                          { value: "iceberg", label: "Iceberg / hidden", hint: "Size concealed from book" },
                          {
                            value: "algo",
                            label: "Algorithmic (TWAP / VWAP / POV)",
                            hint: "Slicing + pacing algorithms",
                          },
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
                          {
                            value: "always_fill",
                            label: "Always-fill at signal price",
                            hint: "Zero execution alpha baseline: fills at the price requested",
                          },
                          {
                            value: "spread_crossing",
                            label: "Spread crossing",
                            hint: "Pay the full bid-ask spread on every fill",
                          },
                          {
                            value: "book_matching",
                            label: "Book matching (L2 depth walk)",
                            hint: "Walk L2 depth; larger orders pay worse prices",
                          },
                          {
                            value: "queue_model",
                            label: "Queue-position model",
                            hint: "Simulates FIFO queue; maker fills depend on queue position at time of arrival",
                          },
                          {
                            value: "participation",
                            label: "Participation (% of volume)",
                            hint: "Fill rate capped as a fraction of observed venue volume",
                          },
                          {
                            value: "probabilistic",
                            label: "Probabilistic / venue-historical",
                            hint: "Fills drawn from a statistical model fitted to historical venue liquidity",
                          },
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
                          {
                            value: "maker_taker",
                            label: "Maker / taker fees",
                            hint: "Venue fee schedule; may include tier-based rebates",
                          },
                          {
                            value: "funding",
                            label: "Funding rates (perpetuals)",
                            hint: "Periodic funding paid / received on perpetual positions",
                          },
                          {
                            value: "borrow",
                            label: "Borrow / financing costs",
                            hint: "Short borrow fees, margin financing, leverage costs",
                          },
                          {
                            value: "gas",
                            label: "Gas / network fees (on-chain)",
                            hint: "EVM gas, priority fees, bridge costs",
                          },
                          {
                            value: "commissions",
                            label: "Commissions",
                            hint: "TradFi broker / prime commission schedules",
                          },
                          {
                            value: "slippage",
                            label: "Slippage model",
                            hint: "Explicit slippage charge per trade (separate from fill model)",
                          },
                          {
                            value: "spread",
                            label: "Spread cost",
                            hint: "Half-spread charged on every fill, regardless of order type",
                          },
                          {
                            value: "settlement",
                            label: "Settlement / clearing",
                            hint: "Exchange clearing, DvP settlement, T+N financing",
                          },
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
                    <Label className="text-sm font-medium">Average trades per day</Label>
                    <Input
                      placeholder="e.g. 50/day, ~3/week, or N/A"
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
          </>
        )}

        {/* === STEP 5 === */}
        {currentStep === 5 && (
          <>
            {form.hasBacktest === "no" && (
              <div className="rounded-md border border-border/60 bg-card/40 px-4 py-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">No backtest yet: nothing to file in this step.</p>
                <p className="mt-1 text-xs">
                  You marked &ldquo;Not yet backtested&rdquo; in the previous step. For DART Full, Odum rebuilds the
                  strategy including the backtest. Click <strong>Next</strong> to continue.
                </p>
              </div>
            )}
            {/* Section F — gated on backtest existing */}
            {form.hasBacktest !== "no" && form.hasBacktest !== "" && (
              <section className="space-y-4 pt-0 first:pt-0">
                <SectionHeading letter="F" title="Tear sheet, account statements, or other evidence" />
                <p className="text-xs text-muted-foreground -mt-2">
                  Attach the supporting documents. Files cache in your browser until you submit: you can view / download
                  them immediately to verify they&rsquo;re correct. Upload to Odum&rsquo;s regulated storage happens
                  when you press <strong>Submit evaluation</strong>. On localhost nothing is uploaded; filename and size
                  are recorded as a draft only.
                </p>

                {(
                  [
                    {
                      key: "backtestMethodologyDoc" as const,
                      label: "Backtest methodology document",
                      hint: "PDF, Word, or Markdown: describes how the backtest was run",
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
                      hint: "One row per trade or fill: at minimum timestamp, side, instrument, size, price",
                      accept: ".csv,.tsv,.parquet",
                    },
                    {
                      key: "equityCurveCsv" as const,
                      label: "Equity curve CSV",
                      hint: "Timestamp + account / strategy equity at that point: i.e. NAV: realised P&L plus unrealised P&L on open positions, marked-to-market. Daily granularity is fine; intraday welcome if you have it.",
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
                    errorMessage={uploadErrors[key] ?? null}
                  />
                ))}

                {(form.tradeLogCsv?.filename || form.equityCurveCsv?.filename) && (
                  <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm">
                    <p className="font-medium text-emerald-200">
                      We&rsquo;ll derive metrics + the day-flow narrative from your CSV.
                    </p>
                    <p className="mt-1 text-xs text-emerald-200/70">
                      You can skip the pipeline narrative below and the Key performance metrics section: we&rsquo;ll
                      compute Sharpe, drawdown, win rate etc. from the data you uploaded. The methodology / assumptions
                      / tear-sheet uploads above are still helpful but not required.
                    </p>
                  </div>
                )}

                {!(form.tradeLogCsv?.filename || form.equityCurveCsv?.filename) && (
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">One-day pipeline sample description</Label>
                    <p className="text-xs text-muted-foreground">
                      Narrative: how a single trading day flows end-to-end through the pipeline.
                    </p>
                    <Textarea
                      rows={3}
                      value={form.pipelineSample}
                      onChange={(e) => setField("pipelineSample", e.target.value)}
                    />
                  </div>
                )}
              </section>
            )}

            {/* Section G — gated on backtest existing AND no CSV uploaded (CSV → we derive these) */}
            {form.hasBacktest !== "no" &&
              form.hasBacktest !== "" &&
              !form.tradeLogCsv?.filename &&
              !form.equityCurveCsv?.filename && (
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
                    ] as {
                      key: keyof Pick<
                        FormState,
                        | "sharpeRatio"
                        | "calmarRatio"
                        | "maxDrawdown"
                        | "totalReturn"
                        | "winRate"
                        | "winningVsLosingDays"
                        | "avgTradeExpectancy"
                      >;
                      label: string;
                    }[]
                  ).map(({ key, label }) => (
                    <div key={key} className="space-y-1">
                      <Label className="text-sm font-medium">{label}</Label>
                      <Input value={form[key] as string} onChange={(e) => setField(key, e.target.value)} />
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
          </>
        )}

        {/* === STEP 6 === */}
        {currentStep === 6 && (
          <>
            {/* Section H — Risk and controls (was: Strategy documentation) */}
            <section className="space-y-4 pt-0 first:pt-0">
              <SectionHeading letter="H" title="Risk and controls" />
              <p className="text-xs text-muted-foreground -mt-2">
                Short answers are fine. Tick &ldquo;not sure yet&rdquo; below if you&rsquo;d rather walk it through with
                us on the call.
              </p>

              <div className="space-y-1">
                <Label className="text-sm font-medium">In plain English, how does the strategy work?</Label>
                <p className="text-xs text-muted-foreground">
                  A few sentences is usually enough. We&rsquo;re looking for the shape of the idea, not a full deck.
                </p>
                <Textarea
                  rows={4}
                  value={form.strategyOverview}
                  onChange={(e) => setField("strategyOverview", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium">Why does this strategy make money?</Label>
                <Textarea rows={3} value={form.alphaTesis} onChange={(e) => setField("alphaTesis", e.target.value)} />
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium">What inputs drive the decisions?</Label>
                <p className="text-xs text-muted-foreground">
                  E.g. price, volume, funding rates, on-chain data, alternative data, an ML model.
                </p>
                <Textarea
                  rows={3}
                  value={form.featureSetLogic}
                  onChange={(e) => setField("featureSetLogic", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium">When does the strategy tend to perform badly?</Label>
                <Textarea
                  rows={3}
                  value={form.knownWeaknesses}
                  onChange={(e) => setField("knownWeaknesses", e.target.value)}
                />
              </div>
            </section>

            {/* Section I — Position-level risk controls (simplified) */}
            <section className="space-y-4 pt-8 border-t border-border/40">
              <SectionHeading letter="I" title="Position and order controls" />

              <div className="space-y-1">
                <Label className="text-sm font-medium">Position sizing, leverage, and drawdown</Label>
                <p className="text-xs text-muted-foreground">
                  How big do positions get, what leverage do you allow, and what loss size triggers a pause?
                </p>
                <Textarea
                  rows={3}
                  value={form.riskManagement}
                  onChange={(e) => setField("riskManagement", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium">Order-level guardrails</Label>
                <p className="text-xs text-muted-foreground">
                  Things like max order size, venue exposure caps, fat-finger checks, or circuit-breakers.
                </p>
                <Textarea
                  rows={3}
                  placeholder="e.g. max single-order size = 1% NAV; venue exposure cap $200k; hard stop if open P&L < -3% in a session."
                  value={form.executionRiskControls}
                  onChange={(e) => setField("executionRiskControls", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium">How sensitive is the strategy to trading costs?</Label>
                <p className="text-xs text-muted-foreground">
                  Maker rebates required? Funding-rate ceiling? Gas tolerance? &ldquo;Not very&rdquo; is also a fine
                  answer.
                </p>
                <Textarea
                  rows={3}
                  placeholder="e.g. breaks even below 3bps per side; requires maker-only fills; funding cost must not exceed 0.01% per 8h."
                  value={form.feeSensitivity}
                  onChange={(e) => setField("feeSensitivity", e.target.value)}
                />
              </div>
            </section>

            {/* Section I² — Capital, collateral, and venue setup (was: Treasury and operational flows) */}
            <section className="space-y-4 pt-8 border-t border-border/40">
              <SectionHeading letter="I²" title="Capital, collateral, and venue setup" />

              <div className="space-y-1">
                <Label className="text-sm font-medium">
                  <Term id="treasury-management">Treasury management</Term> requirements
                </Label>
                <p className="text-xs text-muted-foreground">
                  Does the strategy require active management of idle capital across venues or chains? Stablecoin
                  sweeps, collateral optimisation, cross-venue transfer flows?
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
                  When capital moves between exchanges or chains for rebalancing, what controls apply? This shapes the
                  custody and operational-approval flow.
                </p>
                <div className="flex flex-col gap-2">
                  {(
                    [
                      { value: "whitelist", label: "Whitelisted addresses / destinations only" },
                      { value: "approval_required", label: "Operational approval required before each transfer" },
                      { value: "automated_limits", label: "Automated within pre-agreed size / frequency limits" },
                      { value: "na", label: "N/A: no cross-venue rebalancing expected" },
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
                  placeholder="Optional notes: e.g. withdrawal destinations, cold-wallet anchor, approver list, typical rebalance cadence."
                  value={form.rebalancingNotes}
                  onChange={(e) => setField("rebalancingNotes", e.target.value)}
                />
              </div>
            </section>
          </>
        )}

        {/* === STEP 7 === */}
        {currentStep === 7 && (
          <>
            {!form.commercialPath && (
              <div className="rounded-md border border-border/60 bg-card/40 px-4 py-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">No commercial path selected yet.</p>
                <p className="mt-1 text-xs">
                  Step back to{" "}
                  <button type="button" onClick={() => setCurrentStep(2)} className="underline">
                    Step 2: Path &amp; relationship
                  </button>{" "}
                  and pick a primary path so we can show the path-specific questions.
                </p>
              </div>
            )}
            {/* Section J — Path A only */}
            {form.commercialPath === "A" && (
              <section className="space-y-4 pt-0 first:pt-0">
                <SectionHeading letter="J" title="Running through DART: what we’d need" />

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
                <SectionHeading letter="K" title="Sending signals into Odum: how it would work" />

                <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-sm space-y-2 text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">
                      <Term id="dart-signals-in">DART Signals-In</Term>
                    </span>{" "}
                    is not a standard OMS. Beyond receiving and executing your signals, DART provides:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>
                      <Term id="execution-alpha">Execution alpha</Term>: smart order routing, latency optimisation,
                      passive/aggressive fill selection
                    </li>
                    <li>
                      Full <Term id="tca">TCA</Term> suite: slippage analysis, fill quality benchmarking, venue
                      comparison
                    </li>
                    <li>
                      <Term id="twap">TWAP</Term> / <Term id="vwap">VWAP</Term> and custom execution algorithms
                    </li>
                    <li>
                      <Term id="treasury-management">Treasury management</Term>: idle capital sweeps, cross-venue
                      collateral optimisation
                    </li>
                    <li>
                      Real-time and end-of-day <Term id="pnl">P&amp;L</Term>, position, and order-ledger views
                    </li>
                    <li>Post-trade analytics: regime attribution, drawdown decomposition, fee breakdown</li>
                  </ul>
                  <p className="text-xs">
                    The questions below help us understand how your signals arrive and what execution and analytics
                    surfaces will be most relevant to your use case.
                  </p>
                </div>

                <div className="rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
                  <p className="font-medium">DART Signals-In instruction schema</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Eight required fields per instruction (instrument, side, size, lifecycle markers, sub-client
                    identifier, etc.). Full field-by-field spec, lifecycle semantics, and venue/instrument compatibility
                    matrix:{" "}
                    <a
                      href="/briefings/dart-signals-in"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-medium"
                    >
                      /briefings/dart-signals-in →
                    </a>
                  </p>
                </div>

                <div className="space-y-1">
                  <Label className="text-sm font-medium">Signal format and delivery</Label>
                  <p className="text-xs text-muted-foreground">
                    Can your signals map into the eight-field schema linked above? Describe how signals are generated
                    and delivered: batch file, webhook push, REST pull, or other: and the expected latency from decision
                    to delivery.
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
                    Which DART surfaces are most important? Describe the expected execution style (passive/aggressive,
                    algorithmic, venue routing), and which post-trade or analytics views you need most.
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
                <SectionHeading letter="L" title="Regulated operating model: what needs evidencing" />

                <p className="text-sm text-muted-foreground">
                  The <Term id="regulatory-umbrella">Regulatory Umbrella</Term> is cross-cutting and does not prescribe
                  a specific API key or entity setup. The questions below help us understand the operational arrangement
                  so we can configure oversight and reporting appropriately.
                </p>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Who holds the API keys / faces the exchange?</Label>
                  <p className="text-xs text-muted-foreground">
                    This does not affect eligibility for regulatory coverage: it just determines the oversight model.
                  </p>
                  <div className="flex flex-col gap-2">
                    {(
                      [
                        { value: "client", label: "Client: we hold our own API keys and face the exchange directly" },
                        { value: "odum", label: "Odum: we prefer Odum to operate the keys and face the exchange" },
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
                    What data: positions, orders, trades, balances: does Odum need read access to in order to fulfil the
                    regulatory and reporting obligations?
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
                    Which reporting, position, P&amp;L, order-ledger, trade-ledger, or regulatory oversight views are
                    required from Odum&rsquo;s side?
                  </p>
                  <Textarea
                    rows={4}
                    value={form.pathCReportingViews}
                    onChange={(e) => setField("pathCReportingViews", e.target.value)}
                  />
                </div>
              </section>
            )}

            {/* Section L₂ — Path D / Odum Signals only */}
            {form.commercialPath === "D" && (
              <section className="space-y-4 pt-8 border-t border-border/40">
                <SectionHeading letter="L" title="Odum-provided signals: delivery shape" />

                <div className="rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
                  <p className="font-medium">Odum Signals payload schema</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    The Odum standard payload, delivery mechanics (webhook + REST pull), HMAC signing, idempotency keys,
                    and the light observability surface are documented in the deep-dive briefing:{" "}
                    <a
                      href="/briefings/signals-out"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-medium"
                    >
                      /briefings/signals-out →
                    </a>
                    . You can adopt the Odum standard as-is, or share your own schema and we&rsquo;ll map between them
                    on emission.
                  </p>
                </div>

                <div className="space-y-1">
                  <Label className="text-sm font-medium">Preferred delivery mechanism</Label>
                  <div className="flex flex-col gap-2 mt-1">
                    {(
                      [
                        {
                          value: "webhook",
                          label: "Webhook push",
                          hint: "Odum POSTs to your endpoint as soon as a signal fires; lowest latency",
                        },
                        {
                          value: "rest_pull",
                          label: "REST pull",
                          hint: "You poll an Odum endpoint on your cadence; simpler integration, slightly higher latency",
                        },
                        {
                          value: "batch_file",
                          label: "Batch file (S3 / SFTP / GCS)",
                          hint: "End-of-period file drops; use when sub-second latency isn't needed",
                        },
                        { value: "other", label: "Other (describe below)" },
                      ] as { value: string; label: string; hint?: string }[]
                    ).map(({ value, label, hint }) => (
                      <label key={value} className="flex items-start gap-2 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="pathDDeliveryMechanism"
                          value={value}
                          checked={form.pathDDeliveryMechanism === value}
                          onChange={() => setField("pathDDeliveryMechanism", value)}
                          className="mt-0.5"
                        />
                        <span>
                          {label}
                          {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
                        </span>
                      </label>
                    ))}
                  </div>
                  {(form.pathDDeliveryMechanism === "other" || form.pathDDeliveryMechanism === "batch_file") && (
                    <Input
                      className="mt-2"
                      placeholder={
                        form.pathDDeliveryMechanism === "batch_file"
                          ? "Drop location + cadence (e.g. s3://bucket/signals/, daily 17:00 UTC)"
                          : "Describe the delivery channel"
                      }
                      value={form.pathDDeliveryNotes}
                      onChange={(e) => setField("pathDDeliveryNotes", e.target.value)}
                    />
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-sm font-medium">Schema preference</Label>
                  <div className="flex flex-col gap-2 mt-1">
                    {(
                      [
                        {
                          value: "odum_standard",
                          label: "Use Odum's standard payload schema",
                          hint: "Field-by-field spec at /briefings/signals-out: simplest path",
                        },
                        {
                          value: "custom",
                          label: "Map to our own schema (we'll share it)",
                          hint: "Send us a sample / spec; Odum maps emissions to your shape",
                        },
                      ] as { value: string; label: string; hint?: string }[]
                    ).map(({ value, label, hint }) => (
                      <label key={value} className="flex items-start gap-2 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="pathDSchemaChoice"
                          value={value}
                          checked={form.pathDSchemaChoice === value}
                          onChange={() => setField("pathDSchemaChoice", value)}
                          className="mt-0.5"
                        />
                        <span>
                          {label}
                          {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
                        </span>
                      </label>
                    ))}
                  </div>
                  {form.pathDSchemaChoice === "custom" && (
                    <Textarea
                      className="mt-2"
                      rows={3}
                      placeholder="Describe your schema: required fields, instrument identifier convention, signed/unsigned, lifecycle markers, etc. We'll follow up to collect the full spec."
                      value={form.pathDSchemaNotes}
                      onChange={(e) => setField("pathDSchemaNotes", e.target.value)}
                    />
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-sm font-medium">Latency tolerance</Label>
                  <p className="text-xs text-muted-foreground">
                    How quickly do signals need to land with you after Odum&rsquo;s decision? Tight tolerances steer us
                    toward webhook delivery and dedicated infrastructure.
                  </p>
                  <Input
                    placeholder="e.g. <100ms, <1s, <5min, end-of-day"
                    value={form.pathDLatencyTolerance}
                    onChange={(e) => setField("pathDLatencyTolerance", e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-sm font-medium">Where will you execute these signals?</Label>
                  <p className="text-xs text-muted-foreground">
                    Your own venue accounts, an in-house OMS, a third-party execution provider, or a mix. Helpful
                    context for sizing recommendations and reconciliation expectations: we don&rsquo;t need account
                    details, just the operating shape.
                  </p>
                  <Textarea
                    rows={3}
                    placeholder="e.g. own Binance + Coinbase accounts; FIX into broker; in-house Python OMS routing to 3 venues."
                    value={form.pathDExecutionContext}
                    onChange={(e) => setField("pathDExecutionContext", e.target.value)}
                  />
                </div>
              </section>
            )}

            {/* Section M */}
            <section className="space-y-4 pt-8 border-t border-border/40">
              <SectionHeading letter="M" title="Current operating setup" />

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
          </>
        )}

        {/* === STEP 8 === */}
        {currentStep === 8 && (
          <>
            {/* Section N */}
            <section className="space-y-4 pt-0 first:pt-0">
              <SectionHeading letter="N" title="Paper trading: what you’ve done" />

              <div className="space-y-2 rounded-md border border-border/60 bg-card/40 px-4 py-3">
                <Label className="text-sm font-medium">Has this strategy been paper traded?</Label>
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                  {(
                    [
                      { value: "yes", label: "Yes: ran in a paper / shadow environment" },
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
                    Fine to skip: paper trading is validation, not a prerequisite. If you&rsquo;re going DART Full, Odum
                    runs the paper phase during incubation.
                  </p>
                )}
              </div>

              {form.hasPaperTraded === "yes" && (
                <>
                  <div className="flex flex-wrap gap-x-6 gap-y-3">
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
              <SectionHeading letter="O" title="Live trading: what you’ve done" />

              <div className="space-y-2 rounded-md border border-border/60 bg-card/40 px-4 py-3">
                <Label className="text-sm font-medium">Has this strategy been live traded?</Label>
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                  {(
                    [
                      { value: "yes", label: "Yes: traded with real capital" },
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
                    No live track record yet: that&rsquo;s expected for many submissions. DART Full includes the
                    live-tiny to live-allocated progression as part of incubation.
                  </p>
                )}
              </div>

              {form.hasLiveTraded === "yes" && (
                <>
                  <div className="flex flex-wrap gap-x-6 gap-y-3">
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
              <SectionHeading letter="P" title="What would need to be true to move forward with Odum?" />

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
          </>
        )}

        {/* Wizard navigation — Prev / Next / Submit */}
        <div className="pt-8 mt-8 border-t border-border/40">
          {errors.length > 0 && (
            <p className="text-destructive text-sm mb-4">
              Please fix the {errors.length} error{errors.length > 1 ? "s" : ""} before submitting.
            </p>
          )}
          {submitError && (
            <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <p className="font-medium">Submission failed: please try again.</p>
              {submitErrorDetail && <p className="mt-1 font-mono text-xs break-words">{submitErrorDetail}</p>}
              <p className="mt-1 text-xs">
                If the problem persists, email{" "}
                <a href="mailto:info@odum-research.com" className="underline">
                  info@odum-research.com
                </a>{" "}
                with your strategy name and we&rsquo;ll pick it up manually.
              </p>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={currentStep === 1 || submitting}
              onClick={() => {
                setCurrentStep((s) => Math.max(1, s - 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              ← Previous
            </Button>
            {currentStep < TOTAL_STEPS ? (
              <Button
                type="button"
                onClick={() => {
                  // Block forward navigation only for the early required-field steps
                  // (1 + 2). Later steps are best-effort — let the user move freely
                  // and surface any remaining gaps at final Submit.
                  if (currentStep === 1 || currentStep === 2) {
                    const allErrs = validate();
                    const stepErrs = allErrs.filter((e) => FIELD_TO_STEP[e.field] === currentStep);
                    if (stepErrs.length > 0) {
                      setErrors(allErrs);
                      const first = document.getElementById(stepErrs[0].field);
                      if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
                      return;
                    }
                  }
                  setCurrentStep((s) => Math.min(TOTAL_STEPS, s + 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Next →
              </Button>
            ) : (
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit evaluation"}
              </Button>
            )}
          </div>
          {uploadStatus && <p className="text-xs text-muted-foreground mt-3">{uploadStatus}</p>}
          <p className="text-xs text-muted-foreground text-center mt-4">
            This form is confidential. Odum Capital Ltd: FCA authorised · FRN 975797
          </p>
        </div>
      </form>
    </div>
  );
}
