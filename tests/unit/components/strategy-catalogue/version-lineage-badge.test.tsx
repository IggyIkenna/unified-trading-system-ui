import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { VersionLineageBadge } from "@/components/strategy-catalogue/VersionLineageBadge";

describe("VersionLineageBadge", () => {
  it("renders v0 (genesis) when there is no parent", () => {
    render(<VersionLineageBadge versionIndex={0} parentVersionIndex={null} />);
    expect(screen.getByTestId("version-lineage-badge")).toHaveTextContent("v0 (genesis)");
  });

  it("renders v1 (forked from v0) when parent exists", () => {
    render(<VersionLineageBadge versionIndex={1} parentVersionIndex={0} />);
    expect(screen.getByTestId("version-lineage-badge")).toHaveTextContent("v1 (forked from v0)");
  });

  it("renders compact label without parent suffix", () => {
    render(<VersionLineageBadge versionIndex={2} parentVersionIndex={1} compact />);
    expect(screen.getByTestId("version-lineage-badge")).toHaveTextContent("v2");
    expect(screen.getByTestId("version-lineage-badge")).not.toHaveTextContent("forked");
  });

  it("uses lineage chain in title attribute when provided", () => {
    render(<VersionLineageBadge versionIndex={3} parentVersionIndex={2} lineage={["v0", "v1", "v2", "v3"]} />);
    expect(screen.getByTestId("version-lineage-badge").getAttribute("title")).toBe("v0 → v1 → v2 → v3");
  });
});
