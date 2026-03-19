/**
 * Mock API handlers for deployment-ui.
 * Active when VITE_MOCK_API=true.
 *
 * All /api/* fetch calls are intercepted and return realistic simulated data.
 * This enables full E2E smoke testing without a real backend.
 */

/**
 * Mock API handlers for deployment-ui.
 * Active when VITE_MOCK_API=true.
 *
 * Supports:
 * - VITE_STRESS_SCENARIO: BIG_DRAWDOWN | BIG_TICKS | MISSING_DATA | BAD_SCHEMAS | STALE_DATA | HIGH_CARDINALITY
 * - VITE_MOCK_DELAY_MS: artificial delay in ms for all mock responses
 */

export const MOCK_MODE = import.meta.env.VITE_MOCK_API === "true";
const STRESS_SCENARIO = import.meta.env.VITE_STRESS_SCENARIO || "";
const MOCK_DELAY_MS = parseInt(import.meta.env.VITE_MOCK_DELAY_MS || "60", 10);

// ---- Mock data ----

const MOCK_SERVICES = [
  {
    name: "instruments-service",
    layer: 1,
    category: "data",
    dimensions: ["category", "date"],
    status: "healthy",
    lastDeployed: "2026-03-09T14:00:00Z",
  },
  {
    name: "corporate-actions",
    layer: 1,
    category: "data",
    dimensions: ["category", "date"],
    status: "healthy",
    lastDeployed: "2026-03-08T10:00:00Z",
  },
  {
    name: "market-tick-data-service",
    layer: 2,
    category: "ingestion",
    dimensions: ["category", "venue", "date"],
    status: "healthy",
    lastDeployed: "2026-03-09T16:00:00Z",
  },
  {
    name: "market-data-processing-service",
    layer: 2,
    category: "ingestion",
    dimensions: ["category", "venue", "date"],
    status: "warning",
    lastDeployed: "2026-03-07T12:00:00Z",
  },
  {
    name: "features-calendar-service",
    layer: 3,
    category: "features",
    dimensions: ["category", "date"],
    status: "healthy",
    lastDeployed: "2026-03-09T18:00:00Z",
  },
  {
    name: "features-delta-one-service",
    layer: 3,
    category: "features",
    dimensions: ["category", "feature_group", "date"],
    status: "healthy",
    lastDeployed: "2026-03-09T18:30:00Z",
  },
  {
    name: "features-volatility-service",
    layer: 3,
    category: "features",
    dimensions: ["category", "feature_group", "date"],
    status: "healthy",
    lastDeployed: "2026-03-09T18:45:00Z",
  },
  {
    name: "features-onchain-service",
    layer: 3,
    category: "features",
    dimensions: ["category", "feature_group", "date"],
    status: "healthy",
    lastDeployed: "2026-03-10T09:00:00Z",
  },
  {
    name: "ml-training-service",
    layer: 4,
    category: "ml",
    dimensions: ["model_id", "date"],
    status: "healthy",
    lastDeployed: "2026-03-08T20:00:00Z",
  },
  {
    name: "ml-inference-service",
    layer: 4,
    category: "ml",
    dimensions: ["model_id", "date"],
    status: "healthy",
    lastDeployed: "2026-03-09T11:00:00Z",
  },
];

const MOCK_DEPLOYMENTS = [
  {
    id: "dep-001",
    service: "instruments-service",
    status: "completed",
    created_at: "2026-03-10T08:00:00Z",
    updated_at: "2026-03-10T08:45:00Z",
    total_shards: 48,
    completed_shards: 48,
    failed_shards: 0,
    parameters: { compute: "vm", mode: "batch", cloud_provider: "gcp" },
    tag: "daily-run",
  },
  {
    id: "dep-002",
    service: "instruments-service",
    status: "running",
    created_at: "2026-03-10T09:30:00Z",
    updated_at: "2026-03-10T09:30:00Z",
    total_shards: 126,
    completed_shards: 78,
    failed_shards: 0,
    parameters: { compute: "cloud_run", mode: "live", cloud_provider: "gcp" },
    tag: null,
  },
  {
    id: "dep-003",
    service: "instruments-service",
    status: "failed",
    created_at: "2026-03-10T07:00:00Z",
    updated_at: "2026-03-10T07:22:00Z",
    total_shards: 72,
    completed_shards: 31,
    failed_shards: 8,
    parameters: { compute: "vm", mode: "batch", cloud_provider: "gcp" },
    tag: "debug-run",
  },
  {
    id: "dep-004",
    service: "instruments-service",
    status: "completed",
    created_at: "2026-03-09T22:00:00Z",
    updated_at: "2026-03-09T23:40:00Z",
    total_shards: 12,
    completed_shards: 12,
    failed_shards: 0,
    parameters: { compute: "vm", mode: "batch", cloud_provider: "gcp" },
    tag: "weekly-retrain",
  },
];

