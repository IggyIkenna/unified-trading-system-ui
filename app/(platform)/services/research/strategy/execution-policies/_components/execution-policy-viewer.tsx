"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MOCK_EXECUTION_POLICIES } from "@/lib/mocks/fixtures/architecture-v2-fixtures";
import { cn } from "@/lib/utils";

const DECISION_CLASS: Record<string, string> = {
  ALLOW: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
  REJECT: "text-red-400 border-red-500/40 bg-red-500/10",
  RESIZE: "text-amber-400 border-amber-500/40 bg-amber-500/10",
  DEFER: "text-sky-400 border-sky-500/40 bg-sky-500/10",
};

export function ExecutionPolicyViewer() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="platform-page-width space-y-6 p-6">
        <div className="space-y-2">
          <h1 className="text-page-title font-semibold tracking-tight">Execution policies</h1>
          <p className="text-body text-muted-foreground max-w-2xl">
            Per (venue × action × condition) decisions applied in execution-service
            Layer-3 pre-flight. Policies are artifact-versioned so strategy instances pin their
            policy set at promotion time.
          </p>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-xs text-muted-foreground">Venue</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Action</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Condition</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Decision</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Rationale</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Version</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_EXECUTION_POLICIES.map((p, idx) => (
                  <TableRow
                    key={`${p.venue}-${p.action}-${idx}`}
                    className="border-border/30"
                    data-testid={`policy-row-${idx}`}
                  >
                    <TableCell className="font-medium text-xs">{p.venue}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {p.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {p.condition}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px]", DECISION_CLASS[p.decision] ?? "")}
                      >
                        {p.decision}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.rationale}</TableCell>
                    <TableCell className="font-mono text-[10px]">{p.policy_version}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
