"use client";

/**
 * Plan D — Per-instance version timeline.
 *
 * REVISED PATH (2026-04-25 placement audit): per-instance, NOT a top-level
 * versions list. Renders the version lineage from genesis → drafts →
 * pending_approval → approved → rolled_out → retired (most-recent-first).
 */

import * as React from "react";
import { useParams } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { VersionLineageBadge } from "@/components/strategy-catalogue/VersionLineageBadge";
import { listVersionsForInstance, seedGenesisVersion } from "@/lib/api/mocks/strategy-versions.mock";

export default function StrategyVersionsTab(): React.JSX.Element {
  const params = useParams<{ id: string }>();
  const instanceId = params?.id ?? "";

  const [versions, setVersions] = React.useState<ReturnType<typeof listVersionsForInstance>>([]);

  React.useEffect(() => {
    if (!instanceId) return;
    if (listVersionsForInstance(instanceId).length === 0) {
      seedGenesisVersion(instanceId);
    }
    setVersions(listVersionsForInstance(instanceId));
  }, [instanceId]);

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Versions" description={`Version lineage for instance ${instanceId}`} />
      <Card>
        <CardContent className="p-4">
          {versions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No versions yet.</p>
          ) : (
            <ul className="space-y-3" data-testid="version-timeline">
              {versions.map((v, idx) => {
                const versionIndex = versions.length - 1 - idx;
                const parentIndex = v.parent_version_id === null ? null : Math.max(0, versionIndex - 1);
                return (
                  <li
                    key={v.version_id}
                    className="flex items-center justify-between border-b pb-2"
                    data-testid={`version-row-${v.version_id}`}
                  >
                    <div className="flex items-center gap-3">
                      <VersionLineageBadge versionIndex={versionIndex} parentVersionIndex={parentIndex} />
                      <span className="font-mono text-xs">{v.version_id}</span>
                      <Badge variant="outline">{v.status}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {v.authored_by} · {v.maturity_phase}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
