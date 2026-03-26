import { Fingerprint } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { fmtNum, statusBg } from "./helpers";
import type { CandidateStrategy } from "./types";

export function FeatureStabilityPanel({
  strategy,
}: {
  strategy: CandidateStrategy;
}) {
  const dead = strategy.featureStability.filter(
    (f) => f.status === "dead",
  ).length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Fingerprint className="size-4 text-cyan-400" />
          Feature Stability
          <Badge variant="outline" className="text-xs ml-auto font-mono">
            dead features: {dead}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead>Feature</TableHead>
              <TableHead className="text-right">Imp (train)</TableHead>
              <TableHead className="text-right">Imp (now)</TableHead>
              <TableHead className="text-right">PSI</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {strategy.featureStability.map((f) => (
              <TableRow key={f.featureName} className="text-xs">
                <TableCell className="font-mono max-w-[180px] truncate">
                  {f.featureName}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {fmtNum(f.importanceAtTraining, 3)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {fmtNum(f.importanceCurrent, 3)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {fmtNum(f.psi, 2)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs capitalize",
                      statusBg(
                        f.status === "stable"
                          ? "passed"
                          : f.status === "drifting"
                            ? "warning"
                            : "failed",
                      ),
                    )}
                  >
                    {f.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
