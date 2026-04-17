"use client";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMLGovernance, useModelVersions } from "@/hooks/api/use-ml-models";
import type { ModelVersion } from "@/lib/types/ml";
import { CheckCircle2, Clock, Shield } from "lucide-react";
import * as React from "react";

export default function MLGovernancePage() {
  const { data: govData, isLoading: govLoading } = useMLGovernance();
  const { data: versionsData, isLoading: verLoading } = useModelVersions();

  const isLoading = govLoading || verLoading;
  const versions = React.useMemo(
    () => ((versionsData as { data?: ModelVersion[] })?.data ?? []) as ModelVersion[],
    [versionsData],
  );

  const approvedVersions = versions.filter((v) => v.approvedAt);
  const pendingVersions = versions.filter((v) => !v.approvedAt && v.status !== "deprecated" && v.status !== "archived");

  if (isLoading) {
    return (
      <div className="platform-page-width space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="platform-page-width space-y-6 p-6">
      <PageHeader
        title="ML Governance"
        description="Approval status and audit trail for model deployments"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="pt-0 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total Models</p>
                <p className="text-2xl font-bold mt-0.5">{versions.length}</p>
              </div>
              <div className="rounded-lg bg-purple-500/10 p-2">
                <Shield className="size-4 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-0 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Approved</p>
                <p className="text-2xl font-bold mt-0.5">{approvedVersions.length}</p>
              </div>
              <div className="rounded-lg bg-emerald-500/10 p-2">
                <CheckCircle2 className="size-4 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-0 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Pending Review</p>
                <p className="text-2xl font-bold mt-0.5">{pendingVersions.length}</p>
              </div>
              <div className="rounded-lg bg-amber-500/10 p-2">
                <Clock className="size-4 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {versions.length > 0 ? (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Model Approval Audit Trail</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registered By</TableHead>
                  <TableHead>Approved By</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono text-xs">{v.modelFamilyId}</TableCell>
                    <TableCell className="font-mono text-xs">v{v.version}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${v.approvedAt ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-amber-500/15 text-amber-400 border-amber-500/30"}`}
                      >
                        {v.approvedAt ? "approved" : "pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{v.registeredBy}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{v.approvedBy ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(v.approvedAt ?? v.registeredAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={<Shield className="size-10 text-muted-foreground" />}
          title="No model versions"
          description="Register models to see their governance audit trail."
        />
      )}
    </div>
  );
}
