/**
 * Prospect questionnaire — 6 base axes + 7 optional Reg-Umbrella axes.
 *
 * This page is INTENTIONALLY UN-GATED — it's the path through which
 * visitors get a Deep Dive access code. The flow:
 *   1. Visitor clicks "Request access code" under Deep Dive in the nav.
 *   2. Lands here. Top of form has "Already have an access code? Enter it →"
 *      pointing to /briefings, which is gated via briefings/layout.tsx.
 *   3. Fills questionnaire → submit handler:
 *        a. Persists envelope + access-code fingerprint to Firestore.
 *        b. Calls setBriefingSessionActive() to unlock the briefings hub
 *           on this browser without re-typing the code (they just gave
 *           us their info; no need to re-gate).
 *        c. Resend emails the access code + Calendly link + next-steps.
 *   4. Different browser later? Use the emailed access code via /briefings.
 *
 * Reg-Umbrella branch: the 7 extra axes (licence region, 3mo/1yr/2yr targets,
 * own-MLRO, entity jurisdiction, supported currencies) render ONLY when
 * `service_family ∈ {RegUmbrella, combo}`. This keeps the form short for
 * DART / IM prospects.
 *
 * Reg-Umbrella branch: the 7 extra axes (licence region, 3mo/1yr/2yr targets,
 * own-MLRO, entity jurisdiction, supported currencies) render ONLY when
 * `service_family ∈ {RegUmbrella, combo}`. This keeps the form short for
 * DART / IM prospects.
 *
 * Submission sinks: localStorage in dev (VITE_MOCK_API=true or localhost);
 * Firestore `/questionnaires` collection in staging/prod. The envelope
 * (email + firm + access-code fingerprint) is persisted alongside the
 * response so `/admin/organizations/[id]` can join on email / firm name.
 *
 * SSOT: lib/questionnaire/types.ts + UAC QuestionnaireResponse.
 * Plan: unified-trading-pm/plans/active/reg_umbrella_questionnaire_and_onboarding_docs_2026_04_21.plan.md
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Link from "next/link";
import { setBriefingSessionActive } from "@/lib/briefings/session";
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
import { Term } from "@/components/marketing/term";

/**
 * Map of strategy_style enum values to glossary IDs (lib/glossary.ts).
 * Wraps the option label in <Term> so users get a hover-glossary explainer.
 * Falls through to the raw text label when no glossary entry exists.
 */
const STRATEGY_STYLE_GLOSSARY: Record<string, string> = {
  ml_directional: "ml-directional",
  rules_directional: "rules-directional",
  carry: "carry-yield",
  arbitrage: "arbitrage",
  event_driven: "event-driven",
  stat_arb: "stat-arb",
  // vol_trading + market_making + portfolio: glossary entries TBD; renders plain
};

/** Map of instrument_type enum values to glossary IDs. */
const INSTRUMENT_TYPE_GLOSSARY: Record<string, string> = {
  perp: "perpetual",
  // spot, lending, staking, lp, option, dated_future, event_settled — no glossary entries today
};

/** Map of service_family enum values to glossary IDs. */
const SERVICE_FAMILY_GLOSSARY: Record<string, string> = {
  DART: "dart",
  IM: "im",
};

/** Map of fund_structure enum values to glossary IDs. */
const FUND_STRUCTURE_GLOSSARY: Record<string, string> = {
  SMA: "sma",
  Pooled: "pooled",
};

