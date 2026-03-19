import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as clientModule from "../../src/api/client";

const {
  getHealth,
  getServices,
  getServiceDimensions,
  discoverConfigs,
  listDirectories,
  getConfigBuckets,
  getVenues,
  getVenuesByCategory,
  getStartDates,
  getDependencies,
  getDeployments,
  getDeployment,
  createDeployment,
  getDeploymentQuotaInfo,
  cancelDeployment,
  resumeDeployment,
  verifyDeploymentCompletion,
  cancelShard,
  updateDeploymentTag,
  deleteDeployment,
  bulkDeleteDeployments,
  getDeploymentReport,
  getRerunCommands,
  getChecklist,
  validateChecklist,
  listChecklists,
  getDataStatus,
  getDataStatusTurbo,
  getVenueFilters,
  listFiles,
  getMissingShards,
  getExecutionDataStatus,
  getExecutionMissingShards,
  getServiceStatus,
  getServicesOverview,
  getCapabilities,
  getServiceCategories,
  clearCache,
  clearDataStatusCache,
  getCloudBuildTriggers,
  triggerCloudBuild,
  getCloudBuildHistory,
  getInstrumentsList,
  getInstrumentAvailability,
  getDeploymentEvents,
  getDeploymentVmEvents,
  rollbackLiveDeployment,
  getLiveDeploymentHealth,
  ApiError,
  AbortError,
} = clientModule;

// Helper to create a mock successful fetch response
function mockFetchOk(data: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(data),
    }),
  );
}

// Helper to create a mock failed fetch response
function mockFetchError(status: number, detail: string) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status,
      statusText: `HTTP ${status}`,
      json: () =>
        Promise.resolve({ detail, message: detail, code: `HTTP_${status}` }),
    }),
  );
}

// Helper to create a mock failed fetch response with no JSON
function mockFetchErrorNoJson(status: number) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status,
      statusText: `HTTP ${status}`,
      json: () => Promise.reject(new Error("no json")),
    }),
  );
}

