import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("deployment-ui mock-api deployment control (ph3)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("VITE_MOCK_API", "true");
    vi.stubGlobal("window", {
      fetch: vi.fn(),
      location: { origin: "http://localhost:5173" },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns services list with health and deployment data", async () => {
    const { installDeploymentMockHandlers } = await import("./mock-api");
    installDeploymentMockHandlers(true);

    const response = await window.fetch("/api/services");
    const data = (await (response as Response).json()) as {
      services: Array<{
        name: string;
        layer: number;
        category: string;
        status: string;
        lastDeployed: string;
      }>;
    };

    expect(data.services).toBeDefined();
    expect(data.services.length).toBeGreaterThanOrEqual(5);

    // Verify different categories
    const categories = new Set(data.services.map((s) => s.category));
    expect(categories.size).toBeGreaterThanOrEqual(3);

    // Verify different layers
    const layers = new Set(data.services.map((s) => s.layer));
    expect(layers.size).toBeGreaterThanOrEqual(3);
  });

  it("returns historical deployments", async () => {
    const { installDeploymentMockHandlers } = await import("./mock-api");
    installDeploymentMockHandlers(true);

    const response = await window.fetch("/api/deployments");
    const data = (await (response as Response).json()) as {
      deployments: Array<{
        id: string;
        service: string;
        status: string;
        total_shards: number;
        completed_shards: number;
        failed_shards: number;
        parameters: { mode: string };
      }>;
      total: number;
    };

    expect(data.deployments).toBeDefined();
    expect(data.deployments.length).toBeGreaterThanOrEqual(3);

    // Verify different statuses
    const statuses = new Set(data.deployments.map((d) => d.status));
    expect(statuses.size).toBeGreaterThanOrEqual(2);
    expect(statuses.has("completed")).toBe(true);
    expect(statuses.has("running") || statuses.has("failed")).toBe(true);
  });

  it("supports POST to create new deployment", async () => {
    const { installDeploymentMockHandlers } = await import("./mock-api");
    installDeploymentMockHandlers(true);

    const response = await window.fetch("/api/deployments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service: "instruments-service",
        mode: "batch",
        shards: 24,
      }),
    });
    const data = (await (response as Response).json()) as {
      deployment_id: string;
      shards: Array<{ shard_id: string; status: string }>;
      total_shards: number;
      dry_run: boolean;
      message: string;
    };

    expect(data.deployment_id).toBeTruthy();
    expect(data.shards).toBeDefined();
    expect(data.total_shards).toBeGreaterThan(0);
    expect(data.message).toContain("mock");
  });

  it("supports rollback endpoint", async () => {
    const { installDeploymentMockHandlers } = await import("./mock-api");
    installDeploymentMockHandlers(true);

    const response = await window.fetch("/api/deployments/dep-001/rollback", {
      method: "POST",
    });
    const data = (await (response as Response).json()) as {
      id: string;
      status: string;
      message: string;
    };

    expect(data.status).toBe("rolling_back");
    expect(data.message).toContain("Rollback");
  });

  it("returns Cloud Build triggers with build info", async () => {
    const { installDeploymentMockHandlers } = await import("./mock-api");
    installDeploymentMockHandlers(true);

    const response = await window.fetch("/api/cloud-builds/triggers");
    const data = (await (response as Response).json()) as {
      triggers: Array<{
        trigger_id: string;
        service: string;
        last_build: { status: string; build_id: string };
      }>;
    };

    expect(data.triggers).toBeDefined();
    expect(data.triggers.length).toBeGreaterThanOrEqual(1);
    expect(data.triggers[0].last_build).toBeDefined();
    expect(data.triggers[0].last_build.status).toBe("SUCCESS");
  });

  it("returns build versions for version selection", async () => {
    const { installDeploymentMockHandlers } = await import("./mock-api");
    installDeploymentMockHandlers(true);

    const response = await window.fetch("/api/builds/instruments-service");
    const data = (await (response as Response).json()) as Array<{
      tag: string;
      display: string;
      version: string;
      branch: string;
    }>;

    expect(data).toBeDefined();
    expect(data.length).toBeGreaterThanOrEqual(2);

    for (const build of data) {
      expect(build.tag).toBeTruthy();
      expect(build.version).toBeTruthy();
      expect(build.branch).toBe("main");
    }
  });

  it("returns quota information", async () => {
    const { installDeploymentMockHandlers } = await import("./mock-api");
    installDeploymentMockHandlers(true);

    const response = await window.fetch("/api/quota?shards=50");
    const data = (await (response as Response).json()) as {
      projectId: string;
      cpuQuota: { used: number; limit: number };
      memoryQuota: { used: number; limit: number };
      estimatedCost: { perShard: number; total: number };
    };

    expect(data.projectId).toBeTruthy();
    expect(data.cpuQuota).toBeDefined();
    expect(data.memoryQuota).toBeDefined();
    expect(data.estimatedCost.total).toBe(50 * 0.18);
  });

  it("returns readiness checklist with pass/fail/warn items", async () => {
    const { installDeploymentMockHandlers } = await import("./mock-api");
    installDeploymentMockHandlers(true);

    const response = await window.fetch(
      "/api/services/instruments-service/checklist",
    );
    const data = (await (response as Response).json()) as {
      service: string;
      overallScore: number;
      categories: Array<{
        name: string;
        score: number;
        items: Array<{ status: string }>;
      }>;
    };

    expect(data.overallScore).toBeGreaterThan(0);
    expect(data.categories).toBeDefined();
    expect(data.categories.length).toBeGreaterThanOrEqual(2);

    // Verify different item statuses
    const allStatuses = new Set(
      data.categories.flatMap((c) => c.items.map((i) => i.status)),
    );
    expect(allStatuses.has("pass")).toBe(true);
    expect(allStatuses.has("fail") || allStatuses.has("warn")).toBe(true);
  });

  it("returns data status with calendar and missing dates", async () => {
    const { installDeploymentMockHandlers } = await import("./mock-api");
    installDeploymentMockHandlers(true);

    const response = await window.fetch(
      "/api/services/instruments-service/data-status",
    );
    const data = (await (response as Response).json()) as {
      service: string;
      category: string;
      totalDates: number;
      completeDates: number;
      missingDates: string[];
      calendar: Array<{ date: string; status: string }>;
    };

    expect(data.totalDates).toBeGreaterThan(0);
    expect(data.completeDates).toBeGreaterThan(0);
    expect(data.missingDates.length).toBeGreaterThan(0);
    expect(data.calendar.length).toBeGreaterThan(0);

    // Verify calendar has both complete and missing entries
    const calendarStatuses = new Set(data.calendar.map((c) => c.status));
    expect(calendarStatuses.has("complete")).toBe(true);
    expect(calendarStatuses.has("missing")).toBe(true);
  });

  it("returns health endpoint", async () => {
    const { installDeploymentMockHandlers } = await import("./mock-api");
    installDeploymentMockHandlers(true);

    const response = await window.fetch("/api/health");
    const data = (await (response as Response).json()) as {
      status: string;
      mock: boolean;
    };

    expect(data.status).toBe("healthy");
    expect(data.mock).toBe(true);
  });

  it("supports deploy with specific build version", async () => {
    const { installDeploymentMockHandlers } = await import("./mock-api");
    installDeploymentMockHandlers(true);

    const response = await window.fetch(
      "/api/deployments/instruments-service/deploy",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_tag: "v0.3.1-abc1234",
          environment: "staging",
        }),
      },
    );
    const data = (await (response as Response).json()) as {
      status: string;
      service: string;
      image_tag: string;
      environment: string;
    };

    expect(data.status).toBe("deploying");
    expect(data.image_tag).toBe("v0.3.1-abc1234");
    expect(data.environment).toBe("staging");
  });
});