const MOCK_CATEGORIES = [
  "equity",
  "crypto",
  "fx",
  "rates",
  "commodity",
  "sports",
];

const MOCK_VENUES_BY_CATEGORY: Record<string, string[]> = {
  equity: ["NYSE", "NASDAQ", "LSE", "TSE", "HKEX"],
  crypto: ["Binance", "OKX", "Bybit", "Kraken", "Coinbase"],
  fx: ["Reuters", "Bloomberg", "EBS"],
  rates: ["CME", "EUREX", "ICE"],
  commodity: ["NYMEX", "LME", "ICE"],
  sports: ["DraftKings", "Betfair", "Pinnacle"],
};

const MOCK_QUOTA = {
  projectId: "unified-trading-prod",
  region: "asia-northeast1-c",
  cpuQuota: { used: 847, limit: 2000, unit: "vCPUs" },
  memoryQuota: { used: 3200, limit: 8192, unit: "GB" },
  instanceQuota: { used: 42, limit: 100, unit: "instances" },
  estimatedCost: {
    perShard: 0.18,
    total: null as number | null,
    currency: "USD",
  },
};

const MOCK_DATA_STATUS = {
  service: "instruments-service",
  category: "equity",
  totalDates: 30,
  completeDates: 28,
  missingDates: ["2026-03-05", "2026-03-06"],
  calendar: Array.from({ length: 30 }, (_, i) => {
    const d = new Date("2026-02-09");
    d.setDate(d.getDate() + i);
    return {
      date: d.toISOString().split("T")[0],
      status: i === 24 || i === 25 ? "missing" : "complete",
      shards: i === 24 || i === 25 ? 0 : Math.floor(Math.random() * 20) + 40,
    };
  }),
};

const MOCK_CHECKLIST = {
  service: "instruments-service",
  overallScore: 87,
  isBlocked: false,
  categories: [
    {
      name: "Data Coverage",
      score: 95,
      items: [
        {
          id: "c1",
          label: "Equity coverage ≥ 95%",
          status: "pass",
          detail: "98.2% complete",
        },
        {
          id: "c2",
          label: "Crypto coverage ≥ 90%",
          status: "pass",
          detail: "94.1% complete",
        },
        {
          id: "c3",
          label: "FX coverage ≥ 90%",
          status: "warn",
          detail: "88.5% complete (below 90% threshold)",
        },
      ],
    },
    {
      name: "Build Health",
      score: 100,
      items: [
        {
          id: "b1",
          label: "Latest build passing",
          status: "pass",
          detail: "Build #1847 — 2026-03-10T08:00Z",
        },
        {
          id: "b2",
          label: "No critical CVEs",
          status: "pass",
          detail: "0 critical, 2 low severity",
        },
      ],
    },
    {
      name: "Deployment Readiness",
      score: 67,
      items: [
        {
          id: "d1",
          label: "Canary deployment validated",
          status: "fail",
          detail: "No canary run in last 7 days",
        },
        {
          id: "d2",
          label: "Rollback tested",
          status: "pass",
          detail: "Rollback tested 2026-03-08",
        },
        {
          id: "d3",
          label: "Alert thresholds configured",
          status: "warn",
          detail: "P99 latency alert missing",
        },
      ],
    },
  ],
};

// ---- Route handler ----

function delay(ms = MOCK_DELAY_MS): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ---- Stress overrides ----
function getStressDeployments(): typeof MOCK_DEPLOYMENTS {
  if (STRESS_SCENARIO === "MISSING_DATA") return [];
  if (STRESS_SCENARIO === "HIGH_CARDINALITY") {
    return Array.from({ length: 500 }, (_, i) => ({
      id: `dep-hc-${String(i).padStart(4, "0")}`,
      service: MOCK_SERVICES[i % MOCK_SERVICES.length].name,
      status: ["completed", "running", "failed", "queued"][i % 4],
      created_at: new Date(Date.now() - i * 3600000).toISOString(),
      updated_at: new Date(Date.now() - i * 1800000).toISOString(),
      total_shards: Math.floor(Math.random() * 200) + 10,
      completed_shards: Math.floor(Math.random() * 100),
      failed_shards: i % 4 === 2 ? Math.floor(Math.random() * 20) : 0,
      parameters: { compute: "vm", mode: "batch", cloud_provider: "gcp" },
      tag: null,
    }));
  }
  if (STRESS_SCENARIO === "BIG_DRAWDOWN") {
    return MOCK_DEPLOYMENTS.map((d) => ({
      ...d,
      status: "failed",
      failed_shards: d.total_shards,
    }));
  }
  return MOCK_DEPLOYMENTS;
}

