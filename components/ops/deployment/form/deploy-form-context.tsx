"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useChecklistValidation, useServiceDimensions } from "@/hooks/deployment/useServices";
import { useVenueCountByCategories, useVenuesByCategory, useStartDates } from "@/hooks/deployment/useConfig";
import { getDeploymentQuotaInfo, type QuotaInfoResponse } from "@/hooks/deployment/_api-stub";
import type { DeploymentRequest, ServiceDimension } from "@/lib/types/deployment";
import type {
  DateGranularity,
  DeployFormContextValue,
  DeployFormProviderProps,
  LogLevel,
} from "@/components/ops/deployment/form/deploy-form-types";

const DeployFormContext = createContext<DeployFormContextValue | null>(null);

export function useDeployFormContext(): DeployFormContextValue {
  const ctx = useContext(DeployFormContext);
  if (!ctx) {
    throw new Error("useDeployFormContext must be used within DeployFormProvider");
  }
  return ctx;
}

export function DeployFormProvider({ serviceName, onDeploy, isDeploying, children }: DeployFormProviderProps) {
  const { dimensions, loading: loadingDims } = useServiceDimensions(serviceName);
  const { validateDate } = useStartDates(serviceName);
  const { validation: checklistValidation } = useChecklistValidation(serviceName);

  const [compute, setCompute] = useState<"cloud_run" | "vm">("vm");
  const [mode, setMode] = useState<"batch" | "live">("batch");
  const [region, setRegion] = useState<string>("asia-northeast1");
  const [vmZone, setVmZone] = useState<string>("asia-northeast1-b");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedVenues, setSelectedVenues] = useState<string[]>([]);
  const [selectedFeatureGroups, setSelectedFeatureGroups] = useState<string[]>([]);
  const [selectedTimeframes, setSelectedTimeframes] = useState<string[]>([]);
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [selectedTargetTypes, setSelectedTargetTypes] = useState<string[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [force, setForce] = useState(true);
  const [dryRun, setDryRun] = useState(true);
  const [logLevel, setLogLevel] = useState<LogLevel>("INFO");
  const [containerMaxWorkers, setContainerMaxWorkers] = useState<string>("");
  const [extraArgs, setExtraArgs] = useState<string>("");
  const [deploymentTag, setDeploymentTag] = useState<string>("");
  const [acknowledgedWarnings, setAcknowledgedWarnings] = useState(false);
  const [skipVenueSharding, setSkipVenueSharding] = useState(false);
  const [skipFeatureGroupSharding, setSkipFeatureGroupSharding] = useState(false);
  const [dateGranularity, setDateGranularity] = useState<DateGranularity>("default");
  const [maxConcurrent, setMaxConcurrent] = useState<string>("");

  const [cloudProvider, setCloudProvider] = useState<"gcp" | "aws">("gcp");

  const [imageTag, setImageTag] = useState<string>("latest");
  const [trafficSplitPct, setTrafficSplitPct] = useState<number>(10);
  const [healthGateTimeoutS, setHealthGateTimeoutS] = useState<number>(300);
  const [rollbackOnFail, setRollbackOnFail] = useState<boolean>(true);

  const [quotaOpen, setQuotaOpen] = useState(false);
  const [quotaLoading, setQuotaLoading] = useState(false);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfoResponse | null>(null);

  const [cloudConfigPath, setCloudConfigPath] = useState<string>("");
  const [discoveredConfigCount, setDiscoveredConfigCount] = useState<number | null>(null);

  const [backendRegion, setBackendRegion] = useState<string>("asia-northeast1");
  const [showRegionWarning, setShowRegionWarning] = useState<boolean>(false);

  useEffect(() => {
    fetch("/api/config/region")
      .then((r) => r.json())
      .then((data) => setBackendRegion(data.storage_region ?? data.gcs_region ?? "asia-northeast1"))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setShowRegionWarning(region !== backendRegion);
  }, [region, backendRegion]);

  useEffect(() => {
    setAcknowledgedWarnings(false);
  }, [serviceName]);

  const primaryCategory = selectedCategories[0] || null;
  const { venues: categoryVenues } = useVenuesByCategory(primaryCategory);

  const categoryDimForVenues = dimensions?.dimensions?.find((d: ServiceDimension) => d.name === "category");
  const allCategoriesForEstimate =
    selectedCategories.length > 0 ? selectedCategories : (categoryDimForVenues?.values ?? []);
  const { totalVenueCount: allCategoriesVenueCount } = useVenueCountByCategories(allCategoriesForEstimate);

  useEffect(() => {
    setSelectedVenues([]);
  }, [primaryCategory]);

  useEffect(() => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    setEndDate(today.toISOString().split("T")[0]);
    setStartDate(weekAgo.toISOString().split("T")[0]);
  }, []);

  const dateValidation = useMemo(() => {
    if (!startDate || !primaryCategory) return { valid: true };

    if (selectedVenues.length > 0) {
      for (const venue of selectedVenues) {
        const result = validateDate(startDate, primaryCategory, venue);
        if (!result.valid) return result;
      }
    } else {
      return validateDate(startDate, primaryCategory);
    }

    return { valid: true };
  }, [startDate, primaryCategory, selectedVenues, validateDate]);

  const getDimension = useCallback(
    (name: string): ServiceDimension | undefined => {
      return dimensions?.dimensions.find((d) => d.name === name);
    },
    [dimensions],
  );

  const hasCategory = !!getDimension("category");
  const hasVenue = !!getDimension("venue");
  const hasFeatureGroup = !!getDimension("feature_group");
  const hasTimeframe = !!getDimension("timeframe");
  const hasInstrument = !!getDimension("instrument");
  const hasTargetType = !!getDimension("target_type");
  const hasDomain = !!getDimension("domain");
  const hasDate = !!getDimension("date");

  const configDimension = getDimension("config");
  const hasCloudConfig = configDimension?.type === "gcs_dynamic";

  const handleCloudConfigSelected = (path: string, configCount: number) => {
    setCloudConfigPath(path);
    setDiscoveredConfigCount(configCount > 0 ? configCount : null);
  };

  const estimatedShards = useMemo(() => {
    if (dateGranularity === "none") {
      // continue to multiplier logic
    } else if (!startDate || !endDate) {
      return 0;
    }

    let days: number;
    if (dateGranularity === "none") {
      days = 1;
    } else {
      const start = new Date(startDate);
      const end = new Date(endDate);
      days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      if (dateGranularity === "weekly") {
        days = Math.ceil(days / 7);
      } else if (dateGranularity === "monthly") {
        days = Math.ceil(days / 30);
      }
    }

    let multiplier = 1;

    if (hasCloudConfig && discoveredConfigCount !== null) {
      multiplier *= discoveredConfigCount;
      return days * multiplier;
    }

    const categoryDim = getDimension("category");
    const venueDim = getDimension("venue");

    const isVenueHierarchical = venueDim && !skipVenueSharding;

    if (isVenueHierarchical) {
      if (selectedVenues.length > 0) {
        multiplier *= selectedVenues.length;
      } else if (allCategoriesVenueCount > 0) {
        multiplier *= allCategoriesVenueCount;
      } else if (categoryVenues?.venues?.length) {
        const catCount = selectedCategories.length > 0 ? selectedCategories.length : (categoryDim?.values?.length ?? 1);
        multiplier *= categoryVenues.venues.length * catCount;
      } else {
        multiplier *= 23;
      }
    } else {
      if (categoryDim?.values?.length) {
        multiplier *= selectedCategories.length > 0 ? selectedCategories.length : categoryDim.values.length;
      }

      if (venueDim && !skipVenueSharding) {
        if (selectedVenues.length > 0) {
          multiplier *= selectedVenues.length;
        } else if (categoryVenues?.venues?.length) {
          multiplier *= categoryVenues.venues.length;
        }
      }
    }

    const featureGroupDim = getDimension("feature_group");
    if (featureGroupDim?.values?.length && !skipFeatureGroupSharding) {
      multiplier *= selectedFeatureGroups.length > 0 ? selectedFeatureGroups.length : featureGroupDim.values.length;
    }

    const timeframeDim = getDimension("timeframe");
    if (timeframeDim?.values?.length) {
      multiplier *= selectedTimeframes.length > 0 ? selectedTimeframes.length : timeframeDim.values.length;
    }

    const instrumentDim = getDimension("instrument");
    if (instrumentDim?.values?.length) {
      multiplier *= selectedInstruments.length > 0 ? selectedInstruments.length : instrumentDim.values.length;
    }

    const targetTypeDim = getDimension("target_type");
    if (targetTypeDim?.values?.length) {
      multiplier *= selectedTargetTypes.length > 0 ? selectedTargetTypes.length : targetTypeDim.values.length;
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

  const buildRequest = useCallback((): DeploymentRequest => {
    const request: DeploymentRequest = {
      service: serviceName,
      mode,
      compute,
      cloud_provider: cloudProvider,
      ...(startDate ? { start_date: startDate } : {}),
      ...(endDate ? { end_date: endDate } : {}),
      force,
      dry_run: dryRun,
      log_level: logLevel,
      region,
    };

    if (compute === "vm" && vmZone) {
      request.vm_zone = vmZone;
    }

    if (selectedCategories.length > 0) request.category = selectedCategories;
    if (selectedVenues.length > 0) request.venue = selectedVenues;
    if (selectedFeatureGroups.length > 0) request.feature_group = selectedFeatureGroups;
    if (selectedTimeframes.length > 0) request.timeframe = selectedTimeframes;
    if (selectedInstruments.length > 0) request.instrument = selectedInstruments;
    if (selectedTargetTypes.length > 0) request.target_type = selectedTargetTypes;
    if (selectedDomain) request.domain = selectedDomain;
    const maxWorkersNum = containerMaxWorkers ? parseInt(containerMaxWorkers, 10) : undefined;
    if (maxWorkersNum !== undefined && !Number.isNaN(maxWorkersNum) && maxWorkersNum > 0) {
      request.max_workers = maxWorkersNum;
    }
    if (deploymentTag.trim()) request.tag = deploymentTag.trim();
    if (extraArgs.trim()) request.extra_args = extraArgs.trim();
    if (cloudConfigPath.trim()) request.cloud_config_path = cloudConfigPath.trim();
    if (skipVenueSharding) request.skip_venue_sharding = true;
    if (skipFeatureGroupSharding) request.skip_feature_group_sharding = true;
    if (dateGranularity && dateGranularity !== "default") request.date_granularity = dateGranularity;
    if (maxConcurrent) request.max_concurrent = parseInt(maxConcurrent, 10);

    if (mode === "live") {
      if (imageTag.trim()) request.image_tag = imageTag.trim();
      request.traffic_split_pct = trafficSplitPct;
      request.health_gate_timeout_s = healthGateTimeoutS;
      request.rollback_on_fail = rollbackOnFail;
    }

    return request;
  }, [
    serviceName,
    mode,
    compute,
    cloudProvider,
    startDate,
    endDate,
    force,
    dryRun,
    logLevel,
    region,
    vmZone,
    selectedCategories,
    selectedVenues,
    selectedFeatureGroups,
    selectedTimeframes,
    selectedInstruments,
    selectedTargetTypes,
    selectedDomain,
    containerMaxWorkers,
    deploymentTag,
    extraArgs,
    cloudConfigPath,
    skipVenueSharding,
    skipFeatureGroupSharding,
    dateGranularity,
    maxConcurrent,
    imageTag,
    trafficSplitPct,
    healthGateTimeoutS,
    rollbackOnFail,
  ]);

  const handleSubmit = useCallback(() => {
    onDeploy(buildRequest());
  }, [onDeploy, buildRequest]);

  const cloudConfigReady =
    !hasCloudConfig || Boolean(cloudConfigPath.trim() && discoveredConfigCount !== null && discoveredConfigCount > 0);

  const datesReady = dateGranularity === "none" || Boolean(startDate && endDate);
  const canCheckQuota = Boolean(datesReady && dateValidation.valid && cloudConfigReady);

  const openQuotaModal = useCallback(async () => {
    setQuotaOpen(true);
    setQuotaLoading(true);
    setQuotaError(null);
    setQuotaInfo(null);

    try {
      const info = await getDeploymentQuotaInfo(buildRequest());
      setQuotaInfo(info);
    } catch (e: unknown) {
      setQuotaError(e instanceof Error ? e.message : "Failed to load quota info");
    } finally {
      setQuotaLoading(false);
    }
  }, [buildRequest]);

  const hasChecklistWarningsRaw = checklistValidation && !checklistValidation.ready && !dryRun;
  const needsAcknowledgmentRaw = hasChecklistWarningsRaw && checklistValidation!.can_proceed_with_acknowledgment;
  const cannotProceedRaw = hasChecklistWarningsRaw && checklistValidation!.blocking_items.length > 0;

  const maxConcurrentValue = maxConcurrent ? parseInt(maxConcurrent, 10) : 0;
  const maxConcurrentExceedsLimit = maxConcurrentValue > 2500;

  const canSubmit =
    datesReady &&
    dateValidation.valid &&
    !isDeploying &&
    cloudConfigReady &&
    (dryRun || !cannotProceedRaw) &&
    (dryRun || !needsAcknowledgmentRaw || acknowledgedWarnings) &&
    !maxConcurrentExceedsLimit;

  const value: DeployFormContextValue = {
    serviceName,
    onDeploy,
    isDeploying,
    dimensions,
    loadingDims,
    validateDate,
    checklistValidation,
    compute,
    setCompute,
    mode,
    setMode,
    region,
    setRegion,
    vmZone,
    setVmZone,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    selectedCategories,
    setSelectedCategories,
    selectedVenues,
    setSelectedVenues,
    selectedFeatureGroups,
    setSelectedFeatureGroups,
    selectedTimeframes,
    setSelectedTimeframes,
    selectedInstruments,
    setSelectedInstruments,
    selectedTargetTypes,
    setSelectedTargetTypes,
    selectedDomain,
    setSelectedDomain,
    force,
    setForce,
    dryRun,
    setDryRun,
    logLevel,
    setLogLevel,
    containerMaxWorkers,
    setContainerMaxWorkers,
    extraArgs,
    setExtraArgs,
    deploymentTag,
    setDeploymentTag,
    acknowledgedWarnings,
    setAcknowledgedWarnings,
    skipVenueSharding,
    setSkipVenueSharding,
    skipFeatureGroupSharding,
    setSkipFeatureGroupSharding,
    dateGranularity,
    setDateGranularity,
    maxConcurrent,
    setMaxConcurrent,
    cloudProvider,
    setCloudProvider,
    imageTag,
    setImageTag,
    trafficSplitPct,
    setTrafficSplitPct,
    healthGateTimeoutS,
    setHealthGateTimeoutS,
    rollbackOnFail,
    setRollbackOnFail,
    quotaOpen,
    setQuotaOpen,
    quotaLoading,
    quotaError,
    quotaInfo,
    openQuotaModal,
    cloudConfigPath,
    setCloudConfigPath,
    discoveredConfigCount,
    handleCloudConfigSelected,
    backendRegion,
    showRegionWarning,
    primaryCategory,
    categoryVenues,
    allCategoriesVenueCount,
    dateValidation,
    getDimension,
    hasCategory,
    hasVenue,
    hasFeatureGroup,
    hasTimeframe,
    hasInstrument,
    hasTargetType,
    hasDomain,
    hasDate,
    hasCloudConfig,
    estimatedShards,
    buildRequest,
    handleSubmit,
    cloudConfigReady,
    datesReady,
    canCheckQuota,
    hasChecklistWarnings: !!hasChecklistWarningsRaw,
    needsAcknowledgment: !!needsAcknowledgmentRaw,
    cannotProceed: !!cannotProceedRaw,
    maxConcurrentExceedsLimit,
    canSubmit,
  };

  return <DeployFormContext.Provider value={value}>{children}</DeployFormContext.Provider>;
}