/** Canonical 4217 short-list offered as checkboxes before "Other" fallback. */
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
  // Base axes
  categories: Set<QuestionnaireCategory>;
  instrument_types: Set<QuestionnaireInstrumentType>;
  venue_scope_mode: "all" | "explicit";
  venue_scope_csv: string;
  strategy_style: Set<QuestionnaireStrategyStyle>;
  service_family: QuestionnaireServiceFamily;
  fund_structure: Set<QuestionnaireFundStructure>;

  // Strategy-preference axes (optional for all service families)
  market_neutral: QuestionnaireMarketNeutrality | null;
  share_class_preferences: Set<QuestionnaireShareClassPreference>;
  risk_profile: QuestionnaireRiskProfile | null;
  target_sharpe_min_str: string;
  leverage_preference: QuestionnaireLeveragePreference | null;

  // Reg-Umbrella axes
  licence_region: QuestionnaireLicenceRegion | null;
  targets_3mo: string;
  targets_1yr: string;
  targets_2yr: string;
  own_mlro: "yes" | "no" | "unsure";
  entity_jurisdiction: string;
  supported_currencies: Set<string>;
  supported_currencies_other: string;

  // Envelope (captured when access-gate is live)
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

  const base: QuestionnaireResponse = {
    categories: [...state.categories],
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

  // Reg-Umbrella branch — only attach the extra axes when the prospect
  // picked RegUmbrella or combo. Empty values fall through as null /
  // empty tuple so Firestore doesn't get lots of "" noise.
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

export default function QuestionnairePage() {
  // Intentionally NOT wrapped in <BriefingAccessGate>: this page IS the
  // path to GET an access code. Visitors who already have a code follow
  // the "Already have an access code?" link inside the form to /briefings,
  // which has its own gate via app/(public)/briefings/layout.tsx.
  return <QuestionnaireForm />;
}

function QuestionnaireForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<FormState>({
    categories: new Set<QuestionnaireCategory>(),
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

  // Pre-select service_family from ?service= query param when the visitor
  // lands here via a briefing-specific CTA. Compute synchronously via useMemo
  // to avoid the react-hooks/set-state-in-effect warning; only seed when
  // state.service_family is the initial empty string so user overrides aren't
  // clobbered by re-runs.
  const urlServiceFamily = useMemo(() => {
    const raw = searchParams?.get("service");
    if (!raw) return null;
    return QUESTIONNAIRE_SERVICE_FAMILIES.find((sf) => sf === raw) ?? null;
  }, [searchParams]);
  useEffect(() => {
    if (urlServiceFamily && state.service_family === "") {
      setState((s) => ({ ...s, service_family: urlServiceFamily }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlServiceFamily]);

  const regUmbrellaVisible = useMemo(() => isRegUmbrellaPath(state.service_family), [state.service_family]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const response = buildResponse(state);

    // Build the envelope only when either identifier is provided.
    const envelope: QuestionnaireEnvelope | null =
      state.email.trim() || state.firm_name.trim()
        ? {
            email: state.email.trim(),
            firm_name: state.firm_name.trim(),
            access_code_fingerprint: await fingerprintAccessCode(readStoredAccessCode() ?? ""),
          }
        : null;

    const outcome = await submitQuestionnaire(response, envelope);
    if (outcome.success) {
      const personaId = resolvePersonaFromQuestionnaire(response);
      persistResolvedPersona(personaId);
      // Fire-and-forget: send full response email to user + BCC info@.
      // Server inlines every answer into both copies so the prospect sees
      // exactly what we received and we have a durable inbox record.
      fetch("/api/questionnaire/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: state.email.trim() || undefined,
          firmName: state.firm_name.trim() || undefined,
          firmLocation: state.firm_location || undefined,
          firmLocationNotes: state.firm_location_notes.trim() || undefined,
          referralSource: state.referral_source || undefined,
          referralSourceNotes: state.referral_source_notes.trim() || undefined,
          serviceFamily: state.service_family,
          submissionId: outcome.submissionId,
          categories: [...state.categories],
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
          // Reg-Umbrella-only axes — pass even when unset; server skips empty values
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
        }),
      }).catch(() => {
        /* non-critical */
      });
    }
    setResult(outcome);
    setSubmitting(false);
    if (outcome.success) {
      // The visitor just gave us their info — auto-unlock the briefings hub
      // on this browser without making them re-type the code we're about to
      // email. Same browser: straight into the Deep Dive briefings hub.
      // Different browser later: enter the emailed code at /briefings.
      //
      // We intentionally do NOT redirect to /services/strategy-catalogue here
      // — that's a signed-in platform surface gated by Firebase Auth, and
      // unlocking it is part of a later step in the onboarding flow (the
      // demo-access stage, post first call). Sending them there now would
      // bounce them to /login, which is a worse UX than landing them on the
      // briefings hub they just earned access to.
      //
      // The persona + filter envelope still gets persisted server-side so the
      // demo-onboarding step can pre-seed the catalogue when the user actually
      // gets sandbox access.
      try {
        setBriefingSessionActive();
      } catch {
        /* localStorage unavailable — they'll need to enter the code manually next time */
      }
      setTimeout(() => router.push("/briefings"), 1200);
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-6 py-12" data-testid="questionnaire-page">
      <div
        data-testid="questionnaire-have-code-affordance"
        className="mb-6 flex items-center justify-between rounded-md border border-border/60 bg-muted/30 px-4 py-3 text-sm"
      >
        <span className="text-muted-foreground">Already have a Deep Dive access code?</span>
        <Link
          href="/briefings"
          className="font-medium text-foreground underline-offset-4 hover:underline"
          data-testid="questionnaire-enter-code-link"
        >
          Enter it →
        </Link>
      </div>

      <h1 className="text-3xl font-semibold">Tell us about your strategy</h1>
      <p className="mt-2 text-slate-500">
        Six quick questions (plus a Regulatory Umbrella branch if you need FCA cover). Submit and we&apos;ll email you a
        Deep Dive access code + a calendar link to book a first call.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-8" data-testid="questionnaire-form">
        {/* 1. Categories */}
        <fieldset data-testid="axis-categories">
          <legend className="font-medium">1. Which asset-class categories interest you?</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {QUESTIONNAIRE_CATEGORIES.map((cat) => (
              <label key={cat} className="inline-flex items-center gap-2 rounded border px-3 py-1">
                <input
                  type="checkbox"
                  name="categories"
                  value={cat}
                  data-testid={`category-${cat}`}
                  checked={state.categories.has(cat)}
                  onChange={() => setState((s) => ({ ...s, categories: toggleInSet(s.categories, cat) }))}
                />
                <span>{cat}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* 2. Instrument types */}
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

        {/* 3. Venue scope */}
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

        {/* 4. Strategy style */}
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

        {/* 5. Service family */}
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
                  onChange={() => setState((s) => ({ ...s, service_family: sf }))}
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

        {/* 6. Fund structure */}
        <fieldset data-testid="axis-fund-structure">
          <legend className="font-medium">6. Fund structure</legend>
          <p className="mt-1 text-xs text-muted-foreground">Select all that apply.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(
              [
                { value: "SMA" as const, label: "SMA — Separately Managed Account" },
                { value: "Pooled" as const, label: "Pooled fund" },
                { value: "prop" as const, label: "Prop — trading own capital" },
                { value: "NA" as const, label: "Not yet decided / Other" },
              ] as const
            ).map(({ value, label }) => (
              <label key={value} className="inline-flex items-center gap-2 rounded border px-3 py-1">
                <input
                  type="checkbox"
                  name="fund_structure"
                  value={value}
                  data-testid={`fund-structure-${value}`}
                  checked={state.fund_structure.has(value)}
                  onChange={() => setState((s) => ({ ...s, fund_structure: toggleInSet(s.fund_structure, value) }))}
                />
                {FUND_STRUCTURE_GLOSSARY[value] ? (
                  <Term id={FUND_STRUCTURE_GLOSSARY[value]}>
                    <span>{label}</span>
                  </Term>
                ) : (
                  <span>{label}</span>
                )}
              </label>
            ))}
          </div>
        </fieldset>

        {/* ─── Strategy preferences (optional, all service families) ──── */}
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

          {/* Market neutrality */}
          <fieldset data-testid="axis-market-neutral">
            <legend className="font-medium">7. Market exposure</legend>
            <p className="mt-1 text-xs text-muted-foreground">
              Are you looking for market-neutral strategies, or comfortable with directional exposure?
            </p>
            <div className="mt-2 space-y-1">
              {(
                [
                  { value: "neutral", label: "Market neutral — carry, arb, stat arb (delta-hedged)" },
                  { value: "directional", label: "Directional — ML signals, trend, event-driven" },
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

          {/* Risk profile */}
          <fieldset data-testid="axis-risk-profile">
            <legend className="font-medium">8. Risk appetite</legend>
            <div className="mt-2 space-y-1">
              {(
                [
                  { value: "low", label: "Low — capital preservation, stable yield (SUPPORTED strategies only)" },
                  { value: "medium", label: "Medium — balanced growth and protection" },
                  { value: "high", label: "High — growth-focused, higher volatility acceptable" },
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

          {/* Leverage preference */}
          <fieldset data-testid="axis-leverage-preference">
            <legend className="font-medium">9. Leverage preference</legend>
            <div className="mt-2 space-y-1">
              {(
                [
                  { value: "none", label: "None / Spot only (1x, no margin)" },
                  { value: "low", label: "Low (2–3x max)" },
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

          {/* Share class preference */}
          <fieldset data-testid="axis-share-class">
            <legend className="font-medium">10. Base currency preference</legend>
            <p className="mt-1 text-xs text-muted-foreground">
              Preferred denomination for strategy P&amp;L. Select all that apply — leave blank for no preference.
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

          {/* Target Sharpe (optional free text) */}
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
              Used for display annotation and ranking — not a hard filter.
            </p>
          </fieldset>
        </section>

        {/* ─── Regulatory Umbrella branch ─────────────────────────────── */}
        {regUmbrellaVisible && (
          <section
            data-testid="reg-umbrella-section"
            className="rounded-lg border border-dashed border-border/60 bg-card/30 p-5 space-y-6"
          >
            <header>
              <h2 className="text-lg font-semibold">Regulatory Umbrella details</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                These help us tailor the umbrella structure to your firm. Skip any you&apos;re unsure of — we&apos;ll
                follow up.
              </p>
            </header>

            {/* 7. Licence region */}
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

            {/* 8. Entity jurisdiction */}
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

            {/* 9. Supported currencies */}
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

            {/* 10. Own MLRO */}
            <fieldset data-testid="axis-own-mlro">
              <legend className="font-medium">10. Will you supply your own MLRO?</legend>
              <div className="mt-2 space-y-1">
                {(
                  [
                    { value: "yes", label: "Yes — we have / will appoint our own MLRO" },
                    { value: "no", label: "No — we&apos;d like Odum&apos;s MLRO to cover us" },
                    { value: "unsure", label: "Not sure yet — discuss" },
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

            {/* 11-13. Targets */}
            <fieldset data-testid="axis-targets">
              <legend className="font-medium">11. Business targets (free text)</legend>
              <p className="mt-1 text-xs text-muted-foreground">
                AUM / revenue / headcount / licence-milestone — whatever best captures the plan. Blank entries are fine.
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

        {/* Envelope: we always ask; admin playback pivots off these. */}
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

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={submitting}
            data-testid="questionnaire-submit"
            className="rounded bg-slate-900 px-6 py-2 font-medium text-white disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit"}
          </button>
          {result !== null && result.success && (
            <span data-testid="questionnaire-success" className="text-green-700">
              Saved ({result.sink}) — redirecting…
            </span>
          )}
          {result !== null && !result.success && (
            <span data-testid="questionnaire-error" className="text-red-700">
              {result.error ?? "Submission failed"}
            </span>
          )}
        </div>
      </form>

      {/* Strategy Evaluation DDQ */}
      <div className="mt-12 rounded-lg border border-border bg-card/50 p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Optional</p>
        <h2 className="mt-1 text-lg font-semibold">Strategy Evaluation Pack</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          If you have an existing strategy to submit for evaluation — incubation, signal integration, or regulatory
          coverage — the full DDQ covers backtest methodology, performance evidence, path-specific questions, and
          deployment readiness.
        </p>
        <a
          href="/strategy-evaluation"
          className="mt-4 inline-flex items-center gap-2 rounded border border-slate-900 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-900 hover:text-white transition-colors dark:border-border dark:text-foreground dark:hover:bg-muted"
        >
          Open Strategy Evaluation Pack →
        </a>
      </div>
    </main>
  );
}

/**
 * Read the access code the prospect used to unlock the page. The
 * briefing-access-gate does NOT currently persist the plain code (only
 * an "unlocked" flag) — so this is a best-effort: any consumer that
 * stored the unsalted code under `odum-briefing-access-code` is
 * captured for the fingerprint. If absent, the fingerprint is empty and
 * the envelope still identifies the prospect by email + firm.
 */
function readStoredAccessCode(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("odum-briefing-access-code");
}
