"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getExecutionMissingShards, type ExecutionMissingShardsResponse } from "@/hooks/deployment/_api-stub";
import type {
  ExecutionDataStatusContextValue,
  ExecutionDataStatusProviderProps,
  ExecutionDataStatusResponse,
  ViewMode,
} from "@/components/ops/deployment/data-status/execution-data-status-types";

const ExecutionDataStatusContext = createContext<ExecutionDataStatusContextValue | null>(null);

export function useExecutionDataStatusContext(): ExecutionDataStatusContextValue {
  const ctx = useContext(ExecutionDataStatusContext);
  if (!ctx) {
    throw new Error("useExecutionDataStatusContext must be used within ExecutionDataStatusProvider");
  }
  return ctx;
}

export function ExecutionDataStatusProvider({ serviceName, children }: ExecutionDataStatusProviderProps) {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  });

  const [cloudConfigPath, setCloudConfigPath] = useState<string | null>(null);
  const [, setDiscoveredConfigCount] = useState<number | null>(null);
  const [data, setData] = useState<ExecutionDataStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("hierarchy");

  const [expandedStrategies, setExpandedStrategies] = useState<Set<string>>(new Set());
  const [expandedModes, setExpandedModes] = useState<Set<string>>(new Set());
  const [expandedTimeframes, setExpandedTimeframes] = useState<Set<string>>(new Set());
  const [expandedBreakdowns, setExpandedBreakdowns] = useState<Set<string>>(new Set());
  const [expandedConfigs, setExpandedConfigs] = useState<Set<string>>(new Set());

  const [showDeployModal, setShowDeployModal] = useState(false);
  const [missingShardsData, setMissingShardsData] = useState<ExecutionMissingShardsResponse | null>(null);
  const [loadingMissingShards, setLoadingMissingShards] = useState(false);
  const [deployingMissing, setDeployingMissing] = useState(false);

  const [deployRegion, setDeployRegion] = useState<string>("asia-northeast1");
  const [backendRegion, setBackendRegion] = useState<string>("asia-northeast1");
  const [showDeployRegionWarning, setShowDeployRegionWarning] = useState(false);

  useEffect(() => {
    fetch("/api/config/region")
      .then((r) => r.json())
      .then((d) => {
        const region = d.storage_region ?? d.gcs_region ?? "asia-northeast1";
        setBackendRegion(region);
        setDeployRegion(region);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setShowDeployRegionWarning(deployRegion !== backendRegion);
  }, [deployRegion, backendRegion]);

  const handleCloudConfigSelected = useCallback((path: string, configCount: number) => {
    setCloudConfigPath(path);
    setDiscoveredConfigCount(configCount);
  }, []);

  const fetchData = useCallback(async () => {
    if (!cloudConfigPath) {
      setError("Please select a config path first");
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch(
        `/api/service-status/execution-services/data-status?` +
          `config_path=${encodeURIComponent(cloudConfigPath)}` +
          `&start_date=${startDate}` +
          `&end_date=${endDate}` +
          `&include_dates_list=true`,
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ExecutionDataStatusResponse = await response.json();

      if (result.error) {
        setError(result.error);
      } else {
        setData(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data status");
    } finally {
      setLoading(false);
    }
  }, [cloudConfigPath, startDate, endDate]);

  useEffect(() => {
    setData(null);
    setError(null);
  }, [cloudConfigPath]);

  const fetchMissingShards = useCallback(async () => {
    if (!cloudConfigPath) return;

    setLoadingMissingShards(true);
    try {
      const result = await getExecutionMissingShards({
        config_path: cloudConfigPath,
        start_date: startDate,
        end_date: endDate,
      });
      setMissingShardsData(result);
      setShowDeployModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch missing shards");
    } finally {
      setLoadingMissingShards(false);
    }
  }, [cloudConfigPath, startDate, endDate]);

  const handleDeployMissing = useCallback(async () => {
    if (!missingShardsData || missingShardsData.total_missing === 0) return;

    setDeployingMissing(true);
    try {
      const response = await fetch("/api/deployments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: "execution-services",
          compute: "cloud_run",
          region: deployRegion,
          start_date: startDate,
          end_date: endDate,
          custom_shards: missingShardsData.missing_shards.map((s) => {
            const path = s.config_path ?? s.config_gcs ?? "";
            const isS3 = path.startsWith("s3://");
            return {
              ...(isS3 ? { config_path: path } : { config_gcs: path }),
              start_date: s.date,
              end_date: s.date,
            };
          }),
        }),
      });

      if (!response.ok) {
        throw new Error(`Deployment failed: ${response.statusText}`);
      }

      const result = await response.json();
      setShowDeployModal(false);
      setMissingShardsData(null);
      alert(`Deployment created: ${result.deployment_id || "Success"}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deployment failed");
    } finally {
      setDeployingMissing(false);
    }
  }, [missingShardsData, startDate, endDate, deployRegion]);

  const toggleStrategy = (key: string) => {
    setExpandedStrategies((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleMode = (key: string) => {
    setExpandedModes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleTimeframe = (key: string) => {
    setExpandedTimeframes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleBreakdown = (key: string) => {
    setExpandedBreakdowns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleConfig = (key: string) => {
    setExpandedConfigs((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const closeDeployModal = useCallback(() => {
    setShowDeployModal(false);
    setMissingShardsData(null);
  }, []);

  const value: ExecutionDataStatusContextValue = {
    serviceName,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    cloudConfigPath,
    data,
    loading,
    error,
    viewMode,
    setViewMode,
    expandedStrategies,
    expandedModes,
    expandedTimeframes,
    expandedBreakdowns,
    expandedConfigs,
    showDeployModal,
    missingShardsData,
    loadingMissingShards,
    deployingMissing,
    deployRegion,
    setDeployRegion,
    backendRegion,
    showDeployRegionWarning,
    handleCloudConfigSelected,
    fetchData,
    fetchMissingShards,
    handleDeployMissing,
    toggleStrategy,
    toggleMode,
    toggleTimeframe,
    toggleBreakdown,
    toggleConfig,
    closeDeployModal,
  };

  return <ExecutionDataStatusContext.Provider value={value}>{children}</ExecutionDataStatusContext.Provider>;
}
