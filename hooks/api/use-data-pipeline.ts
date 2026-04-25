import type { TurboCategoryData, TurboDataStatusResponse } from "@/hooks/deployment/_api-stub";
import { getDataStatusTurbo, getServicesOverview } from "@/hooks/deployment/_api-stub";
import { useAuth } from "@/hooks/use-auth";
import { MOCK_ACTIVE_JOBS, MOCK_ALERTS, MOCK_PIPELINE_STAGES } from "@/lib/mocks/fixtures/data-service";
import { isMockDataMode } from "@/lib/runtime/data-mode";
import type { AlertItem, DataAssetGroup, JobInfo, PipelineStageSummary } from "@/lib/types/data-service";
import { useQuery } from "@tanstack/react-query";

const STAGE_SERVICE_MAP: Record<string, string> = {
  instruments: "instruments-service",
  raw: "market-tick-data-service",
  processing: "market-data-processing-service",
};

const STAGE_LABELS: Record<string, string> = {
  instruments: "Instruments",
  raw: "Raw Data",
  processing: "Processed",
  events: "Events",
};

const STAGE_ORDER = ["instruments", "raw", "processing", "events"] as const;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function thirtyDaysAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function turboToStageSummary(stage: string, turbo: TurboDataStatusResponse | null): PipelineStageSummary {
  const label = STAGE_LABELS[stage] ?? stage;
  if (!turbo || !turbo.categories) {
    return {
      stage: stage as PipelineStageSummary["stage"],
      label,
      totalShards: 0,
      completedShards: 0,
      inProgressShards: 0,
      failedShards: 0,
      completionPct: 0,
      lastUpdated: new Date().toISOString(),
      byAssetGroup: [],
    };
  }

  let totalFound = 0;
  let totalExpected = 0;
  const byAssetGroup: PipelineStageSummary["byAssetGroup"] = [];

  for (const [catKey, catData] of Object.entries(turbo.categories) as [string, TurboCategoryData][]) {
    const found = catData.dates_found ?? catData.dates_found_count ?? 0;
    const expected = catData.dates_expected ?? found;
    totalFound += found;
    totalExpected += expected;
    byAssetGroup.push({
      assetGroup: catKey.toLowerCase() as DataAssetGroup,
      totalShards: expected,
      completedShards: found,
      completionPct: expected > 0 ? Math.round((found / expected) * 100 * 10) / 10 : 0,
    });
  }

  const pct = totalExpected > 0 ? Math.round((totalFound / totalExpected) * 100 * 10) / 10 : 0;

  return {
    stage: stage as PipelineStageSummary["stage"],
    label,
    totalShards: totalExpected,
    completedShards: totalFound,
    inProgressShards: 0,
    failedShards: Math.max(totalExpected - totalFound, 0),
    completionPct: pct,
    lastUpdated: new Date().toISOString(),
    byAssetGroup,
  };
}

async function fetchPipelineStages(): Promise<PipelineStageSummary[]> {
  const startDate = thirtyDaysAgo();
  const endDate = today();

  const turboResults = await Promise.allSettled(
    STAGE_ORDER.filter((s) => s in STAGE_SERVICE_MAP).map(async (stage) => {
      const service = STAGE_SERVICE_MAP[stage];
      const turbo = await getDataStatusTurbo({
        service,
        start_date: startDate,
        end_date: endDate,
      });
      return { stage, turbo };
    }),
  );

  const stages: PipelineStageSummary[] = [];
  const turboMap = new Map<string, TurboDataStatusResponse>();

  for (const result of turboResults) {
    if (result.status === "fulfilled") {
      turboMap.set(result.value.stage, result.value.turbo);
    }
  }

  for (const stage of STAGE_ORDER) {
    if (stage === "events") {
      const processingStage = stages.find((s) => s.stage === "processing");
      stages.push({
        stage: "events",
        label: "Events",
        totalShards: processingStage?.totalShards ?? 0,
        completedShards: processingStage?.completedShards ?? 0,
        inProgressShards: 0,
        failedShards: 0,
        completionPct: processingStage?.completionPct ?? 0,
        lastUpdated: new Date().toISOString(),
        byAssetGroup: processingStage?.byAssetGroup ?? [],
      });
      continue;
    }
    stages.push(turboToStageSummary(stage, turboMap.get(stage) ?? null));
  }

  return stages;
}

async function fetchActiveJobs(): Promise<JobInfo[]> {
  try {
    const overview = await getServicesOverview();
    if (!overview.services?.length) return [];
    return overview.services
      .filter((s) => s.health !== "healthy")
      .slice(0, 5)
      .map((s, i) => ({
        id: `job-${i}`,
        type: "process" as const,
        status: "running" as const,
        assetGroup: "cefi" as DataAssetGroup,
        venue: s.service,
        dateRange: { start: thirtyDaysAgo(), end: today() },
        shardsTotal: 100,
        shardsCompleted: 50,
        progressPct: 50,
        startedAt: new Date().toISOString(),
        workersActive: 1,
        workersMax: 4,
        forceFlag: false,
      }));
  } catch {
    return [];
  }
}

export function useDataPipelineStages() {
  const { user } = useAuth();
  const mock = isMockDataMode();

  return useQuery<PipelineStageSummary[]>({
    queryKey: ["data-pipeline-stages", user?.id, mock],
    queryFn: async () => {
      if (mock) return MOCK_PIPELINE_STAGES;
      return fetchPipelineStages();
    },
    enabled: !!user,
    refetchInterval: 60_000,
    placeholderData: MOCK_PIPELINE_STAGES,
  });
}

export function useDataPipelineJobs() {
  const { user } = useAuth();
  const mock = isMockDataMode();

  return useQuery<JobInfo[]>({
    queryKey: ["data-pipeline-jobs", user?.id, mock],
    queryFn: async () => {
      if (mock) return MOCK_ACTIVE_JOBS;
      return fetchActiveJobs();
    },
    enabled: !!user,
    refetchInterval: 30_000,
    placeholderData: MOCK_ACTIVE_JOBS,
  });
}

export function useDataPipelineAlerts() {
  const { user } = useAuth();
  const mock = isMockDataMode();

  return useQuery<AlertItem[]>({
    queryKey: ["data-pipeline-alerts", user?.id, mock],
    queryFn: async () => {
      if (mock) return MOCK_ALERTS;
      return MOCK_ALERTS;
    },
    enabled: !!user,
    placeholderData: MOCK_ALERTS,
  });
}
