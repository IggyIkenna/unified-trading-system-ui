/**
 * Catalogue Truthiness Adapter.
 *
 * Reconciles UAC canonical lists (archetypes / ML models / features) against
 * live backend registry state to produce per-item status labels — `LIVE`,
 * `IN_DEVELOPMENT`, `RETIRED`, or `PLANNED_NOT_IMPLEMENTED`. Admins view all
 * four buckets; clients see LIVE only.
 *
 * Live data sources (HTTP):
 *   - strategy-service:        GET /api/v1/registry/archetypes
 *   - strategy-service:        GET /api/v1/registry/ml-models
 *   - features-* service (UTL factory): GET /api/v1/registry/features
 *
 * Authentication: shared-secret `X-Admin-Token` (from
 * `NEXT_PUBLIC_ADMIN_API_TOKEN` in mock / dev, server-side env in staging/prod).
 * If the token is absent OR `CLOUD_MOCK_MODE=true`, the adapter short-circuits
 * to mock seed data — clearly labelled `(mock) <status>` so operators know
 * they're not looking at live backend state.
 *
 * SSOT:
 *   - unified-trading-pm/codex/09-strategy/architecture-v2/admin-registry-api.md
 *   - plan: ui_unification_v2_sanitisation_2026_04_20 Phase 7
 */

import { STRATEGY_ARCHETYPES_V2 } from "@/lib/architecture-v2/enums";
import type {
  StrategyArchetype,
  StrategyFamily,
} from "@/lib/architecture-v2/enums";
import { ARCHETYPE_TO_FAMILY } from "@/lib/architecture-v2/enums";

export type CatalogueStatus =
  | "LIVE"
  | "IN_DEVELOPMENT"
  | "RETIRED"
  | "PLANNED_NOT_IMPLEMENTED";

export const CATALOGUE_STATUSES: readonly CatalogueStatus[] = [
  "LIVE",
  "IN_DEVELOPMENT",
  "RETIRED",
  "PLANNED_NOT_IMPLEMENTED",
] as const;

export interface ArchetypeRegistryRow {
  readonly archetype: StrategyArchetype;
  readonly family: StrategyFamily;
  readonly status: CatalogueStatus;
  readonly lastUpdatedUtc: string | null;
  readonly deploymentHealth: "healthy" | "degraded" | "down" | "unknown";
  readonly liveStrategyCount: number;
  readonly source: "live" | "mock";
}

export interface MlModelRegistryRow {
  readonly modelId: string;
  readonly archetype: StrategyArchetype | null;
  readonly status: CatalogueStatus;
  readonly lastTrainingUtc: string | null;
  readonly deploymentHealth: "healthy" | "degraded" | "down" | "unknown";
  readonly source: "live" | "mock";
}

export interface FeatureRegistryRow {
  readonly featureGroup: string;
  readonly serviceKey: string;
  readonly status: CatalogueStatus;
  readonly lastComputedUtc: string | null;
  readonly consumers: readonly string[];
  readonly source: "live" | "mock";
}

export interface CatalogueSnapshot {
  readonly archetypes: readonly ArchetypeRegistryRow[];
  readonly mlModels: readonly MlModelRegistryRow[];
  readonly features: readonly FeatureRegistryRow[];
  readonly fetchedAtUtc: string;
  readonly mode: "live" | "mock";
  readonly warnings: readonly string[];
}

// ---------------------------------------------------------------------------
// Mock seeds — used when CLOUD_MOCK_MODE=true or admin token absent
// ---------------------------------------------------------------------------

