"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle, Clock, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useExecutionAnalysis } from "@/hooks/api/use-strategies";
import { Spinner } from "@/components/shared/spinner";

const STEP_COLORS: Record<string, string> = {
  SIGNAL_GENERATION: "bg-blue-500/10 text-blue-600 border-blue-200",
  RISK_CHECK: "bg-amber-500/10 text-amber-600 border-amber-200",
  ALGO_SELECTION: "bg-purple-500/10 text-purple-600 border-purple-200",
  ORDER_ROUTING: "bg-indigo-500/10 text-indigo-600 border-indigo-200",
  EXECUTION: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
};

function InstructionCard({ instruction }: { instruction: Record<string, unknown> }) {
  const stepType = String(instruction.type ?? "UNKNOWN");
  const colorClass = STEP_COLORS[stepType] ?? "bg-muted text-muted-foreground";
  const output = (instruction.output ?? {}) as Record<string, unknown>;
  const input = (instruction.input ?? {}) as Record<string, unknown>;

  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${colorClass}`}>
          {String(instruction.step ?? "?")}
        </div>
        <div className="w-px h-full bg-border min-h-[24px]" />
      </div>
      <Card className="flex-1 mb-3">
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={colorClass}>
                {stepType.replace(/_/g, " ")}
              </Badge>
              {instruction.status === "completed" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {instruction.timestamp ? new Date(String(instruction.timestamp)).toLocaleTimeString() : ""}
            </span>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-3 pt-0">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Input</p>
              <div className="space-y-0.5">
                {Object.entries(input).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-muted-foreground">{k}:</span>
                    <span className="font-mono text-xs">{Array.isArray(v) ? v.join(", ") : String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Output</p>
              <div className="space-y-0.5">
                {Object.entries(output).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-muted-foreground">{k}:</span>
                    <span className="font-mono text-xs">{typeof v === "number" ? v.toLocaleString() : String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ExecutionAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const executionId = String(params.executionId ?? "");
  const { data, isLoading } = useExecutionAnalysis(executionId);

  const analysis = data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    );
  }

  const instructions = (analysis?.instructions ?? []) as unknown as Record<string, unknown>[];
  const fills = (analysis?.fills ?? []) as Record<string, unknown>[];
  const summary = analysis?.summary;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Execution Analysis</h1>
          <p className="text-sm text-muted-foreground">
            {analysis?.instrument ?? executionId}
            {analysis?.strategy_id ? ` — Strategy: ${analysis.strategy_id}` : ""}
          </p>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold">{summary.total_steps}</p>
              <p className="text-xs text-muted-foreground">Steps</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="flex items-center justify-center gap-1">
                {summary.all_passed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <p className="text-lg font-bold">{summary.all_passed ? "All Passed" : "Has Failures"}</p>
              </div>
              <p className="text-xs text-muted-foreground">Status</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold">{summary.total_fills}</p>
              <p className="text-xs text-muted-foreground">Fills</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="flex items-center justify-center gap-1">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <p className="text-lg font-bold">{summary.algo_used}</p>
              </div>
              <p className="text-xs text-muted-foreground">Algorithm</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ChevronRight className="w-5 h-5" /> Instruction Pipeline
        </h2>
        <div className="pl-2">
          {instructions.map((inst, idx) => (
            <InstructionCard key={idx} instruction={inst} />
          ))}
        </div>
      </div>

      {fills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fills</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Fees</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fills.map((fill, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono text-xs">{String(fill.id ?? "—").slice(0, 12)}</TableCell>
                    <TableCell>
                      <Badge variant={String(fill.side) === "BUY" ? "default" : "destructive"}>
                        {String(fill.side ?? "—")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{Number(fill.quantity ?? 0).toFixed(4)}</TableCell>
                    <TableCell className="text-right font-mono">${Number(fill.price ?? 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono">${Number(fill.fees ?? 0).toFixed(2)}</TableCell>
                    <TableCell>{String(fill.venue ?? "—")}</TableCell>
                    <TableCell className="text-xs">
                      {fill.filled_at ? new Date(String(fill.filled_at)).toLocaleTimeString() : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
