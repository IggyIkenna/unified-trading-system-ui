/**
 * Mock API handlers for deployment-ui.
 * Active when VITE_MOCK_API=true.
 *
 * All /api/* fetch calls are intercepted and return realistic simulated data.
 * This enables full E2E smoke testing without a real backend.
 */

export const MOCK_MODE = import.meta.env.VITE_MOCK_API === "true";

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
    startedAt: "2026-03-10T08:00:00Z",
    completedAt: "2026-03-10T08:45:00Z",
    shards: 48,
    mode: "batch",
    cloudProvider: "gcp",
    region: "asia-northeast1-c",
    createdBy: "pipeline-agent",
    tag: "daily-run",
  },
  {
    id: "dep-002",
    service: "market-tick-data-service",
    status: "running",
    startedAt: "2026-03-10T09:30:00Z",
    completedAt: null,
    shards: 126,
    mode: "batch",
    cloudProvider: "gcp",
    region: "asia-northeast1-c",
    createdBy: "pipeline-agent",
    tag: null,
  },
  {
    id: "dep-003",
    service: "features-delta-one-service",
    status: "failed",
    startedAt: "2026-03-10T07:00:00Z",
    completedAt: "2026-03-10T07:22:00Z",
    shards: 72,
    mode: "batch",
    cloudProvider: "gcp",
    region: "asia-northeast1-c",
    createdBy: "pipeline-agent",
    tag: "debug-run",
    error: "Quota exceeded: VM instance quota in asia-northeast1-c",
  },
  {
    id: "dep-004",
    service: "ml-training-service",
    status: "completed",
    startedAt: "2026-03-09T22:00:00Z",
    completedAt: "2026-03-09T23:40:00Z",
    shards: 12,
    mode: "batch",
    cloudProvider: "gcp",
    region: "us-central1",
    createdBy: "pipeline-agent",
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

function delay(ms = 60): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
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
  const path = url.replace(/^https?:\/\/[^/]+/, "").replace(/\?.*$/, "");

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
    return json({ services: MOCK_SERVICES });
  }

  // Service sub-routes
  if (path.match(/^\/api\/services\/(.+)\/dimensions$/)) {
    const svc = MOCK_SERVICES.find((s) => path.includes(s.name));
    return json({ dimensions: svc?.dimensions ?? ["date"] });
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
      { deployment: newDep, message: "Deployment started (mock)" },
      201,
    );
  }
  if (path === "/api/deployments") {
    return json({
      deployments: MOCK_DEPLOYMENTS,
      total: MOCK_DEPLOYMENTS.length,
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
  if (path === "/api/cloud-builds" || path === "/cloud-builds/triggers") {
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
  if (path.match(/^\/service-status\/(.+)\/status$/)) {
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

  // Cache
  if (path === "/api/cache/clear" && method === "DELETE") {
    return json({ cleared: true, message: "Cache cleared (mock)" });
  }
  if (path === "/api/cache" && method === "DELETE") {
    return json({ cleared: true, message: "Cache cleared (mock)" });
  }

  // Categories
  if (path === "/api/categories") {
    return json({ categories: MOCK_CATEGORIES });
  }

  console.warn("[MOCK] Unhandled path:", path);
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

  console.info(
    "%c[MOCK MODE] deployment-ui: all /api/* calls intercepted",
    "color: #fbbf24; font-weight: bold",
  );
}
