import { describe, it, expect, beforeEach, vi } from "vitest";
import { resetMockStore } from "@/lib/mock/store";

// Mock firebaseAdmin to use mock store
vi.mock("@/lib/firebaseAdmin", async () => {
  const { mockDb, mockAuth } = await import("@/lib/mock/store");
  return {
    getAdminDb: () => mockDb,
    getAdminAuth: () => mockAuth,
  };
});

import { getAllowedPresentationIds } from "@/lib/access";

beforeEach(() => {
  resetMockStore();
});

describe("getAllowedPresentationIds", () => {
  it("returns empty for nonexistent user", async () => {
    const ids = await getAllowedPresentationIds("nonexistent-uid");
    expect(ids).toEqual([]);
  });

  it("returns explicit presentation IDs for viewer", async () => {
    // mock-viewer-uid has presentationIds: ["00-master"]
    const ids = await getAllowedPresentationIds("mock-viewer-uid");
    expect(ids).toContain("00-master");
  });

  it("includes client presentations for client user", async () => {
    // mock-client-uid has clientId: "elysium"
    // elysium client has presentationIds: ["00-master", "01-data-provision", "04-execution-as-a-service"]
    const ids = await getAllowedPresentationIds("mock-client-uid");
    expect(ids).toContain("00-master");
    expect(ids).toContain("01-data-provision");
    expect(ids).toContain("04-execution-as-a-service");
  });

  it("includes group presentations for board member", async () => {
    // mock-board-uid has groupIds: ["board-group"]
    // board-group has presentationIds: ["00-master", "05-investment-management", "06-regulatory-umbrella"]
    const ids = await getAllowedPresentationIds("mock-board-uid");
    expect(ids).toContain("00-master");
    expect(ids).toContain("05-investment-management");
    expect(ids).toContain("06-regulatory-umbrella");
  });

  it("resolves folder groups for admin", async () => {
    // mock-admin-uid has groupIds: ["board-group", "all-presentations"]
    // all-presentations is a folder group with folderName: "services"
    // services folder contains: 01-06 presentations
    const ids = await getAllowedPresentationIds("mock-admin-uid");
    // From board-group: 00-master, 05, 06
    expect(ids).toContain("00-master");
    // From folder group "services": 01-06
    expect(ids).toContain("01-data-provision");
    expect(ids).toContain("02-backtesting-as-a-service");
    expect(ids).toContain("03-strategy-white-labelling");
    expect(ids).toContain("04-execution-as-a-service");
    expect(ids).toContain("05-investment-management");
    expect(ids).toContain("06-regulatory-umbrella");
  });

  it("deduplicates IDs across sources", async () => {
    // Admin has both board-group (includes 00-master) and direct access
    const ids = await getAllowedPresentationIds("mock-admin-uid");
    const masterCount = ids.filter((id) => id === "00-master").length;
    expect(masterCount).toBe(1); // no duplicates
  });

  it("returns investor presentations", async () => {
    // mock-investor-uid has groupIds: ["investor-group"]
    // investor-group has presentationIds: ["00-master", "05-investment-management"]
    const ids = await getAllowedPresentationIds("mock-investor-uid");
    expect(ids).toContain("00-master");
    expect(ids).toContain("05-investment-management");
    expect(ids).toHaveLength(2);
  });
});
