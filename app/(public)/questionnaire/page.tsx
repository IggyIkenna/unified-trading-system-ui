/**
 * G1.10 — Prospect questionnaire public page.
 *
 * Unauthenticated. Walks the prospect through the 6 axes that drive the
 * G1.7 restriction-profile overlay. Submission sinks to localStorage
 * (dev) or Firestore `/questionnaires` (staging/prod). The admin
 * playback in user-management-ui reads from the same collection.
 *
 * Operator directive 2026-04-20: "user-management-api isn't needed — we
 * use Firebase auth; that's the API."
 *
 * SSOT: lib/questionnaire/types.ts + UAC QuestionnaireResponse.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type {
  QuestionnaireCategory,
  QuestionnaireFundStructure,
  QuestionnaireInstrumentType,
  QuestionnaireResponse,
  QuestionnaireServiceFamily,
  QuestionnaireStrategyStyle,
} from "@/lib/questionnaire/types";
import {
  QUESTIONNAIRE_CATEGORIES,
  QUESTIONNAIRE_FUND_STRUCTURES,
  QUESTIONNAIRE_INSTRUMENT_TYPES,
  QUESTIONNAIRE_SERVICE_FAMILIES,
  QUESTIONNAIRE_STRATEGY_STYLES,
} from "@/lib/questionnaire/types";
import { submitQuestionnaire, type SubmitResult } from "@/lib/questionnaire/submit";

interface FormState {
  categories: Set<QuestionnaireCategory>;
  instrument_types: Set<QuestionnaireInstrumentType>;
  venue_scope_mode: "all" | "explicit";
  venue_scope_csv: string;
  strategy_style: Set<QuestionnaireStrategyStyle>;
  service_family: QuestionnaireServiceFamily;
  fund_structure: QuestionnaireFundStructure;
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

function buildResponse(state: FormState): QuestionnaireResponse {
  const venue_scope =
    state.venue_scope_mode === "all"
      ? ("all" as const)
      : state.venue_scope_csv
          .split(",")
          .map((v) => v.trim())
          .filter((v) => v.length > 0);
  return {
    categories: [...state.categories],
    instrument_types: [...state.instrument_types],
    venue_scope,
    strategy_style: [...state.strategy_style],
    service_family: state.service_family,
    fund_structure: state.fund_structure,
  };
}

export default function QuestionnairePage() {
  const router = useRouter();
  const [state, setState] = useState<FormState>({
    categories: new Set<QuestionnaireCategory>(),
    instrument_types: new Set<QuestionnaireInstrumentType>(),
    venue_scope_mode: "all",
    venue_scope_csv: "",
    strategy_style: new Set<QuestionnaireStrategyStyle>(),
    service_family: "DART",
    fund_structure: "NA",
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const response = buildResponse(state);
    const outcome = await submitQuestionnaire(response);
    setResult(outcome);
    setSubmitting(false);
    if (outcome.success) {
      // Redirect to a thank-you state; downstream demo-provider will pick up
      // the profile on next navigation.
      setTimeout(() => router.push("/services"), 1200);
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-6 py-12" data-testid="questionnaire-page">
      <h1 className="text-3xl font-semibold">Tell us about your strategy</h1>
      <p className="mt-2 text-slate-500">
        Six quick questions so we can pre-configure your demo. No login required.
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
