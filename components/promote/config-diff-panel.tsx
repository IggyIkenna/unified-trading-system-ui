"use client";

import * as React from "react";
import { GitBranch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CandidateStrategy } from "./types";

const DEFAULT_ROWS: {
  parameter: string;
  currentValue: string;
  proposedValue: string;
  impact: string;
}[] = [
  {
    parameter: "max_notional_per_leg",
    currentValue: "$2.5M",
    proposedValue: "$3.2M",
    impact: "Higher venue load",
  },
  {
    parameter: "signal_threshold",
    currentValue: "0.42",
    proposedValue: "0.38",
    impact: "More trades, higher turnover",
  },
  {
    parameter: "risk_budget_var",
    currentValue: "6.0%",
    proposedValue: "7.5%",
    impact: "Consumes more portfolio VaR",
  },
  {
    parameter: "kill_switch_dd",
    currentValue: "12%",
    proposedValue: "10%",
    impact: "Tighter protective stop",
  },
];

export function ConfigDiffPanel({ strategy }: { strategy: CandidateStrategy }) {
  const [approved, setApproved] = React.useState<Record<string, boolean>>({});
  const rows = strategy.configDiff?.length ? strategy.configDiff : DEFAULT_ROWS;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <GitBranch className="size-4 text-cyan-400" />
          Config diff — staging vs proposed production
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3 font-mono">
          Candidate: {strategy.name} v{strategy.version}
        </p>
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead>Parameter</TableHead>
              <TableHead>Current</TableHead>
              <TableHead>Proposed</TableHead>
              <TableHead>Impact</TableHead>
              <TableHead className="w-[100px]">Approve</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const ok = approved[r.parameter] === true;
              return (
                <TableRow key={r.parameter} className="text-xs">
                  <TableCell className="font-mono">{r.parameter}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {r.currentValue}
                  </TableCell>
                  <TableCell className="font-mono text-cyan-400">
                    {r.proposedValue}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.impact}
                  </TableCell>
                  <TableCell>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={ok}
                        onCheckedChange={(v) =>
                          setApproved((prev) => ({
                            ...prev,
                            [r.parameter]: v === true,
                          }))
                        }
                      />
                      {ok ? (
                        <Badge
                          variant="outline"
                          className="text-xs border-emerald-500/40 text-emerald-400"
                        >
                          OK
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Review
                        </span>
                      )}
                    </label>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
