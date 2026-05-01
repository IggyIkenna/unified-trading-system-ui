/**
 * Reusable QuestionnaireForm — 6 base axes + 7 optional Reg-Umbrella axes.
 *
 * Two mount points share this component:
 *   - `/questionnaire` standalone page.
 *   - `<BriefingAccessGate>` lock screen (Deep Dive routes) — the questionnaire
 *     IS the access path; submitting it auto-activates the briefing session and
 *     emails the prospect their code for return visits.
 *
 * On submit:
 *   - Writes to Firestore `/questionnaires` (or localStorage in dev mock mode).
 *   - Sets the briefing-session localStorage flag (`setBriefingSessionActive`).
 *   - Fires the `/api/questionnaire/email` endpoint with full payload.
 *   - Redirects to `returnPath` prop if supplied, then `?return=` URL param,
 *     then `/briefings`. Relative paths only (open-redirect guard).
 *
 * Reg-Umbrella branch: the 7 extra axes render only when
 * `service_family ∈ {RegUmbrella, combo}`.
 *
 * SSOT: lib/questionnaire/types.ts + UAC QuestionnaireResponse.
 */

"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { setBriefingSessionActive } from "@/lib/briefings/session";
import { persistSeed, seedFiltersFromQuestionnaire } from "@/lib/questionnaire/seed-catalogue-filters";
import type {
  QuestionnaireCategory,
  QuestionnaireEnvelope,
  QuestionnaireFundStructure,
  QuestionnaireInstrumentType,
  QuestionnaireLeveragePreference,
  QuestionnaireLicenceRegion,
  QuestionnaireMarketNeutrality,
  QuestionnaireResponse,
  QuestionnaireRiskProfile,
  QuestionnaireServiceFamily,
  QuestionnaireShareClassPreference,
  QuestionnaireStrategyStyle,
} from "@/lib/questionnaire/types";
import {
  QUESTIONNAIRE_CATEGORIES,
  QUESTIONNAIRE_INSTRUMENT_TYPES,
  QUESTIONNAIRE_LICENCE_REGIONS,
  QUESTIONNAIRE_SERVICE_FAMILIES,
  QUESTIONNAIRE_STRATEGY_STYLES,
} from "@/lib/questionnaire/types";
import { fingerprintAccessCode, submitQuestionnaire, type SubmitResult } from "@/lib/questionnaire/submit";
import { persistResolvedPersona, resolvePersonaFromQuestionnaire } from "@/lib/questionnaire/resolve-persona";
import { dispatchEmail } from "@/lib/email/client";
import type { EmailDispatchOutcome } from "@/lib/email/email-result";
import { EmailStatusBanner } from "@/components/email/email-status-banner";
import { Term } from "@/components/marketing/term";
import { STRUCTURE_OPTIONS, STRUCTURE_PROMPT } from "@/lib/marketing/structure-options";

const STRATEGY_STYLE_GLOSSARY: Record<string, string> = {
  ml_directional: "ml-directional",
  rules_directional: "rules-directional",
  carry: "carry-yield",
  arbitrage: "arbitrage",
  event_driven: "event-driven",
  stat_arb: "stat-arb",
};

const INSTRUMENT_TYPE_GLOSSARY: Record<string, string> = {
  perp: "perpetual",
};

const SERVICE_FAMILY_GLOSSARY: Record<string, string> = {
  DART: "dart",
  IM: "im",
};

const FUND_STRUCTURE_GLOSSARY: Record<string, string> = {
  SMA: "sma",
  Pooled: "pooled",
};

const COMMON_CURRENCIES: readonly string[] = [
  "USD",
  "EUR",
  "GBP",
  "CHF",
  "AUD",
  "CAD",
  "SGD",
  "JPY",
  "HKD",
  "AED",
] as const;

interface FormState {
  assetGroups: Set<QuestionnaireCategory>;
  instrument_types: Set<QuestionnaireInstrumentType>;
  venue_scope_mode: "all" | "explicit";
  venue_scope_csv: string;
  strategy_style: Set<QuestionnaireStrategyStyle>;
  service_family: QuestionnaireServiceFamily;
  fund_structure: Set<QuestionnaireFundStructure>;
  market_neutral: QuestionnaireMarketNeutrality | null;
  share_class_preferences: Set<QuestionnaireShareClassPreference>;
  risk_profile: QuestionnaireRiskProfile | null;
  target_sharpe_min_str: string;
  leverage_preference: QuestionnaireLeveragePreference | null;
  licence_region: QuestionnaireLicenceRegion | null;
  targets_3mo: string;
  targets_1yr: string;
  targets_2yr: string;
  own_mlro: "yes" | "no" | "unsure";
  entity_jurisdiction: string;
  supported_currencies: Set<string>;
  supported_currencies_other: string;
  email: string;
  firm_name: string;
  firm_location: string;
  firm_location_notes: string;
  referral_source: string;
  referral_source_notes: string;
}