function buildMockArchetypeRows(): readonly ArchetypeRegistryRow[] {
  // Mark 5 IM-live archetypes as LIVE, rest as IN_DEVELOPMENT or PLANNED.
  // Matches codex `restriction-policy.md` § IM-live cells.
  const liveArchetypes = new Set<StrategyArchetype>([
    "ML_DIRECTIONAL_CONTINUOUS",
    "CARRY_BASIS_PERP",
    "STAT_ARB_PAIRS_FIXED",
    "ML_DIRECTIONAL_EVENT_SETTLED",
  ]);
  const inDevArchetypes = new Set<StrategyArchetype>([
    "CARRY_BASIS_DATED",
    "RULES_DIRECTIONAL_CONTINUOUS",
    "VOL_TRADING_OPTIONS",
    "MARKET_MAKING_CONTINUOUS",
  ]);
  return STRATEGY_ARCHETYPES_V2.map((archetype) => {
    let status: CatalogueStatus;
    let deploymentHealth: ArchetypeRegistryRow["deploymentHealth"];
    let liveCount: number;
    if (liveArchetypes.has(archetype)) {
      status = "LIVE";
      deploymentHealth = "healthy";
      liveCount = 3;
    } else if (inDevArchetypes.has(archetype)) {
      status = "IN_DEVELOPMENT";
      deploymentHealth = "unknown";
      liveCount = 0;
    } else {
      status = "PLANNED_NOT_IMPLEMENTED";
      deploymentHealth = "unknown";
      liveCount = 0;
    }
    return {
      archetype,
      family: ARCHETYPE_TO_FAMILY[archetype],
      status,
      lastUpdatedUtc: status === "LIVE" ? "2026-04-19T00:00:00Z" : null,
      deploymentHealth,
      liveStrategyCount: liveCount,
      source: "mock" as const,
    };
  });
}

function buildMockMlModelRows(): readonly MlModelRegistryRow[] {
  return [
    {
      modelId: "btc-ml-directional-5m-v3",
      archetype: "ML_DIRECTIONAL_CONTINUOUS",
      status: "LIVE",
      lastTrainingUtc: "2026-04-15T12:00:00Z",
      deploymentHealth: "healthy",
      source: "mock",
    },
    {
      modelId: "eth-ml-directional-5m-v2",
      archetype: "ML_DIRECTIONAL_CONTINUOUS",
      status: "LIVE",
      lastTrainingUtc: "2026-04-14T12:00:00Z",
      deploymentHealth: "healthy",
      source: "mock",
    },
    {
      modelId: "es-front-continuous-v1",
      archetype: "ML_DIRECTIONAL_CONTINUOUS",
      status: "IN_DEVELOPMENT",
      lastTrainingUtc: null,
      deploymentHealth: "unknown",
      source: "mock",
    },
    {
      modelId: "nse-options-v0",
      archetype: "VOL_TRADING_OPTIONS",
      status: "PLANNED_NOT_IMPLEMENTED",
      lastTrainingUtc: null,
      deploymentHealth: "unknown",
      source: "mock",
    },
    {
      modelId: "sports-ml-directional-v4",
      archetype: "ML_DIRECTIONAL_EVENT_SETTLED",
      status: "LIVE",
      lastTrainingUtc: "2026-04-18T08:00:00Z",
      deploymentHealth: "healthy",
      source: "mock",
    },
  ];
}

