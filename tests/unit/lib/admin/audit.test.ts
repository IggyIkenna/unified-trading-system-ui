/**
 * Admin audit emitter — verifies the stdout log path always fires and
 * swallows Firestore errors.
 */

import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { recordAdminEvent } from "@/lib/admin/audit";

vi.mock("@/lib/admin/firebase", () => ({
  firebaseDb: null,
}));

describe("recordAdminEvent", () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    infoSpy.mockRestore();
  });

  it("always emits a structured stdout log line", async () => {
    await recordAdminEvent({
      type: "ADMIN_DOC_DELETED",
      target: { org_id: "acme", application_id: "app-1", doc_type: "licence" },
      details: { deleted_path: "gs://bucket/key", backend: "cloud" },
    });
    expect(infoSpy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(infoSpy.mock.calls[0][0] as string) as {
      level: string;
      kind: string;
      type: string;
      target: Record<string, string>;
      timestamp: string;
    };
    expect(payload.level).toBe("info");
    expect(payload.kind).toBe("admin_event");
    expect(payload.type).toBe("ADMIN_DOC_DELETED");
    expect(payload.target.org_id).toBe("acme");
    expect(payload.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  it("resolves without throwing when Firebase is unavailable", async () => {
    await expect(
      recordAdminEvent({
        type: "ADMIN_DOC_DELETED",
        target: { org_id: "x" },
      }),
    ).resolves.toBeUndefined();
  });
});