function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return next;
}

function isRegUmbrellaPath(service_family: QuestionnaireServiceFamily): boolean {
  return service_family === "RegUmbrella" || service_family === "combo";
}

function buildResponse(state: FormState): QuestionnaireResponse {
  const venue_scope =
    state.venue_scope_mode === "all"
      ? ("all" as const)
      : state.venue_scope_csv
          .split(",")
          .map((v) => v.trim())
          .filter((v) => v.length > 0);

  const sharpeVal = parseFloat(state.target_sharpe_min_str);
  const strategyPrefs: Pick<
    QuestionnaireResponse,
    "market_neutral" | "share_class_preferences" | "risk_profile" | "target_sharpe_min" | "leverage_preference"
  > = {
    market_neutral: state.market_neutral,
    share_class_preferences: [...state.share_class_preferences],
    risk_profile: state.risk_profile,
    target_sharpe_min: isNaN(sharpeVal) ? null : sharpeVal,
    leverage_preference: state.leverage_preference,
  };

  // Wire-format key is `categories` (UAC + GCS path-segment SSOT — see
  // CLAUDE.md asset-group-vocabulary exception). FormState uses the new
  // `assetGroups` naming internally; map back to wire shape on submit.
  const base: QuestionnaireResponse = {
    categories: [...state.assetGroups],
    instrument_types: [...state.instrument_types],
    venue_scope,
    strategy_style: [...state.strategy_style],
    service_family: state.service_family,
    fund_structure: [...state.fund_structure],
    ...strategyPrefs,
  };

  if (!isRegUmbrellaPath(state.service_family)) {
    return base;
  }

  const currencies: readonly string[] = Array.from(
    new Set(
      [
        ...state.supported_currencies,
        ...state.supported_currencies_other
          .split(",")
          .map((v) => v.trim().toUpperCase())
          .filter((v) => v.length > 0),
      ]
        .slice()
        .sort(),
    ),
  );

  return {
    ...base,
    licence_region: state.licence_region,
    targets_3mo: state.targets_3mo.trim() || null,
    targets_1yr: state.targets_1yr.trim() || null,
    targets_2yr: state.targets_2yr.trim() || null,
    own_mlro: state.own_mlro === "yes" ? true : state.own_mlro === "no" ? false : null,
    entity_jurisdiction: state.entity_jurisdiction.trim() || null,
    supported_currencies: currencies,
  };
}

function readStoredAccessCode(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("odum-briefing-access-code");
}

interface QuestionnaireFormProps {
  /**
   * Override redirect destination on successful submit. When unset, falls
   * through to the `?return=` URL param, then `/briefings`. Pass explicitly
   * when embedding the form inside a gate that already knows the destination
   * (e.g. <BriefingAccessGate> on /briefings/[slug]).
   */
  returnPath?: string;
  /**
   * When true, hides the standalone-page header ("Tell us about your strategy")
   * and the optional Strategy-Evaluation-Pack footer card. Use when embedding
   * inside a host that supplies its own framing.
   */
  compact?: boolean;
}

