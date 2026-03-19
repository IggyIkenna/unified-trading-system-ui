import { describe, it, expect } from "vitest";
import type {
  Service,
  Deployment,
  DeploymentRequest,
  DeploymentStatus,
  HealthResponse,
  ServiceStatus as ServiceStatusType,
  DeployJobStatus,
  ServiceHealth,
} from "../../src/types";
import type {
  ServiceStatus,
  DeployParams,
  DeployJob,
} from "../../src/types/deploymentTypes";

describe("Type contracts", () => {
  it("Service interface has required fields", () => {
    const service: Service = {
      name: "instruments-service",
      description: "Downloads instruments",
      dimensions: ["category", "venue"],
      docker_image: "gcr.io/test/instruments",
      cloud_run_job_name: "instruments-job",
    };
    expect(service.name).toBe("instruments-service");
    expect(service.dimensions).toHaveLength(2);
  });

  it("DeploymentRequest supports all fields", () => {
    const req: DeploymentRequest = {
      service: "instruments-service",
      compute: "vm",
      start_date: "2025-01-01",
      end_date: "2025-12-31",
      category: ["cefi"],
      venue: ["binance"],
      dry_run: true,
      max_concurrent: 500,
    };
    expect(req.service).toBe("instruments-service");
    expect(req.compute).toBe("vm");
    expect(req.dry_run).toBe(true);
  });

  it("DeploymentStatus union covers all valid statuses", () => {
    const statuses: DeploymentStatus[] = [
      "pending",
      "running",
      "completed",
      "completed_pending_delete",
      "completed_with_errors",
      "completed_with_warnings",
      "clean",
      "failed",
      "cancelled",
      "partial",
    ];
    expect(statuses).toHaveLength(10);
  });

  it("Deployment interface has required fields", () => {
    const deployment: Deployment = {
      id: "dep-123",
      service: "instruments-service",
      status: "running",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T01:00:00Z",
      total_shards: 100,
      completed_shards: 50,
      failed_shards: 2,
      parameters: { service: "instruments-service" },
    };
    expect(deployment.id).toBe("dep-123");
    expect(deployment.status).toBe("running");
  });

  it("HealthResponse has required fields", () => {
    const health: HealthResponse = {
      status: "healthy",
      version: "0.1.0",
      config_dir: "/configs",
    };
    expect(health.status).toBe("healthy");
  });

  it("deploymentTypes ServiceStatus has required fields", () => {
    const status: ServiceStatus = {
      service_id: "svc-1",
      name: "test-service",
      environment: "production",
      current_version: "1.0.0",
      health: "HEALTHY",
      last_deployed_at: "2026-01-01",
      replicas_ready: 3,
      replicas_total: 3,
    };
    expect(status.health).toBe("HEALTHY");
    expect(status.replicas_ready).toBe(3);
  });

  it("DeployParams has required fields", () => {
    const params: DeployParams = {
      service_id: "svc-1",
      version: "2.0.0",
      environment: "staging",
    };
    expect(params.service_id).toBe("svc-1");
  });

  it("DeployJob has required fields", () => {
    const job: DeployJob = {
      job_id: "job-abc",
      service_id: "svc-1",
      service_name: "test-service",
      version: "2.0.0",
      environment: "prod",
      status: "RUNNING",
      triggered_at: "2026-01-01T00:00:00Z",
      completed_at: null,
      logs_url: null,
      triggered_by: "admin",
    };
    expect(job.status).toBe("RUNNING");
    expect(job.completed_at).toBeNull();
  });

  it("ServiceHealth union covers all states", () => {
    const states: ServiceHealth[] = [
      "HEALTHY",
      "DEGRADED",
      "UNHEALTHY",
      "UNKNOWN",
    ];
    expect(states).toHaveLength(4);
  });

  it("DeployJobStatus union covers all states", () => {
    const statuses: DeployJobStatus[] = [
      "QUEUED",
      "RUNNING",
      "SUCCESS",
      "FAILED",
      "CANCELLED",
    ];
    expect(statuses).toHaveLength(5);
  });
});
