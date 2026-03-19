import { useEffect, useState } from "react";
import { apiClient } from "@/api/client";
import type { ResultSummary, ResultsResponse } from "@/api/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from "@unified-trading/ui-kit";
import { BarChart2 } from "lucide-react";

export function GridResults() {
  const [results, setResults] = useState<ResultSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<ResultsResponse>("/results")
      .then((res) => setResults(res.data.results || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-[var(--color-text-primary)]">
            Grid Results
          </h1>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
            Backtest run summary grid
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BarChart2 size={16} className="text-[var(--color-text-muted)]" />
          <span className="text-xs text-[var(--color-text-muted)]">
            {results.length} results
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Backtest Results</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-xs text-[var(--color-text-muted)]">
              Loading results…
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--color-text-muted)]">
              No results found. Run a backtest to see results here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="table-row border-b border-[var(--color-border)]">
                    <th className="table-header-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                      Run ID
                    </th>
                    <th className="table-header-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                      Strategy
                    </th>
                    <th className="table-header-cell px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                      Sharpe
                    </th>
                    <th className="table-header-cell px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                      Net Alpha (bps)
                    </th>
                    <th className="table-header-cell px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                      P&amp;L
                    </th>
                    <th className="table-header-cell px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                      Trades
                    </th>
                    <th className="table-header-cell px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr
                      key={r.result_id}
                      className="table-row border-b border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] transition-colors"
                    >
                      <td className="table-cell px-4 py-3 font-mono text-xs text-[var(--color-text-secondary)]">
                        {(r.run_id ?? r.result_id ?? "").slice(0, 8)}
                      </td>
                      <td className="table-cell px-4 py-3 text-[var(--color-text-primary)]">
                        {r.strategy_description}
                      </td>
                      <td className="table-cell px-4 py-3 text-right tabular-nums">
                        {(r.sharpe_ratio ?? 0).toFixed(2)}
                      </td>
                      <td
                        className={`table-cell px-4 py-3 text-right tabular-nums font-medium ${
                          (r.net_alpha_bps ?? 0) >= 0
                            ? "text-[var(--color-success)]"
                            : "text-[var(--color-danger)]"
                        }`}
                      >
                        {(r.net_alpha_bps ?? 0).toFixed(1)}
                      </td>
                      <td
                        className={`table-cell px-4 py-3 text-right tabular-nums font-medium ${
                          (r.pnl ?? 0) >= 0
                            ? "text-[var(--color-success)]"
                            : "text-[var(--color-danger)]"
                        }`}
                      >
                        {(r.pnl ?? 0).toFixed(2)}
                      </td>
                      <td className="table-cell px-4 py-3 text-right tabular-nums text-[var(--color-text-secondary)]">
                        {r.total_trades ?? 0}
                      </td>
                      <td className="table-cell px-4 py-3 text-center">
                        <Badge variant="success">completed</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
