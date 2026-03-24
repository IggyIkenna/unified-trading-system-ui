"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Play,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  GitBranch,
  Hammer,
  ChevronDown,
  ChevronRight,
  Library,
  AlertTriangle,
  Box,
  Wrench,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  getCloudBuildTriggers,
  triggerCloudBuild,
  getCloudBuildHistory,
  type BuildTrigger,
  type BuildInfo,
} from "@/hooks/deployment/_api-stub";

interface CloudBuildsTabProps {
  serviceName?: string; // If provided, filter to just this service
}

function getBuildStatusIcon(status: string) {
  switch (status) {
    case "SUCCESS":
      return (
        <CheckCircle className="h-4 w-4 text-[var(--color-accent-green)]" />
      );
    case "FAILURE":
    case "TIMEOUT":
    case "CANCELLED":
      return <XCircle className="h-4 w-4 text-[var(--color-accent-red)]" />;
    case "WORKING":
    case "QUEUED":
    case "PENDING":
      return (
        <RefreshCw className="h-4 w-4 text-[var(--color-accent-cyan)] animate-spin" />
      );
    default:
      return <AlertCircle className="h-4 w-4 text-[var(--color-text-muted)]" />;
  }
}

function getBuildStatusColor(status: string): string {
  switch (status) {
    case "SUCCESS":
      return "bg-[var(--color-accent-green)]";
    case "FAILURE":
    case "TIMEOUT":
    case "CANCELLED":
      return "bg-[var(--color-accent-red)]";
    case "WORKING":
    case "QUEUED":
    case "PENDING":
      return "bg-[var(--color-accent-cyan)]";
    default:
      return "bg-[var(--color-text-muted)]";
  }
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "-";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
}

