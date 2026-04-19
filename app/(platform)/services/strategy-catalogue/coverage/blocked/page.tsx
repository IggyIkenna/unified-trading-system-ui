"use client";

import Link from "next/link";
import { ArrowUpRight, ShieldBan } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BLOCK_LIST } from "@/lib/architecture-v2";

export default function BlockedCoveragePage() {
  const entries = BLOCK_LIST;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="platform-page-width space-y-6 p-6">
        <PageHeader
          title="Block-list browser"
          description="Every BLOCKED cell in the coverage matrix groups into one of these 10 root causes. Each entry lists affected archetypes, remediation, and the UAC-gap reference that would unblock it."
        >
          <Badge variant="outline">{entries.length} entries</Badge>
        </PageHeader>

        <div className="grid grid-cols-1 gap-4">
          {entries.map((entry) => (
            <Card key={entry.id} data-testid={`block-list-${entry.id}`}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="font-mono text-xs text-red-500"
                  >
                    <ShieldBan className="mr-1 size-3" aria-hidden />
                    {entry.id}
                  </Badge>
                  <CardTitle className="text-heading">{entry.summary}</CardTitle>
                </div>
                <CardDescription className="pt-2">
                  <span className="text-xs text-muted-foreground">
                    Archetypes affected:
                  </span>{" "}
                  <span className="flex flex-wrap gap-1 pt-1">
                    {entry.archetypesAffected.map((archetype) => (
                      <Badge
                        key={archetype}
                        variant="secondary"
                        className="font-mono text-[0.65rem]"
                      >
                        {archetype}
                      </Badge>
                    ))}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="space-y-2">
                  {entry.explanation.map((paragraph, idx) => (
                    <p key={idx} className="text-muted-foreground">
                      {paragraph}
                    </p>
                  ))}
                </div>

                <div className="rounded-md border border-border/60 bg-muted/30 p-3">
                  <div className="text-xs font-medium text-foreground">
                    Remediation
                  </div>
                  <p className="mt-1 text-muted-foreground">{entry.remediation}</p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground">
                      Affected cells
                    </div>
                    <ul className="mt-1 list-inside list-disc space-y-0.5 font-mono text-[0.65rem] text-foreground">
                      {entry.affectedCells.map((cell) => (
                        <li key={cell}>{cell}</li>
                      ))}
                    </ul>
                  </div>
                  {entry.uacGapRefs.length > 0 ? (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground">
                        UAC registry gaps
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {entry.uacGapRefs.map((gap) => (
                          <Link
                            key={gap}
                            href={`https://github.com/IggyIkenna/unified-trading-pm/blob/main/codex/09-strategy/architecture-v2/uac-registry-gaps.md#${gap}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background px-2 py-0.5 text-[0.65rem] hover:bg-accent"
                          >
                            Gap #{gap}
                            <ArrowUpRight className="size-3" aria-hidden />
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
