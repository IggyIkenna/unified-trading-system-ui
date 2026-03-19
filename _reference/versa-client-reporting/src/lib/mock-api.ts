export const MOCK_MODE = import.meta.env.VITE_MOCK_API === "true";
const STRESS_SCENARIO = import.meta.env.VITE_STRESS_SCENARIO || "";
const MOCK_DELAY_MS = parseInt(import.meta.env.VITE_MOCK_DELAY_MS || "60", 10);

const MOCK_REPORTS = [
  {
    id: "rpt-001",
    name: "Apex Capital — February 2026",
    client: "Apex Capital",
    type: "monthly",
    status: "delivered",
    period: "2026-02",
    generatedAt: "2026-03-01T09:00:00Z",
    deliveredAt: "2026-03-01T10:00:00Z",
  },
  {
    id: "rpt-002",
    name: "Meridian Fund — February 2026",
    client: "Meridian Fund",
    type: "monthly",
    status: "pending",
    period: "2026-02",
    generatedAt: "2026-03-01T09:15:00Z",
    deliveredAt: null,
  },
  {
    id: "rpt-003",
    name: "QuantEdge Q4 2025",
    client: "QuantEdge HK",
    type: "quarterly",
    status: "delivered",
    period: "2025-Q4",
    generatedAt: "2026-01-15T09:00:00Z",
    deliveredAt: "2026-01-15T11:00:00Z",
  },
];

const MOCK_PERFORMANCE = {
  period: "2026-02",
  totalReturn: 0.187,
  sharpe: 2.34,
  maxDrawdown: 0.042,
  byClient: [
    { client: "Apex Capital", return: 0.21, allocation: 0.45 },
    { client: "Meridian Fund", return: 0.16, allocation: 0.35 },
    { client: "QuantEdge HK", return: 0.19, allocation: 0.2 },
  ],
  monthly: Array.from({ length: 12 }, (_, i) => ({
    month: `2025-${String(i + 1).padStart(2, "0")}`,
    return: (Math.random() - 0.3) * 0.1,
  })),
};

async function handle(url: string): Promise<Response> {
  await new Promise((r) => setTimeout(r, MOCK_DELAY_MS));
  const path = url.replace(/^https?:\/\/[^/]+/, "").replace(/\?.*$/, "");
  const json = <T>(d: T) =>
    new Response(JSON.stringify(d), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  if (path === "/api/health") return json({ status: "healthy", mock: true });
  if (path === "/api/reports") return json(MOCK_REPORTS);
  if (path === "/api/performance/summary") return json(MOCK_PERFORMANCE);
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
    if (url.includes("/api/")) return handle(url);
    return orig(input, init);
  };
  console.info(
    "%c[MOCK MODE] client-reporting-ui",
    "color:#fbbf24;font-weight:bold",
  );
}