function formatTimeAgo(timestamp: string | null): string {
  if (!timestamp) return "-";
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

// Reusable trigger card component
interface TriggerCardProps {
  trigger: BuildTrigger;
  isExpanded: boolean;
  onExpand: () => void;
  branchInput: string;
  onBranchChange: (value: string) => void;
  onTriggerBuild: () => void;
  isTriggering: boolean;
  buildHistory?: BuildInfo[];
  loadingHistory: boolean;
}

function TriggerCard({
  trigger,
  isExpanded,
  onExpand,
  branchInput,
  onBranchChange,
  onTriggerBuild,
  isTriggering,
  buildHistory,
  loadingHistory,
}: TriggerCardProps) {
  const isLibrary = trigger.type === "library";
  const isInfrastructure = trigger.type === "infrastructure";

  return (
    <Card
      className={cn(
        "overflow-hidden",
        isLibrary && "border-l-4 border-l-[var(--color-accent-purple)]",
        isInfrastructure && "border-l-4 border-l-[var(--color-accent-pink)]",
      )}
    >
      <div
        className="p-4 cursor-pointer hover:bg-[var(--color-bg-hover)]"
        onClick={onExpand}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-[var(--color-text-muted)]" />
            ) : (
              <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
            )}

            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{trigger.service}</span>
                {isLibrary && (
                  <Badge
                    variant="outline"
                    className="text-[8px] text-[var(--color-accent-purple)] border-[var(--color-accent-purple)]"
                  >
                    SDK
                  </Badge>
                )}
                {trigger.disabled && (
                  <Badge
                    variant="outline"
                    className="text-[8px] text-[var(--color-accent-amber)]"
                  >
                    DISABLED
                  </Badge>
                )}
              </div>
              {trigger.github_repo && (
                <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 mt-0.5">
                  <GitBranch className="h-3 w-3" />
                  {trigger.github_repo}
                  {trigger.branch_pattern && (
                    <span className="text-[var(--color-accent-cyan)]">
                      ({trigger.branch_pattern})
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Last build status */}
            {trigger.last_build ? (
              <div className="flex items-center gap-2 text-sm">
                {getBuildStatusIcon(trigger.last_build.status)}
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={cn(
                        "text-[9px]",
                        getBuildStatusColor(trigger.last_build.status),
                      )}
                    >
                      {trigger.last_build.status}
                    </Badge>
                    {trigger.last_build.commit_sha && (
                      <code className="text-[10px] text-[var(--color-text-muted)]">
                        {trigger.last_build.commit_sha}
                      </code>
                    )}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-2 justify-end mt-0.5">
                    <Clock className="h-3 w-3" />
                    {formatTimeAgo(trigger.last_build.create_time)}
                    {trigger.last_build.duration_seconds && (
                      <span>
                        ({formatDuration(trigger.last_build.duration_seconds)})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <span className="text-xs text-[var(--color-text-muted)]">
                No builds yet
              </span>
            )}

            {/* Trigger button */}
            <div
              className="flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Input
                placeholder="main"
                value={branchInput}
                onChange={(e) => onBranchChange(e.target.value)}
                className="w-24 h-8 text-xs"
              />
              <Button
                size="sm"
                onClick={onTriggerBuild}
                disabled={isTriggering || trigger.disabled}
                className="bg-[var(--color-accent-purple)] hover:bg-[var(--color-accent-purple)]/80"
              >
                {isTriggering ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Logs link */}
            {trigger.last_build?.log_url && (
              <a
                href={trigger.last_build.log_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[var(--color-accent-cyan)] hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Expanded build history */}
      {isExpanded && (
        <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-4">
          <div className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">
            Recent Builds
          </div>

          {loadingHistory ? (
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading history...
            </div>
          ) : buildHistory?.length ? (
            <div className="space-y-2">
              {buildHistory.map((build) => (
                <div
                  key={build.build_id}
                  className="flex items-center justify-between p-2 rounded bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)]"
                >
                  <div className="flex items-center gap-3">
                    {getBuildStatusIcon(build.status)}
                    <Badge
                      className={cn(
                        "text-[9px]",
                        getBuildStatusColor(build.status),
                      )}
                    >
                      {build.status}
                    </Badge>
                    {build.commit_sha && (
                      <code className="text-xs text-[var(--color-text-muted)]">
                        {build.commit_sha}
                      </code>
                    )}
                    {build.branch && (
                      <span className="text-xs text-[var(--color-accent-cyan)]">
                        {build.branch}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                    {build.duration_seconds && (
                      <span>{formatDuration(build.duration_seconds)}</span>
                    )}
                    <span>{formatTimeAgo(build.create_time)}</span>
                    {build.log_url && (
                      <a
                        href={build.log_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--color-accent-cyan)] hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-[var(--color-text-muted)]">
              No build history available
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export function CloudBuildsTab({ serviceName }: CloudBuildsTabProps) {
  const [triggers, setTriggers] = useState<BuildTrigger[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggeringService, setTriggeringService] = useState<string | null>(
    null,
  );
  const [triggerResult, setTriggerResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [branchInputs, setBranchInputs] = useState<Record<string, string>>({});
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [buildHistory, setBuildHistory] = useState<Record<string, BuildInfo[]>>(
    {},
  );
  const [loadingHistory, setLoadingHistory] = useState<string | null>(null);

  const fetchTriggers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCloudBuildTriggers();
      let filteredTriggers = response.triggers;
      if (serviceName) {
        filteredTriggers = filteredTriggers.filter(
          (t) => t.service === serviceName,
        );
      }
      // Sort: libraries first, then services alphabetically
      filteredTriggers.sort((a, b) => {
        // Libraries come first
        if (a.type === "library" && b.type !== "library") return -1;
        if (a.type !== "library" && b.type === "library") return 1;
        return a.service.localeCompare(b.service);
      });
      setTriggers(filteredTriggers);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load build triggers",
      );
    } finally {
      setLoading(false);
    }
  }, [serviceName]);

  // Separate libraries, services, and infrastructure
  const { libraries, services, infrastructure, librariesWithIssues } =
    useMemo(() => {
      const libs = triggers.filter((t) => t.type === "library");
      const svcs = triggers.filter((t) => t.type === "service");
      const infra = triggers.filter((t) => t.type === "infrastructure");
      // Check for libraries with failing builds
      const issueLibs = libs.filter(
        (lib) =>
          lib.last_build &&
          ["FAILURE", "TIMEOUT", "CANCELLED"].includes(lib.last_build.status),
      );
      return {
        libraries: libs,
        services: svcs,
        infrastructure: infra,
        librariesWithIssues: issueLibs,
      };
    }, [triggers]);

  useEffect(() => {
    fetchTriggers();
  }, [fetchTriggers]);

  // Auto-refresh when there are running builds
  const hasRunningBuilds = useMemo(() => {
    return triggers.some(
      (t) =>
        t.last_build &&
        ["WORKING", "QUEUED", "PENDING"].includes(t.last_build.status),
    );
  }, [triggers]);

  useEffect(() => {
    if (!hasRunningBuilds) return;

    // Poll every 15 seconds when builds are running
    const interval = setInterval(() => {
      fetchTriggers();
    }, 15000);

    return () => clearInterval(interval);
  }, [hasRunningBuilds, fetchTriggers]);

  const handleTriggerBuild = async (service: string) => {
    const branch = branchInputs[service] || "main";
    setTriggeringService(service);
    setTriggerResult(null);

    try {
      const response = await triggerCloudBuild(service, branch);
      setTriggerResult({
        success: response.success,
        message: response.message,
      });

      if (response.success) {
        // Refresh triggers to show the new build
        setTimeout(() => fetchTriggers(), 2000);
      }
    } catch (err) {
      setTriggerResult({
        success: false,
        message: err instanceof Error ? err.message : "Failed to trigger build",
      });
    } finally {
      setTriggeringService(null);
    }
  };

  const handleExpandService = async (service: string) => {
    if (expandedService === service) {
      setExpandedService(null);
      return;
    }

    setExpandedService(service);

    // Load build history if not already loaded
    if (!buildHistory[service]) {
      setLoadingHistory(service);
      try {
        const response = await getCloudBuildHistory(service);
        setBuildHistory((prev) => ({ ...prev, [service]: response.builds }));
      } catch {
        // Error surfaced via buildHistory state
      } finally {
        setLoadingHistory(null);
      }
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-[var(--color-accent-cyan)]" />
          <span className="ml-2">Loading build triggers...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center gap-2 text-[var(--color-accent-red)]">
            <XCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
          <Button onClick={fetchTriggers} className="mt-4" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Hammer className="h-5 w-5 text-[var(--color-accent-purple)]" />
          <h2 className="text-lg font-semibold">Cloud Build Triggers</h2>
          <Badge variant="outline" className="text-xs">
            {triggers.length} triggers
          </Badge>
          {hasRunningBuilds && (
            <Badge className="text-[10px] bg-[var(--color-accent-cyan)] animate-pulse">
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Auto-refreshing
            </Badge>
          )}
        </div>
        <Button onClick={fetchTriggers} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Result message */}
      {triggerResult && (
        <div
          className={cn(
            "p-3 rounded-lg flex items-center gap-2 border",
            triggerResult.success ? "status-success" : "status-error",
          )}
        >
          {triggerResult.success ? (
            <CheckCircle className="h-4 w-4 text-[var(--color-accent-green)]" />
          ) : (
            <XCircle className="h-4 w-4 text-[var(--color-accent-red)]" />
          )}
          <span className="text-sm">{triggerResult.message}</span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-6 px-2"
            onClick={() => setTriggerResult(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Library Issues Warning */}
      {librariesWithIssues.length > 0 && (
        <div className="p-4 rounded-lg status-warning">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-[var(--color-accent-amber)] flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-[var(--color-accent-amber)]">
                Library Quality Gate Issues
              </div>
              <div className="text-sm text-[var(--color-text-secondary)] mt-1">
                {librariesWithIssues.map((lib) => lib.service).join(", ")}{" "}
                {librariesWithIssues.length === 1 ? "has" : "have"} failing
                builds. Services importing{" "}
                {librariesWithIssues.length === 1
                  ? "this library"
                  : "these libraries"}{" "}
                may encounter import errors when rebuilt.
              </div>
              <div className="text-xs text-[var(--color-text-muted)] mt-2">
                All services depend on unified-trading-services. Fix library
                issues before rebuilding dependent services.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Libraries Section */}
      {libraries.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)]">
            <Library className="h-4 w-4" />
            Libraries / SDKs
            <Badge variant="outline" className="text-[10px] ml-1">
              {libraries.length}
            </Badge>
          </div>
          {libraries.map((trigger) => (
            <TriggerCard
              key={trigger.trigger_id}
              trigger={trigger}
              isExpanded={expandedService === trigger.service}
              onExpand={() => handleExpandService(trigger.service)}
              branchInput={branchInputs[trigger.service] || ""}
              onBranchChange={(val) =>
                setBranchInputs((prev) => ({ ...prev, [trigger.service]: val }))
              }
              onTriggerBuild={() => handleTriggerBuild(trigger.service)}
              isTriggering={triggeringService === trigger.service}
              buildHistory={buildHistory[trigger.service]}
              loadingHistory={loadingHistory === trigger.service}
            />
          ))}
        </div>
      )}

      {/* Services Section */}
      {services.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)]">
            <Box className="h-4 w-4" />
            Deployable Services
            <Badge variant="outline" className="text-[10px] ml-1">
              {services.length}
            </Badge>
          </div>
          {services.map((trigger) => (
            <TriggerCard
              key={trigger.trigger_id}
              trigger={trigger}
              isExpanded={expandedService === trigger.service}
              onExpand={() => handleExpandService(trigger.service)}
              branchInput={branchInputs[trigger.service] || ""}
              onBranchChange={(val) =>
                setBranchInputs((prev) => ({ ...prev, [trigger.service]: val }))
              }
              onTriggerBuild={() => handleTriggerBuild(trigger.service)}
              isTriggering={triggeringService === trigger.service}
              buildHistory={buildHistory[trigger.service]}
              loadingHistory={loadingHistory === trigger.service}
            />
          ))}
        </div>
      )}

      {/* Infrastructure Section */}
      {infrastructure.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)]">
            <Wrench className="h-4 w-4" />
            Infrastructure
            <Badge variant="outline" className="text-[10px] ml-1">
              {infrastructure.length}
            </Badge>
          </div>
          {infrastructure.map((trigger) => (
            <TriggerCard
              key={trigger.trigger_id}
              trigger={trigger}
              isExpanded={expandedService === trigger.service}
              onExpand={() => handleExpandService(trigger.service)}
              branchInput={branchInputs[trigger.service] || ""}
              onBranchChange={(val) =>
                setBranchInputs((prev) => ({ ...prev, [trigger.service]: val }))
              }
              onTriggerBuild={() => handleTriggerBuild(trigger.service)}
              isTriggering={triggeringService === trigger.service}
              buildHistory={buildHistory[trigger.service]}
              loadingHistory={loadingHistory === trigger.service}
            />
          ))}
        </div>
      )}

      {/* Legacy: Show all triggers if no type separation (backward compat) */}
      {libraries.length === 0 &&
        services.length === 0 &&
        infrastructure.length === 0 &&
        triggers.length > 0 && (
          <div className="space-y-3">
            {triggers.map((trigger) => (
              <TriggerCard
                key={trigger.trigger_id}
                trigger={trigger}
                isExpanded={expandedService === trigger.service}
                onExpand={() => handleExpandService(trigger.service)}
                branchInput={branchInputs[trigger.service] || ""}
                onBranchChange={(val) =>
                  setBranchInputs((prev) => ({
                    ...prev,
                    [trigger.service]: val,
                  }))
                }
                onTriggerBuild={() => handleTriggerBuild(trigger.service)}
                isTriggering={triggeringService === trigger.service}
                buildHistory={buildHistory[trigger.service]}
                loadingHistory={loadingHistory === trigger.service}
              />
            ))}
          </div>
        )}

      {triggers.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-[var(--color-text-muted)]">
            No build triggers found
            {serviceName && ` for ${serviceName}`}
          </CardContent>
        </Card>
      )}

      {/* Permission note */}
      <div className="text-xs text-[var(--color-text-muted)] p-3 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
        <strong>Note:</strong> Triggering builds requires the service account to
        have
        <code className="mx-1 px-1 py-0.5 rounded bg-[var(--color-bg-primary)]">
          roles/cloudbuild.builds.editor
        </code>
        permission. If triggers fail, check IAM permissions.
      </div>
    </div>
  );
}
