import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@unified-trading/ui-kit";

const PERF = {
  totalReturn: 0.187,
  sharpe: 2.34,
  maxDrawdown: 0.042,
  byClient: [
    { client: "Apex Capital", return: 0.21, allocation: 0.45 },
    { client: "Meridian Fund", return: 0.16, allocation: 0.35 },
    { client: "QuantEdge HK", return: 0.19, allocation: 0.2 },
  ],
};

export function PerformanceTab() {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
        Performance Summary
      </h2>

      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Total Return",
            value: `+${(PERF.totalReturn * 100).toFixed(1)}%`,
            color: "text-[var(--color-success)]",
          },
          {
            label: "Sharpe Ratio",
            value: PERF.sharpe.toFixed(2),
            color: "text-[var(--color-text-primary)]",
          },
          {
            label: "Max Drawdown",
            value: `-${(PERF.maxDrawdown * 100).toFixed(1)}%`,
            color: "text-[var(--color-error)]",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4">
              <div className={`text-2xl font-semibold font-mono ${s.color}`}>
                {s.value}
              </div>
              <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                {s.label}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>By Client</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header-cell">Client</th>
                <th className="table-header-cell">Return</th>
                <th className="table-header-cell">Allocation</th>
              </tr>
            </thead>
            <tbody>
              {PERF.byClient.map((c) => (
                <tr key={c.client} className="table-row">
                  <td className="table-cell font-medium text-[var(--color-text-primary)]">
                    {c.client}
                  </td>
                  <td className="table-cell font-mono text-[var(--color-success)]">
                    +{(c.return * 100).toFixed(1)}%
                  </td>
                  <td className="table-cell font-mono">
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
