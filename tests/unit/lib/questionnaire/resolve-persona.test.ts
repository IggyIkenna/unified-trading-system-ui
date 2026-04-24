import { beforeEach, describe, expect, it } from "vitest";

import {
  RESOLVED_PERSONA_STORAGE_KEY,
  RESOLVED_PERSONA_TO_AUTH_ID,
  clearResolvedPersona,
  persistResolvedPersona,
  readResolvedPersona,
  resolvePersonaFromQuestionnaire,
} from "@/lib/questionnaire/resolve-persona";
import type { QuestionnaireResponse } from "@/lib/questionnaire/types";

function build(
  overrides: Partial<QuestionnaireResponse> = {},
): QuestionnaireResponse {
  return {
    categories: [],
    instrument_types: [],
    venue_scope: "all",
    strategy_style: [],
    service_family: "DART",
    fund_structure: [],
    ...overrides,
  };
}

describe("resolvePersonaFromQuestionnaire", () => {
  it("DART + research-style answer -> prospect-dart", () => {
    const res = build({
      service_family: "DART",
      strategy_style: ["ml_directional"],
    });
    expect(resolvePersonaFromQuestionnaire(res)).toBe("prospect-dart");
  });

  it("DART + pure execution-only styles -> prospect-signals-only", () => {
    const res = build({
      service_family: "DART",
      strategy_style: ["carry", "arbitrage"],
    });
    expect(resolvePersonaFromQuestionnaire(res)).toBe("prospect-signals-only");
  });

  it("DART with empty strategy_style -> prospect-dart (vague base)", () => {
    const res = build({ service_family: "DART", strategy_style: [] });
    expect(resolvePersonaFromQuestionnaire(res)).toBe("prospect-dart");
  });

  it("IM + SMA -> prospect-im-sma", () => {
    const res = build({ service_family: "IM", fund_structure: ["SMA"] });
    expect(resolvePersonaFromQuestionnaire(res)).toBe("prospect-im-sma");
  });

  it("IM + SMA + prop (multi) -> prospect-im-sma (SMA wins)", () => {
    const res = build({ service_family: "IM", fund_structure: ["SMA", "prop"] });
    expect(resolvePersonaFromQuestionnaire(res)).toBe("prospect-im-sma");
  });

  it("IM + Pooled -> prospect-im-pooled", () => {
    const res = build({ service_family: "IM", fund_structure: ["Pooled"] });
    expect(resolvePersonaFromQuestionnaire(res)).toBe("prospect-im-pooled");
  });

  it("IM + prop -> prospect-im-pooled (prop maps to pooled shape)", () => {
    const res = build({ service_family: "IM", fund_structure: ["prop"] });
    expect(resolvePersonaFromQuestionnaire(res)).toBe("prospect-im-pooled");
  });

  it("IM + empty fund_structure -> prospect-im-pooled (default)", () => {
    const res = build({ service_family: "IM", fund_structure: [] });
    expect(resolvePersonaFromQuestionnaire(res)).toBe("prospect-im-pooled");
  });

  it("RegUmbrella -> prospect-regulatory", () => {
    const res = build({ service_family: "RegUmbrella" });
    expect(resolvePersonaFromQuestionnaire(res)).toBe("prospect-regulatory");
  });

  it("combo -> prospect-dart (broadest)", () => {
    const res = build({ service_family: "combo" });
    expect(resolvePersonaFromQuestionnaire(res)).toBe("prospect-dart");
  });
});

describe("persistResolvedPersona / readResolvedPersona", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("round-trips through localStorage under RESOLVED_PERSONA_STORAGE_KEY", () => {
    persistResolvedPersona("prospect-regulatory");
    expect(window.localStorage.getItem(RESOLVED_PERSONA_STORAGE_KEY)).toBe(
      "prospect-regulatory",
    );
    expect(readResolvedPersona()).toBe("prospect-regulatory");
  });

  it("readResolvedPersona returns null for unknown persona", () => {
    window.localStorage.setItem(RESOLVED_PERSONA_STORAGE_KEY, "bogus-persona");
    expect(readResolvedPersona()).toBeNull();
  });

  it("clearResolvedPersona removes the stored key", () => {
    persistResolvedPersona("prospect-dart");
    clearResolvedPersona();
    expect(window.localStorage.getItem(RESOLVED_PERSONA_STORAGE_KEY)).toBeNull();
  });
});

describe("RESOLVED_PERSONA_TO_AUTH_ID mapping", () => {
  it("every resolved persona maps to a known auth id", () => {
    expect(RESOLVED_PERSONA_TO_AUTH_ID["prospect-dart"]).toBe("prospect-dart");
    expect(RESOLVED_PERSONA_TO_AUTH_ID["prospect-im-sma"]).toBe("client-im-sma");
    expect(RESOLVED_PERSONA_TO_AUTH_ID["prospect-im-pooled"]).toBe(
      "client-im-pooled",
    );
    expect(RESOLVED_PERSONA_TO_AUTH_ID["prospect-regulatory"]).toBe(
      "prospect-regulatory",
    );
    expect(RESOLVED_PERSONA_TO_AUTH_ID["prospect-signals-only"]).toBe(
      "prospect-signals-only",
    );
    expect(RESOLVED_PERSONA_TO_AUTH_ID["prospect-generic"]).toBe("prospect-dart");
  });
});
