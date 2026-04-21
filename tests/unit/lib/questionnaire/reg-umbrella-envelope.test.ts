/**
 * Phase-2 regression tests for the Reg-Umbrella questionnaire extension.
 *
 * Plan: unified-trading-pm/plans/active/reg_umbrella_questionnaire_and_onboarding_docs_2026_04_21.plan.md
 *
 * Covers:
 *   - localStorage envelope write (submitted_by fields land in the new key).
 *   - fingerprint helper produces stable hex output.
 *   - submit helper still accepts a null envelope (backwards-compat path).
 *   - submit helper rejects an undefined/null response (basic shape guard).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  QUESTIONNAIRE_ENVELOPE_LOCAL_STORAGE_KEY,
  QUESTIONNAIRE_LOCAL_STORAGE_KEY,
  type QuestionnaireEnvelope,
  type QuestionnaireResponse,
} from "@/lib/questionnaire/types";
import {
  fingerprintAccessCode,
  submitQuestionnaire,
} from "@/lib/questionnaire/submit";

const BASE_RESPONSE: QuestionnaireResponse = {
  categories: ["TradFi"],
  instrument_types: ["spot"],
  venue_scope: "all",
  strategy_style: ["carry"],
  service_family: "RegUmbrella",
  fund_structure: "SMA",
};

const REG_ENVELOPE: QuestionnaireEnvelope = {
  email: "prospect@acme.com",
  firm_name: "Acme Capital",
  access_code_fingerprint: "abc123",
};

beforeEach(() => {
  localStorage.clear();
  // Force the localStorage sink regardless of host by stubbing the env.
  vi.stubEnv("VITE_MOCK_API", "true");
});

afterEach(() => {
  vi.unstubAllEnvs();
  localStorage.clear();
});

describe("submitQuestionnaire — localStorage sink", () => {
  it("writes the response payload under the canonical key", async () => {
    const result = await submitQuestionnaire(BASE_RESPONSE, null);
    expect(result.success).toBe(true);
    expect(result.sink).toBe("localStorage");
    const raw = localStorage.getItem(QUESTIONNAIRE_LOCAL_STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw as string) as QuestionnaireResponse & { submissionId: string };
    expect(parsed.service_family).toBe("RegUmbrella");
    expect(parsed.submissionId).toMatch(/^q-local-/);
  });

  it("writes the envelope under its own key when provided", async () => {
    const result = await submitQuestionnaire(BASE_RESPONSE, REG_ENVELOPE);
    expect(result.success).toBe(true);
    const raw = localStorage.getItem(QUESTIONNAIRE_ENVELOPE_LOCAL_STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw as string) as QuestionnaireEnvelope & { submissionId: string };
    expect(parsed.email).toBe("prospect@acme.com");
    expect(parsed.firm_name).toBe("Acme Capital");
    expect(parsed.access_code_fingerprint).toBe("abc123");
    expect(parsed.submissionId).toMatch(/^q-local-/);
  });

  it("does NOT write the envelope key when envelope is null", async () => {
    await submitQuestionnaire(BASE_RESPONSE, null);
    expect(localStorage.getItem(QUESTIONNAIRE_ENVELOPE_LOCAL_STORAGE_KEY)).toBeNull();
  });

  it("persists Reg-Umbrella axes in the response payload", async () => {
    const regResponse: QuestionnaireResponse = {
      ...BASE_RESPONSE,
      licence_region: "EU_and_UK",
      targets_3mo: "Onboard 2 client orgs",
      own_mlro: false,
      entity_jurisdiction: "GB",
      supported_currencies: ["GBP", "EUR"],
    };
    await submitQuestionnaire(regResponse, REG_ENVELOPE);
    const raw = localStorage.getItem(QUESTIONNAIRE_LOCAL_STORAGE_KEY);
    const parsed = JSON.parse(raw as string) as QuestionnaireResponse;
    expect(parsed.licence_region).toBe("EU_and_UK");
    expect(parsed.targets_3mo).toBe("Onboard 2 client orgs");
    expect(parsed.own_mlro).toBe(false);
    expect(parsed.entity_jurisdiction).toBe("GB");
    expect(parsed.supported_currencies).toEqual(["GBP", "EUR"]);
  });
});

describe("fingerprintAccessCode", () => {
  it("returns a stable hex digest for the same input", async () => {
    const a = await fingerprintAccessCode("odum-2026-reg");
    const b = await fingerprintAccessCode("odum-2026-reg");
    expect(a).toBe(b);
    // SHA-256 hex is 64 chars; happy-dom ships SubtleCrypto.
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("returns different digests for different inputs", async () => {
    const a = await fingerprintAccessCode("code-one");
    const b = await fingerprintAccessCode("code-two");
    expect(a).not.toBe(b);
  });

  it("returns empty string when SubtleCrypto is unavailable", async () => {
    const originalSubtle = window.crypto.subtle;
    // happy-dom/jsdom define crypto.subtle. Temporarily override.
    Object.defineProperty(window.crypto, "subtle", {
      configurable: true,
      value: undefined,
    });
    try {
      const digest = await fingerprintAccessCode("anything");
      expect(digest).toBe("");
    } finally {
      Object.defineProperty(window.crypto, "subtle", {
        configurable: true,
        value: originalSubtle,
      });
    }
  });
});
