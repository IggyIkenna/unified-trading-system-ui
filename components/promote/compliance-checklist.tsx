import { FileCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SR_11_7_ITEMS } from "./mock-fixtures";
import { statusBg, StatusIcon } from "./helpers";
import type { CandidateStrategy, GateStatus } from "./types";

export function ComplianceChecklist({
  strategy,
}: {
  strategy: CandidateStrategy;
}) {
  const comp = strategy.compliance;
  const docGate: GateStatus = comp.documentationComplete ? "passed" : "warning";

  const checklistRows =
    comp.documentationChecklist ??
    SR_11_7_ITEMS.map((item) => ({
      label: item.label,
      complete: comp.documentationComplete,
    }));

  const baseDate = new Date(comp.lastValidationDate);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileCheck className="size-4 text-amber-400" />
          SR 11-7 — documentation checklist
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg border border-border/60 p-3 space-y-1">
            <p className="text-muted-foreground">Registry ID</p>
            <p className="font-mono text-lg">
              {comp.modelId ?? `REG-${strategy.id}`}
            </p>
          </div>
          <div className="rounded-lg border border-border/60 p-3 space-y-1">
            <p className="text-muted-foreground">Risk materiality score</p>
            <p className="font-mono text-lg">
              {comp.riskMaterialityScore ?? "—"}
            </p>
          </div>
          <div className="rounded-lg border border-border/60 p-3 space-y-1">
            <p className="text-muted-foreground">Model tier</p>
            <p className="font-mono text-lg">Tier {comp.modelTier}</p>
          </div>
          <div className="rounded-lg border border-border/60 p-3 space-y-1">
            <p className="text-muted-foreground">Owner</p>
            <p className="font-mono">{comp.modelOwner}</p>
          </div>
          <div className="rounded-lg border border-border/60 p-3 space-y-1">
            <p className="text-muted-foreground">Classification</p>
            <p className="font-mono">{comp.regulatoryClassification}</p>
          </div>
          <div className="rounded-lg border border-border/60 p-3 space-y-1">
            <p className="text-muted-foreground">Validation cycle</p>
            <p className="font-mono">
              {comp.lastValidationDate} → {comp.nextValidationDate}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {checklistRows.map((row, i) => {
            const st: GateStatus = row.complete ? "passed" : "pending";
            const itemDate = new Date(baseDate);
            itemDate.setDate(baseDate.getDate() - (checklistRows.length - i));
            const dateStr =
              row.lastUpdated ?? itemDate.toISOString().slice(0, 10);
            return (
              <div
                key={row.label}
                className={cn(
                  "flex items-center justify-between p-2.5 rounded-lg border text-xs",
                  statusBg(st),
                )}
              >
                <div className="flex items-center gap-2">
                  <StatusIcon status={st} className="size-3.5" />
                  <span>{row.label}</span>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  {dateStr}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={statusBg(docGate)}>
            Documentation{" "}
            {comp.documentationComplete ? "complete" : "incomplete"}
          </Badge>
          <Badge
            variant="outline"
            className={
              comp.mrcReviewed ? statusBg("passed") : statusBg("pending")
            }
          >
            MRC {comp.mrcReviewed ? "reviewed" : "pending"}
          </Badge>
          <Badge
            variant="outline"
            className={
              comp.fcaNotified ? statusBg("passed") : statusBg("not_started")
            }
          >
            FCA {comp.fcaNotified ? "notified" : "n/a"}
          </Badge>
          <Badge
            variant="outline"
            className={
              comp.sec17a4Compliant ? statusBg("passed") : statusBg("warning")
            }
          >
            SEC 17a-4 {comp.sec17a4Compliant ? "aligned" : "review"}
          </Badge>
          <Badge
            variant="outline"
            className={
              comp.finra4512Compliant ? statusBg("passed") : statusBg("warning")
            }
          >
            FINRA 4512 {comp.finra4512Compliant ? "aligned" : "review"}
          </Badge>
        </div>

        <div className="rounded-lg border border-border/60 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="text-left p-2 font-medium">Regulatory row</th>
                <th className="text-left p-2 font-medium">Status</th>
                <th className="text-left p-2 font-medium">Evidence</th>
              </tr>
            </thead>
            <tbody className="font-mono text-xs">
              <tr className="border-b border-border/40">
                <td className="p-2">Books &amp; records (17a-4)</td>
                <td className="p-2">
                  {comp.sec17a4Compliant ? "Pass" : "Gap"}
                </td>
                <td className="p-2 text-muted-foreground">
                  WORM archive + immutability attestation
                </td>
              </tr>
              <tr className="border-b border-border/40">
                <td className="p-2">Communications / supervision (4512)</td>
                <td className="p-2">
                  {comp.finra4512Compliant ? "Pass" : "Gap"}
                </td>
                <td className="p-2 text-muted-foreground">
                  Supervisory workflow + retention map
                </td>
              </tr>
              <tr>
                <td className="p-2">Model risk (SR 11-7)</td>
                <td className="p-2">{comp.mrcReviewed ? "Pass" : "Pending"}</td>
                <td className="p-2 text-muted-foreground">
                  MRC minutes ref · tier {comp.modelTier}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
