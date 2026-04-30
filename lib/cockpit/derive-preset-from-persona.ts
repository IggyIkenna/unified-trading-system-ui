/**
 * Persona → recommended cockpit preset.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.plan.md §9 (Phase 6).
 *
 * Inputs: persona id, role, entitlements, optional questionnaire-derived
 * scope. Output: a recommended preset id from `COCKPIT_PRESETS` plus a
 * brief reason string for the wizard's "Recommended starter" copy.
 *
 * The mapping is deliberately conservative: an unrecognised persona falls
 * back to "live-trading-desk" (generic monitor cockpit). Phase 6's wizard
 * shows the recommendation but the user can pick any of the 8 presets.
 */

export interface PersonaInput {
  readonly id?: string;
  readonly role?: "admin" | "internal" | "client" | string;
  readonly entitlements?: ReadonlyArray<string | { domain: string; tier: string }>;
}

export interface PresetRecommendation {
  readonly presetId: string;
  /** Human-readable explanation shown next to the recommended preset card. */
  readonly reason: string;
}

function hasEntitlement(persona: PersonaInput, name: string): boolean {
  const ents = persona.entitlements ?? [];
  for (const e of ents) {
    if (typeof e === "string" && e === name) return true;
    if (typeof e === "string" && e === "*") return true; // wildcard
  }
  return false;
}

function hasTradingDomain(persona: PersonaInput, domain: string): boolean {
  const ents = persona.entitlements ?? [];
  for (const e of ents) {
    if (typeof e === "object" && "domain" in e && e.domain === domain) return true;
    if (typeof e === "string" && e === "*") return true;
  }
  return false;
}

/**
 * Recommend the starter preset for a persona. Order of resolution:
 *   1. Persona-id specific bundles (UAT/demo personas with hand-curated
 *      cockpits) — extend `PERSONA_PRESET_OVERRIDES` to add more.
 *   2. Role-based bands (admin / internal → live-trading-desk;
 *      regulator-only → executive-overview; signals-in → signals-in-monitor).
 *   3. Entitlement-derived (data-only → executive-overview;
 *      DeFi-only → defi-yield-risk; vol-only → volatility-research-lab;
 *      DART-Full → research-to-live-pipeline).
 *   4. Conservative default → live-trading-desk.
 */
const PERSONA_PRESET_OVERRIDES: Readonly<Record<string, PresetRecommendation>> = {
  admin: { presetId: "executive-overview", reason: "Admin / wildcard view." },
  "internal-trader": { presetId: "live-trading-desk", reason: "Internal trader desk shape." },
  "client-full": { presetId: "research-to-live-pipeline", reason: "Full DART access — research → live pipeline." },
  "prospect-dart": {
    presetId: "research-to-live-pipeline",
    reason: "Prospect with DART-Full entitlements — research-to-live demo.",
  },
  "client-data-only": {
    presetId: "executive-overview",
    reason: "Data-only access — surface the executive reporting view.",
  },
  "prospect-signals-only": {
    presetId: "signals-in-monitor",
    reason: "Signals-In persona — monitor signal intake + routing health.",
  },
  "prospect-regulatory": {
    presetId: "executive-overview",
    reason: "Regulatory-only persona — reports surface for compliance review.",
  },
  "prospect-im": {
    presetId: "executive-overview",
    reason: "Investment-management prospect — allocator reporting view.",
  },
};

export function recommendPresetForPersona(persona: PersonaInput): PresetRecommendation {
  // Step 1: persona-id override.
  if (persona.id && PERSONA_PRESET_OVERRIDES[persona.id]) {
    return PERSONA_PRESET_OVERRIDES[persona.id];
  }

  // Step 2: role bands.
  if (persona.role === "admin" || persona.role === "internal") {
    return { presetId: "live-trading-desk", reason: "Operational role — live trading desk." };
  }

  // Step 3: entitlement-derived.
  const isFullDart = hasEntitlement(persona, "strategy-full") && hasEntitlement(persona, "ml-full");
  if (isFullDart) {
    return {
      presetId: "research-to-live-pipeline",
      reason: "DART-Full entitlements detected — surface the research → live pipeline.",
    };
  }

  const isDefiOnly = hasTradingDomain(persona, "trading-defi") && !hasTradingDomain(persona, "trading-common");
  if (isDefiOnly) {
    return { presetId: "defi-yield-risk", reason: "DeFi-only entitlement — yield + risk cockpit." };
  }

  const isVolOnly = hasTradingDomain(persona, "trading-options");
  if (isVolOnly) {
    return { presetId: "volatility-research-lab", reason: "Options entitlement — volatility research lab." };
  }

  const isSportsOrPrediction =
    hasTradingDomain(persona, "trading-sports") || hasTradingDomain(persona, "trading-predictions");
  if (isSportsOrPrediction) {
    return { presetId: "sports-prediction-desk", reason: "Event-market entitlement — sports / prediction desk." };
  }

  const isSignalsIn = hasEntitlement(persona, "signals-in") || hasEntitlement(persona, "signals-receive");
  if (isSignalsIn) {
    return { presetId: "signals-in-monitor", reason: "Signals-In entitlement — intake + routing monitor." };
  }

  const isReportingOnly = hasEntitlement(persona, "reporting") && !hasEntitlement(persona, "execution-basic");
  if (isReportingOnly) {
    return { presetId: "executive-overview", reason: "Reporting-only entitlement — executive overview." };
  }

  // Step 4: conservative default.
  return { presetId: "live-trading-desk", reason: "Default starter cockpit." };
}