export function QuestionnaireForm({ returnPath, compact = false }: QuestionnaireFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<FormState>({
    assetGroups: new Set<QuestionnaireCategory>(),
    instrument_types: new Set<QuestionnaireInstrumentType>(),
    venue_scope_mode: "all",
    venue_scope_csv: "",
    strategy_style: new Set<QuestionnaireStrategyStyle>(),
    service_family: "DART",
    fund_structure: new Set<QuestionnaireFundStructure>(),
    market_neutral: null,
    share_class_preferences: new Set<QuestionnaireShareClassPreference>(),
    risk_profile: null,
    target_sharpe_min_str: "",
    leverage_preference: null,
    licence_region: null,
    targets_3mo: "",
    targets_1yr: "",
    targets_2yr: "",
    own_mlro: "unsure",
    entity_jurisdiction: "",
    supported_currencies: new Set<string>(),
    supported_currencies_other: "",
    email: "",
    firm_name: "",
    firm_location: "",
    firm_location_notes: "",
    referral_source: "",
    referral_source_notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [emailOutcome, setEmailOutcome] = useState<EmailDispatchOutcome | null>(null);

  // Compute the URL-derived service family on every render — cheap (<10 entry
  // list) and avoids the React 19 react-hooks/set-state-in-effect warning that
  // fires when an effect synchronously calls setState.
  const urlServiceFamily = useMemo(() => {
    const raw = searchParams?.get("service");
    if (!raw) return null;
    return QUESTIONNAIRE_SERVICE_FAMILIES.find((sf) => sf === raw) ?? null;
  }, [searchParams]);

  // Tracks whether the user has explicitly picked a service family via the
  // radio. Once true, URL changes no longer clobber their choice. State
  // (not ref) so render-phase reads are React-19-strict-mode-safe.
  const [userPickedServiceFamily, setUserPickedServiceFamily] = useState(false);

  // URL is the source of truth for service_family until the user explicitly
  // picks a different family. We run the seed in render phase rather than
  // via useEffect to avoid React 19's set-state-in-effect lint warning;
  // the guard condition prevents an infinite re-render loop.
  if (urlServiceFamily && !userPickedServiceFamily && state.service_family !== urlServiceFamily) {
    setState((s) => ({ ...s, service_family: urlServiceFamily }));
  }

  const regUmbrellaVisible = useMemo(() => isRegUmbrellaPath(state.service_family), [state.service_family]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const response = buildResponse(state);

    const envelope: QuestionnaireEnvelope | null =
      state.email.trim() || state.firm_name.trim()
        ? {
            email: state.email.trim(),
            firm_name: state.firm_name.trim(),
            access_code_fingerprint: await fingerprintAccessCode(readStoredAccessCode() ?? ""),
          }
        : null;

    const outcome = await submitQuestionnaire(response, envelope);
    setResult(outcome);

    // Email is the gate that unlocks the briefings — the route is
    // intentionally fail-closed (returns ok=false on skip and on Resend
    // rejection) so a misconfigured deploy can't silently let everyone
    // in. We await the outcome here rather than fire-and-forget so the
    // unlock + redirect only happen on confirmed delivery.
    if (outcome.success) {
      const personaId = resolvePersonaFromQuestionnaire(response);
      persistResolvedPersona(personaId);
      const dispatchOutcome = await dispatchEmail("/api/questionnaire/email", {
        email: state.email.trim() || undefined,
        firmName: state.firm_name.trim() || undefined,
        firmLocation: state.firm_location || undefined,
        firmLocationNotes: state.firm_location_notes.trim() || undefined,
        referralSource: state.referral_source || undefined,
        referralSourceNotes: state.referral_source_notes.trim() || undefined,
        serviceFamily: state.service_family,
        submissionId: outcome.submissionId,
        assetGroups: [...state.assetGroups],
        instrumentTypes: [...state.instrument_types],
        venueScope:
          state.venue_scope_mode === "all"
            ? "all"
            : state.venue_scope_csv
                .split(",")
                .map((v) => v.trim())
                .filter((v) => v.length > 0),
        strategyStyle: [...state.strategy_style],
        fundStructure: [...state.fund_structure],
        marketNeutral: state.market_neutral,
        shareClassPreferences: [...state.share_class_preferences],
        riskProfile: state.risk_profile,
        targetSharpeMin: state.target_sharpe_min_str || undefined,
        leveragePreference: state.leverage_preference,
        licenceRegion: state.licence_region,
        targets3mo: state.targets_3mo.trim() || undefined,
        targets1yr: state.targets_1yr.trim() || undefined,
        targets2yr: state.targets_2yr.trim() || undefined,
        ownMlro: state.own_mlro,
        entityJurisdiction: state.entity_jurisdiction.trim() || undefined,
        supportedCurrencies: [
          ...state.supported_currencies,
          ...state.supported_currencies_other
            .split(",")
            .map((v) => v.trim().toUpperCase())
            .filter((v) => v.length > 0),
        ],
      });
      setEmailOutcome(dispatchOutcome);

      if (dispatchOutcome.status === "queued") {
        setBriefingSessionActive();
        const paramReturn = searchParams?.get("return");
        const safeParam =
          paramReturn && paramReturn.startsWith("/") && !paramReturn.startsWith("//") ? paramReturn : null;
        const target = returnPath ?? safeParam ?? "/briefings";
        setTimeout(() => router.push(target), 1200);
      }
    }
    setSubmitting(false);
    if (outcome.success) {
      setBriefingSessionActive();
      // Funnel Coherence plan Workstream E5 — compute the catalogue seed
      // from the prospect's answers and persist it (Firestore envelope is
      // already written by the API; the localStorage seed lets the demo/UAT
      // walkthrough and the post-signup catalogue hydrate without a fresh
      // round-trip). DO NOT redirect to /services/* — public users go to
      // /briefings.
      try {
        const sharpeVal = parseFloat(state.target_sharpe_min_str);
        const seed = seedFiltersFromQuestionnaire({
          categories: [...state.assetGroups],
          instrument_types: [...state.instrument_types],
          market_neutral: state.market_neutral,
          risk_profile: state.risk_profile,
          leverage_preference: state.leverage_preference,
          target_sharpe_min: Number.isFinite(sharpeVal) ? sharpeVal : null,
          share_class_preferences: [...state.share_class_preferences],
        });
        persistSeed(seed);
      } catch (err) {
        console.error("[questionnaire] persistSeed failed", err);
      }
      const paramReturn = searchParams?.get("return");
      const safeParam =
        paramReturn && paramReturn.startsWith("/") && !paramReturn.startsWith("//") ? paramReturn : null;
      const target = returnPath ?? safeParam ?? "/briefings";
      setTimeout(() => router.push(target), 1200);
    }
  };

  return (
    <div className={compact ? "" : "mx-auto max-w-2xl px-6 py-12"} data-testid="questionnaire-page">
      {!compact && (
        <>
          <h1 className="text-3xl font-semibold">Tell us about your strategy</h1>
          <p className="mt-2 text-slate-500">
            Invite-only questionnaire. Six quick questions (plus a Regulatory Umbrella branch if you need FCA cover) so
            we can pre-configure your path.
          </p>
        </>
      )}

      <div
        className={`${compact ? "mb-6" : "mt-6"} rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-200`}
      >
        <p className="font-medium">Complete this in one go.</p>
        <p className="mt-1 text-xs text-amber-300/80">
          About two minutes. This short questionnaire does not auto-save, so finish in this session. Submit to unlock
          your briefings access; we will email your code in case you come back later.
        </p>
      </div>

      <form onSubmit={onSubmit} className={compact ? "space-y-8" : "mt-8 space-y-8"} data-testid="questionnaire-form">
        <fieldset data-testid="axis-asset-groups">
          <legend className="font-medium">1. Which asset groups interest you?</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {QUESTIONNAIRE_CATEGORIES.map((cat) => (
              <label key={cat} className="inline-flex items-center gap-2 rounded border px-3 py-1">
                <input
                  type="checkbox"
                  name="asset_groups"
                  value={cat}
                  data-testid={`asset-group-${cat}`}
                  checked={state.assetGroups.has(cat)}
                  onChange={() => setState((s) => ({ ...s, assetGroups: toggleInSet(s.assetGroups, cat) }))}
                />
                <span>{cat}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset data-testid="axis-instrument-types">
          <legend className="font-medium">2. Which instrument types?</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {QUESTIONNAIRE_INSTRUMENT_TYPES.map((it) => (
              <label key={it} className="inline-flex items-center gap-2 rounded border px-3 py-1">
                <input
                  type="checkbox"
                  name="instrument_types"
                  value={it}
                  data-testid={`instrument-${it}`}
                  checked={state.instrument_types.has(it)}
                  onChange={() =>
                    setState((s) => ({
                      ...s,
                      instrument_types: toggleInSet(s.instrument_types, it),
                    }))
                  }
                />
                {INSTRUMENT_TYPE_GLOSSARY[it] ? (
                  <Term id={INSTRUMENT_TYPE_GLOSSARY[it]}>
                    <span>{it}</span>
                  </Term>
                ) : (
                  <span>{it}</span>
                )}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset data-testid="axis-venue-scope">
          <legend className="font-medium">3. Venue scope</legend>
          <div className="mt-2 space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="venue_scope_mode"
                value="all"
                data-testid="venue-scope-all"
                checked={state.venue_scope_mode === "all"}
                onChange={() => setState((s) => ({ ...s, venue_scope_mode: "all" }))}
              />
              <span>All venues</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="venue_scope_mode"
                value="explicit"
                data-testid="venue-scope-explicit"
                checked={state.venue_scope_mode === "explicit"}
                onChange={() => setState((s) => ({ ...s, venue_scope_mode: "explicit" }))}
              />
              <span>Specific venues (comma-separated IDs)</span>
            </label>
            {state.venue_scope_mode === "explicit" && (
              <input
                type="text"
                name="venue_scope_csv"
                data-testid="venue-scope-csv"
                className="mt-1 w-full rounded border px-3 py-2"
                placeholder="binance, uniswap_v3, cme"
                value={state.venue_scope_csv}
                onChange={(e) => setState((s) => ({ ...s, venue_scope_csv: e.target.value }))}
              />
            )}
          </div>
        </fieldset>

        <fieldset data-testid="axis-strategy-style">
          <legend className="font-medium">4. Strategy styles</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {QUESTIONNAIRE_STRATEGY_STYLES.map((style) => (
              <label key={style} className="inline-flex items-center gap-2 rounded border px-3 py-1">
                <input
                  type="checkbox"
                  name="strategy_style"
                  value={style}
                  data-testid={`strategy-${style}`}
                  checked={state.strategy_style.has(style)}
                  onChange={() => setState((s) => ({ ...s, strategy_style: toggleInSet(s.strategy_style, style) }))}
                />
                {STRATEGY_STYLE_GLOSSARY[style] ? (
                  <Term id={STRATEGY_STYLE_GLOSSARY[style]}>
                    <span>{style.replace(/_/g, " ")}</span>
                  </Term>
                ) : (
                  <span>{style.replace(/_/g, " ")}</span>
                )}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset data-testid="axis-service-family">
          <legend className="font-medium">5. Which service family fits?</legend>
          <div className="mt-2 space-y-1">
            {QUESTIONNAIRE_SERVICE_FAMILIES.map((sf) => (
              <label key={sf} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="service_family"
                  value={sf}
                  data-testid={`service-family-${sf}`}
                  checked={state.service_family === sf}
                  onChange={() => {
                    setUserPickedServiceFamily(true);
                    setState((s) => ({ ...s, service_family: sf }));
                  }}
                />
                {SERVICE_FAMILY_GLOSSARY[sf] ? (
                  <Term id={SERVICE_FAMILY_GLOSSARY[sf]}>
                    <span>{sf}</span>
                  </Term>
                ) : (
                  <span>{sf}</span>
                )}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset data-testid="axis-fund-structure">
          <legend className="font-medium">6. Client-facing operating route</legend>
          <p className="mt-1 text-xs text-muted-foreground">{STRUCTURE_PROMPT} Select all that apply.</p>
          <div className="mt-2 flex flex-col gap-2">
            {(
              [
                {
                  value: "SMA" as const,
                  label: `${STRUCTURE_OPTIONS["sma-direct"].label} (${STRUCTURE_OPTIONS["sma-direct"].tag})`,
                  blurb: STRUCTURE_OPTIONS["sma-direct"].blurb,
                },
                {
                  value: "Pooled" as const,
                  label: `${STRUCTURE_OPTIONS["pooled-fund-affiliate"].label} (${STRUCTURE_OPTIONS["pooled-fund-affiliate"].tag})`,
                  blurb: STRUCTURE_OPTIONS["pooled-fund-affiliate"].blurb,
                },
                {
                  value: "prop" as const,
                  label: "Prop (trading own capital)",
                  blurb: "No external investors; the engagement runs against the firm's own capital only.",
                },
                {
                  value: "NA" as const,
                  label: "Not sure yet / Other",
                  blurb: STRUCTURE_OPTIONS.unsure.blurb,
                },
              ] as const
            ).map(({ value, label, blurb }) => (
              <label key={value} className="flex items-start gap-2 rounded border border-border/60 px-3 py-2">
                <input
                  type="checkbox"
                  name="fund_structure"
                  value={value}
                  data-testid={`fund-structure-${value}`}
                  checked={state.fund_structure.has(value)}
                  onChange={() => setState((s) => ({ ...s, fund_structure: toggleInSet(s.fund_structure, value) }))}
                  className="mt-1"
                />
                <span className="flex flex-col gap-0.5">
                  {FUND_STRUCTURE_GLOSSARY[value] ? (
                    <Term id={FUND_STRUCTURE_GLOSSARY[value]}>
                      <span className="text-sm font-medium">{label}</span>
                    </Term>
                  ) : (
                    <span className="text-sm font-medium">{label}</span>
                  )}
                  <span className="text-xs text-muted-foreground">{blurb}</span>
                </span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Selecting both <em>SMA</em> and <em>Pooled Fund</em> indicates a combined UK + EU coverage shape, common
            where the mandate spans both jurisdictions. The final operating model is agreed at the fit call.
          </p>
        </fieldset>

        <section
          data-testid="strategy-preferences-section"
          className="rounded-lg border border-border/40 bg-card/20 p-5 space-y-6"
        >
          <header>
            <h2 className="text-lg font-semibold">
              Strategy preferences <span className="text-sm font-normal text-muted-foreground">(optional)</span>
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              These shape the strategy universe we show you. Skip any you&apos;re unsure of.
            </p>
          </header>

          <fieldset data-testid="axis-market-neutral">
            <legend className="font-medium">7. Market exposure</legend>
            <p className="mt-1 text-xs text-muted-foreground">
              Are you looking for market-neutral strategies, or comfortable with directional exposure?
            </p>
            <div className="mt-2 space-y-1">
              {(
                [
                  { value: "neutral", label: "Market neutral: carry, arb, stat arb (delta-hedged)" },
                  { value: "directional", label: "Directional: ML signals, trend, event-driven" },
                  { value: "both", label: "Both / No preference" },
                ] as const
              ).map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="market_neutral"
                    value={value}
                    data-testid={`market-neutral-${value}`}
                    checked={state.market_neutral === value}
                    onChange={() => setState((s) => ({ ...s, market_neutral: value as QuestionnaireMarketNeutrality }))}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset data-testid="axis-risk-profile">
            <legend className="font-medium">8. Risk appetite</legend>
            <div className="mt-2 space-y-1">
              {(
                [
                  { value: "low", label: "Low: capital preservation, stable yield (SUPPORTED strategies only)" },
                  { value: "medium", label: "Medium: balanced growth and protection" },
                  { value: "high", label: "High: growth-focused, higher volatility acceptable" },
                ] as const
              ).map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="risk_profile"
                    value={value}
                    data-testid={`risk-profile-${value}`}
                    checked={state.risk_profile === value}
                    onChange={() => setState((s) => ({ ...s, risk_profile: value as QuestionnaireRiskProfile }))}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset data-testid="axis-leverage-preference">
            <legend className="font-medium">9. Leverage preference</legend>
            <div className="mt-2 space-y-1">
              {(
                [
                  { value: "none", label: "None / Spot only (1x, no margin)" },
                  { value: "low", label: "Low (2-3x max)" },
                  { value: "medium", label: "Medium (~5x max)" },
                  { value: "any", label: "Any (unconstrained)" },
                ] as const
              ).map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="leverage_preference"
                    value={value}
                    data-testid={`leverage-${value}`}
                    checked={state.leverage_preference === value}
                    onChange={() =>
                      setState((s) => ({ ...s, leverage_preference: value as QuestionnaireLeveragePreference }))
                    }
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset data-testid="axis-share-class">
            <legend className="font-medium">10. Base currency preference</legend>
            <p className="mt-1 text-xs text-muted-foreground">
              Preferred denomination for strategy P&amp;L. Select all that apply: leave blank for no preference.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  { value: "usd_only" as const, label: "USD / Stablecoin (USDT, USDC, GBP, EUR)" },
                  { value: "btc_neutral" as const, label: "BTC-neutral" },
                  { value: "eth_neutral" as const, label: "ETH-neutral" },
                ] as const
              ).map(({ value, label }) => (
                <label key={value} className="inline-flex items-center gap-2 rounded border px-3 py-1">
                  <input
                    type="checkbox"
                    name="share_class_preferences"
                    value={value}
                    data-testid={`share-class-${value}`}
                    checked={state.share_class_preferences.has(value)}
                    onChange={() =>
                      setState((s) => ({
                        ...s,
                        share_class_preferences: toggleInSet(s.share_class_preferences, value),
                      }))
                    }
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset data-testid="axis-target-sharpe">
            <legend className="font-medium">
              11. Minimum Sharpe target <span className="font-normal text-muted-foreground text-sm">(optional)</span>
            </legend>
            <input
              type="number"
              name="target_sharpe_min"
              data-testid="target-sharpe-min"
              step="0.1"
              min="0"
              className="mt-2 w-40 rounded border px-3 py-2"
              placeholder="e.g. 1.5"
              value={state.target_sharpe_min_str}
              onChange={(e) => setState((s) => ({ ...s, target_sharpe_min_str: e.target.value }))}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Used for display annotation and ranking: not a hard filter.
            </p>
          </fieldset>
        </section>

        {regUmbrellaVisible && (
          <section
            data-testid="reg-umbrella-section"
            className="rounded-lg border border-dashed border-border/60 bg-card/30 p-5 space-y-6"
          >
            <header>
              <h2 className="text-lg font-semibold">Regulatory Umbrella details</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                These help us tailor the umbrella structure to your firm. Skip any you&apos;re unsure of: we&apos;ll
                follow up.
              </p>
            </header>

            <fieldset data-testid="axis-licence-region">
              <legend className="font-medium">7. Licence region preference</legend>
              <div className="mt-2 space-y-1">
                {QUESTIONNAIRE_LICENCE_REGIONS.map((lr) => (
                  <label key={lr} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="licence_region"
                      value={lr}
                      data-testid={`licence-region-${lr}`}
                      checked={state.licence_region === lr}
                      onChange={() => setState((s) => ({ ...s, licence_region: lr }))}
                    />
                    <span>{lr.replace(/_/g, " ")}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset data-testid="axis-entity-jurisdiction">
              <legend className="font-medium">8. Operating entity jurisdiction</legend>
              <input
                type="text"
                name="entity_jurisdiction"
                data-testid="entity-jurisdiction"
                className="mt-2 w-full rounded border px-3 py-2"
                placeholder="GB, IE, LU, JE, GG, Gibraltar …"
                value={state.entity_jurisdiction}
                onChange={(e) => setState((s) => ({ ...s, entity_jurisdiction: e.target.value }))}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                ISO-2 country code preferred; free text accepted for dependent territories or EEA sub-regions.
              </p>
            </fieldset>

            <fieldset data-testid="axis-supported-currencies">
              <legend className="font-medium">9. Operating currencies</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {COMMON_CURRENCIES.map((ccy) => (
                  <label key={ccy} className="inline-flex items-center gap-2 rounded border px-3 py-1">
                    <input
                      type="checkbox"
                      name="supported_currencies"
                      value={ccy}
                      data-testid={`currency-${ccy}`}
                      checked={state.supported_currencies.has(ccy)}
                      onChange={() =>
                        setState((s) => ({
                          ...s,
                          supported_currencies: toggleInSet(s.supported_currencies, ccy),
                        }))
                      }
                    />
                    <span>{ccy}</span>
                  </label>
                ))}
              </div>
              <input
                type="text"
                name="supported_currencies_other"
                data-testid="supported-currencies-other"
                className="mt-2 w-full rounded border px-3 py-2"
                placeholder="Other (comma-separated ISO-4217 codes): MXN, ZAR …"
                value={state.supported_currencies_other}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    supported_currencies_other: e.target.value,
                  }))
                }
              />
            </fieldset>

            <fieldset data-testid="axis-own-mlro">
              <legend className="font-medium">10. Will you supply your own MLRO?</legend>
              <div className="mt-2 space-y-1">
                {(
                  [
                    { value: "yes", label: "Yes: we have / will appoint our own MLRO" },
                    { value: "no", label: "No: we&apos;d like Odum&apos;s MLRO to cover us" },
                    { value: "unsure", label: "Not sure yet: discuss" },
                  ] as const
                ).map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="own_mlro"
                      value={value}
                      data-testid={`own-mlro-${value}`}
                      checked={state.own_mlro === value}
                      onChange={() => setState((s) => ({ ...s, own_mlro: value }))}
                    />
                    <span dangerouslySetInnerHTML={{ __html: label }} />
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset data-testid="axis-targets">
              <legend className="font-medium">11. Business targets (free text)</legend>
              <p className="mt-1 text-xs text-muted-foreground">
                AUM / revenue / headcount / licence-milestone: whatever best captures the plan. Blank entries are fine.
              </p>
              <label className="mt-3 block text-sm">
                First 3 months
                <textarea
                  name="targets_3mo"
                  data-testid="targets-3mo"
                  rows={2}
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={state.targets_3mo}
                  onChange={(e) => setState((s) => ({ ...s, targets_3mo: e.target.value }))}
                />
              </label>
              <label className="mt-3 block text-sm">
                End of year 1
                <textarea
                  name="targets_1yr"
                  data-testid="targets-1yr"
                  rows={2}
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={state.targets_1yr}
                  onChange={(e) => setState((s) => ({ ...s, targets_1yr: e.target.value }))}
                />
              </label>
              <label className="mt-3 block text-sm">
                End of year 2
                <textarea
                  name="targets_2yr"
                  data-testid="targets-2yr"
                  rows={2}
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={state.targets_2yr}
                  onChange={(e) => setState((s) => ({ ...s, targets_2yr: e.target.value }))}
                />
              </label>
            </fieldset>
          </section>
        )}

        <fieldset data-testid="axis-envelope">
          <legend className="font-medium">Who&apos;s this for?</legend>
          <p className="mt-1 text-xs text-slate-500">
            So we can tie your answers back to your organisation when we follow up.
          </p>
          <label className="mt-3 block text-sm">
            Work email
            <input
              type="email"
              name="email"
              data-testid="envelope-email"
              className="mt-1 w-full rounded border px-3 py-2"
              placeholder="you@firm.com"
              value={state.email}
              onChange={(e) => setState((s) => ({ ...s, email: e.target.value }))}
            />
          </label>
          <label className="mt-3 block text-sm">
            Firm name
            <input
              type="text"
              name="firm_name"
              data-testid="envelope-firm-name"
              className="mt-1 w-full rounded border px-3 py-2"
              placeholder="Acme Capital LLP"
              value={state.firm_name}
              onChange={(e) => setState((s) => ({ ...s, firm_name: e.target.value }))}
            />
          </label>
          <div className="mt-3 text-sm">
            <p className="font-medium">Where is the firm based (or planned to be)?</p>
            <p className="mt-1 text-xs text-muted-foreground">
              If the entity doesn&rsquo;t exist yet, pick the intended jurisdiction.
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
              {(
                [
                  { value: "uk", label: "UK" },
                  { value: "eu", label: "EU" },
                  { value: "us", label: "US" },
                  { value: "cayman", label: "Cayman" },
                  { value: "bvi", label: "BVI" },
                  { value: "singapore", label: "Singapore" },
                  { value: "hong_kong", label: "Hong Kong" },
                  { value: "switzerland", label: "Switzerland" },
                  { value: "uae", label: "UAE" },
                  { value: "other", label: "Other" },
                  { value: "exploring", label: "Exploring" },
                ] as { value: string; label: string }[]
              ).map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="firm_location"
                    value={value}
                    data-testid={`firm-location-${value}`}
                    checked={state.firm_location === value}
                    onChange={() => setState((s) => ({ ...s, firm_location: value }))}
                  />
                  {label}
                </label>
              ))}
            </div>
            {(state.firm_location === "eu" ||
              state.firm_location === "us" ||
              state.firm_location === "other" ||
              state.firm_location === "exploring") && (
              <input
                type="text"
                name="firm_location_notes"
                className="mt-2 w-full rounded border px-3 py-2"
                placeholder="e.g. Luxembourg / Delaware / planning UK FCA Q3"
                value={state.firm_location_notes}
                onChange={(e) => setState((s) => ({ ...s, firm_location_notes: e.target.value }))}
              />
            )}
          </div>
          <div className="mt-3 text-sm">
            <p className="font-medium">How did you hear about us?</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
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
                <label key={value} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="referral_source"
                    value={value}
                    checked={state.referral_source === value}
                    onChange={() => setState((s) => ({ ...s, referral_source: value }))}
                  />
                  {label}
                </label>
              ))}
            </div>
            {(state.referral_source === "referral" ||
              state.referral_source === "event" ||
              state.referral_source === "publication" ||
              state.referral_source === "other") && (
              <input
                type="text"
                name="referral_source_notes"
                className="mt-2 w-full rounded border px-3 py-2"
                placeholder={
                  state.referral_source === "referral"
                    ? "Who introduced you?"
                    : state.referral_source === "event"
                      ? "Which event?"
                      : state.referral_source === "publication"
                        ? "Which publication?"
                        : "Tell us a bit more"
                }
                value={state.referral_source_notes}
                onChange={(e) => setState((s) => ({ ...s, referral_source_notes: e.target.value }))}
              />
            )}
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={submitting}
            data-testid="questionnaire-submit"
            className="rounded bg-slate-900 px-6 py-2 font-medium text-white disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit"}
          </button>
          {result !== null && result.success && emailOutcome?.status === "queued" && (
            <span data-testid="questionnaire-success" className="text-green-700">
              Thanks: Deep Dive unlocked on this browser. You won&apos;t need to fill this in again here. We&apos;ve
              also emailed your access code (so you can return on a different device) and a link to book a 30-minute
              walk-through call. Redirecting…
            </span>
          )}
          {result !== null && !result.success && (
            <span data-testid="questionnaire-error" className="text-red-700">
              {result.error ?? "Submission failed"}
            </span>
          )}
        </div>
        {result !== null && result.success && emailOutcome !== null && emailOutcome.status !== "queued" && (
          <div data-testid="questionnaire-email-outcome">
            <EmailStatusBanner outcome={emailOutcome} />
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          By submitting, you agree we may store your responses to tailor your access and email you a code. We use no
          advertising trackers; small browser-storage flags remember your access on this device. See our{" "}
          <a href="/privacy" className="underline-offset-4 hover:underline">
            Privacy Policy
          </a>
          .
        </p>
      </form>

      {!compact && (
        <div className="mt-12 rounded-lg border border-border bg-card/50 p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Optional</p>
          <h2 className="mt-1 text-lg font-semibold">Strategy Evaluation Pack</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            If you have an existing strategy to submit for evaluation: incubation, signal integration, or regulatory
            coverage: the full DDQ covers backtest methodology, performance evidence, path-specific questions, and
            deployment readiness.
          </p>
          <a
            href="/strategy-evaluation"
            className="mt-4 inline-flex items-center gap-2 rounded border border-slate-900 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-900 hover:text-white transition-colors dark:border-border dark:text-foreground dark:hover:bg-muted"
          >
            Open Strategy Evaluation Pack →
          </a>
        </div>
      )}
    </div>
  );
}
