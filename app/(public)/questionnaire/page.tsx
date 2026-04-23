/**
 * Prospect questionnaire — 6 base axes + 7 optional Reg-Umbrella axes.
 *
 * Access-gate: wrapped in <BriefingAccessGate> so the page is only reachable
 * with an invite code (or when no access code is configured for this env).
 * The code fingerprint is attached to each submission so admins can pivot
 * from access-code → cohort.
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

import { BriefingAccessGate } from "@/components/briefings/briefing-access-gate";
import type {
  QuestionnaireCategory,
  QuestionnaireEnvelope,
  QuestionnaireFundStructure,
  QuestionnaireInstrumentType,
  QuestionnaireLicenceRegion,
  QuestionnaireResponse,
  QuestionnaireServiceFamily,
  QuestionnaireStrategyStyle,
} from "@/lib/questionnaire/types";
import {
  QUESTIONNAIRE_CATEGORIES,
  QUESTIONNAIRE_FUND_STRUCTURES,
  QUESTIONNAIRE_INSTRUMENT_TYPES,
  QUESTIONNAIRE_LICENCE_REGIONS,
  QUESTIONNAIRE_SERVICE_FAMILIES,
  QUESTIONNAIRE_STRATEGY_STYLES,
} from "@/lib/questionnaire/types";
import {
  fingerprintAccessCode,
  submitQuestionnaire,
  type SubmitResult,
} from "@/lib/questionnaire/submit";
import {
  persistResolvedPersona,
  resolvePersonaFromQuestionnaire,
} from "@/lib/questionnaire/resolve-persona";

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
  fund_structure: QuestionnaireFundStructure;

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

  const base: QuestionnaireResponse = {
    categories: [...state.categories],
    instrument_types: [...state.instrument_types],
    venue_scope,
    strategy_style: [...state.strategy_style],
    service_family: state.service_family,
    fund_structure: state.fund_structure,
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
      ].slice().sort(),
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
  return (
    <BriefingAccessGate>
      <QuestionnaireForm />
    </BriefingAccessGate>
  );
}

export function QuestionnaireForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<FormState>({
    categories: new Set<QuestionnaireCategory>(),
    instrument_types: new Set<QuestionnaireInstrumentType>(),
    venue_scope_mode: "all",
    venue_scope_csv: "",
    strategy_style: new Set<QuestionnaireStrategyStyle>(),
    service_family: "DART",
    fund_structure: "NA",
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
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  // Pre-select service_family from ?service= query param when the visitor
  // lands here via a briefing-specific CTA. Runs once on mount.
  useEffect(() => {
    const raw = searchParams?.get("service");
    if (!raw) return;
    const match = QUESTIONNAIRE_SERVICE_FAMILIES.find((sf) => sf === raw);
    if (match) {
      setState((s) => ({ ...s, service_family: match }));
    }
  }, [searchParams]);

  const regUmbrellaVisible = useMemo(
    () => isRegUmbrellaPath(state.service_family),
    [state.service_family],
  );

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
            access_code_fingerprint: await fingerprintAccessCode(
              readStoredAccessCode() ?? "",
            ),
          }
        : null;

    const outcome = await submitQuestionnaire(response, envelope);
    if (outcome.success) {
      const personaId = resolvePersonaFromQuestionnaire(response);
      persistResolvedPersona(personaId);
      // Fire-and-forget: email ack + internal notify
      fetch("/api/questionnaire/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: state.email.trim() || undefined,
          firmName: state.firm_name.trim() || undefined,
          serviceFamily: state.service_family,
          submissionId: outcome.submissionId,
          categories: [...state.categories],
          fundStructure: state.fund_structure,
        }),
      }).catch(() => {/* non-critical */});
    }
    setResult(outcome);
    setSubmitting(false);
    if (outcome.success) {
      setTimeout(() => router.push("/services"), 1200);
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-6 py-12" data-testid="questionnaire-page">
      <h1 className="text-3xl font-semibold">Tell us about your strategy</h1>
      <p className="mt-2 text-slate-500">
        Invite-only questionnaire. Six quick questions (plus a Regulatory Umbrella
        branch if you need FCA cover) so we can pre-configure your path.
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
                  onChange={() =>
                    setState((s) => ({ ...s, categories: toggleInSet(s.categories, cat) }))
                  }
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
                <span>{it}</span>
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
              <label
                key={style}
                className="inline-flex items-center gap-2 rounded border px-3 py-1"
              >
                <input
                  type="checkbox"
                  name="strategy_style"
                  value={style}
                  data-testid={`strategy-${style}`}
                  checked={state.strategy_style.has(style)}
                  onChange={() =>
                    setState((s) => ({ ...s, strategy_style: toggleInSet(s.strategy_style, style) }))
                  }
                />
                <span>{style.replace(/_/g, " ")}</span>
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
                <span>{sf}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* 6. Fund structure */}
        <fieldset data-testid="axis-fund-structure">
          <legend className="font-medium">6. Fund structure</legend>
          <div className="mt-2 space-y-1">
            {QUESTIONNAIRE_FUND_STRUCTURES.map((fs) => (
              <label key={fs} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="fund_structure"
                  value={fs}
                  data-testid={`fund-structure-${fs}`}
                  checked={state.fund_structure === fs}
                  onChange={() => setState((s) => ({ ...s, fund_structure: fs }))}
                />
                <span>{fs}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* ─── Regulatory Umbrella branch ─────────────────────────────── */}
        {regUmbrellaVisible && (
          <section
            data-testid="reg-umbrella-section"
            className="rounded-lg border border-dashed border-border/60 bg-card/30 p-5 space-y-6"
          >
            <header>
              <h2 className="text-lg font-semibold">Regulatory Umbrella details</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                These help us tailor the umbrella structure to your firm. Skip any
                you&apos;re unsure of — we&apos;ll follow up.
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
                onChange={(e) =>
                  setState((s) => ({ ...s, entity_jurisdiction: e.target.value }))
                }
              />
              <p className="mt-1 text-xs text-muted-foreground">
                ISO-2 country code preferred; free text accepted for dependent
                territories or EEA sub-regions.
              </p>
            </fieldset>

            {/* 9. Supported currencies */}
            <fieldset data-testid="axis-supported-currencies">
              <legend className="font-medium">9. Operating currencies</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {COMMON_CURRENCIES.map((ccy) => (
                  <label
                    key={ccy}
                    className="inline-flex items-center gap-2 rounded border px-3 py-1"
                  >
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
              <legend className="font-medium">
                11. Business targets (free text)
              </legend>
              <p className="mt-1 text-xs text-muted-foreground">
                AUM / revenue / headcount / licence-milestone — whatever best
                captures the plan. Blank entries are fine.
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
            So we can tie your answers back to your organisation when we follow
            up.
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
