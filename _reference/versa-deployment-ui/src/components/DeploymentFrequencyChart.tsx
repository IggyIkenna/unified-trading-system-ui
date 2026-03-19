import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle } from "./ui/card";

interface DeploymentDayDatum {
  date: string;
  successful: number;
  failed: number;
  rolled_back: number;
}

const MOCK_DEPLOYMENT_FREQUENCY: DeploymentDayDatum[] = [
  { date: "Mar 10", successful: 8, failed: 1, rolled_back: 0 },
  { date: "Mar 11", successful: 12, failed: 0, rolled_back: 1 },
  { date: "Mar 12", successful: 6, failed: 2, rolled_back: 0 },
  { date: "Mar 13", successful: 15, failed: 0, rolled_back: 0 },
  { date: "Mar 14", successful: 10, failed: 1, rolled_back: 1 },
  { date: "Mar 15", successful: 4, failed: 0, rolled_back: 0 },
  { date: "Mar 16", successful: 9, failed: 0, rolled_back: 0 },
];

const COLORS = {
  successful: "var(--color-accent-green, #22c55e)",
  failed: "var(--color-accent-red, #ef4444)",
  rolled_back: "var(--color-accent-amber, #f59e0b)",
};

export function DeploymentFrequencyChart() {
  const totalDeploys = MOCK_DEPLOYMENT_FREQUENCY.reduce(
    (sum, d) => sum + d.successful + d.failed + d.rolled_back,
    0,
  );
  const totalUnsuccessful = MOCK_DEPLOYMENT_FREQUENCY.reduce(
    (sum, d) => sum + d.failed + d.rolled_back,
    0,
  );
  const successRate =
    totalDeploys > 0
      ? (((totalDeploys - totalUnsuccessful) / totalDeploys) * 100).toFixed(1)
      : "0.0";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deployment Frequency (7d)</CardTitle>
      </CardHeader>
      <div style={{ padding: "0 16px 16px" }}>
        <div
          style={{
            display: "flex",
            gap: 24,
            marginBottom: 16,
            fontSize: 12,
            color: "var(--color-text-muted, #71717a)",
          }}
        >
          <span>
            Total deploys:{" "}
            <span
              style={{
                fontFamily: "monospace",
                color: "var(--color-text-primary, #fafafa)",
              }}
            >
              {totalDeploys}
            </span>
          </span>
          <span>
            Success rate:{" "}
            <span
              style={{
                fontFamily: "monospace",
                color: "var(--color-accent-green, #22c55e)",
              }}
            >
              {successRate}%
            </span>
          </span>
        </div>
        <div
          data-testid="deployment-frequency-chart"
          style={{ width: "100%", height: 280 }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={MOCK_DEPLOYMENT_FREQUENCY}
              margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border, #27272a)"
              />
              <XAxis
                dataKey="date"
                tick={{
                  fontSize: 11,
                  fill: "var(--color-text-muted, #71717a)",
                }}
              />
              <YAxis
                tick={{
                  fontSize: 11,
                  fill: "var(--color-text-muted, #71717a)",
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-surface, #18181b)",
                  border: "1px solid var(--color-border, #27272a)",
                  borderRadius: "6px",
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar
                dataKey="successful"
                name="Successful"
                stackId="a"
                fill={COLORS.successful}
              />
              <Bar
                dataKey="failed"
                name="Failed"
                stackId="a"
                fill={COLORS.failed}
              />
              <Bar
                dataKey="rolled_back"
                name="Rolled Back"
                stackId="a"
                fill={COLORS.rolled_back}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}