function getFetchUrl(): string {
  return (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
}

function getFetchOptions(): RequestInit {
  return (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit;
}

describe("client API functions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getHealth", () => {
    it("calls /api/health and returns response", async () => {
      const mockData = { status: "ok" };
      mockFetchOk(mockData);
      const result = await getHealth();
      expect(result).toEqual(mockData);
      expect(getFetchUrl()).toContain("/api/health");
    });
  });

  describe("getServices", () => {
    it("calls /api/services and returns response", async () => {
      const mockData = { services: [], count: 0 };
      mockFetchOk(mockData);
      const result = await getServices();
      expect(result).toEqual(mockData);
      expect(getFetchUrl()).toContain("/api/services");
    });
  });

  describe("getServiceDimensions", () => {
    it("calls correct URL with service name", async () => {
      mockFetchOk({ dimensions: [] });
      await getServiceDimensions("instruments-service");
      expect(getFetchUrl()).toContain(
        "/api/services/instruments-service/dimensions",
      );
    });
  });

  describe("discoverConfigs", () => {
    it("calls correct URL with service name and cloud path", async () => {
      mockFetchOk({ configs: [] });
      await discoverConfigs("my-service", "gs://bucket/path");
      const url = getFetchUrl();
      expect(url).toContain("/api/services/my-service/discover-configs");
      expect(url).toContain("cloud_path=gs%3A%2F%2Fbucket%2Fpath");
    });
  });

  describe("listDirectories", () => {
    it("calls correct URL with service name and cloud path", async () => {
      mockFetchOk({ directories: [], count: 0 });
      await listDirectories("my-service", "gs://bucket/path");
      const url = getFetchUrl();
      expect(url).toContain("/api/services/my-service/list-directories");
      expect(url).toContain("cloud_path=");
    });
  });

  describe("getConfigBuckets", () => {
    it("calls correct URL", async () => {
      mockFetchOk({ service: "svc", default_bucket: null, buckets: [] });
      await getConfigBuckets("my-service");
      expect(getFetchUrl()).toContain(
        "/api/services/my-service/config-buckets",
      );
    });
  });

  describe("getVenues", () => {
    it("calls /api/config/venues", async () => {
      mockFetchOk({ venues: [] });
      await getVenues();
      expect(getFetchUrl()).toContain("/api/config/venues");
    });
  });

  describe("getVenuesByCategory", () => {
    it("calls correct URL with category", async () => {
      mockFetchOk({ venues: [] });
      await getVenuesByCategory("cefi");
      expect(getFetchUrl()).toContain("/api/config/venues/cefi");
    });
  });

  describe("getStartDates", () => {
    it("calls correct URL", async () => {
      mockFetchOk({ start_dates: {} });
      await getStartDates("instruments-service");
      expect(getFetchUrl()).toContain(
        "/api/config/expected-start-dates/instruments-service",
      );
    });
  });

  describe("getDependencies", () => {
    it("calls correct URL", async () => {
      mockFetchOk({ dependencies: [] });
      await getDependencies("my-service");
      expect(getFetchUrl()).toContain("/api/config/dependencies/my-service");
    });
  });

  describe("getDeployments", () => {
    it("calls /api/deployments with no filters", async () => {
      mockFetchOk({ deployments: [], count: 0 });
      await getDeployments();
      const url = getFetchUrl();
      expect(url).toContain("/api/deployments");
      expect(url).not.toContain("?");
    });

    it("adds service filter to URL", async () => {
      mockFetchOk({ deployments: [], count: 0 });
      await getDeployments({ service: "instruments-service" });
      expect(getFetchUrl()).toContain("service=instruments-service");
    });

    it("adds status filter to URL", async () => {
      mockFetchOk({ deployments: [], count: 0 });
      await getDeployments({ status: "COMPLETED" });
      expect(getFetchUrl()).toContain("status=COMPLETED");
    });

    it("adds category filter to URL", async () => {
      mockFetchOk({ deployments: [], count: 0 });
      await getDeployments({ category: "cefi" });
      expect(getFetchUrl()).toContain("category=cefi");
    });

    it("adds limit filter to URL", async () => {
      mockFetchOk({ deployments: [], count: 0 });
      await getDeployments({ limit: 50 });
      expect(getFetchUrl()).toContain("limit=50");
    });

    it("adds force_refresh filter to URL", async () => {
      mockFetchOk({ deployments: [], count: 0 });
      await getDeployments({ forceRefresh: true });
      expect(getFetchUrl()).toContain("force_refresh=true");
    });
  });

  describe("getDeployment", () => {
    it("calls /api/deployments/:id", async () => {
      mockFetchOk({ deployment_id: "dep-123" });
      await getDeployment("dep-123");
      expect(getFetchUrl()).toContain("/api/deployments/dep-123");
    });
  });

  describe("createDeployment", () => {
    it("sends POST request with deployment request body", async () => {
      mockFetchOk({ deployment_id: "dep-1", dry_run: true, shards: [] });
      const request = {
        service: "instruments-service",
        compute: "vm" as const,
        region: "us-central1",
        start_date: "2026-01-01",
        end_date: "2026-01-31",
        dry_run: true,
      };
      await createDeployment(request);
      const url = getFetchUrl();
      const options = getFetchOptions();
      expect(url).toContain("/api/deployments");
      expect(options.method).toBe("POST");
      expect(JSON.parse(options.body as string)).toEqual(request);
    });
  });

  describe("getDeploymentQuotaInfo", () => {
    it("sends POST request to /api/deployments/quota-info", async () => {
      mockFetchOk({
        service: "svc",
        compute: "vm",
        total_shards: 10,
        required_quota: {},
        effective_settings: { max_concurrent: 5 },
        region: "us-central1",
      });
      const request = {
        service: "instruments-service",
        compute: "vm" as const,
        region: "us-central1",
        start_date: "2026-01-01",
        end_date: "2026-01-31",
        dry_run: true,
      };
      await getDeploymentQuotaInfo(request);
      const url = getFetchUrl();
      const options = getFetchOptions();
      expect(url).toContain("/api/deployments/quota-info");
      expect(options.method).toBe("POST");
    });
  });

  describe("cancelDeployment", () => {
    it("sends POST to /api/deployments/:id/cancel", async () => {
      mockFetchOk({
        deployment_id: "dep-1",
        status: "CANCELLED",
        cancelled_shards: 5,
        message: "ok",
      });
      await cancelDeployment("dep-1");
      const url = getFetchUrl();
      const options = getFetchOptions();
      expect(url).toContain("/api/deployments/dep-1/cancel");
      expect(options.method).toBe("POST");
    });
  });

  describe("resumeDeployment", () => {
    it("sends POST to /api/deployments/:id/resume", async () => {
      mockFetchOk({
        deployment_id: "dep-1",
        status: "RUNNING",
        total_shards: 10,
        completed: 5,
        failed: 0,
        message: "ok",
      });
      await resumeDeployment("dep-1");
      const url = getFetchUrl();
      const options = getFetchOptions();
      expect(url).toContain("/api/deployments/dep-1/resume");
      expect(options.method).toBe("POST");
    });
  });

  describe("verifyDeploymentCompletion", () => {
    it("sends POST to /api/deployments/:id/verify-completion with no query", async () => {
      mockFetchOk({
        completed_with_errors: 0,
        completed_with_warnings: 0,
        completed_with_verification: 10,
        completed: 10,
      });
      await verifyDeploymentCompletion("dep-1");
      const url = getFetchUrl();
      expect(url).toContain("/api/deployments/dep-1/verify-completion");
      expect(url).not.toContain("?");
    });

    it("appends force=true query param when force option set", async () => {
      mockFetchOk({
        completed_with_errors: 0,
        completed_with_warnings: 0,
        completed_with_verification: 10,
        completed: 10,
      });
      await verifyDeploymentCompletion("dep-1", { force: true });
      expect(getFetchUrl()).toContain("force=true");
    });
  });

  describe("cancelShard", () => {
    it("sends POST to correct shard cancel URL", async () => {
      mockFetchOk({
        deployment_id: "dep-1",
        shard_id: "shard-1",
        status: "CANCELLED",
        message: "ok",
      });
      await cancelShard("dep-1", "shard-1");
      const url = getFetchUrl();
      const options = getFetchOptions();
      expect(url).toContain("/api/deployments/dep-1/shards/shard-1/cancel");
      expect(options.method).toBe("POST");
    });
  });

  describe("updateDeploymentTag", () => {
    it("sends PATCH to /api/deployments/:id with tag body", async () => {
      mockFetchOk({
        deployment_id: "dep-1",
        tag: "my-tag",
        message: "updated",
      });
      await updateDeploymentTag("dep-1", "my-tag");
      const url = getFetchUrl();
      const options = getFetchOptions();
      expect(url).toContain("/api/deployments/dep-1");
      expect(options.method).toBe("PATCH");
      expect(JSON.parse(options.body as string)).toEqual({ tag: "my-tag" });
    });

    it("sends null tag to clear tag", async () => {
      mockFetchOk({ deployment_id: "dep-1", tag: null, message: "updated" });
      await updateDeploymentTag("dep-1", null);
      const options = getFetchOptions();
      expect(JSON.parse(options.body as string)).toEqual({ tag: null });
    });
  });

  describe("deleteDeployment", () => {
    it("sends DELETE to /api/deployments/:id", async () => {
      mockFetchOk({ deployment_id: "dep-1", deleted: true, message: "ok" });
      await deleteDeployment("dep-1");
      const url = getFetchUrl();
      const options = getFetchOptions();
      expect(url).toContain("/api/deployments/dep-1");
      expect(options.method).toBe("DELETE");
    });
  });

  describe("bulkDeleteDeployments", () => {
    it("sends POST with deployment_ids array", async () => {
      mockFetchOk({ total_requested: 2, deleted: 2, failed: 0, results: [] });
      await bulkDeleteDeployments(["dep-1", "dep-2"]);
      const url = getFetchUrl();
      const options = getFetchOptions();
      expect(url).toContain("/api/deployments/bulk-delete");
      expect(options.method).toBe("POST");
      expect(JSON.parse(options.body as string)).toEqual({
        deployment_ids: ["dep-1", "dep-2"],
      });
    });
  });

  describe("getDeploymentReport", () => {
    it("calls /api/deployments/:id/report", async () => {
      mockFetchOk({
        deployment_id: "dep-1",
        service: "svc",
        compute_type: "vm",
        status: "COMPLETED",
        summary: {
          total_shards: 1,
          succeeded: 1,
          failed: 0,
          total_retries: 0,
          success_rate: 1,
        },
        failure_breakdown: {},
        zone_usage: {},
        region_usage: {},
        failed_shards: [],
        infrastructure_issues: [],
        retry_stats: {
          shards_with_retries: 0,
          total_zone_switches: 0,
          total_region_switches: 0,
        },
      });
      await getDeploymentReport("dep-1");
      expect(getFetchUrl()).toContain("/api/deployments/dep-1/report");
    });
  });

  describe("getRerunCommands", () => {
    it("calls /api/deployments/:id/rerun-commands with no options", async () => {
      mockFetchOk({
        deployment_id: "dep-1",
        service: "svc",
        compute_type: "vm",
        total_commands: 0,
        commands: [],
      });
      await getRerunCommands("dep-1");
      const url = getFetchUrl();
      expect(url).toContain("/api/deployments/dep-1/rerun-commands");
      expect(url).not.toContain("?");
    });

    it("appends failedOnly and shardId params", async () => {
      mockFetchOk({
        deployment_id: "dep-1",
        service: "svc",
        compute_type: "vm",
        total_commands: 0,
        commands: [],
      });
      await getRerunCommands("dep-1", { failedOnly: true, shardId: "shard-5" });
      const url = getFetchUrl();
      expect(url).toContain("failed_only=true");
      expect(url).toContain("shard_id=shard-5");
    });
  });

  describe("getChecklist", () => {
    it("calls /api/checklists/:service/checklist", async () => {
      mockFetchOk({ checklist: [] });
      await getChecklist("instruments-service");
      expect(getFetchUrl()).toContain(
        "/api/checklists/instruments-service/checklist",
      );
    });
  });

  describe("validateChecklist", () => {
    it("calls /api/checklists/:service/checklist/validate", async () => {
      mockFetchOk({ valid: true });
      await validateChecklist("instruments-service");
      expect(getFetchUrl()).toContain(
        "/api/checklists/instruments-service/checklist/validate",
      );
    });
  });

  describe("listChecklists", () => {
    it("calls /api/checklists", async () => {
      mockFetchOk({ checklists: [], count: 0 });
      await listChecklists();
      expect(getFetchUrl()).toContain("/api/checklists");
    });
  });

  describe("getDataStatus", () => {
    it("calls /api/data-status with required params", async () => {
      mockFetchOk({ categories: {} });
      await getDataStatus({
        service: "instruments-service",
        start_date: "2026-01-01",
        end_date: "2026-01-31",
      });
      const url = getFetchUrl();
      expect(url).toContain("/api/data-status");
      expect(url).toContain("service=instruments-service");
      expect(url).toContain("start_date=2026-01-01");
      expect(url).toContain("end_date=2026-01-31");
    });

    it("appends optional params when provided", async () => {
      mockFetchOk({ categories: {} });
      await getDataStatus({
        service: "instruments-service",
        start_date: "2026-01-01",
        end_date: "2026-01-31",
        mode: "batch",
        category: ["cefi", "defi"],
        venue: ["binance"],
        show_missing: true,
        check_venues: true,
        check_data_types: true,
        force_refresh: true,
      });
      const url = getFetchUrl();
      expect(url).toContain("mode=batch");
      expect(url).toContain("category=cefi");
      expect(url).toContain("venue=binance");
      expect(url).toContain("show_missing=true");
      expect(url).toContain("check_venues=true");
      expect(url).toContain("check_data_types=true");
      expect(url).toContain("force_refresh=true");
    });
  });

  describe("getDataStatusTurbo", () => {
    it("calls /api/data-status/turbo with required params", async () => {
      mockFetchOk({
        service: "svc",
        date_range: { start: "2026-01-01", end: "2026-01-31", days: 31 },
        mode: "turbo",
        overall_completion_pct: 100,
        overall_dates_found: 31,
        overall_dates_expected: 31,
        categories: {},
      });
      await getDataStatusTurbo({
        service: "instruments-service",
        start_date: "2026-01-01",
        end_date: "2026-01-31",
      });
      const url = getFetchUrl();
      expect(url).toContain("/api/data-status/turbo");
      expect(url).toContain("service=instruments-service");
    });

    it("appends optional boolean flags when true", async () => {
      mockFetchOk({
        service: "svc",
        date_range: { start: "2026-01-01", end: "2026-01-31", days: 31 },
        mode: "turbo",
        overall_completion_pct: 100,
        overall_dates_found: 31,
        overall_dates_expected: 31,
        categories: {},
      });
      await getDataStatusTurbo({
        service: "instruments-service",
        start_date: "2026-01-01",
        end_date: "2026-01-31",
        include_sub_dimensions: true,
        include_dates_list: true,
        full_dates_list: true,
        check_upstream_availability: true,
        first_day_of_month_only: true,
        freshness_date: "2026-01-01",
        mode: "batch",
        category: ["cefi"],
        venue: ["binance"],
        folder: ["spot"],
        data_type: ["trades"],
      });
      const url = getFetchUrl();
      expect(url).toContain("include_sub_dimensions=true");
      expect(url).toContain("include_dates_list=true");
      expect(url).toContain("full_dates_list=true");
      expect(url).toContain("check_upstream_availability=true");
      expect(url).toContain("first_day_of_month_only=true");
      expect(url).toContain("freshness_date=2026-01-01");
      expect(url).toContain("category=cefi");
      expect(url).toContain("venue=binance");
      expect(url).toContain("folder=spot");
      expect(url).toContain("data_type=trades");
    });
  });

  describe("getVenueFilters", () => {
    it("calls /api/data-status/venue-filters with params", async () => {
      mockFetchOk({
        category: "cefi",
        venue: "binance",
        folders: [],
        data_types: [],
        instrument_types: [],
      });
      await getVenueFilters("cefi", "binance");
      const url = getFetchUrl();
      expect(url).toContain("/api/data-status/venue-filters");
      expect(url).toContain("category=cefi");
      expect(url).toContain("venue=binance");
    });
  });

  describe("listFiles", () => {
    it("calls /api/data-status/list-files with all required params", async () => {
      mockFetchOk({
        service: "svc",
        bucket: "b",
        category: "cefi",
        venue: "binance",
        folder: "spot",
        data_type: "trades",
        timeframe: null,
        date_range: { start: "2026-01-01", end: "2026-01-31", total_days: 31 },
        summary: {
          total_files: 0,
          total_size_bytes: 0,
          total_size_formatted: "0B",
          dates_with_data: 0,
          dates_empty: 31,
          completion_pct: 0,
        },
        by_date: [],
      });
      await listFiles({
        service: "instruments-service",
        category: "cefi",
        venue: "binance",
        folder: "spot",
        data_type: "trades",
        start_date: "2026-01-01",
        end_date: "2026-01-31",
      });
      expect(getFetchUrl()).toContain("/api/data-status/list-files");
      expect(getFetchUrl()).toContain("service=instruments-service");
    });

    it("appends optional timeframe param", async () => {
      mockFetchOk({
        service: "svc",
        bucket: "b",
        category: "cefi",
        venue: "binance",
        folder: "spot",
        data_type: "trades",
        timeframe: "1h",
        date_range: { start: "2026-01-01", end: "2026-01-31", total_days: 31 },
        summary: {
          total_files: 0,
          total_size_bytes: 0,
          total_size_formatted: "0B",
          dates_with_data: 0,
          dates_empty: 31,
          completion_pct: 0,
        },
        by_date: [],
      });
      await listFiles({
        service: "svc",
        category: "cefi",
        venue: "binance",
        folder: "spot",
        data_type: "trades",
        start_date: "2026-01-01",
        end_date: "2026-01-31",
        timeframe: "1h",
      });
      expect(getFetchUrl()).toContain("timeframe=1h");
    });
  });

  describe("getMissingShards", () => {
    it("calls /api/data-status/missing-shards with required params", async () => {
      mockFetchOk({ missing_shards: [], total_missing: 0 });
      await getMissingShards({
        service: "instruments-service",
        start_date: "2026-01-01",
        end_date: "2026-01-31",
      });
      expect(getFetchUrl()).toContain("/api/data-status/missing-shards");
      expect(getFetchUrl()).toContain("service=instruments-service");
    });

    it("appends optional mode, category, venue params", async () => {
      mockFetchOk({ missing_shards: [], total_missing: 0 });
      await getMissingShards({
        service: "instruments-service",
        start_date: "2026-01-01",
        end_date: "2026-01-31",
        mode: "batch",
        category: ["cefi"],
        venue: ["binance"],
      });
      const url = getFetchUrl();
      expect(url).toContain("mode=batch");
      expect(url).toContain("category=cefi");
      expect(url).toContain("venue=binance");
    });
  });

  describe("getExecutionDataStatus", () => {
    it("calls correct URL", async () => {
      mockFetchOk({
        config_path: "/path",
        version: "1",
        total_configs: 0,
        configs_with_results: 0,
        missing_count: 0,
        completion_pct: 0,
        strategy_count: 0,
        strategies: [],
        breakdown_by_mode: {},
        breakdown_by_timeframe: {},
        breakdown_by_algo: {},
      });
      await getExecutionDataStatus({ config_path: "/path/to/config" });
      expect(getFetchUrl()).toContain(
        "/api/service-status/execution-services/data-status",
      );
      expect(getFetchUrl()).toContain("config_path=");
    });

    it("appends date and list params when provided", async () => {
      mockFetchOk({
        config_path: "/path",
        version: "1",
        total_configs: 0,
        configs_with_results: 0,
        missing_count: 0,
        completion_pct: 0,
        strategy_count: 0,
        strategies: [],
        breakdown_by_mode: {},
        breakdown_by_timeframe: {},
        breakdown_by_algo: {},
      });
      await getExecutionDataStatus({
        config_path: "/path",
        start_date: "2026-01-01",
        end_date: "2026-01-31",
        include_dates_list: true,
      });
      const url = getFetchUrl();
      expect(url).toContain("start_date=2026-01-01");
      expect(url).toContain("end_date=2026-01-31");
      expect(url).toContain("include_dates_list=true");
    });
  });

  describe("getExecutionMissingShards", () => {
    const baseResponse = {
      missing_shards: [],
      total_missing: 0,
      total_configs: 0,
      total_dates: 0,
      breakdown: {
        by_strategy: {},
        by_mode: {},
        by_timeframe: {},
        by_algo: {},
        by_date: {},
      },
      filters: {
        config_path: "/path",
        start_date: "2026-01-01",
        end_date: "2026-01-31",
      },
    };

    it("calls correct URL with required params", async () => {
      mockFetchOk(baseResponse);
      await getExecutionMissingShards({
        config_path: "/path",
        start_date: "2026-01-01",
        end_date: "2026-01-31",
      });
      expect(getFetchUrl()).toContain(
        "/api/service-status/execution-services/missing-shards",
      );
    });

    it("appends optional strategy, mode, timeframe, algo params", async () => {
      mockFetchOk(baseResponse);
      await getExecutionMissingShards({
        config_path: "/path",
        start_date: "2026-01-01",
        end_date: "2026-01-31",
        strategy: "momentum",
        mode: "live",
        timeframe: "1h",
        algo: "algo1",
      });
      const url = getFetchUrl();
      expect(url).toContain("strategy=momentum");
      expect(url).toContain("mode=live");
      expect(url).toContain("timeframe=1h");
      expect(url).toContain("algo=algo1");
    });
  });

  describe("getServiceStatus", () => {
    it("calls /api/service-status/:service/status", async () => {
      mockFetchOk({ service: "svc", status: {} });
      await getServiceStatus("instruments-service");
      expect(getFetchUrl()).toContain(
        "/api/service-status/instruments-service/status",
      );
    });
  });

  describe("getServicesOverview", () => {
    it("calls /api/service-status/overview", async () => {
      mockFetchOk({ services: [] });
      await getServicesOverview();
      expect(getFetchUrl()).toContain("/api/service-status/overview");
    });
  });

  describe("getCapabilities", () => {
    it("calls /api/capabilities", async () => {
      mockFetchOk({ gcs_fuse: { active: false } });
      await getCapabilities();
      expect(getFetchUrl()).toContain("/api/capabilities");
    });
  });

  describe("getServiceCategories", () => {
    it("calls /api/capabilities/service-categories/:service", async () => {
      mockFetchOk({ service: "svc", categories: [] });
      await getServiceCategories("instruments-service");
      expect(getFetchUrl()).toContain(
        "/api/capabilities/service-categories/instruments-service",
      );
    });
  });

  describe("clearCache", () => {
    it("sends POST to /api/cache/clear", async () => {
      mockFetchOk({ status: "ok", cleared: 5 });
      await clearCache();
      const url = getFetchUrl();
      const options = getFetchOptions();
      expect(url).toContain("/api/cache/clear");
      expect(options.method).toBe("POST");
    });
  });

  describe("clearDataStatusCache", () => {
    it("sends POST to /api/data-status/turbo/cache/clear", async () => {
      mockFetchOk({ status: "ok", entries_cleared: 10 });
      await clearDataStatusCache();
      const url = getFetchUrl();
      const options = getFetchOptions();
      expect(url).toContain("/api/data-status/turbo/cache/clear");
      expect(options.method).toBe("POST");
    });
  });

  describe("getCloudBuildTriggers", () => {
    it("calls /api/cloud-builds/triggers", async () => {
      mockFetchOk({
        triggers: [],
        total: 0,
        project: "proj",
        region: "us-central1",
      });
      await getCloudBuildTriggers();
      expect(getFetchUrl()).toContain("/api/cloud-builds/triggers");
    });
  });

  describe("triggerCloudBuild", () => {
    it("sends POST to /api/cloud-builds/trigger with service and branch", async () => {
      mockFetchOk({
        success: true,
        build_id: "build-1",
        log_url: null,
        message: "ok",
        service: "svc",
        branch: "main",
      });
      await triggerCloudBuild("instruments-service");
      const url = getFetchUrl();
      const options = getFetchOptions();
      expect(url).toContain("/api/cloud-builds/trigger");
      expect(options.method).toBe("POST");
      expect(JSON.parse(options.body as string)).toEqual({
        service: "instruments-service",
        branch: "main",
      });
    });

    it("uses provided branch name", async () => {
      mockFetchOk({
        success: true,
        build_id: "build-1",
        log_url: null,
        message: "ok",
        service: "svc",
        branch: "develop",
      });
      await triggerCloudBuild("instruments-service", "develop");
      const options = getFetchOptions();
      expect(JSON.parse(options.body as string)).toEqual({
        service: "instruments-service",
        branch: "develop",
      });
    });
  });

  describe("getCloudBuildHistory", () => {
    it("calls /api/cloud-builds/history/:service with default limit", async () => {
      mockFetchOk({ service: "svc", trigger_name: "t", builds: [], total: 0 });
      await getCloudBuildHistory("instruments-service");
      const url = getFetchUrl();
      expect(url).toContain("/api/cloud-builds/history/instruments-service");
      expect(url).toContain("limit=10");
    });

    it("uses provided limit", async () => {
      mockFetchOk({ service: "svc", trigger_name: "t", builds: [], total: 0 });
      await getCloudBuildHistory("instruments-service", 25);
      expect(getFetchUrl()).toContain("limit=25");
    });
  });

  describe("getInstrumentsList", () => {
    it("calls /api/data-status/instruments with category", async () => {
      mockFetchOk({
        category: "cefi",
        total_in_file: 0,
        returned_count: 0,
        instruments: [],
      });
      await getInstrumentsList({ category: "cefi" });
      const url = getFetchUrl();
      expect(url).toContain("/api/data-status/instruments");
      expect(url).toContain("category=cefi");
    });

    it("appends search and limit params when provided", async () => {
      mockFetchOk({
        category: "cefi",
        total_in_file: 0,
        returned_count: 0,
        instruments: [],
      });
      await getInstrumentsList({ category: "cefi", search: "BTC", limit: 20 });
      const url = getFetchUrl();
      expect(url).toContain("search=BTC");
      expect(url).toContain("limit=20");
    });
  });

  describe("getInstrumentAvailability", () => {
    const baseResponse = {
      instrument_key: "binance/btc_usdt/spot",
      parsed: {
        venue: "binance",
        instrument_type: "spot",
        symbol: "BTC_USDT",
        category: "cefi",
        folder: "spot",
      },
      service: "svc",
      bucket: "b",
      date_range: {
        start: "2026-01-01",
        end: "2026-01-31",
        total_dates: 31,
        first_day_of_month_only: false,
      },
      data_types_checked: [],
      overall: { expected: 31, found: 31, missing: 0, completion_pct: 100 },
      by_data_type: {},
    };

    it("calls /api/data-status/instrument-availability with required params", async () => {
      mockFetchOk(baseResponse);
      await getInstrumentAvailability({
        instrument_key: "binance/btc_usdt/spot",
        start_date: "2026-01-01",
        end_date: "2026-01-31",
      });
      const url = getFetchUrl();
      expect(url).toContain("/api/data-status/instrument-availability");
      expect(url).toContain("instrument_key=binance%2Fbtc_usdt%2Fspot");
    });

    it("appends optional params when provided", async () => {
      mockFetchOk(baseResponse);
      await getInstrumentAvailability({
        instrument_key: "binance/btc_usdt/spot",
        start_date: "2026-01-01",
        end_date: "2026-01-31",
        data_type: "trades",
        first_day_of_month_only: true,
        service: "market-tick-data-handler",
        timeframe: "1h",
        available_from: "2025-01-01",
        available_to: "2026-12-31",
      });
      const url = getFetchUrl();
      expect(url).toContain("data_type=trades");
      expect(url).toContain("first_day_of_month_only=true");
      expect(url).toContain("service=market-tick-data-handler");
      expect(url).toContain("timeframe=1h");
      expect(url).toContain("available_from=2025-01-01");
      expect(url).toContain("available_to=2026-12-31");
    });
  });

  describe("getDeploymentEvents", () => {
    it("calls /api/deployments/:id/events with no shard_id", async () => {
      mockFetchOk({ deployment_id: "dep-1", events: [] });
      await getDeploymentEvents("dep-1");
      const url = getFetchUrl();
      expect(url).toContain("/api/deployments/dep-1/events");
      expect(url).not.toContain("?");
    });

    it("appends shard_id param when provided", async () => {
      mockFetchOk({ deployment_id: "dep-1", events: [] });
      await getDeploymentEvents("dep-1", "shard-42");
      expect(getFetchUrl()).toContain("shard_id=shard-42");
    });
  });

  describe("getDeploymentVmEvents", () => {
    it("calls /api/deployments/:id/vm-events", async () => {
      mockFetchOk({ deployment_id: "dep-1", events: [] });
      await getDeploymentVmEvents("dep-1");
      expect(getFetchUrl()).toContain("/api/deployments/dep-1/vm-events");
    });
  });

  describe("rollbackLiveDeployment", () => {
    it("sends POST to /api/deployments/:id/rollback", async () => {
      mockFetchOk({ success: true, message: "rolled back" });
      await rollbackLiveDeployment("dep-1", { reason: "bug" });
      const url = getFetchUrl();
      const options = getFetchOptions();
      expect(url).toContain("/api/deployments/dep-1/rollback");
      expect(options.method).toBe("POST");
      expect(JSON.parse(options.body as string)).toEqual({ reason: "bug" });
    });
  });

  describe("getLiveDeploymentHealth", () => {
    it("calls /api/deployments/:id/live-health with service and region params", async () => {
      mockFetchOk({ status: "healthy" });
      await getLiveDeploymentHealth(
        "dep-1",
        "instruments-service",
        "us-central1",
      );
      const url = getFetchUrl();
      expect(url).toContain("/api/deployments/dep-1/live-health");
      expect(url).toContain("service=instruments-service");
      expect(url).toContain("region=us-central1");
    });
  });

  describe("error handling (fetchJson)", () => {
    it("throws ApiError with status and message on HTTP error with detail", async () => {
      mockFetchError(404, "Not found");
      await expect(getHealth()).rejects.toBeInstanceOf(ApiError);
      try {
        mockFetchError(404, "Not found again");
        await getHealth();
      } catch (err) {
        if (err instanceof ApiError) {
          expect(err.status).toBe(404);
          expect(err.message).toBe("Not found again");
        }
      }
    });

    it("throws ApiError with HTTP status message when no detail in error JSON", async () => {
      mockFetchErrorNoJson(500);
      await expect(getHealth()).rejects.toBeInstanceOf(ApiError);
    });

    it("re-throws AbortError when fetch is aborted", async () => {
      const abortErr = new Error("Request was aborted");
      abortErr.name = "AbortError";
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortErr));
      await expect(getHealth()).rejects.toBeInstanceOf(AbortError);
    });
  });

  describe("ApiError class", () => {
    it("creates error with status and message", () => {
      const err = new ApiError(404, "Not found");
      expect(err.status).toBe(404);
      expect(err.message).toBe("Not found");
      expect(err.name).toBe("ApiError");
      expect(err instanceof Error).toBe(true);
    });
  });

  describe("AbortError class", () => {
    it("creates abort error with standard message", () => {
      const err = new AbortError();
      expect(err.name).toBe("AbortError");
      expect(err.message).toBe("Request was cancelled");
      expect(err instanceof Error).toBe(true);
    });
  });
});
