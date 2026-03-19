import { describe, it, expect, vi, beforeEach } from "vitest";

// Test the ApiError and AbortError classes, plus URL building helpers
// We can't test fetchJson directly (it calls fetch), but we can test the exported
// helper constants and error classes.

describe("ApiError", async () => {
  const { ApiError, AbortError } = await import("../../src/api/client");

  it("creates error with status and message", () => {
    const err = new ApiError(404, "Not found");
    expect(err.status).toBe(404);
    expect(err.message).toBe("Not found");
    expect(err.name).toBe("ApiError");
    expect(err instanceof Error).toBe(true);
  });

  it("creates error with 500 status", () => {
    const err = new ApiError(500, "Internal server error");
    expect(err.status).toBe(500);
    expect(err.message).toBe("Internal server error");
  });
});

describe("AbortError", async () => {
  const { AbortError } = await import("../../src/api/client");

  it("creates abort error with standard message", () => {
    const err = new AbortError();
    expect(err.name).toBe("AbortError");
    expect(err.message).toBe("Request was cancelled");
    expect(err instanceof Error).toBe(true);
  });
});

describe("TURBO_MODE_SERVICES", async () => {
  const {
    TURBO_MODE_SERVICES,
    TURBO_SUB_DIMENSION_SERVICES,
    UPSTREAM_CHECK_SERVICES,
  } = await import("../../src/api/client");

  it("includes expected services", () => {
    expect(TURBO_MODE_SERVICES).toContain("instruments-service");
    expect(TURBO_MODE_SERVICES).toContain("market-tick-data-handler");
    expect(TURBO_MODE_SERVICES).toContain("features-delta-one-service");
  });

  it("has sub-dimension mapping for turbo services", () => {
    expect(TURBO_SUB_DIMENSION_SERVICES["instruments-service"]).toBe("venue");
    expect(TURBO_SUB_DIMENSION_SERVICES["market-tick-data-handler"]).toBe(
      "data_type",
    );
    expect(TURBO_SUB_DIMENSION_SERVICES["features-delta-one-service"]).toBe(
      "feature_group",
    );
  });

  it("lists upstream check services", () => {
    expect(UPSTREAM_CHECK_SERVICES).toContain("market-data-processing-service");
    expect(UPSTREAM_CHECK_SERVICES).toContain("features-delta-one-service");
    expect(UPSTREAM_CHECK_SERVICES.length).toBe(2);
  });
});

describe("deploymentApi", async () => {
  const api = await import("../../src/api/deploymentApi");

  // Test handleResponse indirectly through exported functions
  // by mocking global fetch

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetchServices calls correct endpoint", async () => {
    const mockServices = [
      {
        service_id: "svc-1",
        name: "test",
        environment: "dev",
        current_version: "1.0",
        health: "HEALTHY",
        last_deployed_at: "2026-01-01",
        replicas_ready: 1,
        replicas_total: 1,
      },
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockServices),
      }),
    );

    const result = await api.fetchServices();
    expect(result).toEqual(mockServices);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/services"),
    );
  });

  it("fetchServices throws on HTTP error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve("Server error"),
      }),
    );

    await expect(api.fetchServices()).rejects.toThrow("HTTP 500: Server error");
  });

  it("fetchDeploymentHistory appends service_id query param", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      }),
    );

    await api.fetchDeploymentHistory("my-service");
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("?service_id=my-service"),
    );
  });

  it("fetchDeploymentHistory with no service_id has no query param", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      }),
    );

    await api.fetchDeploymentHistory();
    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).not.toContain("?");
  });

  it("triggerDeploy sends POST with JSON body", async () => {
    const params = { service_id: "svc-1", version: "2.0", environment: "prod" };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            job_id: "job-1",
            ...params,
            status: "QUEUED",
            triggered_at: "2026-01-01",
            completed_at: null,
            logs_url: null,
            triggered_by: "user",
            service_name: "test",
          }),
      }),
    );

    await api.triggerDeploy(params);
    const [url, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain("/api/v1/deployments");
    expect(options.method).toBe("POST");
    expect(options.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(options.body)).toEqual(params);
  });

  it("rollbackDeployment sends POST to correct URL", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ job_id: "job-1", status: "QUEUED" }),
      }),
    );

    await api.rollbackDeployment("job-123");
    const [url, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain("/api/v1/deployments/job-123/rollback");
    expect(options.method).toBe("POST");
  });
});