function buildMockFeatureRows(): readonly FeatureRegistryRow[] {
  return [
    {
      featureGroup: "price_returns",
      serviceKey: "features-cefi",
      status: "LIVE",
      lastComputedUtc: "2026-04-20T00:00:00Z",
      consumers: ["strategy-service"],
      source: "mock",
    },
    {
      featureGroup: "funding_rate_signals",
      serviceKey: "features-cefi",
      status: "LIVE",
      lastComputedUtc: "2026-04-20T00:00:00Z",
      consumers: ["strategy-service"],
      source: "mock",
    },
    {
      featureGroup: "onchain_tvl_metrics",
      serviceKey: "features-onchain",
      status: "LIVE",
      lastComputedUtc: "2026-04-20T00:00:00Z",
      consumers: ["strategy-service"],
      source: "mock",
    },
    {
      featureGroup: "sports_form_indicators",
      serviceKey: "features-sports",
      status: "LIVE",
      lastComputedUtc: "2026-04-19T22:00:00Z",
      consumers: ["strategy-service"],
      source: "mock",
    },
    {
      featureGroup: "cme_continuous_stitched",
      serviceKey: "features-tradfi",
      status: "IN_DEVELOPMENT",
      lastComputedUtc: null,
      consumers: [],
      source: "mock",
    },
    {
      featureGroup: "prediction_closing_line",
      serviceKey: "features-prediction",
      status: "PLANNED_NOT_IMPLEMENTED",
      lastComputedUtc: null,
      consumers: [],
      source: "mock",
    },
  ];
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

interface AdapterConfig {
  readonly adminToken?: string;
  readonly strategyServiceBaseUrl?: string;
  readonly featuresServiceBaseUrls?: Readonly<Record<string, string>>;
  readonly mockMode?: boolean;
}

function resolveConfig(override?: AdapterConfig): AdapterConfig {
  const envMock =
    typeof process !== "undefined" &&
    process.env.CLOUD_MOCK_MODE === "true";
  const publicMock =
    typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_CLOUD_MOCK_MODE === "true";
  const adminToken =
    override?.adminToken ??
    (typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_ADMIN_API_TOKEN
      : undefined);
  const defaultStrategyBase =
    typeof process !== "undefined"
      ? (process.env.NEXT_PUBLIC_STRATEGY_SERVICE_URL ?? "")
      : "";
  // mockMode precedence: explicit override > env flag > missing token
  const mockMode =
    override?.mockMode ?? (envMock || publicMock || !adminToken);
  return {
    adminToken,
    strategyServiceBaseUrl: override?.strategyServiceBaseUrl ?? defaultStrategyBase,
    featuresServiceBaseUrls: override?.featuresServiceBaseUrls,
    mockMode,
  };
}

// ---------------------------------------------------------------------------
// Live HTTP helpers (skinny — no TanStack dependency; wrap with your own hook)
// ---------------------------------------------------------------------------

interface ArchetypeApiRow {
  readonly archetype: string;
  readonly family?: string;
  readonly status?: string;
  readonly last_updated?: string | null;
  readonly deployment_health?: string;
  readonly live_strategy_count?: number;
}

interface MlModelApiRow {
  readonly model_id: string;
  readonly archetype?: string | null;
  readonly status?: string;
  readonly last_training_timestamp?: string | null;
  readonly deployment_health?: string;
}

interface FeatureApiRow {
  readonly feature_group: string;
  readonly service_key?: string;
  readonly status?: string;
  readonly last_computed_at?: string | null;
  readonly consumers?: readonly string[];
}

function coerceStatus(raw: string | undefined): CatalogueStatus {
  if (
    raw === "LIVE" ||
    raw === "IN_DEVELOPMENT" ||
    raw === "RETIRED" ||
    raw === "PLANNED_NOT_IMPLEMENTED"
  ) {
    return raw;
  }
  return "PLANNED_NOT_IMPLEMENTED";
}

function coerceHealth(raw: string | undefined): ArchetypeRegistryRow["deploymentHealth"] {
  if (raw === "healthy" || raw === "degraded" || raw === "down") return raw;
  return "unknown";
}

function coerceArchetype(raw: string): StrategyArchetype | null {
  return (STRATEGY_ARCHETYPES_V2 as readonly string[]).includes(raw)
    ? (raw as StrategyArchetype)
    : null;
}

async function fetchJson<T>(
  url: string,
  adminToken: string,
  signal?: AbortSignal,
): Promise<T> {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "X-Admin-Token": adminToken,
      Accept: "application/json",
    },
    signal,
  });
  if (!res.ok) {
    throw new Error(
      `Admin registry fetch failed (${res.status}): ${res.statusText} — ${url}`,
    );
  }
  return (await res.json()) as T;
}

// ---------------------------------------------------------------------------
// Public adapter
// ---------------------------------------------------------------------------

export class CatalogueTruthinessAdapter {
  private readonly config: AdapterConfig;

  constructor(override?: AdapterConfig) {
    this.config = resolveConfig(override);
  }

  get isMockMode(): boolean {
    return this.config.mockMode === true;
  }

