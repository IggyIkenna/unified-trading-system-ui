import { describe, it, expect, beforeEach } from "vitest";
import { mockDb, mockAuth, resetMockStore } from "@/lib/mock/store";

beforeEach(() => {
  resetMockStore();
});

describe("mockAuth", () => {
  it("verifySessionCookie returns mock admin user", async () => {
    const decoded = await mockAuth.verifySessionCookie("any-cookie", true);
    expect(decoded.uid).toBe("mock-admin-uid");
    expect(decoded.email).toBe("admin@odum-research.com");
  });

  it("createSessionCookie returns a mock value", async () => {
    const cookie = await mockAuth.createSessionCookie("token", {
      expiresIn: 5000,
    });
    expect(cookie).toBe("mock-session-cookie-value");
  });
});

describe("mockDb.collection", () => {
  it("reads seeded users", async () => {
    const snap = await mockDb.collection("users").doc("mock-admin-uid").get();
    expect(snap.exists).toBe(true);
    expect(snap.data()?.email).toBe("admin@odum-research.com");
  });

  it("returns non-existent doc correctly", async () => {
    const snap = await mockDb.collection("users").doc("nonexistent-uid").get();
    expect(snap.exists).toBe(false);
    expect(snap.data()).toBeUndefined();
  });

  it("reads seeded presentations", async () => {
    const snap = await mockDb
      .collection("presentations")
      .doc("00-master")
      .get();
    expect(snap.exists).toBe(true);
    expect(snap.data()?.title).toBe("Master Index");
  });

  it("reads seeded groups", async () => {
    const snap = await mockDb.collection("groups").doc("board-group").get();
    expect(snap.exists).toBe(true);
    const data = snap.data();
    expect(data?.presentationIds).toContain("00-master");
  });

  it("reads seeded clients", async () => {
    const snap = await mockDb.collection("clients").doc("elysium").get();
    expect(snap.exists).toBe(true);
    expect(snap.data()?.name).toBe("Elysium Capital");
  });
});

describe("mockDb.collection.where", () => {
  it("filters by __name__ in", async () => {
    const snap = await mockDb
      .collection("presentations")
      .where("__name__", "in", ["00-master", "01-data-provision"])
      .get();
    expect(snap.docs).toHaveLength(2);
    expect(snap.docs.map((d) => d.id).sort()).toEqual([
      "00-master",
      "01-data-provision",
    ]);
  });

  it("filters by field ==", async () => {
    const snap = await mockDb
      .collection("presentations")
      .where("folder", "==", "services")
      .get();
    expect(snap.docs.length).toBeGreaterThanOrEqual(6);
    snap.docs.forEach((doc) => {
      expect(doc.data()?.folder).toBe("services");
    });
  });

  it("returns empty for no matches", async () => {
    const snap = await mockDb
      .collection("presentations")
      .where("folder", "==", "nonexistent")
      .get();
    expect(snap.docs).toHaveLength(0);
  });
});

describe("mockDb.collection.get (list all)", () => {
  it("returns all documents in collection", async () => {
    const snap = await mockDb.collection("presentations").get();
    expect(snap.docs.length).toBe(10);
  });

  it("forEach works on query snapshot", async () => {
    const snap = await mockDb.collection("users").get();
    const emails: string[] = [];
    snap.forEach((doc) => {
      emails.push(doc.data()?.email as string);
    });
    expect(emails).toContain("admin@odum-research.com");
    expect(emails).toContain("board@odum-research.com");
  });
});

describe("mockDb CRUD operations", () => {
  it("set creates a new document", async () => {
    await mockDb
      .collection("users")
      .doc("new-uid")
      .set({ email: "new@test.com", role: "viewer" });
    const snap = await mockDb.collection("users").doc("new-uid").get();
    expect(snap.exists).toBe(true);
    expect(snap.data()?.email).toBe("new@test.com");
  });

  it("update modifies existing document", async () => {
    await mockDb
      .collection("users")
      .doc("mock-admin-uid")
      .update({ displayName: "Updated Admin" });
    const snap = await mockDb.collection("users").doc("mock-admin-uid").get();
    expect(snap.data()?.displayName).toBe("Updated Admin");
    expect(snap.data()?.email).toBe("admin@odum-research.com"); // unchanged
  });

  it("delete removes a document", async () => {
    await mockDb.collection("users").doc("mock-viewer-uid").delete();
    const snap = await mockDb.collection("users").doc("mock-viewer-uid").get();
    expect(snap.exists).toBe(false);
  });

  it("add creates document with auto-generated id", async () => {
    const ref = await mockDb
      .collection("contact_submissions")
      .add({ name: "Test", message: "Hello" });
    expect(ref._id).toMatch(/^auto-/);
    const snap = await ref.get();
    expect(snap.exists).toBe(true);
    expect(snap.data()?.name).toBe("Test");
  });
});

describe("mockDb.batch", () => {
  it("commits multiple operations atomically", async () => {
    const batch = mockDb.batch();
    batch.set(mockDb.collection("users").doc("batch-uid-1") as never, {
      email: "batch1@test.com",
    });
    batch.set(mockDb.collection("users").doc("batch-uid-2") as never, {
      email: "batch2@test.com",
    });
    await batch.commit();

    const snap1 = await mockDb.collection("users").doc("batch-uid-1").get();
    const snap2 = await mockDb.collection("users").doc("batch-uid-2").get();
    expect(snap1.exists).toBe(true);
    expect(snap2.exists).toBe(true);
  });
});

describe("resetMockStore", () => {
  it("resets to seed data after mutations", async () => {
    await mockDb.collection("users").doc("mock-admin-uid").delete();
    const beforeReset = await mockDb
      .collection("users")
      .doc("mock-admin-uid")
      .get();
    expect(beforeReset.exists).toBe(false);

    resetMockStore();

    const afterReset = await mockDb
      .collection("users")
      .doc("mock-admin-uid")
      .get();
    expect(afterReset.exists).toBe(true);
    expect(afterReset.data()?.email).toBe("admin@odum-research.com");
  });
});
