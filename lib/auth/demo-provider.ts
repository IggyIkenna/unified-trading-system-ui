import { getPersonaByEmail, getPersonaById } from "@/lib/auth/personas";
import type { AuthPersona, Entitlement } from "@/lib/config/auth";
import { ALL_ENTITLEMENTS } from "@/lib/config/auth";
import type { AuthProvider, AuthUser } from "./types";

export { derivePersonaInstruments } from "./derive-persona-instruments";

const STORAGE_KEY = "portal_user";
const TOKEN_KEY = "portal_token";

function personaToAuthUser(persona: AuthPersona): AuthUser {
  return {
    id: persona.id,
    email: persona.email,
    displayName: persona.displayName,
    role: persona.role,
    org: persona.org,
    entitlements: persona.entitlements as AuthUser["entitlements"],
    ...(persona.assigned_strategies ? { assigned_strategies: persona.assigned_strategies } : {}),
  };
}

export class DemoAuthProvider implements AuthProvider {
  private user: AuthUser | null = null;
  private token: string | null = null;

  constructor() {
    this.restore();
  }

  private restore(): void {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const savedToken = localStorage.getItem(TOKEN_KEY);
      if (!raw) return;
      const stored = JSON.parse(raw) as { id: string; email: string };
      const persona = getPersonaById(stored.id) ?? getPersonaByEmail(stored.email);
      if (persona) {
        this.user = personaToAuthUser(persona);
        this.token = savedToken ?? `demo-token-${persona.id}`;
      }
    } catch {
      // Corrupted localStorage — start fresh
    }
  }

  async login(credential: string, secret?: string): Promise<AuthUser | null> {
    let persona = getPersonaById(credential);

    if (!persona) {
      persona = getPersonaByEmail(credential);
      if (persona && secret !== undefined && persona.password !== secret) {
        return null;
      }
    }

    if (!persona) {
      // Check mock signup users (created during signup flow)
      try {
        const raw = localStorage.getItem("mock-signup-users");
        if (raw) {
          const signupUsers = JSON.parse(raw) as Array<{ id: string; email: string; password: string; uid: string }>;
          const match = signupUsers.find((u) => u.email === credential && u.password === secret);
          if (match) {
            this.user = {
              id: match.id,
              email: match.email,
              displayName: match.email.split("@")[0],
              role: "client",
              org: { id: "pending", name: "Pending Approval" },
              entitlements: [],
            };
            this.token = `demo-token-${match.uid}`;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.user));
            localStorage.setItem(TOKEN_KEY, this.token);
            return this.user;
          }
        }
      } catch {
        /* ignore */
      }
      return null;
    }

    this.user = personaToAuthUser(persona);
    this.token = `demo-token-${persona.id}`;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.user));
    localStorage.setItem(TOKEN_KEY, this.token);
    const QUESTIONNAIRE_PRESEEDS: Record<string, object> = {
      "desmond-signals-in": {
        categories: ["CeFi", "DeFi"],
        instrument_types: ["perp"],
        venue_scope: "all",
        strategy_style: ["carry", "arbitrage", "stat_arb"],
        service_family: "DART",
        fund_structure: ["prop"],
        market_neutral: "neutral",
        share_class_preferences: [],
        risk_profile: "low",
        leverage_preference: "low",
        target_sharpe_min: null,
      },
      "desmond-dart-full": {
        categories: ["CeFi", "DeFi"],
        instrument_types: ["perp"],
        venue_scope: "all",
        strategy_style: ["carry", "arbitrage", "stat_arb"],
        service_family: "DART",
        fund_structure: ["prop"],
        market_neutral: "neutral",
        share_class_preferences: [],
        risk_profile: "low",
        leverage_preference: "low",
        target_sharpe_min: null,
      },
      "elysium-defi": {
        categories: ["CeFi", "DeFi"],
        instrument_types: ["perp", "staking"],
        venue_scope: "all",
        strategy_style: ["carry"],
        service_family: "DART",
        fund_structure: ["prop"],
        market_neutral: "neutral",
        share_class_preferences: [],
        risk_profile: "low",
        leverage_preference: "low",
        target_sharpe_min: null,
      },
      "elysium-defi-full": {
        categories: ["CeFi", "DeFi"],
        instrument_types: ["perp", "staking"],
        venue_scope: "all",
        strategy_style: ["carry"],
        service_family: "DART",
        fund_structure: ["prop"],
        market_neutral: "neutral",
        share_class_preferences: [],
        risk_profile: "low",
        leverage_preference: "low",
        target_sharpe_min: null,
      },
    };
    const preseed = QUESTIONNAIRE_PRESEEDS[persona.id];
    if (preseed) {
      localStorage.setItem("questionnaire-response-v1", JSON.stringify(preseed));
    }
    return this.user;
  }

  async logout(): Promise<void> {
    this.user = null;
    this.token = null;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("odum_user");
  }

  async getToken(): Promise<string | null> {
    return this.token;
  }

  getUser(): AuthUser | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return this.user !== null;
  }

  hasEntitlement(entitlement: Entitlement): boolean {
    if (!this.user) return false;
    if (this.user.entitlements.includes(ALL_ENTITLEMENTS)) return true;
    return this.user.entitlements.includes(entitlement);
  }

  onAuthStateChanged(_callback: (user: AuthUser | null) => void): () => void {
    return () => {};
  }
}
