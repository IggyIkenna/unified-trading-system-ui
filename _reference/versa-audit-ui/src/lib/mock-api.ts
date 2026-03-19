export const MOCK_MODE = import.meta.env.VITE_MOCK_API === "true";
const STRESS_SCENARIO = import.meta.env.VITE_STRESS_SCENARIO || "";
const MOCK_DELAY_MS = parseInt(import.meta.env.VITE_MOCK_DELAY_MS || "60", 10);

const MOCK_JOBS = [
  {
    id: "job-001",
    name: "instruments-service daily",
    service: "instruments-service",
    status: "completed",
    startedAt: "2026-03-10T02:00:00Z",
    completedAt: "2026-03-10T02:45:00Z",
    shardsTotal: 48,
    shardsCompleted: 48,
    shardsFailed: 0,
    category: "equity",
    date: "2026-03-09",
  },
  {
    id: "job-002",
    name: "market-tick-data batch",
    service: "market-tick-data-service",
    status: "running",
    startedAt: "2026-03-10T09:30:00Z",
    completedAt: null,
    shardsTotal: 126,
    shardsCompleted: 78,
    shardsFailed: 0,
    category: "crypto",
    date: "2026-03-09",
  },
  {
    id: "job-003",
    name: "features-delta-one",
    service: "features-delta-one-service",
    status: "failed",
    startedAt: "2026-03-10T07:00:00Z",
    completedAt: "2026-03-10T07:22:00Z",
    shardsTotal: 72,
    shardsCompleted: 31,
    shardsFailed: 8,
    category: "equity",
    date: "2026-03-09",
    error: "Quota exceeded",
  },
  {
    id: "job-004",
    name: "ml-training weekly",
    service: "ml-training-service",
    status: "completed",
    startedAt: "2026-03-09T22:00:00Z",
    completedAt: "2026-03-09T23:40:00Z",
    shardsTotal: 12,
    shardsCompleted: 12,
    shardsFailed: 0,
    category: "all",
    date: "2026-W10",
  },
  {
    id: "job-005",
    name: "features-volatility",
    service: "features-volatility-service",
    status: "completed",
    startedAt: "2026-03-10T08:00:00Z",
    completedAt: "2026-03-10T09:15:00Z",
    shardsTotal: 96,
    shardsCompleted: 96,
    shardsFailed: 0,
    category: "equity",
    date: "2026-03-09",
  },
];

function getStressJobs(): typeof MOCK_JOBS {
  if (STRESS_SCENARIO === "MISSING_DATA") return [];
  if (STRESS_SCENARIO === "BIG_DRAWDOWN")
    return MOCK_JOBS.map((j) => ({
      ...j,
      status: "failed",
      shardsFailed: j.shardsTotal,
      error: "Emergency shutdown",
    }));
  if (STRESS_SCENARIO === "HIGH_CARDINALITY") {
    return Array.from({ length: 1000 }, (_, i) => ({
      id: `job-hc-${String(i).padStart(4, "0")}`,
      name: `Job ${i}`,
      service: `service-${i % 20}`,
      status: ["completed", "running", "failed"][i % 3],
      startedAt: new Date(Date.now() - i * 3600000).toISOString(),
      completedAt:
        i % 3 === 0 ? new Date(Date.now() - i * 1800000).toISOString() : null,
      shardsTotal: Math.floor(Math.random() * 200) + 10,
      shardsCompleted: Math.floor(Math.random() * 100),
      shardsFailed: i % 3 === 2 ? Math.floor(Math.random() * 20) : 0,
      category: ["equity", "crypto", "fx"][i % 3],
      date: "2026-03-10",
    }));
  }
  if (STRESS_SCENARIO === "STALE_DATA")
    return MOCK_JOBS.map((j) => ({
      ...j,
      startedAt: "2020-01-01T00:00:00Z",
      completedAt: "2020-01-01T01:00:00Z",
    }));
  return MOCK_JOBS;
}

async function handle(url: string): Promise<Response> {
  await new Promise((r) => setTimeout(r, MOCK_DELAY_MS));
  const path = url.replace(/^https?:\/\/[^/]+/, "").replace(/\?.*$/, "");
  const json = <T>(d: T) =>
    new Response(JSON.stringify(d), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  if (path === "/health") return json({ status: "healthy", mock: true });
  if (path === "/batch/jobs" || path.startsWith("/batch/jobs?")) {
    const jobs = getStressJobs();
    return json({ jobs, total: jobs.length });
  }
  if (path.match(/\/batch\/jobs\/(.+)/)) {
    const id = path.split("/").pop();
    return json({ job: MOCK_JOBS.find((j) => j.id === id) ?? MOCK_JOBS[0] });
  }
  return json({ error: "mock: no handler", path });
}

export function installMockHandlers(enabled = MOCK_MODE) {
  if (!enabled) return;
  const orig = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : (input as Request).url;
    if (
      url.includes("/api/") ||
      url.includes("/health") ||
      url.includes("/batch/")
    )
      return handle(url);
    return orig(input, init);
  };
  console.info(
    "%c[MOCK MODE] batch-audit-ui",
    "color:#fbbf24;font-weight:bold",
  );
}
