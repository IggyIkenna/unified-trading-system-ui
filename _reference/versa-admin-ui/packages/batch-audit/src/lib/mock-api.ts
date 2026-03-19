export const MOCK_MODE = import.meta.env.VITE_MOCK_API === "true";

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

async function handle(url: string): Promise<Response> {
  await new Promise((r) => setTimeout(r, 60));
  const path = url.replace(/^https?:\/\/[^/]+/, "").replace(/\?.*$/, "");
  const json = <T>(d: T): Response =>
    new Response(JSON.stringify(d), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  if (path === "/api/health") return json({ status: "healthy", mock: true });
  if (path === "/api/jobs" || path.startsWith("/api/jobs?"))
    return json({ jobs: MOCK_JOBS, total: MOCK_JOBS.length });
  if (path.match(/\/api\/jobs\/(.+)/)) {
    const id = path.split("/").pop();
    return json({ job: MOCK_JOBS.find((j) => j.id === id) ?? MOCK_JOBS[0] });
  }
  return json({ error: "mock: no handler", path });
}

export function installMockHandlers(enabled = MOCK_MODE): void {
  if (!enabled) return;
  const orig = window.fetch.bind(window);
  window.fetch = async (input, init): Promise<Response> => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    if (url.includes("/api/")) return handle(url);
    return orig(input, init);
  };
  // eslint-disable-next-line no-console
  console.info("%c[MOCK MODE] batch-audit", "color:#fbbf24;font-weight:bold");
}
