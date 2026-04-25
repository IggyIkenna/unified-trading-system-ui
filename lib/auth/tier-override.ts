"use client";

/**
 * Tier override — client-side entitlement overlay for paired-persona demos.
 *
 * Decoupled from the auth provider: works against demo-mode personas AND real
 * Firebase users. The DemoPlanToggle writes a tier-override flag to localStorage;
 * `useAuth()` reads it via `applyTierOverride()` and adjusts the user's
 * entitlements at render time. The user object's identity (email, uid, org,
 * displayName, role) stays stable — only entitlements flip.
 *
 * This unblocks UAT migrating from `NEXT_PUBLIC_AUTH_PROVIDER=demo` to
 * `firebase` without breaking the FOMO/upgrade-preview narrative. With the
 * old persona-swap pattern the toggle called `loginByEmail(pairedId, "")`
 * which only worked against the demo provider's local PERSONAS table.
 *
 * SSOT: this file. Add a new paired-persona demo by appending a TierBundle
 * entry. Codex cross-ref:
 * `unified-trading-pm/codex/14-playbooks/demo-ops/staging-demo-setup.md` and
 * `unified-trading-pm/codex/08-workflows/environment-mode-philosophy.md` §Axis 2.
 */

import type { AuthUser } from "@/lib/auth/types";
import type { Entitlement, EntitlementOrWildcard, TradingEntitlement } from "@/lib/config/auth";

export type TierKey =
  | "dart-full"
  | "dart-signals-in"
  | "defi-full"
  | "defi-base";

export interface TierConfig {
  readonly key: TierKey;
  readonly label: string;
  readonly entitlements: readonly (EntitlementOrWildcard | TradingEntitlement)[];
  /** Optional dot colour hint for the toggle pill — `emerald` = full tier,
   * `amber` = base/signals-in tier. */
  readonly tone: "emerald" | "amber";
}

export interface TierBundle {
  /** Email-keyed (lowercased). Toggle activates when the signed-in user's
   * email matches this. */
  readonly emailPattern: string;
  /** Default tier when no override is set in localStorage. */
  readonly defaultTier: TierKey;
  /** Two-element ordered list — first is the upgrade tier, second is the
   * fallback tier. Toggle flips between them. */
  readonly tiers: readonly [TierConfig, TierConfig];
}

// ── Bundles ──────────────────────────────────────────────────────────────────
//
// Adding a new paired-persona demo: append an entry here and add matching
// personas in `personas.ts` (or use real Firebase users — both work).

const DESMOND_FULL_ENTITLEMENTS: readonly (EntitlementOrWildcard | TradingEntitlement)[] = [
  "investor-relations",
  "investor-platform",
  "data-pro",
  "execution-full",
  "ml-full",
  "strategy-full",
  "reporting",
  { domain: "trading-common", tier: "basic" },
  { domain: "trading-defi", tier: "basic" },
];

const DESMOND_SIGNALS_IN_ENTITLEMENTS: readonly (EntitlementOrWildcard | TradingEntitlement)[] = [
  "investor-relations",
  "investor-platform",
  "data-pro",
  "execution-full",
  "reporting",
  { domain: "trading-common", tier: "basic" },
  { domain: "trading-defi", tier: "basic" },
];

const ELYSIUM_DEFI_FULL_ENTITLEMENTS: readonly (EntitlementOrWildcard | TradingEntitlement)[] = [
  "data-pro",
  "execution-full",
  "ml-full",
  "strategy-full",
  "reporting",
  { domain: "trading-defi", tier: "basic" },
];

const ELYSIUM_DEFI_BASE_ENTITLEMENTS: readonly (EntitlementOrWildcard | TradingEntitlement)[] = [
  "data-pro",
  "execution-full",
  "reporting",
  { domain: "trading-defi", tier: "basic" },
];