function getStressServices(): typeof MOCK_SERVICES {
  if (STRESS_SCENARIO === "MISSING_DATA") return [];
  if (STRESS_SCENARIO === "HIGH_CARDINALITY") {
    return Array.from({ length: 100 }, (_, i) => ({
      name: `service-${String(i).padStart(3, "0")}`,
      layer: (i % 6) + 1,
      category: [
        "data",
        "ingestion",
        "features",
        "ml",
        "execution",
        "monitoring",
      ][i % 6],
      dimensions: ["category", "date"],
      status: i % 10 === 0 ? "warning" : "healthy",
      lastDeployed: new Date(Date.now() - i * 86400000).toISOString(),
    }));
  }
  return MOCK_SERVICES;
}

function json<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function handleRoute(url: string, init?: RequestInit): Promise<Response> {
  await delay();
  const method = init?.method?.toUpperCase() ?? "GET";
  const path = url
    .replace(/^https?:\/\/[^/]+/, "")
    .replace(/\?.*$/, "")
    .replace("/api/v1/", "/api/");

  // Health
  if (path === "/api/health") {
    return json({
      status: "healthy",
      uptime: 99.97,
      version: "0.1.1",
      mock: true,
    });
  }

  // Services overview (must come before /api/services to avoid partial match)
  if (path === "/api/services/overview") {
    return json({
      services: MOCK_SERVICES.map((s) => ({
        ...s,
        shards: Math.floor(Math.random() * 200) + 20,
      })),
    });
  }

  // Services list
  if (path === "/api/services") {
    return json({ services: getStressServices() });
  }

  // Service sub-routes
  if (path.match(/^\/api\/services\/(.+)\/dimensions$/)) {
    const svc = MOCK_SERVICES.find((s) => path.includes(s.name));
    const dimNames: string[] = svc?.dimensions ?? ["date"];
    const dimensionObjects = dimNames.map((name) => {
      if (name === "date") {
        return {
          name: "date",
          type: "date_range",
          description: "Date range for batch processing",
          granularity: "daily",
        };
      }
      if (name === "category") {
        return {
          name: "category",
          type: "fixed",
          description: "Market category",
          values: ["cefi", "tradfi", "defi"],
        };
      }
      if (name === "venue") {
        return {
          name: "venue",
          type: "fixed",
          description: "Trading venue",
          values: [],
        };
      }
      if (name === "feature_group") {
        return {
          name: "feature_group",
          type: "fixed",
          description: "Feature group",
          values: [],
        };
      }
      return { name, type: "fixed", description: name, values: [] };
    });
    return json({
      service: "instruments-service",
      dimensions: dimensionObjects,
      cli_args: { "--start-date": null, "--end-date": null },
    });
  }
  if (path.match(/^\/api\/services\/(.+)\/dependencies$/)) {
    return json({ upstream: [], downstream: [], dependents: [] });
  }
  if (path.match(/^\/api\/services\/(.+)\/checklist\/validate$/)) {
    return json({
      service: "instruments-service",
      ready: true,
      readiness_percent: 100,
      total_items: 10,
      completed_items: 10,
      blocking_items: [],
      warnings: [],
      can_proceed_with_acknowledgment: false,
    });
  }
  if (path.match(/^\/api\/services\/(.+)\/checklist$/)) {
    return json(MOCK_CHECKLIST);
  }
  if (path.match(/^\/api\/services\/(.+)\/status$/)) {
    return json({ status: "healthy", lastCheck: new Date().toISOString() });
  }
  if (path.match(/^\/api\/services\/(.+)\/start-dates$/)) {
    return json({ service: "instruments-service", start_dates: {} });
  }
  if (path.match(/^\/api\/services\/(.+)\/data-status$/)) {
    return json(MOCK_DATA_STATUS);
  }

  // Config
  if (path.match(/^\/api\/config\/venues/)) {
    const cat =
      new URL(url, "http://x").searchParams.get("category") ?? "equity";
    return json({ venues: MOCK_VENUES_BY_CATEGORY[cat] ?? [] });
  }
  if (path.match(/^\/api\/config\/start-dates/)) {
    return json({ dates: { equity: "2020-01-02", crypto: "2019-01-01" } });
  }
  if (path === "/api/config/region") {
    return json({
      gcs_region: "asia-northeast1",
      storage_region: "asia-northeast1",
      cloud_provider: "gcp",
      zones: ["asia-northeast1-a", "asia-northeast1-b", "asia-northeast1-c"],
    });
  }

  // Venues
  if (path.startsWith("/api/venues")) {
    return json({ categories: {}, category: "", venues: [], data_types: [] });
  }

  // Deployments
  if (path === "/api/deployments" && method === "POST") {
    const body = init?.body
      ? (JSON.parse(init.body as string) as Record<string, unknown>)
      : {};
    const newDep = {
      id: `dep-${Date.now()}`,
      service: (body.service as string | undefined) ?? "unknown",
      status: "running",
      startedAt: new Date().toISOString(),
      completedAt: null,
      shards:
        (body.shards as number | undefined) ??
        Math.floor(Math.random() * 100) + 20,
      mode: (body.mode as string | undefined) ?? "batch",
      cloudProvider: "gcp",
      region: (body.region as string | undefined) ?? "asia-northeast1-c",
      createdBy: "mock-user",
      tag: (body.tag as string | undefined) ?? null,
    };
    return json(
      {
        dry_run: false,
        deployment_id: newDep.id,
        shards: Array.from({ length: Math.min(newDep.shards, 10) }, (_, i) => ({
          shard_id: `shard-${i}`,
          status: "queued",
          category: "crypto",
          date_range: { start: "2026-01-01", end: "2026-03-15" },
        })),
        total_shards: newDep.shards,
        shards_truncated: newDep.shards > 10,
        deployment: newDep,
        message: "Deployment started (mock)",
      },
      201,
    );
  }
  if (path === "/api/deployments") {
    const deps = getStressDeployments();
    return json({
      deployments: deps,
      total: deps.length,
    });
  }
  if (path.match(/^\/api\/deployments\/(.+)\/quota$/)) {
    const shards = parseInt(
      new URL(url, "http://x").searchParams.get("shards") ?? "50",
    );
    return json({
      total_shards: shards,
      max_concurrent: 2000,
      estimated_duration_min: 5,
    });
  }
  if (path.match(/^\/api\/deployments\/(.+)\/events$/)) {
    const id = path.split("/")[3];
    return json({ deployment_id: id, events: [], count: 0 });
  }
  if (path.match(/^\/api\/deployments\/(.+)\/vm-events$/)) {
    const id = path.split("/")[3];
    return json({ deployment_id: id, events: [], count: 0 });
  }
  if (path.match(/^\/api\/deployments\/(.+)$/)) {
    const id = path.split("/").pop();
    const dep =
      MOCK_DEPLOYMENTS.find((d) => d.id === id) ?? MOCK_DEPLOYMENTS[0];
    return json({ deployment: dep });
  }

  // Quota (standalone endpoint)
  if (path === "/api/quota" || path.startsWith("/api/quota")) {
    const shards = parseInt(
      new URL(url, "http://x").searchParams.get("shards") ?? "50",
    );
    return json({
      ...MOCK_QUOTA,
      estimatedCost: { ...MOCK_QUOTA.estimatedCost, total: shards * 0.18 },
    });
  }

  // Data status (standalone)
  if (path.match(/^\/api\/data-status/)) {
    return json(MOCK_DATA_STATUS);
  }

  // Cloud builds
  if (
    path === "/api/cloud-builds" ||
    path === "/cloud-builds/triggers" ||
    path === "/api/cloud-builds/triggers"
  ) {
    return json({
      triggers: [
        {
          trigger_id: "trig-001",
          service: "instruments-service",
          type: "service",
          github_repo: "IggyIkenna/instruments-service",
          branch_pattern: "main",
          disabled: false,
          last_build: {
            status: "SUCCESS",
            commit_sha: "abc1234",
            create_time: "2026-01-14T20:00:00Z",
            duration_seconds: 120,
            log_url: null,
            build_id: "build-001",
          },
        },
      ],
    });
  }
  if (path.match(/^\/cloud-builds\/history\//)) {
    return json({ builds: [] });
  }
  if (path === "/cloud-builds/trigger" && method === "POST") {
    return json(
      {
        success: true,
        message: "Build triggered (mock)",
        build_id: `build-${Date.now()}`,
      },
      201,
    );
  }
  if (path.match(/^\/api\/cloud-builds\/(.+)\/trigger$/) && method === "POST") {
    return json(
      {
        build: {
          id: `cb-${Date.now()}`,
          status: "QUEUED",
          startTime: new Date().toISOString(),
        },
        message: "Build triggered (mock)",
      },
      201,
    );
  }

  // Service status
  if (path.match(/^\/(?:api\/)?service-status\/(.+)\/status$/)) {
    return json({
      service: "instruments-service",
      health: "healthy",
      last_data_update: "2026-01-15T08:00:00Z",
      last_deployment: "2026-01-15T10:00:00Z",
      last_build: "2026-01-14T20:00:00Z",
      last_code_push: "2026-01-14T18:00:00Z",
      anomalies: [],
      details: {
        deployment: {
          deployment_id: "dep-test-001",
          status: "completed",
          compute_type: "cloud_run",
        },
        build: {
          status: "SUCCESS",
          commit_sha: "abc1234",
          duration_seconds: 120,
        },
        code: { commit_sha: "abc1234", message: "feat: update", author: "dev" },
      },
    });
  }

  // Cache — handle both POST (client uses POST) and DELETE
  if (path === "/api/cache/clear") {
    return json({ cleared: true, message: "Cache cleared (mock)" });
  }
  if (path === "/api/cache") {
    return json({ cleared: true, message: "Cache cleared (mock)" });
  }

  // Categories
  if (path === "/api/categories") {
    return json({ categories: MOCK_CATEGORIES });
  }

  // Builds
  if (path.match(/^\/api\/builds\/.+/)) {
    return json([
      {
        tag: "v0.3.1-abc1234",
        display: "v0.3.1 (abc1234)",
        version: "0.3.1",
        branch: "main",
        is_v1: false,
      },
      {
        tag: "v0.3.0-def5678",
        display: "v0.3.0 (def5678)",
        version: "0.3.0",
        branch: "main",
        is_v1: false,
      },
    ]);
  }

  // Deploy a specific build
  if (path.match(/^\/api\/deployments\/.+\/deploy$/) && method === "POST") {
    const body = init?.body
      ? (JSON.parse(init.body as string) as Record<string, unknown>)
      : {};
    return json(
      {
        status: "deploying",
        service: path.split("/")[3],
        image_tag: (body.image_tag as string | undefined) ?? "latest",
        environment: (body.environment as string | undefined) ?? "dev",
      },
      201,
    );
  }

  // Rollback
  if (path.match(/^\/api\/deployments\/.+\/rollback$/) && method === "POST") {
    return json({
      id: path.split("/")[3],
      status: "rolling_back",
      message: "Rollback initiated (mock)",
    });
  }

  // Epics
  if (path === "/api/epics") {
    return json([
      {
        id: "epic-code-completion",
        name: "Code Completion",
        status: "in_progress",
        repos_total: 62,
        repos_done: 38,
        repos_blocked: 2,
        completion_pct: 61.3,
      },
      {
        id: "epic-deployment",
        name: "Deployment",
        status: "in_progress",
        repos_total: 62,
        repos_done: 12,
        repos_blocked: 5,
        completion_pct: 19.4,
      },
      {
        id: "epic-business",
        name: "Business Readiness",
        status: "not_started",
        repos_total: 62,
        repos_done: 0,
        repos_blocked: 0,
        completion_pct: 0,
      },
    ]);
  }
  if (path.match(/^\/api\/epics\/(.+)$/)) {
    const epicId = path.split("/").pop();
    return json({
      id: epicId,
      name: epicId,
      status: "in_progress",
      repos: MOCK_SERVICES.map((s) => ({
        name: s.name,
        code_gate: "C4",
        deployment_gate: "D1",
        business_gate: "B0",
      })),
    });
  }

  // Services overview
  if (
    path === "/api/service-status/overview" ||
    path === "/api/services/overview"
  ) {
    return json({
      services: MOCK_SERVICES.map((s) => ({
        name: s.name,
        layer: s.layer,
        category: s.category,
        status: s.status,
        health: "healthy",
        lastDeployed: s.lastDeployed,
      })),
      total: MOCK_SERVICES.length,
      healthy: MOCK_SERVICES.length - 1,
      warning: 1,
      error: 0,
    });
  }

  // Config dependencies
  if (path.match(/^\/api\/config\/dependencies\/.+/)) {
    return json({
      dependencies: ["unified-trading-library", "unified-cloud-interface"],
      service: path.split("/").pop(),
    });
  }

  // Config expected-start-dates
  if (path.match(/^\/api\/config\/expected-start-dates\/.+/)) {
    return json({
      service: path.split("/").pop(),
      start_dates: {
        equity: "2020-01-02",
        crypto: "2019-01-01",
        fx: "2018-01-02",
      },
    });
  }

  // Checklists
  if (path.match(/^\/api\/checklists\/(.+)\/checklist\/validate$/)) {
    return json({ valid: true, errors: [], warnings: [] });
  }
  if (path.match(/^\/api\/checklists\/(.+)\/checklist$/)) {
    return json(MOCK_CHECKLIST);
  }
  if (path === "/api/checklists") {
    return json({
      checklists: MOCK_SERVICES.map((s) => ({
        service: s.name,
        items_total: 10,
        items_complete: 7,
        completion_pct: 70.0,
      })),
    });
  }

  // Capabilities
  if (path === "/api/capabilities") {
    return json({
      capabilities: [
        "batch_deploy",
        "live_deploy",
        "cloud_build",
        "rollback",
        "config_browse",
      ],
      version: "0.3.0",
    });
  }
  if (path.match(/^\/api\/capabilities\/service-categories\/.+/)) {
    return json({
      categories: ["data", "ingestion", "features", "ml"],
      service: path.split("/").pop(),
    });
  }

  // Deployment quota-info
  if (path === "/api/deployments/quota-info") {
    return json({
      max_concurrent: 2000,
      current_running: 0,
      available: 2000,
      estimated_cost_per_shard: 0.18,
      daily_budget: 500.0,
      daily_spent: 0,
    });
  }

  // Deployment report
  if (path.match(/^\/api\/deployments\/(.+)\/report$/)) {
    return json({
      deployment_id: path.split("/")[3],
      shards_total: 50,
      shards_completed: 50,
      shards_failed: 0,
      duration_minutes: 12,
      cost_usd: 9.0,
    });
  }

  // Deployment live-health
  if (path.match(/^\/api\/deployments\/(.+)\/live-health$/)) {
    return json({
      deployment_id: path.split("/")[3],
      status: "healthy",
      checks: [],
    });
  }

  // Data status turbo
  if (path.startsWith("/api/data-status/turbo/cache/clear")) {
    return json({ cleared: true });
  }
  if (path.startsWith("/api/data-status/turbo")) {
    return json(MOCK_DATA_STATUS);
  }
  if (path.startsWith("/api/data-status/venue-filters")) {
    return json({
      venues: ["Binance", "OKX", "Bybit", "Coinbase"],
      categories: ["crypto", "equity", "fx"],
    });
  }
  if (path.startsWith("/api/data-status/list-files")) {
    return json({ files: [], directories: [], error: null });
  }
  if (path.startsWith("/api/data-status/instruments")) {
    return json({
      instruments: ["BTC/USDT", "ETH/USDT", "AAPL", "MSFT"],
      error: null,
    });
  }
  if (path.startsWith("/api/data-status/instrument-availability")) {
    return json({
      overall: { total: 5, available: 5, missing: 0 },
      by_data_type: {},
      error: null,
    });
  }

  // Cloud builds history (fix path to also match /api/ prefix)
  if (path.match(/^\/api\/cloud-builds\/history\/.+/)) {
    return json({ builds: [] });
  }

  // Config discover/browse
  if (path.match(/^\/api\/services\/(.+)\/discover-configs$/)) {
    return json({ configs: [], total: 0 });
  }
  if (path.match(/^\/api\/services\/(.+)\/list-directories$/)) {
    return json({ directories: [], total: 0 });
  }
  if (path.match(/^\/api\/services\/(.+)\/config-buckets$/)) {
    return json({
      buckets: ["mock-config-bucket"],
      project_id: "mock-project",
    });
  }

  return json({ error: "Mock: no handler", path }, 404);
}

export function installDeploymentMockHandlers(enabled = MOCK_MODE) {
  if (!enabled) return;

  const original = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : (input as Request).url;
    if (
      url.includes("/api/") ||
      url.includes("/cloud-builds/") ||
      url.includes("/service-status/")
    ) {
      return handleRoute(url, init);
    }
    return original(input, init);
  };
}
