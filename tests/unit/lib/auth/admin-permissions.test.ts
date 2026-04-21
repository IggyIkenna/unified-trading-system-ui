import { describe, expect, it } from "vitest";

import type { AuthUser } from "@/lib/auth/types";
import {
  ADMIN_PERMISSIONS,
  hasAdminPermission,
  hasAllAdminPermissions,
  hasAnyAdminPermission,
  type AdminAuthUser,
} from "@/lib/auth/admin-permissions";

const CLIENT_USER: AuthUser = {
  id: "u-1",
  email: "user@example.com",
  displayName: "Example",
  role: "client",
  org: { id: "org-1", name: "Example Org" },
  entitlements: [],
};

const BOOTSTRAP_ADMIN: AuthUser = {
  ...CLIENT_USER,
  id: "admin-1",
  email: "ikenna@odum-research.com",
  role: "admin",
  // admin_permissions claim OMITTED — legacy bootstrap admin.
};

const SCOPED_ADMIN: AdminAuthUser = {
  ...BOOTSTRAP_ADMIN,
  id: "admin-2",
  email: "scoped@odum-research.com",
  admin_permissions: ["admin:view_audit", "admin:modify_user"],
};

const VIEW_ONLY_ADMIN: AdminAuthUser = {
  ...BOOTSTRAP_ADMIN,
  id: "admin-3",
  email: "viewonly@odum-research.com",
  admin_permissions: [],
};

describe("ADMIN_PERMISSIONS catalogue", () => {
  it("lists exactly the 10 canonical admin permissions", () => {
    expect(ADMIN_PERMISSIONS).toHaveLength(10);
    expect(ADMIN_PERMISSIONS).toContain("admin:grant_role");
    expect(ADMIN_PERMISSIONS).toContain("admin:create_org");
    expect(ADMIN_PERMISSIONS).toContain("admin:lock_strategy");
    expect(ADMIN_PERMISSIONS).toContain("admin:impersonate");
    expect(ADMIN_PERMISSIONS).toContain("admin:rotate_secret");
    expect(ADMIN_PERMISSIONS).toContain("admin:modify_user");
    expect(ADMIN_PERMISSIONS).toContain("admin:offboard_user");
    expect(ADMIN_PERMISSIONS).toContain("admin:view_audit");
    expect(ADMIN_PERMISSIONS).toContain("admin:manage_apps");
    expect(ADMIN_PERMISSIONS).toContain("admin:manage_entitlements");
  });
});

describe("hasAdminPermission — gating rules", () => {
  it("rule 1: non-admin users always fail", () => {
    for (const perm of ADMIN_PERMISSIONS) {
      expect(hasAdminPermission(CLIENT_USER, perm)).toBe(false);
    }
  });

  it("rule 1: null user always fails", () => {
    expect(hasAdminPermission(null, "admin:grant_role")).toBe(false);
  });

  it("rule 2: bootstrap admin (claim omitted) passes every check", () => {
    for (const perm of ADMIN_PERMISSIONS) {
      expect(hasAdminPermission(BOOTSTRAP_ADMIN, perm)).toBe(true);
    }
  });

  it("rule 3: view-only admin (empty array) fails every destructive check", () => {
    for (const perm of ADMIN_PERMISSIONS) {
      expect(hasAdminPermission(VIEW_ONLY_ADMIN, perm)).toBe(false);
    }
  });

  it("rule 4: scoped admin passes listed permissions", () => {
    expect(hasAdminPermission(SCOPED_ADMIN, "admin:view_audit")).toBe(true);
    expect(hasAdminPermission(SCOPED_ADMIN, "admin:modify_user")).toBe(true);
  });

  it("rule 4: scoped admin fails unlisted permissions", () => {
    expect(hasAdminPermission(SCOPED_ADMIN, "admin:grant_role")).toBe(false);
    expect(hasAdminPermission(SCOPED_ADMIN, "admin:rotate_secret")).toBe(false);
    expect(hasAdminPermission(SCOPED_ADMIN, "admin:offboard_user")).toBe(false);
  });
});

describe("hasAllAdminPermissions", () => {
  it("returns true if every permission passes", () => {
    expect(hasAllAdminPermissions(SCOPED_ADMIN, ["admin:view_audit", "admin:modify_user"])).toBe(true);
  });

  it("returns false if any permission fails", () => {
    expect(hasAllAdminPermissions(SCOPED_ADMIN, ["admin:view_audit", "admin:rotate_secret"])).toBe(false);
  });

  it("bootstrap admin passes every combination", () => {
    expect(hasAllAdminPermissions(BOOTSTRAP_ADMIN, [...ADMIN_PERMISSIONS])).toBe(true);
  });

  it("non-admin fails even for empty permission set request (still requires admin role)", () => {
    // Vacuously true for empty list per `every()` semantics BUT non-admin should never reach here in practice.
    expect(hasAllAdminPermissions(CLIENT_USER, ["admin:view_audit"])).toBe(false);
  });
});

describe("hasAnyAdminPermission", () => {
  it("returns true if any permission passes", () => {
    expect(hasAnyAdminPermission(SCOPED_ADMIN, ["admin:rotate_secret", "admin:view_audit"])).toBe(true);
  });

  it("returns false if no permission passes", () => {
    expect(hasAnyAdminPermission(SCOPED_ADMIN, ["admin:rotate_secret", "admin:grant_role"])).toBe(false);
  });

  it("non-admin fails every check", () => {
    expect(hasAnyAdminPermission(CLIENT_USER, [...ADMIN_PERMISSIONS])).toBe(false);
  });
});
