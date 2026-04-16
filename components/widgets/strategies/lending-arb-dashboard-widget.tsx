"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";

interface LendingArbRow {
  protocol: string;
  token: string;
  supplyApy: number;
  borrowApy: number;
  spreadBps: number;
  utilization: number;
}

const MOCK_DATA: LendingArbRow[] = [
  { protocol: "Aave V3", token: "USDC", supplyApy: 4.2, borrowApy: 3.1, spreadBps: 110, utilization: 82.4 },
  { protocol: "Aave V3", token: "WETH", supplyApy: 2.1, borrowApy: 1.8, spreadBps: 30, utilization: 71.2 },
  { protocol: "Aave V3", token: "DAI", supplyApy: 3.9, borrowApy: 3.4, spreadBps: 50, utilization: 78.1 },
  { protocol: "Aave V3", token: "USDT", supplyApy: 4.5, borrowApy: 3.3, spreadBps: 120, utilization: 85.6 },
  { protocol: "Morpho Blue", token: "USDC", supplyApy: 5.1, borrowApy: 4.0, spreadBps: 110, utilization: 88.3 },
  { protocol: "Morpho Blue", token: "WETH", supplyApy: 2.8, borrowApy: 2.5, spreadBps: 30, utilization: 65.7 },
  { protocol: "Morpho Blue", token: "DAI", supplyApy: 4.7, borrowApy: 3.6, spreadBps: 110, utilization: 80.2 },
  { protocol: "Morpho Blue", token: "USDT", supplyApy: 5.3, borrowApy: 4.1, spreadBps: 120, utilization: 87.9 },
  { protocol: "Compound V3", token: "USDC", supplyApy: 3.8, borrowApy: 3.5, spreadBps: 30, utilization: 79.5 },
  { protocol: "Compound V3", token: "WETH", supplyApy: 1.9, borrowApy: 1.5, spreadBps: 40, utilization: 68.3 },
  { protocol: "Compound V3", token: "DAI", supplyApy: 3.5, borrowApy: 3.0, spreadBps: 50, utilization: 74.8 },
  { protocol: "Compound V3", token: "USDT", supplyApy: 4.0, borrowApy: 3.2, spreadBps: 80, utilization: 81.2 },
  { protocol: "Kamino", token: "USDC", supplyApy: 6.2, borrowApy: 4.8, spreadBps: 140, utilization: 91.0 },
  { protocol: "Kamino", token: "WETH", supplyApy: 3.1, borrowApy: 2.3, spreadBps: 80, utilization: 72.4 },
  { protocol: "Kamino", token: "DAI", supplyApy: 5.5, borrowApy: 4.2, spreadBps: 130, utilization: 86.1 },
  { protocol: "Kamino", token: "USDT", supplyApy: 6.8, borrowApy: 5.0, spreadBps: 180, utilization: 93.2 },
];

export function LendingArbDashboardWidget(_props: WidgetComponentProps) {
  const bestArb = MOCK_DATA.reduce((best, row) => (row.spreadBps > best.spreadBps ? row : best), MOCK_DATA[0]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Lending Protocol Arb Dashboard</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 flex items-center justify-between">
          <div className="text-xs text-emerald-400">
            <span className="font-medium">Best Arb:</span> {bestArb.protocol} — {bestArb.token}
          </div>
          <Badge variant="success" className="text-[10px]">
            {bestArb.spreadBps} bps
          </Badge>
        </div>

        <div className="overflow-auto max-h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px]">Protocol</TableHead>
                <TableHead className="text-[10px]">Token</TableHead>
                <TableHead className="text-[10px] text-right">Supply APY</TableHead>
                <TableHead className="text-[10px] text-right">Borrow APY</TableHead>
                <TableHead className="text-[10px] text-right">Spread</TableHead>
                <TableHead className="text-[10px] text-right">Util %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_DATA.map((row) => (
                <TableRow
                  key={`${row.protocol}-${row.token}`}
                  className={row.spreadBps > 50 ? "bg-emerald-500/5" : ""}
                >
                  <TableCell className="text-xs">{row.protocol}</TableCell>
                  <TableCell className="text-xs font-mono">{row.token}</TableCell>
                  <TableCell className="text-xs font-mono text-right">{row.supplyApy.toFixed(1)}%</TableCell>
                  <TableCell className="text-xs font-mono text-right">{row.borrowApy.toFixed(1)}%</TableCell>
                  <TableCell className="text-xs font-mono text-right">
                    <Badge variant={row.spreadBps > 50 ? "success" : "secondary"} className="text-[10px]">
                      {row.spreadBps}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-right">{row.utilization.toFixed(1)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
