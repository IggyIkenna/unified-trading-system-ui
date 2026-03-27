"use client";

import type { WidgetComponentProps } from "../widget-registry";
import { useRiskData } from "./risk-data-context";
import { CollapsibleSection } from "../shared";
import { KpiStrip, type KpiMetric } from "../shared";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import { WidgetScroll } from "@/components/shared/widget-scroll";

export function RiskGreeksSummaryWidget(_props: WidgetComponentProps) {
  const { portfolioGreeks, positionGreeks, greeksTimeSeries, secondOrderRisks, portfolioGreeksData } = useRiskData();

  const greeks = portfolioGreeksData?.portfolio ?? portfolioGreeks;

  const greekMetrics: KpiMetric[] = [
    { label: "Delta", value: greeks.delta.toFixed(2), sentiment: "neutral" },
    { label: "Gamma", value: greeks.gamma.toFixed(3), sentiment: "neutral" },
    { label: "Vega", value: `$${greeks.vega.toLocaleString()}`, sentiment: "neutral" },
    { label: "Theta", value: `$${greeks.theta.toLocaleString()}/d`, sentiment: "negative" },
    { label: "Rho", value: `$${greeks.rho.toLocaleString()}`, sentiment: "neutral" },
  ];

  return (
    <WidgetScroll axes="vertical">
      <div className="space-y-2 p-1">
        <KpiStrip metrics={greekMetrics} columns={5} />

        <div>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-[10px]">Instrument</TableHead>
                <TableHead className="text-[10px]">Venue</TableHead>
                <TableHead className="text-[10px] text-right">Qty</TableHead>
                <TableHead className="text-[10px] text-right">Delta</TableHead>
                <TableHead className="text-[10px] text-right">Gamma</TableHead>
                <TableHead className="text-[10px] text-right">Vega</TableHead>
                <TableHead className="text-[10px] text-right">Theta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positionGreeks.map((pos) => (
                <TableRow key={pos.instrument as string}>
                  <TableCell className="text-[11px] font-medium">{pos.instrument as string}</TableCell>
                  <TableCell className="text-[11px] text-muted-foreground">{pos.venue as string}</TableCell>
                  <TableCell className="text-[11px] text-right font-mono">{pos.qty as number}</TableCell>
                  <TableCell className="text-[11px] text-right font-mono">{(pos.delta as number).toFixed(2)}</TableCell>
                  <TableCell className="text-[11px] text-right font-mono">{(pos.gamma as number).toFixed(3)}</TableCell>
                  <TableCell className="text-[11px] text-right font-mono">
                    ${(pos.vega as number).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-[11px] text-right font-mono text-rose-400">
                    ${(pos.theta as number).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/30 font-bold">
                <TableCell className="text-[11px]">Portfolio Total</TableCell>
                <TableCell />
                <TableCell />
                <TableCell className="text-[11px] text-right font-mono">{greeks.delta.toFixed(2)}</TableCell>
                <TableCell className="text-[11px] text-right font-mono">{greeks.gamma.toFixed(3)}</TableCell>
                <TableCell className="text-[11px] text-right font-mono">${greeks.vega.toLocaleString()}</TableCell>
                <TableCell className="text-[11px] text-right font-mono text-rose-400">
                  ${greeks.theta.toLocaleString()}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {greeksTimeSeries.length > 0 && (
          <div className="h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={greeksTimeSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={9} />
                <YAxis yAxisId="left" stroke="var(--muted-foreground)" fontSize={9} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="var(--muted-foreground)"
                  fontSize={9}
                  tickFormatter={(v) => `$${((v as number) / 1000).toFixed(0)}K`}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "10px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "10px" }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="delta"
                  stroke="#3b82f6"
                  name="Delta"
                  strokeWidth={1.5}
                  dot={false}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="gamma"
                  stroke="#f59e0b"
                  name="Gamma"
                  strokeWidth={1.5}
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="vega"
                  stroke="#22c55e"
                  name="Vega ($)"
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <CollapsibleSection title="Second-Order Risks" defaultOpen={false}>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 rounded bg-muted/30 text-center">
              <div className="text-[10px] text-muted-foreground">Volga (d²V/dσ²)</div>
              <div className="text-sm font-bold font-mono">${secondOrderRisks.volga.toLocaleString()}</div>
              <div className="text-[9px] text-muted-foreground">per 1% vol move</div>
            </div>
            <div className="p-2 rounded bg-muted/30 text-center">
              <div className="text-[10px] text-muted-foreground">Vanna (d²V/dS·dσ)</div>
              <div className="text-sm font-bold font-mono text-rose-400">
                ${secondOrderRisks.vanna.toLocaleString()}
              </div>
              <div className="text-[9px] text-muted-foreground">per 1% spot × 1% vol</div>
            </div>
            <div className="p-2 rounded bg-muted/30 text-center">
              <div className="text-[10px] text-muted-foreground">Slide (vol decay)</div>
              <div className="text-sm font-bold font-mono text-rose-400">
                ${secondOrderRisks.slide.toLocaleString()}
              </div>
              <div className="text-[9px] text-muted-foreground">per day</div>
            </div>
          </div>
        </CollapsibleSection>

        {portfolioGreeksData?.per_underlying && portfolioGreeksData.per_underlying.length > 0 && (
          <CollapsibleSection title="Per-Underlying Breakdown" defaultOpen={false}>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-[10px]">Underlying</TableHead>
                  <TableHead className="text-[10px] text-right">Delta</TableHead>
                  <TableHead className="text-[10px] text-right">Gamma</TableHead>
                  <TableHead className="text-[10px] text-right">Vega</TableHead>
                  <TableHead className="text-[10px] text-right">Theta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portfolioGreeksData.per_underlying.map((row) => (
                  <TableRow key={row.underlying}>
                    <TableCell className="text-[11px] font-medium">{row.underlying}</TableCell>
                    <TableCell className="text-[11px] text-right font-mono">{row.delta.toFixed(2)}</TableCell>
                    <TableCell className="text-[11px] text-right font-mono">{row.gamma.toFixed(4)}</TableCell>
                    <TableCell className="text-[11px] text-right font-mono">${row.vega.toLocaleString()}</TableCell>
                    <TableCell className="text-[11px] text-right font-mono text-rose-400">
                      ${row.theta.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CollapsibleSection>
        )}
      </div>
    </WidgetScroll>
  );
}
