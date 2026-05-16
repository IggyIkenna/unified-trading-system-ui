import { describe, expect, it } from "vitest";

import { linkWithScope } from "@/lib/utils/nav-helpers";
import { EMPTY_WORKSPACE_SCOPE, type WorkspaceScope } from "@/lib/architecture-v2/workspace-scope";

function scope(overrides: Partial<WorkspaceScope> = {}): WorkspaceScope {
  return { ...EMPTY_WORKSPACE_SCOPE, ...overrides };
}

describe("linkWithScope", () => {
  it("returns the original href when scope is empty", () => {
    expect(linkWithScope("/dashboard", EMPTY_WORKSPACE_SCOPE)).toBe("/dashboard");
  });

  it("appends scope params for a non-empty scope", () => {
    const result = linkWithScope("/services/workspace", scope({ assetGroups: ["CEFI"], surface: "terminal" }));
    expect(result).toContain("/services/workspace?");
    expect(result).toContain("ag=CEFI");
    expect(result).toContain("surface=terminal");
  });

  it("preserves an existing query string", () => {
    const result = linkWithScope("/services/workspace?foo=bar", scope({ assetGroups: ["DEFI"] }));
    expect(result).toContain("foo=bar");
    expect(result).toContain("ag=DEFI");
  });

  it("lets existing query params override scope params on collision", () => {
    const result = linkWithScope("/services/workspace?surface=research", scope({ surface: "terminal" }));
    expect(result).toContain("surface=research");
    expect(result).not.toContain("surface=terminal");
  });

  it("preserves a hash fragment", () => {
    const result = linkWithScope("/services/workspace#widget-1", scope({ assetGroups: ["CEFI"] }));
    expect(result).toMatch(/^\/services\/workspace\?ag=CEFI#widget-1$/);
  });

  it("preserves both query string and hash", () => {
    const result = linkWithScope("/services/workspace?foo=bar#widget-1", scope({ assetGroups: ["CEFI"] }));
    expect(result).toContain("?");
    expect(result).toContain("foo=bar");
    expect(result).toContain("ag=CEFI");
    expect(result.endsWith("#widget-1")).toBe(true);
  });
});
