"use client"

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Play,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Loader2,
  Info,
  Zap,
  Server,
  MapPin,
  ShieldAlert,
  HelpCircle,
} from "lucide-react";
import {
  useServiceDimensions,
  useChecklistValidation,
} from "@/hooks/deployment/useServices";
import {
  useVenuesByCategory,
  useVenueCountByCategories,
  useStartDates,
} from "@/hooks/deployment/useConfig";
import { CloudConfigBrowser } from "@/components/ops/deployment/CloudConfigBrowser";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogContent } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CLIPreview } from "@/components/ops/deployment/CLIPreview";
import { BuildSelector } from "@/components/ops/deployment/BuildSelector";
import { cn } from "@/lib/utils";
import { getDeploymentQuotaInfo, type QuotaInfoResponse } from "@/hooks/deployment/_api-stub";
import type { DeploymentRequest, ServiceDimension } from "@/lib/types/deployment";

interface DeployFormProps {
  serviceName: string;
  onDeploy: (request: DeploymentRequest) => void;
  isDeploying?: boolean;
}

export function DeployForm({
  serviceName,
  onDeploy,
  isDeploying,
}: DeployFormProps) {
  const { dimensions, loading: loadingDims } =
    useServiceDimensions(serviceName);
  const { validateDate } = useStartDates(serviceName);
  const { validation: checklistValidation } =
    useChecklistValidation(serviceName);

  // Region options for serverless and VMs
  const REGIONS = [
    { value: "asia-northeast1", label: "asia-northeast1 (Tokyo)" },
    { value: "asia-northeast2", label: "asia-northeast2 (Osaka)" },
    { value: "asia-southeast1", label: "asia-southeast1 (Singapore)" },
    { value: "us-central1", label: "us-central1 (Iowa)" },
    { value: "us-east1", label: "us-east1 (South Carolina)" },
    { value: "us-west1", label: "us-west1 (Oregon)" },
    { value: "europe-west1", label: "europe-west1 (Belgium)" },
    { value: "europe-west2", label: "europe-west2 (London)" },
  ];

  // VM zone options (zone is region + suffix)
  const getZonesForRegion = (region: string) => [
    { value: `${region}-a`, label: `${region}-a` },
    { value: `${region}-b`, label: `${region}-b` },
    { value: `${region}-c`, label: `${region}-c` },
  ];

  // Form state
  const [compute, setCompute] = useState<"cloud_run" | "vm">("vm"); // VM is default
  const [mode, setMode] = useState<"batch" | "live">("batch");
  const [region, setRegion] = useState<string>("asia-northeast1");
  const [vmZone, setVmZone] = useState<string>("asia-northeast1-b");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedVenues, setSelectedVenues] = useState<string[]>([]);
  const [selectedFeatureGroups, setSelectedFeatureGroups] = useState<string[]>(
    [],
  );
  const [selectedTimeframes, setSelectedTimeframes] = useState<string[]>([]);
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [selectedTargetTypes, setSelectedTargetTypes] = useState<string[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [force, setForce] = useState(true);
  const [dryRun, setDryRun] = useState(true); // Default to dry run for safety
  const [logLevel, setLogLevel] = useState<
    "DEBUG" | "INFO" | "WARNING" | "ERROR"
  >("INFO");
  const [containerMaxWorkers, setContainerMaxWorkers] = useState<string>("");
  const [extraArgs, setExtraArgs] = useState<string>("");
  const [deploymentTag, setDeploymentTag] = useState<string>("");
  const [acknowledgedWarnings, setAcknowledgedWarnings] = useState(false);
  const [skipVenueSharding, setSkipVenueSharding] = useState(false);
  const [skipFeatureGroupSharding, setSkipFeatureGroupSharding] =
    useState(false);
  const [dateGranularity, setDateGranularity] = useState<
    "default" | "daily" | "weekly" | "monthly" | "none"
  >("default");
  const [maxConcurrent, setMaxConcurrent] = useState<string>(""); // Optional; empty = backend default (2000)

  // Cloud provider
  const [cloudProvider, setCloudProvider] = useState<"gcp" | "aws">("gcp");

  // Live mode fields
  const [imageTag, setImageTag] = useState<string>("latest");
  const [trafficSplitPct, setTrafficSplitPct] = useState<number>(10);
  const [healthGateTimeoutS, setHealthGateTimeoutS] = useState<number>(300);
  const [rollbackOnFail, setRollbackOnFail] = useState<boolean>(true);

  // Quota info modal state
  const [quotaOpen, setQuotaOpen] = useState(false);
  const [quotaLoading, setQuotaLoading] = useState(false);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfoResponse | null>(null);

  // Cloud config path state (for services with gcs_dynamic config dimension)
  const [cloudConfigPath, setCloudConfigPath] = useState<string>("");
  const [discoveredConfigCount, setDiscoveredConfigCount] = useState<
    number | null
  >(null);

  // Region validation (backend GCS_REGION for cross-region egress warning)
  const [backendRegion, setBackendRegion] = useState<string>("asia-northeast1");
  const [showRegionWarning, setShowRegionWarning] = useState<boolean>(false);

  useEffect(() => {
    fetch("/api/config/region")
      .then((r) => r.json())
      .then((data) =>
        setBackendRegion(
          data.storage_region ?? data.gcs_region ?? "asia-northeast1",
        ),
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    setShowRegionWarning(region !== backendRegion);
  }, [region, backendRegion]);

  // Reset acknowledgment when service changes
  useEffect(() => {
    setAcknowledgedWarnings(false);
  }, [serviceName]);

  // Get venues for selected category (used for venue selector UI)
  const primaryCategory = selectedCategories[0] || null;
  const { venues: categoryVenues } = useVenuesByCategory(primaryCategory);

  // Get total venue count across ALL selected categories (for accurate shard estimation)
  const categoryDimForVenues = dimensions?.dimensions?.find(
    (d: ServiceDimension) => d.name === "category",
  );
  const allCategoriesForEstimate =
    selectedCategories.length > 0
      ? selectedCategories
      : (categoryDimForVenues?.values ?? []);
  const { totalVenueCount: allCategoriesVenueCount } =
    useVenueCountByCategories(allCategoriesForEstimate);

  // Reset venues when category changes
  useEffect(() => {
    setSelectedVenues([]);
  }, [primaryCategory]);

  // Set default dates (today - 7 days to today)
  useEffect(() => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    setEndDate(today.toISOString().split("T")[0]);
    setStartDate(weekAgo.toISOString().split("T")[0]);
  }, []);

  // Date validation
  const dateValidation = useMemo(() => {
    if (!startDate || !primaryCategory) return { valid: true };

    // If venues selected, validate against each venue
    if (selectedVenues.length > 0) {
      for (const venue of selectedVenues) {
        const result = validateDate(startDate, primaryCategory, venue);
        if (!result.valid) return result;
      }
    } else {
      // Validate against category
      return validateDate(startDate, primaryCategory);
    }

    return { valid: true };
  }, [startDate, primaryCategory, selectedVenues, validateDate]);

  // Get dimension by name
  const getDimension = useCallback(
    (name: string): ServiceDimension | undefined => {
      return dimensions?.dimensions.find((d) => d.name === name);
    },
    [dimensions],
  );

  // Check which dimensions this service has
  const hasCategory = !!getDimension("category");
  const hasVenue = !!getDimension("venue");
  const hasFeatureGroup = !!getDimension("feature_group");
  const hasTimeframe = !!getDimension("timeframe");
  const hasInstrument = !!getDimension("instrument");
  const hasTargetType = !!getDimension("target_type");
  const hasDomain = !!getDimension("domain");
  const hasDate = !!getDimension("date");

  // Check for gcs_dynamic config dimension (e.g., execution-services)
  const configDimension = getDimension("config");
  const hasCloudConfig = configDimension?.type === "gcs_dynamic";

  // Handle cloud config browser selection
  const handleCloudConfigSelected = (path: string, configCount: number) => {
    setCloudConfigPath(path);
    setDiscoveredConfigCount(configCount > 0 ? configCount : null);
  };

  // Calculate estimated shards - matches CLI default behavior
  // When no filter is selected, CLI uses ALL values for that dimension
  const estimatedShards = useMemo(() => {
    // 'none' granularity = 1 shard (no date sharding), no dates required
    if (dateGranularity === "none") {
      // Still need to account for category/venue multipliers below
      // but days = 1 shard
    } else if (!startDate || !endDate) {
      return 0;
    }

    let days: number;
    if (dateGranularity === "none") {
      days = 1; // Single shard, no date range
    } else {
      const start = new Date(startDate);
      const end = new Date(endDate);
      days =
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
        1;

      // Apply date granularity override
      if (dateGranularity === "weekly") {
        days = Math.ceil(days / 7);
      } else if (dateGranularity === "monthly") {
        days = Math.ceil(days / 30);
      }
    }

    let multiplier = 1;

    // For services with cloud config discovery (e.g., execution-services)
    // Use discovered config count if available
    if (hasCloudConfig && discoveredConfigCount !== null) {
      multiplier *= discoveredConfigCount;
      return days * multiplier;
    }

    // For each dimension: if nothing selected, use ALL values (CLI default)
    // If something selected, use selected count
    const categoryDim = getDimension("category");
    const venueDim = getDimension("venue");

    // When venue is hierarchical under category, category×venue pairs form a flat list
    // (e.g., CEFI has 9 venues, TRADFI has 6, DEFI has 8 = 23 total category-venue pairs)
    // So we should NOT multiply categories × venues — instead use the total venue count.
    const isVenueHierarchical = venueDim && !skipVenueSharding;

    if (isVenueHierarchical) {
      // Venue is child of category — use combined venue count across all selected categories
      if (selectedVenues.length > 0) {
        // User explicitly picked venues — use that count
        // Still multiply by categories since user may have selected venues from one category only
        multiplier *= selectedVenues.length;
      } else if (allCategoriesVenueCount > 0) {
        // Use actual venue count summed across all selected (or all) categories
        // This replaces both the hardcoded 18 and the single-category venue count
        multiplier *= allCategoriesVenueCount;
      } else if (categoryVenues?.venues?.length) {
        // Fallback: single-category venue count (while multi-category fetch is loading)
        const catCount =
          selectedCategories.length > 0
            ? selectedCategories.length
            : (categoryDim?.values?.length ?? 1);
        multiplier *= categoryVenues.venues.length * catCount;
      } else {
        // Last resort fallback
        multiplier *= 23;
      }
    } else {
      // Category is not hierarchical with venue — multiply independently
      if (categoryDim?.values?.length) {
        multiplier *=
          selectedCategories.length > 0
            ? selectedCategories.length
            : categoryDim.values.length;
      }

      // Venue dimension: if skipVenueSharding enabled, don't multiply by venues
      if (venueDim && !skipVenueSharding) {
        if (selectedVenues.length > 0) {
          multiplier *= selectedVenues.length;
        } else if (categoryVenues?.venues?.length) {
          multiplier *= categoryVenues.venues.length;
        }
      }
    }

    // Feature group - skip if skipFeatureGroupSharding is enabled
    const featureGroupDim = getDimension("feature_group");
    if (featureGroupDim?.values?.length && !skipFeatureGroupSharding) {
      multiplier *=
        selectedFeatureGroups.length > 0
          ? selectedFeatureGroups.length
          : featureGroupDim.values.length;
    }

    const timeframeDim = getDimension("timeframe");
    if (timeframeDim?.values?.length) {
      multiplier *=
        selectedTimeframes.length > 0
          ? selectedTimeframes.length
          : timeframeDim.values.length;
    }

    const instrumentDim = getDimension("instrument");
    if (instrumentDim?.values?.length) {
      multiplier *=
        selectedInstruments.length > 0
          ? selectedInstruments.length
          : instrumentDim.values.length;
    }

    const targetTypeDim = getDimension("target_type");
    if (targetTypeDim?.values?.length) {
      multiplier *=
        selectedTargetTypes.length > 0
          ? selectedTargetTypes.length
          : targetTypeDim.values.length;
    }

    return days * multiplier;
  }, [
    startDate,
    endDate,
    selectedCategories,
    selectedVenues,
    selectedFeatureGroups,
    selectedTimeframes,
    selectedInstruments,
    selectedTargetTypes,
    hasCloudConfig,
    discoveredConfigCount,
    skipVenueSharding,
    skipFeatureGroupSharding,
    dateGranularity,
    categoryVenues,
    allCategoriesVenueCount,
    getDimension,
  ]);

  const buildRequest = (): DeploymentRequest => {
    const request: DeploymentRequest = {
      service: serviceName,
      mode,
      compute,
      cloud_provider: cloudProvider,
      // Dates are optional - backend defaults to expected_start_dates.yaml / yesterday
      ...(startDate ? { start_date: startDate } : {}),
      ...(endDate ? { end_date: endDate } : {}),
      force,
      dry_run: dryRun,
      log_level: logLevel,
      region, // Always include region
    };

    // Include VM zone if using VM compute
    if (compute === "vm" && vmZone) {
      request.vm_zone = vmZone;
    }

    if (selectedCategories.length > 0) request.category = selectedCategories;
    if (selectedVenues.length > 0) request.venue = selectedVenues;
    if (selectedFeatureGroups.length > 0)
      request.feature_group = selectedFeatureGroups;
    if (selectedTimeframes.length > 0) request.timeframe = selectedTimeframes;
    if (selectedInstruments.length > 0)
      request.instrument = selectedInstruments;
    if (selectedTargetTypes.length > 0)
      request.target_type = selectedTargetTypes;
    if (selectedDomain) request.domain = selectedDomain;
    const maxWorkersNum = containerMaxWorkers
      ? parseInt(containerMaxWorkers, 10)
      : undefined;
    if (
      maxWorkersNum !== undefined &&
      !Number.isNaN(maxWorkersNum) &&
      maxWorkersNum > 0
    ) {
      request.max_workers = maxWorkersNum;
    }
    if (deploymentTag.trim()) request.tag = deploymentTag.trim();
    if (extraArgs.trim()) request.extra_args = extraArgs.trim();
    if (cloudConfigPath.trim())
      request.cloud_config_path = cloudConfigPath.trim();
    if (skipVenueSharding) request.skip_venue_sharding = true;
    if (skipFeatureGroupSharding) request.skip_feature_group_sharding = true;
    if (dateGranularity && dateGranularity !== "default")
      request.date_granularity = dateGranularity;
    if (maxConcurrent) request.max_concurrent = parseInt(maxConcurrent);

    // Live mode fields
    if (mode === "live") {
      if (imageTag.trim()) request.image_tag = imageTag.trim();
      request.traffic_split_pct = trafficSplitPct;
      request.health_gate_timeout_s = healthGateTimeoutS;
      request.rollback_on_fail = rollbackOnFail;
    }

    return request;
  };

  const handleSubmit = () => {
    onDeploy(buildRequest());
  };

  // For cloud config services, require path and discovery before submission
  const cloudConfigReady =
    !hasCloudConfig ||
    (cloudConfigPath.trim() &&
      discoveredConfigCount !== null &&
      discoveredConfigCount > 0);

  const datesReady = dateGranularity === "none" || (startDate && endDate);
  const canCheckQuota = Boolean(
    datesReady && dateValidation.valid && cloudConfigReady,
  );

  const openQuotaModal = async () => {
    setQuotaOpen(true);
    setQuotaLoading(true);
    setQuotaError(null);
    setQuotaInfo(null);

    try {
      const info = await getDeploymentQuotaInfo(buildRequest());
      setQuotaInfo(info);
    } catch (e: unknown) {
      setQuotaError(
        e instanceof Error ? e.message : "Failed to load quota info",
      );
    } finally {
      setQuotaLoading(false);
    }
  };

  // Determine if checklist warnings need acknowledgment (only for live deployments)
  const hasChecklistWarnings =
    checklistValidation && !checklistValidation.ready && !dryRun;
  const needsAcknowledgment =
    hasChecklistWarnings && checklistValidation.can_proceed_with_acknowledgment;
  const cannotProceed =
    hasChecklistWarnings && checklistValidation.blocking_items.length > 0;

  // Validate max_concurrent (hard limit: 2500)
  const maxConcurrentValue = maxConcurrent ? parseInt(maxConcurrent, 10) : 0;
  const maxConcurrentExceedsLimit = maxConcurrentValue > 2500;

  const canSubmit =
    datesReady &&
    dateValidation.valid &&
    !isDeploying &&
    cloudConfigReady && // Cloud config must be discovered if required
    (dryRun || !cannotProceed) && // Can't proceed with blocking items
    (dryRun || !needsAcknowledgment || acknowledgedWarnings) && // Need acknowledgment for warnings
    !maxConcurrentExceedsLimit; // Cannot exceed max concurrent hard limit

  if (loadingDims) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent-cyan)]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-[var(--color-accent-cyan)]" />
              Deploy {serviceName}
            </CardTitle>
            <CardDescription className="mt-1">
              Configure sharding dimensions and run parameters
            </CardDescription>
          </div>
          {estimatedShards > 0 && (
            <div className="text-right">
              <div className="text-2xl font-mono font-bold text-[var(--color-text-primary)]">
                ~{estimatedShards}
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">
                estimated shards
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Checklist Validation Warning */}
        {!dryRun && checklistValidation && !checklistValidation.ready && (
          <div
            className={cn(
              "p-4 rounded-lg border",
              checklistValidation.blocking_items.length > 0
                ? "status-error"
                : "status-warning",
            )}
          >
            <div className="flex items-start gap-3">
              <ShieldAlert
                className={cn(
                  "h-5 w-5 shrink-0 mt-0.5",
                  checklistValidation.blocking_items.length > 0
                    ? "text-[var(--color-accent-red)]"
                    : "text-[var(--color-accent-amber)]",
                )}
              />
              <div className="flex-1">
                <h3
                  className={cn(
                    "text-sm font-medium",
                    checklistValidation.blocking_items.length > 0
                      ? "text-[var(--color-accent-red)]"
                      : "text-[var(--color-accent-amber)]",
                  )}
                >
                  Deployment Readiness Warning
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                  {serviceName} has{" "}
                  {checklistValidation.blocking_items.length > 0
                    ? `${checklistValidation.blocking_items.length} blocking issue${checklistValidation.blocking_items.length > 1 ? "s" : ""}`
                    : "pending readiness items"}
                  :
                </p>

                {/* Show blocking items */}
                {checklistValidation.blocking_items.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {checklistValidation.blocking_items.map((item) => (
                      <li
                        key={item.id}
                        className="text-sm text-[var(--color-text-secondary)] flex items-start gap-2"
                      >
                        <span className="text-[var(--color-accent-red)]">
                          •
                        </span>
                        {item.description}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Show warnings (non-blocking) */}
                {checklistValidation.warnings.length > 0 &&
                  checklistValidation.blocking_items.length === 0 && (
                    <ul className="mt-2 space-y-1">
                      {checklistValidation.warnings
                        .slice(0, 5)
                        .map((warning, i) => (
                          <li
                            key={i}
                            className="text-sm text-[var(--color-text-secondary)] flex items-start gap-2"
                          >
                            <span className="text-[var(--color-accent-amber)]">
                              •
                            </span>
                            {warning}
                          </li>
                        ))}
                      {checklistValidation.warnings.length > 5 && (
                        <li className="text-xs text-[var(--color-text-muted)]">
                          ...and {checklistValidation.warnings.length - 5} more
                        </li>
                      )}
                    </ul>
                  )}

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text-muted)]">
                    Readiness: {checklistValidation.readiness_percent}% (
                    {checklistValidation.completed_items}/
                    {checklistValidation.total_items} items)
                  </span>
                </div>

                {/* Acknowledgment checkbox (only if can proceed) */}
                {checklistValidation.can_proceed_with_acknowledgment &&
                  checklistValidation.blocking_items.length === 0 && (
                    <div className="mt-3 flex items-center gap-2">
                      <Checkbox
                        id="acknowledgeWarnings"
                        checked={acknowledgedWarnings}
                        onCheckedChange={(checked) =>
                          setAcknowledgedWarnings(checked as boolean)
                        }
                      />
                      <Label
                        htmlFor="acknowledgeWarnings"
                        className="text-sm cursor-pointer"
                      >
                        I understand the risks and want to proceed anyway
                      </Label>
                    </div>
                  )}

                {/* Cannot proceed message */}
                {checklistValidation.blocking_items.length > 0 && (
                  <p className="mt-3 text-sm text-[var(--color-accent-red)]">
                    Deployment blocked. Resolve blocking issues in the Readiness
                    tab first.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mode (batch | live) */}
        <div className="space-y-2">
          <Label>Mode</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "batch" ? "default" : "outline"}
              onClick={() => setMode("batch")}
              className="flex-1"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Batch
            </Button>
            <Button
              type="button"
              variant={mode === "live" ? "default" : "outline"}
              onClick={() => setMode("live")}
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              Live
            </Button>
          </div>
        </div>

        {/* Cloud Provider (GCP | AWS) */}
        <div className="space-y-2">
          <Label>Cloud Provider</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={cloudProvider === "gcp" ? "default" : "outline"}
              onClick={() => setCloudProvider("gcp")}
              className="flex-1"
            >
              <Server className="h-4 w-4 mr-2" />
              GCP
            </Button>
            <Button
              type="button"
              variant={cloudProvider === "aws" ? "default" : "outline"}
              onClick={() => setCloudProvider("aws")}
              className="flex-1"
            >
              <Server className="h-4 w-4 mr-2" />
              AWS
            </Button>
          </div>
          {cloudProvider === "aws" && (
            <div className="flex items-start gap-2 p-3 rounded-md status-warning mt-2">
              <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-300">
                <span className="font-semibold">
                  AWS configured but unauthenticated
                </span>{" "}
                — dry-run validation available; live deployment requires AWS
                credentials (IRSA / service account) in the environment.
              </p>
            </div>
          )}
        </div>

        {/* Live mode fields — shown only when mode === "live" */}
        {mode === "live" && (
          <div className="space-y-4 p-4 rounded-lg status-running">
            <p className="text-xs font-medium text-[var(--color-accent-cyan)] uppercase tracking-wider">
              Live Deployment Settings
            </p>

            <BuildSelector
              service={serviceName}
              onSelect={(tag) => setImageTag(tag)}
            />

            <div className="space-y-2">
              <Label htmlFor="imageTag">Image Tag</Label>
              <Input
                id="imageTag"
                value={imageTag}
                onChange={(e) => setImageTag(e.target.value)}
                placeholder="latest"
              />
              <p className="text-xs text-[var(--color-text-muted)]">
                Docker image tag to deploy (e.g. 1.0.0,
                0.3.168-feat-my-feature). Select a build above to pre-fill, or
                type a tag manually.
              </p>
            </div>

            <div className="space-y-2">
              <Label>
                Traffic Split:{" "}
                <span className="text-[var(--color-accent-cyan)]">
                  {trafficSplitPct}%
                </span>
              </Label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={trafficSplitPct}
                onChange={(e) => setTrafficSplitPct(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-[var(--color-text-muted)]">
                Canary traffic sent to new revision before full cutover
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="healthGateTimeout">
                Health Gate Timeout (seconds)
              </Label>
              <Input
                id="healthGateTimeout"
                type="number"
                min={30}
                max={3600}
                value={healthGateTimeoutS}
                onChange={(e) =>
                  setHealthGateTimeoutS(Number(e.target.value) || 300)
                }
              />
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                id="rollbackOnFail"
                checked={rollbackOnFail}
                onCheckedChange={(v) => setRollbackOnFail(!!v)}
              />
              <Label htmlFor="rollbackOnFail">
                Auto-rollback if health gate fails
              </Label>
            </div>
          </div>
        )}

        {/* Compute Target */}
        <div className="space-y-2">
          <Label>Compute Target</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={compute === "cloud_run" ? "default" : "outline"}
              onClick={() => setCompute("cloud_run")}
              className="flex-1"
            >
              <Zap className="h-4 w-4 mr-2" />
              Serverless (Cloud Run)
            </Button>
            <Button
              type="button"
              variant={compute === "vm" ? "default" : "outline"}
              onClick={() => setCompute("vm")}
              className="flex-1"
            >
              <Server className="h-4 w-4 mr-2" />
              VM Instance
            </Button>
          </div>
        </div>

        {/* Region Selector (shown for both serverless and VM) */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[var(--color-text-muted)]" />
            Region
          </Label>
          <Select
            value={region}
            onValueChange={(v) => {
              setRegion(v);
              // Update zone to match new region
              setVmZone(`${v}-b`);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select region..." />
            </SelectTrigger>
            <SelectContent>
              {REGIONS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {showRegionWarning && (
            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold">Cross-Region Egress Warning</p>
                  <p className="mt-1">
                    Selected region ({region}) differs from configured storage
                    region ({backendRegion}). This will incur significant egress
                    costs as data must cross regions.
                  </p>
                  <p className="mt-1 font-medium">
                    Recommendation: Use {backendRegion} to avoid egress charges.
                    Zone failover (1a → 1b → 1c) provides high availability
                    within the region.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* VM Zone Selector (only shown when VM is selected) */}
        {compute === "vm" && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">Zone</Label>
            <Select value={vmZone} onValueChange={setVmZone}>
              <SelectTrigger>
                <SelectValue placeholder="Select zone..." />
              </SelectTrigger>
              <SelectContent>
                {getZonesForRegion(region).map((zone) => (
                  <SelectItem key={zone.value} value={zone.value}>
                    {zone.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-[var(--color-text-muted)]">
              Starting zone for VMs. System auto-rotates through zones
              (1a→1b→1c) within the region.
            </p>
          </div>
        )}

        {/* Date Range */}
        {hasDate && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">
                Start Date{dateGranularity === "none" ? " (optional)" : ""}
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-10"
                  placeholder={
                    dateGranularity === "none" ? "From config" : undefined
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">
                End Date{dateGranularity === "none" ? " (optional)" : ""}
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-10"
                  placeholder={
                    dateGranularity === "none" ? "Yesterday" : undefined
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* Date Validation Warning */}
        {!dateValidation.valid && (
          <div className="flex items-start gap-3 p-3 rounded-lg status-error">
            <AlertTriangle className="h-5 w-5 text-[var(--color-accent-red)] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[var(--color-accent-red)]">
                Invalid Date Range
              </p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                {dateValidation.message}
              </p>
              {dateValidation.earliestDate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-[var(--color-accent-cyan)]"
                  onClick={() => setStartDate(dateValidation.earliestDate!)}
                >
                  Set to {dateValidation.earliestDate}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Category Selection */}
        {hasCategory && (
          <MultiSelectDimension
            dimension={getDimension("category")!}
            selected={selectedCategories}
            onChange={setSelectedCategories}
          />
        )}

        {/* Venue Selection (Hierarchical) */}
        {hasVenue && categoryVenues && (
          <MultiSelectDimension
            dimension={{
              ...getDimension("venue")!,
              values: categoryVenues.venues,
            }}
            selected={selectedVenues}
            onChange={setSelectedVenues}
            disabled={!primaryCategory}
            hint={!primaryCategory ? "Select a category first" : undefined}
          />
        )}

        {/* Domain Selection (Single) */}
        {hasDomain && (
          <div className="space-y-2">
            <Label>Domain</Label>
            <Select value={selectedDomain} onValueChange={setSelectedDomain}>
              <SelectTrigger>
                <SelectValue placeholder="Select domain..." />
              </SelectTrigger>
              <SelectContent>
                {getDimension("domain")?.values?.map((val) => (
                  <SelectItem key={val} value={val}>
                    {val}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Cloud Config Path Browser (for gcs_dynamic config dimension) */}
        {hasCloudConfig && (
          <CloudConfigBrowser
            serviceName={serviceName}
            onPathSelected={handleCloudConfigSelected}
          />
        )}

        {/* Feature Group Selection */}
        {hasFeatureGroup && (
          <MultiSelectDimension
            dimension={getDimension("feature_group")!}
            selected={selectedFeatureGroups}
            onChange={setSelectedFeatureGroups}
          />
        )}

        {/* Timeframe Selection */}
        {hasTimeframe && (
          <MultiSelectDimension
            dimension={getDimension("timeframe")!}
            selected={selectedTimeframes}
            onChange={setSelectedTimeframes}
          />
        )}

        {/* Instrument Selection */}
        {hasInstrument && (
          <MultiSelectDimension
            dimension={getDimension("instrument")!}
            selected={selectedInstruments}
            onChange={setSelectedInstruments}
          />
        )}

        {/* Target Type Selection */}
        {hasTargetType && (
          <MultiSelectDimension
            dimension={getDimension("target_type")!}
            selected={selectedTargetTypes}
            onChange={setSelectedTargetTypes}
          />
        )}

        {/* Advanced Options */}
        <div className="border-t border-[var(--color-border-default)] pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-[var(--color-text-muted)]" />
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">
              Advanced Options
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Log Level</Label>
              <Select
                value={logLevel}
                onValueChange={(v) => setLogLevel(v as typeof logLevel)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEBUG">DEBUG</SelectItem>
                  <SelectItem value="INFO">INFO</SelectItem>
                  <SelectItem value="WARNING">WARNING</SelectItem>
                  <SelectItem value="ERROR">ERROR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Max Workers (container)</Label>
              <Input
                type="number"
                placeholder="Default (4)"
                value={containerMaxWorkers}
                onChange={(e) => setContainerMaxWorkers(e.target.value)}
                min={1}
                max={32}
              />
              <p className="text-xs text-[var(--color-text-muted)]">
                Higher values auto-scale machine resources (8 workers = 2x
                CPU/RAM)
              </p>
            </div>
          </div>

          {/* Deployment Notes/Tag */}
          <div className="space-y-2 mt-4">
            <Label htmlFor="deploymentTag">
              Deployment Notes
              <span className="text-[var(--color-text-muted)] font-normal text-xs ml-2">
                (Optional but encouraged)
              </span>
            </Label>
            <Input
              id="deploymentTag"
              placeholder="e.g., Fixed Curve adapter, Added DEFI backfill, Testing new venues"
              value={deploymentTag}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 200) {
                  setDeploymentTag(value);
                }
              }}
              maxLength={200}
              className="font-mono text-sm"
            />
            <p className="text-xs text-[var(--color-text-muted)]">
              Human-readable description • {deploymentTag.length}/200 characters
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="dryRun"
                checked={dryRun}
                onCheckedChange={(checked) => setDryRun(checked as boolean)}
              />
              <Label htmlFor="dryRun" className="cursor-pointer">
                Dry Run (preview only)
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="force"
                checked={force}
                onCheckedChange={(checked) => setForce(checked as boolean)}
              />
              <Label htmlFor="force" className="cursor-pointer">
                Force (skip existence checks)
              </Label>
            </div>
          </div>

          {/* Max Concurrent Jobs */}
          <div className="mt-4 p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)]">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Max concurrent jobs</Label>
              <Input
                type="number"
                min={1}
                max={2500}
                placeholder="2000"
                value={maxConcurrent}
                onChange={(e) => setMaxConcurrent(e.target.value)}
                className={maxConcurrentExceedsLimit ? "border-red-500" : ""}
              />
              <p className="text-xs text-[var(--color-text-muted)]">
                Controls rolling concurrency (how many VMs/jobs run at the same
                time). Default: 2,000. Maximum: 2,500.
              </p>
              {maxConcurrentExceedsLimit && (
                <p className="text-xs text-red-500">
                  Max concurrent cannot exceed 2,500. Use date granularity
                  (weekly/monthly) to reduce shard count.
                </p>
              )}
            </div>
          </div>

          {/* Skip Venue Sharding option (only shown if service has venue dimension) */}
          {hasVenue && (
            <div className="mt-4 p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)]">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="skipVenueSharding"
                  checked={skipVenueSharding}
                  onCheckedChange={(checked) =>
                    setSkipVenueSharding(checked as boolean)
                  }
                />
                <Label
                  htmlFor="skipVenueSharding"
                  className="cursor-pointer font-medium"
                >
                  Skip venue sharding (process all venues per job)
                </Label>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-2 ml-6">
                Reduces job count significantly by processing all venues in a
                single shard per date. Machine resources are auto-scaled based
                on max-workers to compensate.
                {skipVenueSharding && (
                  <span className="block mt-1 text-[var(--color-accent-cyan)]">
                    Estimated: ~
                    {Math.ceil(
                      (new Date(endDate).getTime() -
                        new Date(startDate).getTime()) /
                        (1000 * 60 * 60 * 24),
                    ) + 1}{" "}
                    × {selectedCategories.length || 3} = ~
                    {(Math.ceil(
                      (new Date(endDate).getTime() -
                        new Date(startDate).getTime()) /
                        (1000 * 60 * 60 * 24),
                    ) +
                      1) *
                      (selectedCategories.length || 3)}{" "}
                    shards (vs full venue sharding)
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Skip Feature Group Sharding option (only shown if service has feature_group dimension) */}
          {hasFeatureGroup && (
            <div className="mt-4 p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)]">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="skipFeatureGroupSharding"
                  checked={skipFeatureGroupSharding}
                  onCheckedChange={(checked) =>
                    setSkipFeatureGroupSharding(checked as boolean)
                  }
                />
                <Label
                  htmlFor="skipFeatureGroupSharding"
                  className="cursor-pointer font-medium"
                >
                  Skip feature group sharding (process all feature groups per
                  job)
                </Label>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-2 ml-6">
                Reduces job count by processing all feature groups in a single
                shard.
                {skipFeatureGroupSharding && (
                  <span className="block mt-1 text-[var(--color-accent-cyan)]">
                    Feature groups will be processed together instead of in
                    separate jobs.
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Date Granularity Override (only shown if service has date dimension) */}
          {hasDate && (
            <div className="mt-4 p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)]">
              <div className="space-y-2">
                <Label className="font-medium">Date Granularity Override</Label>
                <Select
                  value={dateGranularity}
                  onValueChange={(value) =>
                    setDateGranularity(
                      value as
                        | "default"
                        | "daily"
                        | "weekly"
                        | "monthly"
                        | "none",
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Use service default" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Use service default</SelectItem>
                    <SelectItem value="daily">
                      Daily (1 shard per day)
                    </SelectItem>
                    <SelectItem value="weekly">
                      Weekly (1 shard per 7 days)
                    </SelectItem>
                    <SelectItem value="monthly">
                      Monthly (1 shard per 30 days)
                    </SelectItem>
                    <SelectItem value="none">
                      None (single shard, no date args)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Override the date chunking to reduce job count. Weekly/monthly
                  groups multiple days into one shard.
                  {dateGranularity === "none" && (
                    <span className="block mt-1 text-[var(--color-accent-cyan)]">
                      Single shard with no start/end date passed to service.
                      Start/end date fields are optional (defaults to
                      service&apos;s expected_start_dates.yaml → yesterday).
                    </span>
                  )}
                  {dateGranularity &&
                    dateGranularity !== "default" &&
                    dateGranularity !== "daily" &&
                    dateGranularity !== "none" &&
                    startDate &&
                    endDate && (
                      <span className="block mt-1 text-[var(--color-accent-cyan)]">
                        {dateGranularity === "weekly"
                          ? `~${Math.ceil((Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1) / 7)} weekly chunks instead of ${Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} daily`
                          : `~${Math.ceil((Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1) / 30)} monthly chunks instead of ${Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} daily`}
                      </span>
                    )}
                </p>
              </div>
            </div>
          )}

          {/* Compute Scaling Indicator */}
          {(containerMaxWorkers ||
            skipVenueSharding ||
            skipFeatureGroupSharding) && (
            <div className="mt-4 p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-accent-yellow)]/50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[var(--color-accent-yellow)]">⚡</span>
                <Label className="font-medium text-[var(--color-accent-yellow)]">
                  Auto-Scaled Compute Resources
                </Label>
              </div>
              <div className="text-xs text-[var(--color-text-muted)] space-y-1">
                {(() => {
                  const baseWorkers = 4;
                  const maxWorkers = containerMaxWorkers
                    ? parseInt(containerMaxWorkers)
                    : baseWorkers;
                  let scaleFactor = Math.max(1.0, maxWorkers / baseWorkers);

                  if (skipVenueSharding) {
                    scaleFactor *= 2.0;
                  }

                  const factors: string[] = [];
                  if (
                    containerMaxWorkers &&
                    parseInt(containerMaxWorkers) > baseWorkers
                  ) {
                    factors.push(
                      `${maxWorkers}/${baseWorkers} workers = ${(maxWorkers / baseWorkers).toFixed(1)}x`,
                    );
                  }
                  if (skipVenueSharding) {
                    factors.push("venue consolidation = 2x");
                  }

                  if (scaleFactor > 1.0) {
                    return (
                      <>
                        <p>
                          Machine resources will be scaled up by{" "}
                          <span className="text-[var(--color-accent-yellow)] font-semibold">
                            {scaleFactor.toFixed(1)}x
                          </span>
                        </p>
                        {factors.length > 0 && (
                          <p className="text-[var(--color-text-muted)]">
                            Factors: {factors.join(" × ")}
                          </p>
                        )}
                        <p className="mt-1 text-[var(--color-accent-cyan)]">
                          Example: c2-standard-16 → c2-standard-
                          {Math.min(60, Math.round(16 * scaleFactor))}
                        </p>
                      </>
                    );
                  }
                  return (
                    <p>Using base compute resources (no scaling needed)</p>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Extra CLI Arguments */}
          <div className="space-y-2 mt-4">
            <Label>Extra CLI Arguments</Label>
            <Input
              placeholder="e.g., --data-types trades --symbols BTC-USDT"
              value={extraArgs}
              onChange={(e) => setExtraArgs(e.target.value)}
            />
            <p className="text-xs text-[var(--color-text-muted)]">
              Additional arguments passed directly to the service container
            </p>
          </div>
        </div>

        {/* CLI Preview */}
        <CLIPreview
          serviceName={serviceName}
          dimensions={dimensions}
          formValues={{
            service: serviceName,
            compute,
            start_date: startDate,
            end_date: endDate,
            category:
              selectedCategories.length > 0 ? selectedCategories : undefined,
            venue: selectedVenues.length > 0 ? selectedVenues : undefined,
            force,
            dry_run: dryRun,
            log_level: logLevel,
            skip_venue_sharding: skipVenueSharding,
            skip_feature_group_sharding: skipFeatureGroupSharding,
            date_granularity:
              dateGranularity !== "default" ? dateGranularity : undefined,
            max_workers:
              containerMaxWorkers &&
              !Number.isNaN(parseInt(containerMaxWorkers, 10))
                ? parseInt(containerMaxWorkers, 10)
                : undefined,
            extra_args: extraArgs.trim() || undefined,
          }}
        />

        {/* Submit Button */}
        <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border-default)]">
          <div className="flex items-center gap-2">
            {dryRun ? (
              <Badge variant="warning">Dry Run Mode</Badge>
            ) : (
              <Badge variant="success">Live Mode</Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={openQuotaModal}
              disabled={!canCheckQuota || quotaLoading}
              title="Quota info"
              aria-label="Quota info"
            >
              {quotaLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <HelpCircle className="h-4 w-4" />
              )}
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="min-w-[140px]"
            >
              {isDeploying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deploying...
                </>
              ) : dryRun ? (
                <>
                  <Play className="h-4 w-4" />
                  Preview Shards
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Deploy
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Quota info modal */}
        <Dialog open={quotaOpen} onClose={() => setQuotaOpen(false)}>
          <DialogHeader onClose={() => setQuotaOpen(false)}>
            <DialogTitle>Quota requirements</DialogTitle>
          </DialogHeader>
          <DialogContent>
            {quotaLoading && (
              <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading quota info...
              </div>
            )}

            {!quotaLoading && quotaError && (
              <div className="text-sm text-[var(--color-accent-red)]">
                {quotaError}
              </div>
            )}

            {!quotaLoading &&
              !quotaError &&
              quotaInfo &&
              (() => {
                const rq = quotaInfo.required_quota as Record<
                  string,
                  Record<string, unknown>
                >;
                const worst = (rq?.worst_case || {}) as Record<
                  string,
                  Record<string, number>
                >;
                const perShard = (worst?.per_shard || {}) as Record<
                  string,
                  number
                >;
                const totals = (worst?.totals_at_max_concurrent ||
                  {}) as Record<string, number>;

                const cpuMetric =
                  Object.keys(perShard).find((k) => k.endsWith("_CPUS")) ||
                  Object.keys(perShard)[0];
                const metrics = [
                  cpuMetric,
                  "IN_USE_ADDRESSES",
                  "SSD_TOTAL_GB",
                ].filter(Boolean) as string[];

                const lq = quotaInfo.live_quota as
                  | Record<string, Record<string, unknown>>
                  | null
                  | undefined;
                const liveRegion = lq?.regions?.[quotaInfo.region] as
                  | Record<string, unknown>
                  | undefined;
                const liveMetrics = (liveRegion?.metrics || {}) as Record<
                  string,
                  Record<string, unknown>
                >;

                const recommended = quotaInfo.recommended_max_concurrent;

                return (
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)]">
                      <div className="text-sm text-[var(--color-text-secondary)]">
                        <div>
                          <span className="text-[var(--color-text-muted)]">
                            Service:
                          </span>{" "}
                          {quotaInfo.service}
                        </div>
                        <div>
                          <span className="text-[var(--color-text-muted)]">
                            Compute:
                          </span>{" "}
                          {quotaInfo.compute}
                        </div>
                        <div>
                          <span className="text-[var(--color-text-muted)]">
                            Region:
                          </span>{" "}
                          {quotaInfo.region}
                        </div>
                        <div>
                          <span className="text-[var(--color-text-muted)]">
                            Total shards:
                          </span>{" "}
                          {quotaInfo.total_shards.toLocaleString()}
                        </div>
                        <div>
                          <span className="text-[var(--color-text-muted)]">
                            Effective max_concurrent:
                          </span>{" "}
                          {quotaInfo.effective_settings.max_concurrent.toLocaleString()}
                        </div>
                        {recommended !== null && recommended !== undefined && (
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <div>
                              <span className="text-[var(--color-text-muted)]">
                                Recommended max_concurrent:
                              </span>{" "}
                              <span className="text-[var(--color-accent-yellow)] font-semibold">
                                {recommended.toLocaleString()}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                setMaxConcurrent(String(recommended))
                              }
                            >
                              Apply
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {metrics.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-semibold text-[var(--color-text-primary)]">
                          VM quota (worst-case)
                        </div>
                        <div className="overflow-hidden rounded-lg border border-[var(--color-border-default)]">
                          <div className="grid grid-cols-4 gap-0 text-xs bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border-default)]">
                            <div className="p-2 font-semibold">Metric</div>
                            <div className="p-2 font-semibold">Per shard</div>
                            <div className="p-2 font-semibold">
                              Total @ max_concurrent
                            </div>
                            <div className="p-2 font-semibold">
                              Live remaining
                            </div>
                          </div>
                          {metrics.map((m) => {
                            const live = liveMetrics?.[m];
                            const remaining = live?.remaining;
                            return (
                              <div
                                key={m}
                                className="grid grid-cols-4 gap-0 text-xs border-b border-[var(--color-border-subtle)] last:border-b-0"
                              >
                                <div className="p-2 font-mono text-[var(--color-text-secondary)]">
                                  {m}
                                </div>
                                <div className="p-2 text-[var(--color-text-secondary)]">
                                  {perShard[m] ?? "-"}
                                </div>
                                <div className="p-2 text-[var(--color-text-secondary)]">
                                  {totals[m] ?? "-"}
                                </div>
                                <div className="p-2 text-[var(--color-text-secondary)]">
                                  {remaining !== undefined &&
                                  remaining !== null ? (
                                    Number(remaining).toLocaleString()
                                  ) : (
                                    <span className="text-[var(--color-text-muted)]">
                                      n/a
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {!liveRegion && (
                          <p className="text-xs text-[var(--color-text-muted)]">
                            Live remaining shows n/a when the quota-broker is
                            not configured or unreachable. Set{" "}
                            <code className="text-[var(--color-text-secondary)]">
                              QUOTA_BROKER_URL
                            </code>{" "}
                            on the dashboard and ensure the quota-broker service
                            is deployed and reachable.
                          </p>
                        )}
                        {!!liveRegion?.error && (
                          <p className="text-xs text-[var(--color-accent-red)]">
                            Live quota unavailable for this region:{" "}
                            {String(liveRegion.error)}
                          </p>
                        )}
                        {quotaInfo.live_quota_error && (
                          <p className="text-xs text-[var(--color-accent-red)]">
                            Live quota error: {quotaInfo.live_quota_error}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Multi-select component for dimensions
interface MultiSelectDimensionProps {
  dimension: ServiceDimension;
  selected: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  hint?: string;
}

function MultiSelectDimension({
  dimension,
  selected,
  onChange,
  disabled,
  hint,
}: MultiSelectDimensionProps) {
  const values = dimension.values || [];

  const toggleValue = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const selectAll = () => onChange([...values]);
  const clearAll = () => onChange([]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{dimension.name}</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={selectAll}
            disabled={disabled}
            className="text-xs text-[var(--color-accent-cyan)] hover:underline disabled:opacity-50 h-auto p-0"
          >
            Select all
          </Button>
          <span className="text-[var(--color-text-muted)]">|</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAll}
            disabled={disabled}
            className="text-xs text-[var(--color-text-secondary)] hover:underline disabled:opacity-50 h-auto p-0"
          >
            Clear
          </Button>
        </div>
      </div>

      {hint && <p className="text-xs text-[var(--color-text-muted)]">{hint}</p>}

      <div
        className={cn(
          "flex flex-wrap gap-2 p-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] max-h-40 overflow-y-auto",
          disabled && "opacity-50 pointer-events-none",
        )}
      >
        {values.map((value) => {
          const isSelected = selected.includes(value);
          return (
            <Button
              key={value}
              type="button"
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => toggleValue(value)}
              className={cn(
                "px-2.5 py-1 text-xs font-mono",
                isSelected &&
                  "bg-[var(--color-accent-cyan)]/20 border-[var(--color-accent-cyan)] text-[var(--color-accent-cyan)]",
              )}
            >
              {isSelected && <CheckCircle2 className="h-3 w-3 inline mr-1" />}
              {value}
            </Button>
          );
        })}
      </div>

      <p className="text-xs text-[var(--color-text-muted)]">
        {selected.length > 0
          ? `${selected.length} of ${values.length} selected`
          : `All ${values.length} will be processed (none selected = all)`}
      </p>
    </div>
  );
}