export const TIER_BUNDLES: readonly TierBundle[] = [
  {
    emailPattern: "desmondhw@gmail.com",
    defaultTier: "dart-full",
    tiers: [
      { key: "dart-full", label: "DART Full", entitlements: DESMOND_FULL_ENTITLEMENTS, tone: "emerald" },
      { key: "dart-signals-in", label: "Signals-In", entitlements: DESMOND_SIGNALS_IN_ENTITLEMENTS, tone: "amber" },
    ],
  },
  {
    emailPattern: "patrick@bankelysium.com",
    defaultTier: "defi-full",
    tiers: [
      { key: "defi-full", label: "DeFi Full", entitlements: ELYSIUM_DEFI_FULL_ENTITLEMENTS, tone: "emerald" },
      { key: "defi-base", label: "DeFi Base", entitlements: ELYSIUM_DEFI_BASE_ENTITLEMENTS, tone: "amber" },
    ],
  },
];

// ── Storage + resolution ─────────────────────────────────────────────────────

const STORAGE_KEY = "tier-override-v1";

interface StoredOverride {
  readonly email: string;
  readonly tier: TierKey;
}

export const TIER_OVERRIDE_EVENT = "tier-override-changed";

function safeParse(raw: string | null): StoredOverride | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredOverride>;
    if (typeof parsed.email !== "string" || typeof parsed.tier !== "string") return null;
    return { email: parsed.email, tier: parsed.tier as TierKey };
  } catch {
    return null;
  }
}

export function getTierBundleForEmail(email: string | null | undefined): TierBundle | undefined {
  if (!email) return undefined;
  const lower = email.toLowerCase();
  return TIER_BUNDLES.find((b) => b.emailPattern === lower);
}

export function getActiveTier(email: string | null | undefined): TierKey | undefined {
  const bundle = getTierBundleForEmail(email);
  if (!bundle) return undefined;
  if (typeof window === "undefined") return bundle.defaultTier;
  const stored = safeParse(window.localStorage.getItem(STORAGE_KEY));
  if (
    stored !== null &&
    stored.email === email!.toLowerCase() &&
    bundle.tiers.some((t) => t.key === stored.tier)
  ) {
    return stored.tier;
  }
  return bundle.defaultTier;
}

export function setTierOverride(email: string, tier: TierKey): void {
  if (typeof window === "undefined") return;
  const bundle = getTierBundleForEmail(email);
  if (!bundle) return;
  if (!bundle.tiers.some((t) => t.key === tier)) return;
  const entry: StoredOverride = { email: email.toLowerCase(), tier };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  window.dispatchEvent(new CustomEvent(TIER_OVERRIDE_EVENT, { detail: entry }));
}

export function clearTierOverride(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(TIER_OVERRIDE_EVENT));
}

/**
 * Resolve the paired tier (the one the toggle would flip to). Returns
 * undefined when the email has no bundle.
 */
export function getPairedTier(email: string | null | undefined): TierConfig | undefined {
  const bundle = getTierBundleForEmail(email);
  if (!bundle) return undefined;
  const active = getActiveTier(email) ?? bundle.defaultTier;
  return bundle.tiers.find((t) => t.key !== active);
}

export function getCurrentTier(email: string | null | undefined): TierConfig | undefined {
  const bundle = getTierBundleForEmail(email);
  if (!bundle) return undefined;
  const active = getActiveTier(email) ?? bundle.defaultTier;
  return bundle.tiers.find((t) => t.key === active);
}

/**
 * Apply the tier override to a user's entitlements. If the user's email has
 * a TierBundle, returns the user with `entitlements` replaced by the active
 * tier's set. Otherwise returns the user unchanged. Identity fields
 * (email, uid, displayName, org, role) are never touched.
 */
export function applyTierOverride<T extends AuthUser>(user: T | null): T | null {
  if (!user) return null;
  const bundle = getTierBundleForEmail(user.email);
  if (!bundle) return user;
  const tierKey = getActiveTier(user.email) ?? bundle.defaultTier;
  const tier = bundle.tiers.find((t) => t.key === tierKey);
  if (!tier) return user;
  return { ...user, entitlements: tier.entitlements as readonly Entitlement[] };
}
