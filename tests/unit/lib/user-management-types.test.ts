/**
 * Ported from user-management-ui/tests/unit/types.test.ts
 * Adapted to UTSU type names (ProvisionedPerson, ProvisioningRole, etc.)
 */
import { describe, it, expect } from "vitest";
import type {
  ProvisionedPerson,
  ProvisioningRole,
  ProvisioningStatus,
  OnboardRequest,
  ProvisioningStep,
  UserServices,
} from "@/lib/types/user-management";

describe("User Management Types", () => {
  it("ProvisionedPerson type accepts valid data", () => {
    const person: ProvisionedPerson = {
      id: "usr-001",
      firebase_uid: "fb-001",
      name: "Test User",
      email: "test@example.com",
      role: "admin",
      product_slugs: [],
      status: "active",
      provisioned_at: new Date().toISOString(),
      last_modified: new Date().toISOString(),
      services: {
        github: "provisioned",
        slack: "provisioned",
        microsoft365: "provisioned",
        gcp: "provisioned",
        aws: "provisioned",
        portal: "provisioned",
      },
    };
    expect(person.id).toBe("usr-001");
    expect(person.role).toBe("admin");
    expect(person.status).toBe("active");
  });

  it("ProvisioningRole covers all roles", () => {
    const roles: ProvisioningRole[] = [
      "admin",
      "collaborator",
      "board",
      "client",
      "shareholder",
      "accounting",
      "operations",
      "investor",
    ];
    expect(roles).toHaveLength(8);
  });

  it("User status covers all statuses", () => {
    const statuses: ProvisionedPerson["status"][] = ["active", "offboarded", "pending"];
    expect(statuses).toHaveLength(3);
  });

  it("ProvisioningStatus covers all states", () => {
    const states: ProvisioningStatus[] = ["provisioned", "not_applicable", "pending", "failed"];
    expect(states).toHaveLength(4);
  });

  it("OnboardRequest has required fields", () => {
    const req: OnboardRequest = {
      name: "Jane Doe",
      email: "jane@example.com",
      role: "client",
      product_slugs: ["trading-basic"],
    };
    expect(req.name).toBe("Jane Doe");
    expect(req.product_slugs).toContain("trading-basic");
  });

  it("ProvisioningStep tracks service status", () => {
    const step: ProvisioningStep = {
      service: "github",
      label: "GitHub",
      status: "success",
    };
    expect(step.service).toBe("github");
    expect(step.status).toBe("success");
  });

  it("UserServices tracks all 6 services", () => {
    const services: UserServices = {
      github: "provisioned",
      slack: "provisioned",
      microsoft365: "not_applicable",
      gcp: "provisioned",
      aws: "provisioned",
      portal: "provisioned",
    };
    expect(Object.keys(services)).toHaveLength(6);
  });

  it("ProvisionedPerson with optional fields", () => {
    const person: ProvisionedPerson = {
      id: "usr-002",
      firebase_uid: "fb-002",
      name: "Client User",
      email: "client@example.com",
      role: "client",
      github_handle: "client-gh",
      microsoft_upn: "client@m365.com",
      slack_handle: "client-slack",
      gcp_email: "client@gcp.com",
      aws_iam_arn: "arn:aws:iam::123456789012:user/client",
      product_slugs: ["trading-basic", "quant-alpha"],
      status: "active",
      provisioned_at: new Date().toISOString(),
      last_modified: new Date().toISOString(),
      services: {
        github: "not_applicable",
        slack: "provisioned",
        microsoft365: "not_applicable",
        gcp: "not_applicable",
        aws: "not_applicable",
        portal: "provisioned",
      },
    };
    expect(person.github_handle).toBe("client-gh");
    expect(person.product_slugs).toHaveLength(2);
  });
});
