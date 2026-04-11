"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/shared/spinner";
import type { CreateDeploymentResponse, GroupedShards, ShardPreviewInfo } from "@/lib/types/deployment";
import { cn } from "@/lib/utils";
import { Check, CheckCircle2, ChevronDown, ChevronUp, Clock, Copy, FolderOpen, Layers, Terminal } from "lucide-react";
import { useMemo, useState } from "react";

interface DeploymentResultProps {
  result: CreateDeploymentResponse;
  onClose: () => void;
  onDeployLive?: () => void;
  onLoadAllShards?: () => Promise<ShardPreviewInfo[]>;
}

// Extract date from shard - handles various dimension formats
function extractDate(shard: ShardPreviewInfo): string {
  const dims = shard.dimensions;

  // Try direct date field (might be string or object)
  if (dims.date) {
    if (typeof dims.date === "string") {
      return dims.date;
    }
    // If date is an object like {start: "2020-05-18", end: "2020-05-18"}
    if (typeof dims.date === "object" && dims.date !== null) {
      const dateObj = dims.date as Record<string, string>;
      return dateObj.start || dateObj.end || "unknown";
    }
  }

  // Try start_date field
  if (dims.start_date && typeof dims.start_date === "string") {
    return dims.start_date;
  }

  // Extract from shard_id (format: CATEGORY_DATE or CATEGORY_VENUE_DATE)
  // Look for YYYY-MM-DD pattern
  const dateMatch = shard.shard_id.match(/(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    return dateMatch[1];
  }

  return "unknown";
}

// Group shards by category -> date
function groupShards(shards: ShardPreviewInfo[]): GroupedShards {
  const grouped: GroupedShards = {};

  for (const shard of shards) {
    const category = String(shard.dimensions.category || "unknown");
    const date = extractDate(shard);

    if (!grouped[category]) {
      grouped[category] = {};
    }
    if (!grouped[category][date]) {
      grouped[category][date] = [];
    }
    grouped[category][date].push(shard);
  }

  return grouped;
}

export function DeploymentResult({ result, onClose, onDeployLive, onLoadAllShards }: DeploymentResultProps) {
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [showShards, setShowShards] = useState(false);
  const [allShards, setAllShards] = useState<ShardPreviewInfo[] | null>(null);
  const [loadingAllShards, setLoadingAllShards] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  // Group shards by category -> date (use all shards if loaded, otherwise preview shards)
  const groupedShards = useMemo(() => groupShards(allShards ?? result.shards ?? []), [allShards, result.shards]);

  const handleLoadAllShards = async () => {
    if (!onLoadAllShards || loadingAllShards) return;
    setLoadingAllShards(true);
    try {
      const shards = await onLoadAllShards();
      setAllShards(shards);
    } catch {
      // Error surfaced via allShards state
    } finally {
      setLoadingAllShards(false);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const toggleDate = (key: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleCopyCommand = async () => {
    await navigator.clipboard.writeText(result.cli_command);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2000);
  };

  const handleCopyId = async () => {
    if (result.deployment_id) {
      await navigator.clipboard.writeText(result.deployment_id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  return (
    <Card
      className={cn(
        "border-2",
        result.dry_run ? "border-[var(--color-accent-amber)]/50" : "border-[var(--color-accent-green)]/50",
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {result.dry_run ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent-amber)]/10">
                <Layers className="h-5 w-5 text-[var(--color-accent-amber)]" />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent-green)]/10">
                <CheckCircle2 className="h-5 w-5 text-[var(--color-accent-green)]" />
              </div>
            )}
            <div>
              <CardTitle className="text-lg">{result.dry_run ? "Dry Run Preview" : "Deployment Started"}</CardTitle>
              <CardDescription>{result.message}</CardDescription>
            </div>
          </div>
          <Badge variant={result.dry_run ? "warning" : "success"}>{result.dry_run ? "Preview" : "Live"}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)]">
            <div className="text-2xl font-mono font-bold text-[var(--color-text-primary)]">{result.total_shards}</div>
            <div className="text-xs text-[var(--color-text-muted)]">Total Shards</div>
          </div>
          <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)]">
            <div className="text-sm font-mono font-medium text-[var(--color-text-primary)]">{result.service}</div>
            <div className="text-xs text-[var(--color-text-muted)]">Service</div>
          </div>
          <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)]">
            <div className="text-sm font-mono font-medium text-[var(--color-text-primary)]">
              {result.compute_mode || "cloud_run"}
            </div>
            <div className="text-xs text-[var(--color-text-muted)]">Compute</div>
          </div>
        </div>

        {/* Deployment ID (for live deployments) */}
        {result.deployment_id && (
          <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-[var(--color-text-muted)] mb-1">Deployment ID</div>
                <code className="text-sm font-mono text-[var(--color-accent-cyan)]">{result.deployment_id}</code>
              </div>
              <Button variant="ghost" size="sm" onClick={handleCopyId} className="h-8">
                {copiedId ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="mt-2 text-xs text-[var(--color-text-muted)]">
              <Clock className="h-3 w-3 inline mr-1" />
              Started: {result.started_at}
            </div>
          </div>
        )}

        {/* Summary */}
        {result.summary && (
          <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)]">
            <div className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">Dimension Breakdown</div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(result.summary.breakdown || {}).map(([dim, values]) => (
                <div key={dim} className="text-xs">
                  <span className="text-[var(--color-text-muted)]">{dim}:</span>{" "}
                  <span className="font-mono text-[var(--color-text-secondary)]">
                    {typeof values === "number" ? values : Object.keys(values as Record<string, unknown>).length} values
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Advisor recommendations (from backend dry-run) */}
        {(() => {
          interface DryRunAdvisor {
            warnings?: string[];
            notes?: string[];
            recommended_date_granularity?: string;
            recommended_max_concurrent?: number;
          }
          const advisor = (result.summary as { advisor?: DryRunAdvisor })?.advisor;
          if (!advisor) return null;
          const warnings: string[] = Array.isArray(advisor.warnings) ? advisor.warnings : [];
          const notes: string[] = Array.isArray(advisor.notes) ? advisor.notes : [];
          const recGranularity: string | undefined = advisor.recommended_date_granularity;
          const recMaxConcurrent: number | undefined = advisor.recommended_max_concurrent;

          if (!recGranularity && !recMaxConcurrent && warnings.length === 0 && notes.length === 0) return null;

          return (
            <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)]">
              <div className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">Advisor</div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {typeof recMaxConcurrent === "number" && (
                  <div>
                    <span className="text-[var(--color-text-muted)]">max_concurrent:</span>{" "}
                    <span className="font-mono text-[var(--color-text-secondary)]">{recMaxConcurrent}</span>
                  </div>
                )}
                {recGranularity && (
                  <div>
                    <span className="text-[var(--color-text-muted)]">date_granularity:</span>{" "}
                    <span className="font-mono text-[var(--color-text-secondary)]">{recGranularity}</span>
                  </div>
                )}
              </div>

              {warnings.length > 0 && (
                <div className="mt-2 text-xs text-[var(--color-accent-amber)] space-y-1">
                  {warnings.map((w, i) => (
                    <div key={i}>- {w}</div>
                  ))}
                </div>
              )}

              {notes.length > 0 && (
                <div className="mt-2 text-xs text-[var(--color-text-muted)] space-y-1">
                  {notes.map((n, i) => (
                    <div key={i}>- {n}</div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Shard List (expandable, grouped by category -> date) */}
        {result.shards && result.shards.length > 0 && (
          <div className="border border-[var(--color-border-default)] rounded-lg overflow-hidden">
            <Button
              variant="ghost"
              onClick={() => setShowShards(!showShards)}
              className="w-full flex items-center justify-between p-3 bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-hover)] transition-colors h-auto rounded-none"
            >
              <span className="text-sm font-medium text-[var(--color-text-secondary)] flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                View Shards ({allShards ? allShards.length : result.shards.length}
                {!allShards && result.shards_truncated ? "+" : ""})
              </span>
              {showShards ? (
                <ChevronUp className="h-4 w-4 text-[var(--color-text-muted)]" />
              ) : (
                <ChevronDown className="h-4 w-4 text-[var(--color-text-muted)]" />
              )}
            </Button>
            {showShards && (
              <div className="max-h-96 overflow-y-auto">
                {/* Load All button if truncated */}
                {result.shards_truncated && !allShards && onLoadAllShards && (
                  <div className="p-3 bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border-subtle)]">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLoadAllShards}
                      disabled={loadingAllShards}
                      className="w-full"
                    >
                      {loadingAllShards ? (
                        <>
                          <Spinner className="h-4 w-4 mr-2" />
                          Loading all {result.total_shards} shards...
                        </>
                      ) : (
                        <>Load All {result.total_shards} Shards</>
                      )}
                    </Button>
                  </div>
                )}

                {/* Grouped shards by category -> date */}
                {Object.entries(groupedShards)
                  .sort()
                  .map(([category, dates]) => (
                    <div key={category} className="border-b border-[var(--color-border-subtle)] last:border-b-0">
                      {/* Category header */}
                      <Button
                        variant="ghost"
                        onClick={() => toggleCategory(category)}
                        className="w-full flex items-center justify-between p-2 px-3 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors h-auto rounded-none"
                      >
                        <span className="text-sm font-medium text-[var(--color-accent-cyan)]">{category}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {Object.keys(dates).length} dates
                          </Badge>
                          {expandedCategories.has(category) ? (
                            <ChevronUp className="h-3 w-3 text-[var(--color-text-muted)]" />
                          ) : (
                            <ChevronDown className="h-3 w-3 text-[var(--color-text-muted)]" />
                          )}
                        </div>
                      </Button>

                      {/* Dates within category */}
                      {expandedCategories.has(category) && (
                        <div className="pl-3">
                          {Object.entries(dates)
                            .sort()
                            .map(([date, shards]) => {
                              const dateKey = `${category}-${date}`;
                              return (
                                <div
                                  key={dateKey}
                                  className="border-b border-[var(--color-border-subtle)] last:border-b-0"
                                >
                                  {/* Date header */}
                                  <Button
                                    variant="ghost"
                                    onClick={() => toggleDate(dateKey)}
                                    className="w-full flex items-center justify-between p-2 pr-3 bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-hover)] transition-colors h-auto rounded-none"
                                  >
                                    <span className="text-xs font-mono text-[var(--color-text-secondary)]">{date}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-[var(--color-text-muted)]">
                                        {shards.length} shard
                                        {shards.length > 1 ? "s" : ""}
                                      </span>
                                      {expandedDates.has(dateKey) ? (
                                        <ChevronUp className="h-3 w-3 text-[var(--color-text-muted)]" />
                                      ) : (
                                        <ChevronDown className="h-3 w-3 text-[var(--color-text-muted)]" />
                                      )}
                                    </div>
                                  </Button>

                                  {/* Shards for this date */}
                                  {expandedDates.has(dateKey) && (
                                    <div className="pl-3 divide-y divide-[var(--color-border-subtle)]">
                                      {shards.map((shard, idx) => (
                                        <div key={shard.shard_id} className="p-2 pr-3 bg-[var(--color-bg-tertiary)]">
                                          <div className="flex items-center justify-between mb-1">
                                            <code className="text-[10px] font-mono text-[var(--color-accent-amber)]">
                                              {shard.shard_id}
                                            </code>
                                            <span className="text-[10px] text-[var(--color-text-muted)]">
                                              #{idx + 1}
                                            </span>
                                          </div>
                                          <div className="text-[10px] text-[var(--color-text-muted)] font-mono break-all">
                                            {shard.cli_args.join(" ")}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  ))}

                {/* Show truncation notice if still showing preview */}
                {result.shards_truncated && !allShards && (
                  <div className="p-3 bg-[var(--color-bg-tertiary)] text-center border-t border-[var(--color-border-subtle)]">
                    <span className="text-xs text-[var(--color-text-muted)]">
                      Showing first 50 of {result.total_shards} shards
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* CLI Command */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--color-text-secondary)] flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              Equivalent CLI Command
            </span>
            <Button variant="ghost" size="sm" onClick={handleCopyCommand} className="h-7 px-2">
              {copiedCommand ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <div className="bg-[var(--color-bg-primary)] rounded-lg p-3 border border-[var(--color-border-default)]">
            <pre className="text-xs font-mono text-[var(--color-text-secondary)] whitespace-pre-wrap break-all">
              <span className="text-[var(--color-accent-green)]">$</span> {result.cli_command}
            </pre>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border-default)]">
          {result.dry_run && onDeployLive ? (
            <>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={onDeployLive}>Deploy for Real</Button>
            </>
          ) : (
            <>
              <div className="text-xs text-[var(--color-text-muted)]">
                {result.dry_run ? "This was a preview. No jobs were started." : "Jobs are running in the background."}
              </div>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
