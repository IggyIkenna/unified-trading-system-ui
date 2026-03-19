import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@unified-trading/ui-kit";

interface JobCompletionDatum {
  job_name: string;
  shards_completed: number;
  shards_failed: number;
  shards_pending: number;
}

const MOCK_JOB_COMPLETION: JobCompletionDatum[] = [
  {
    job_name: "instruments-svc",
    shards_completed: 48,
    shards_failed: 0,
    shards_pending: 0,
  },
  {
    job_name: "tick-data",
    shards_completed: 78,
    shards_failed: 0,
    shards_pending: 48,
  },
  {
    job_name: "delta-one",
    shards_completed: 31,
    shards_failed: 8,
    shards_pending: 33,
  },
  {
    job_name: "ml-training",
    shards_completed: 12,
    shards_failed: 0,
    shards_pending: 0,
  },
  {
    job_name: "volatility",
    shards_completed: 96,
    shards_failed: 2,
    shards_pending: 22,
  },
  {
    job_name: "onchain",
    shards_completed: 18,
    shards_failed: 0,
    shards_pending: 6,
  },
  {
    job_name: "risk-recon",
    shards_completed: 36,
    shards_failed: 1,
    shards_pending: 3,
  },
];

const COLORS = {
  completed: "var(--color-success, #22c55e)",
  failed: "var(--color-error, #ef4444)",
  pending: "var(--color-warning, #f59e0b)",
};

export function JobCompletionChart() {
  const totalShards = MOCK_JOB_COMPLETION.reduce(
    (sum, d) => sum + d.shards_completed + d.shards_failed + d.shards_pending,
    0,
  );
  const totalFailed = MOCK_JOB_COMPLETION.reduce(
    (sum, d) => sum + d.shards_failed,
    0,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shard Completion by Job</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-6 mb-4 text-xs text-[var(--color-text-muted)]">
          <span>
            Total shards:{" "}
            <span className="font-mono text-[var(--color-text-primary)]">
              {totalShards}
            </span>
          </span>
          <span>
            Failed:{" "}
            <span className="font-mono text-[var(--color-error)]">
              {totalFailed}
            </span>
          </span>
        </div>
        <div
          data-testid="job-completion-chart"
          style={{ width: "100%", height: 320 }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={MOCK_JOB_COMPLETION}
              margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border, #27272a)"
              />
              <XAxis
                dataKey="job_name"
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
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar
                dataKey="shards_completed"
                name="Completed"
                stackId="a"
                fill={COLORS.completed}
              >
                {MOCK_JOB_COMPLETION.map((_, idx) => (
                  <Cell key={`completed-${idx}`} fill={COLORS.completed} />
                ))}
              </Bar>
              <Bar
                dataKey="shards_failed"
                name="Failed"
                stackId="a"
                fill={COLORS.failed}
              >
                {MOCK_JOB_COMPLETION.map((_, idx) => (
                  <Cell key={`failed-${idx}`} fill={COLORS.failed} />
                ))}
              </Bar>
              <Bar
                dataKey="shards_pending"
                name="Pending"
                stackId="a"
                fill={COLORS.pending}
              >
                {MOCK_JOB_COMPLETION.map((_, idx) => (
                  <Cell key={`pending-${idx}`} fill={COLORS.pending} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