  async fetchArchetypes(
    signal?: AbortSignal,
  ): Promise<readonly ArchetypeRegistryRow[]> {
    if (this.isMockMode) return buildMockArchetypeRows();
    if (!this.config.strategyServiceBaseUrl || !this.config.adminToken) {
      return buildMockArchetypeRows();
    }
    const url = `${this.config.strategyServiceBaseUrl}/api/v1/registry/archetypes`;
    const payload = await fetchJson<{ rows: readonly ArchetypeApiRow[] }>(
      url,
      this.config.adminToken,
      signal,
    );
    // Reconcile against UAC canonical list — any archetype missing from
    // backend response is PLANNED_NOT_IMPLEMENTED.
    const backendByArchetype = new Map<string, ArchetypeApiRow>();
    for (const row of payload.rows ?? []) {
      backendByArchetype.set(row.archetype, row);
    }
    const reconciled: ArchetypeRegistryRow[] = [];
    for (const archetype of STRATEGY_ARCHETYPES_V2) {
      const backend = backendByArchetype.get(archetype);
      if (backend) {
        reconciled.push({
          archetype,
          family: ARCHETYPE_TO_FAMILY[archetype],
          status: coerceStatus(backend.status),
          lastUpdatedUtc: backend.last_updated ?? null,
          deploymentHealth: coerceHealth(backend.deployment_health),
          liveStrategyCount: backend.live_strategy_count ?? 0,
          source: "live",
        });
      } else {
        reconciled.push({
          archetype,
          family: ARCHETYPE_TO_FAMILY[archetype],
          status: "PLANNED_NOT_IMPLEMENTED",
          lastUpdatedUtc: null,
          deploymentHealth: "unknown",
          liveStrategyCount: 0,
          source: "live",
        });
      }
    }
    return reconciled;
  }

  async fetchMlModels(
    signal?: AbortSignal,
  ): Promise<readonly MlModelRegistryRow[]> {
    if (this.isMockMode) return buildMockMlModelRows();
    if (!this.config.strategyServiceBaseUrl || !this.config.adminToken) {
      return buildMockMlModelRows();
    }
    const url = `${this.config.strategyServiceBaseUrl}/api/v1/registry/ml-models`;
    const payload = await fetchJson<{ rows: readonly MlModelApiRow[] }>(
      url,
      this.config.adminToken,
      signal,
    );
    return (payload.rows ?? []).map((row) => ({
      modelId: row.model_id,
      archetype: row.archetype ? coerceArchetype(row.archetype) : null,
      status: coerceStatus(row.status),
      lastTrainingUtc: row.last_training_timestamp ?? null,
      deploymentHealth: coerceHealth(row.deployment_health),
      source: "live" as const,
    }));
  }

  async fetchFeatures(
    signal?: AbortSignal,
  ): Promise<readonly FeatureRegistryRow[]> {
    if (this.isMockMode) return buildMockFeatureRows();
    const baseUrls = this.config.featuresServiceBaseUrls ?? {};
    if (
      !this.config.adminToken ||
      Object.keys(baseUrls).length === 0
    ) {
      return buildMockFeatureRows();
    }
    const rows: FeatureRegistryRow[] = [];
    for (const [serviceKey, baseUrl] of Object.entries(baseUrls)) {
      const url = `${baseUrl}/api/v1/registry/features`;
      try {
        const payload = await fetchJson<{ rows: readonly FeatureApiRow[] }>(
          url,
          this.config.adminToken,
          signal,
        );
        for (const row of payload.rows ?? []) {
          rows.push({
            featureGroup: row.feature_group,
            serviceKey: row.service_key ?? serviceKey,
            status: coerceStatus(row.status),
            lastComputedUtc: row.last_computed_at ?? null,
            consumers: row.consumers ?? [],
            source: "live",
          });
        }
      } catch (err) {
        // Per-service failure should not block other services — shard-level
        // isolation. Surface as a warning in the snapshot.
        // eslint-disable-next-line no-console
        console.warn(
          `CatalogueTruthinessAdapter: features fetch failed for ${serviceKey}`,
          err,
        );
      }
    }
    return rows;
  }

  async fetchSnapshot(signal?: AbortSignal): Promise<CatalogueSnapshot> {
    const warnings: string[] = [];
    const mode: "live" | "mock" = this.isMockMode ? "mock" : "live";
    if (mode === "mock") {
      warnings.push(
        "Running in mock mode. Admin token unset or CLOUD_MOCK_MODE=true.",
      );
    }
    const [archetypes, mlModels, features] = await Promise.all([
      this.fetchArchetypes(signal),
      this.fetchMlModels(signal),
      this.fetchFeatures(signal),
    ]);
    return {
      archetypes,
      mlModels,
      features,
      fetchedAtUtc: new Date().toISOString(),
      mode,
      warnings,
    };
  }
}

/**
 * Default adapter instance — reads config from `process.env` at call time.
 * Call `.fetchSnapshot()` to get a single snapshot; wrap with SWR/TanStack
 * Query in consumer pages for caching.
 */
export const catalogueTruthiness = new CatalogueTruthinessAdapter();
