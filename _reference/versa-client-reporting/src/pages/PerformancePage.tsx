import { useEffect, useState } from "react";
import { apiClient } from "../api/apiClient";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@unified-trading/ui-kit";
import { TOOLTIP_STYLE, AXIS_STYLE, CHART_COLORS } from "../lib/chart-theme";

interface PerformanceSummary {
  period: string;
  totalReturn: number;
  sharpe: number;
  maxDrawdown: number;
  byClient: { client: string; return: number; allocation: number }[];
  monthly: { month: string; return: number }[];
}

function pct(v: number) {
  return `${v >= 0 ? "+" : ""}${(v * 100).toFixed(2)}%`;
}

export function PerformancePage() {
  const [data, setData] = useState<PerformanceSummary | null>(null);

  useEffect(() => {
    apiClient
      .get<PerformanceSummary>("/api/performance/summary")
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data)
    return <div style={{ padding: "24px" }}>Loading performance...</div>;

  return (
    <div
      style={{
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >
      <h1 className="text-xl font-semibold">Performance — {data.period}</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Total Return</CardTitle>
          </CardHeader>
          <CardContent>
            <span
              className="text-2xl font-bold"
              style={{
                color:
                  data.totalReturn >= 0
                    ? "var(--color-accent-green)"
                    : "var(--color-accent-red)",
              }}
            >
              {pct(data.totalReturn)}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sharpe Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{data.sharpe.toFixed(2)}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Max Drawdown</CardTitle>
          </CardHeader>
          <CardContent>
            <span
              className="text-2xl font-bold"
              style={{ color: "var(--color-accent-red)" }}
            >
              -{pct(data.maxDrawdown)}
            </span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Returns</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.monthly}>
              <XAxis dataKey="month" {...AXIS_STYLE} />
              <YAxis
                {...AXIS_STYLE}
                tickFormatter={(v: number) => `${(v * 100).toFixed(1)}%`}
              />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(v) => [
                  `${(Number(v) * 100).toFixed(2)}%`,
                  "Return",
                ]}
              />
              <ReferenceLine y={0} stroke="var(--color-border-default)" />
              <Bar
                dataKey="return"
                fill={CHART_COLORS[0]}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance by Client</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header-cell">Client</th>
                <th className="table-header-cell text-right">Return</th>
                <th className="table-header-cell text-right">Allocation</th>
              </tr>
            </thead>
            <tbody>
              {data.byClient.map((c) => (
                <tr key={c.client} className="table-row">
                  <td className="table-cell font-medium">{c.client}</td>
                  <td
                    className="table-cell text-right"
                    style={{
                      color:
                        c.return >= 0
                          ? "var(--color-accent-green)"
                          : "var(--color-accent-red)",
                    }}
                  >
                    {pct(c.return)}
                  </td>
                  <td className="table-cell text-right">
                    {(c.allocation * 100).toFixed(0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
