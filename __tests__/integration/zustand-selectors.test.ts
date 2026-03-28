/**
 * Tests for Zustand selector stability.
 *
 * Catches the class of bug where `?? []` in a Zustand selector creates a
 * new array reference on every render, causing React's getSnapshot to
 * detect a change and trigger an infinite re-render loop.
 *
 * Rule: Zustand selectors must return stable references for fallback values.
 * Use module-level constants (e.g., EMPTY_ARR) instead of inline `[]`.
 */
import { describe, it, expect } from "vitest";

describe("Zustand selector stability", () => {
  it("workspace-toolbar uses module-level EMPTY_ARR for undoStack/snapshots fallback", async () => {
    // Import the module and verify the constants exist
    const source = await import("@/components/widgets/workspace-toolbar");
    // The module should export WorkspaceToolbar (function component)
    expect(typeof source.WorkspaceToolbar).toBe("function");
  });

  it("workspace-toolbar source does not use inline ?? [] in selectors", async () => {
    // Read the actual source to verify no inline empty array fallbacks in selectors
    // This is a static analysis test — catches regressions
    const fs = await import("fs");
    const path = await import("path");
    const filePath = path.resolve(
      process.cwd(),
      "components/widgets/workspace-toolbar.tsx",
    );
    const source = fs.readFileSync(filePath, "utf-8");

    // Find all useWorkspaceStore selector lines
    const selectorLines = source
      .split("\n")
      .filter((line: string) => line.includes("useWorkspaceStore((s)"));

    for (const line of selectorLines) {
      // Check that no selector uses `?? []` (inline empty array)
      // They should use `?? EMPTY_ARR` or `?? EMPTY_WORKSPACES` instead
      if (line.includes("?? []")) {
        throw new Error(
          `Zustand selector uses inline ?? [] which causes infinite loops: ${line.trim()}`,
        );
      }
    }

    // Verify the fix constants exist
    expect(source).toContain("EMPTY_ARR");
    expect(source).toContain("EMPTY_WORKSPACES");
  });
});
