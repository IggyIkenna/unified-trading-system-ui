import { ArrowRight, FileCheck, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { statusBg, statusColor, StatusIcon } from "./helpers";
import { PromoteWorkflowActions } from "./promote-workflow-actions";
import type { CandidateStrategy, GateCheck } from "./types";

export function DataValidationTab({
  strategy,
}: {
  strategy: CandidateStrategy;
}) {
  const dq = strategy.dataQuality;
  const gates: GateCheck[] = [
    {
      id: "coverage",
      label: "Data Coverage Score",
      status:
        dq.coverageScore >= 97
          ? "passed"
          : dq.coverageScore >= 90
            ? "warning"
            : "failed",
      mandatory: true,
      threshold: "≥ 97%",
      actual: `${dq.coverageScore}%`,
    },
    {
      id: "freshness",
      label: "Feed Freshness",
      status:
        dq.freshnessMinutes <= 2
          ? "passed"
          : dq.freshnessMinutes <= 5
            ? "warning"
            : "failed",
      mandatory: true,
      threshold: "≤ 2 min",
      actual: `${dq.freshnessMinutes} min`,
    },
    {
      id: "gaps",
      label: "Data Gaps (total)",
      status:
        dq.gapCount <= 5 ? "passed" : dq.gapCount <= 15 ? "warning" : "failed",
      mandatory: true,
      threshold: "≤ 5",
      actual: `${dq.gapCount}`,
    },
    {
      id: "integrity",
      label: "Integrity / Checksum Score",
      status:
        dq.integrityScore >= 99
          ? "passed"
          : dq.integrityScore >= 95
            ? "warning"
            : "failed",
      mandatory: true,
      threshold: "≥ 99%",
      actual: `${dq.integrityScore}%`,
    },
    {
      id: "venues",
      label: "Minimum Venue Coverage",
      status: dq.venues.length >= 3 ? "passed" : "warning",
      mandatory: true,
      threshold: "≥ 3 venues",
      actual: `${dq.venues.length} venues`,
    },
    {
      id: "time-range",
      label: "Historical Depth",
      status: "passed",
      mandatory: true,
      threshold: "≥ 2 years",
      actual: dq.timeRange,
    },
    ...(dq.crossVenueMaxDeviationBps !== undefined
      ? [
          {
            id: "cross-venue",
            label: "Cross-venue price deviation",
            status:
              dq.crossVenueMaxDeviationBps <= 3
                ? ("passed" as const)
                : dq.crossVenueMaxDeviationBps <= 8
                  ? ("warning" as const)
                  : ("failed" as const),
            mandatory: true,
            threshold: "≤ 3 bps",
            actual: `${dq.crossVenueMaxDeviationBps} bps`,
          },
        ]
      : []),
    ...(dq.survivorshipIncludesDelisted !== undefined
      ? [
          {
            id: "survivorship",
            label: "Survivorship / delisted handling",
            status: dq.survivorshipIncludesDelisted
              ? ("passed" as const)
              : ("warning" as const),
            mandatory: true,
            threshold: "Policy-aligned",
            actual: dq.survivorshipIncludesDelisted
              ? "Delisted included per policy"
              : "Cash-only survivors",
          },
        ]
      : []),
    {
      id: "outlier-filter",
      label: "Outlier Detection Applied",
      status: "passed",
      mandatory: false,
      threshold: "Enabled",
      actual: "MAD filter active",
    },
    {
      id: "split-adjust",
      label: "Split / Fork Adjusted",
      status: "passed",
      mandatory: false,
      threshold: "Applied",
      actual: "All events handled",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Data Validation — {strategy.name}</h3>
          <p className="text-sm text-muted-foreground">
            Verifying data quality, coverage, and integrity before model
            assessment
          </p>
        </div>
        <Badge
          variant="outline"
          className={statusBg(strategy.stages.data_validation.status)}
        >
          {strategy.stages.data_validation.status.replace("_", " ")}
        </Badge>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Coverage
            </p>
            <p
              className={cn(
                "text-2xl font-bold font-mono mt-1",
                dq.coverageScore >= 97 ? "text-emerald-400" : "text-amber-400",
              )}
            >
              {dq.coverageScore}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Freshness
            </p>
            <p className="text-2xl font-bold font-mono mt-1">
              {dq.freshnessMinutes}m
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Instruments
            </p>
            <p className="text-2xl font-bold font-mono mt-1">
              {dq.instruments}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Venues
            </p>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {dq.venues.map((v) => (
                <Badge key={v} variant="outline" className="text-[9px]">
                  {v}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileCheck className="size-4" />
            Gate Checks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {gates.map((gate) => (
              <div
                key={gate.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  statusBg(gate.status),
                )}
              >
                <div className="flex items-center gap-3">
                  <StatusIcon status={gate.status} className="size-4" />
                  <div>
                    <span className="text-sm font-medium">{gate.label}</span>
                    {gate.mandatory && (
                      <Badge variant="outline" className="text-[9px] px-1 ml-2">
                        Required
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm font-mono">
                  <span className="text-muted-foreground text-xs">
                    Threshold: {gate.threshold}
                  </span>
                  <span className={statusColor(gate.status)}>
                    {gate.actual}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers className="size-4 text-cyan-400" />
            Data lineage &amp; provenance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] md:text-xs">
            <Badge variant="outline" className="text-[9px]">
              {dq.primaryVendor ?? "Primary vendor"}
            </Badge>
            <ArrowRight className="size-3 text-muted-foreground" />
            <Badge variant="outline" className="text-[9px]">
              ETL {dq.etlPipelineVersion ?? "v2.14"}
            </Badge>
            <ArrowRight className="size-3 text-muted-foreground" />
            <Badge variant="outline" className="text-[9px]">
              Iceberg / Delta
            </Badge>
            <ArrowRight className="size-3 text-muted-foreground" />
            <Badge variant="outline" className="text-[9px]">
              Feature store
            </Badge>
            <ArrowRight className="size-3 text-muted-foreground" />
            <Badge
              variant="outline"
              className="text-[9px] border-cyan-500/40 text-cyan-400"
            >
              Model input
            </Badge>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Provenance: primary vendor feeds with contract IDs, ETL run
            timestamps, and schema hash logged per batch. Cross-venue
            consistency checks flag &gt;3σ deviations; survivorship includes
            delisted instruments where policy requires.
          </p>
        </CardContent>
      </Card>

      <PromoteWorkflowActions
        strategyId={strategy.id}
        strategyName={strategy.name}
        stage="data_validation"
        currentStage={strategy.currentStage}
      />
    </div>
  );
}
