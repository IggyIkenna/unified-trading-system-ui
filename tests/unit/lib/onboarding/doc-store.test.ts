/**
 * Phase-4 tests for the onboarding doc-store dispatcher.
 *
 * Plan: unified-trading-pm/plans/active/reg_umbrella_questionnaire_and_onboarding_docs_2026_04_21.plan.md
 *
 * Covers:
 *   - resolveDocStore() returns the local backend in mock / dev.
 *   - resolveDocStore() returns the cloud stub in prod until cloud deps ship.
 *   - Local backend round-trips a File through upload → list → download → delete.
 *   - Canonical gs:// URI is always emitted, regardless of backend.
 *   - Cloud stub throws a clear error (no silent writes).
 */

import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { _internals_for_testing, resolveDocStore } from "@/lib/onboarding/doc-store";

const ORG = { org_id: "acme", application_id: "app-1", doc_type: "licence" };

function makeFile(content: string, filename: string): File {
  return new File([content], filename, { type: "text/plain" });
}

let scratchCwd: string;
let originalCwd: string;

beforeEach(async () => {
  originalCwd = process.cwd();
  scratchCwd = await mkdtemp(join(tmpdir(), "doc-store-test-"));
  process.chdir(scratchCwd);
  vi.stubEnv("CLOUD_MOCK_MODE", "true");
  vi.stubEnv("NODE_ENV", "development");
});

afterEach(async () => {
  process.chdir(originalCwd);
  await rm(scratchCwd, { recursive: true, force: true });
  vi.unstubAllEnvs();
});

describe("resolveDocStore", () => {
  it("returns local backend when CLOUD_MOCK_MODE=true", () => {
    const store = resolveDocStore();
    expect(store.kind).toBe("local");
  });

  it("returns cloud stub when NODE_ENV=production and CLOUD_MOCK_MODE unset", () => {
    vi.stubEnv("CLOUD_MOCK_MODE", "");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ENVIRONMENT", "production");
    const store = resolveDocStore();
    expect(store.kind).toBe("cloud");
  });

  it("returns local backend in development regardless of CLOUD_MOCK_MODE", () => {
    vi.stubEnv("CLOUD_MOCK_MODE", "");
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ENVIRONMENT", "development");
    const store = resolveDocStore();
    expect(store.kind).toBe("local");
  });
});

describe("localStore — round-trip", () => {
  it("uploads, lists, downloads, and deletes a single doc", async () => {
    const store = _internals_for_testing.localStore;
    const file = makeFile("hello world", "licence.txt");

    const upload = await store.upload(ORG, file);
    expect(upload.ok).toBe(true);
    expect(upload.file_name).toBe("licence.txt");
    expect(upload.size).toBe(11);
    expect(upload.gcs_path).toMatch(/^gs:\/\/odum-.*-onboarding-docs\/acme\/app-1\/licence\.txt$/);
    expect(upload.local_path).toBeDefined();

    const list = await store.list("acme");
    expect(list).toHaveLength(1);
    expect(list[0].doc_type).toBe("licence");
    expect(list[0].application_id).toBe("app-1");
    expect(list[0].size).toBe(11);

    const download = await store.download(ORG);
    expect(download).not.toBeNull();
    expect(download?.filename).toBe("licence.txt");
    expect(download?.size).toBe(11);
    expect(download?.bytes.toString("utf8")).toBe("hello world");

    const del = await store.delete(ORG);
    expect(del?.ok).toBe(true);

    const listAfter = await store.list("acme");
    expect(listAfter).toHaveLength(0);

    const downloadAfter = await store.download(ORG);
    expect(downloadAfter).toBeNull();
  });

  it("returns null when deleting a doc that doesn't exist", async () => {
    const store = _internals_for_testing.localStore;
    const res = await store.delete(ORG);
    expect(res).toBeNull();
  });

  it("returns empty list when the org has no docs", async () => {
    const store = _internals_for_testing.localStore;
    const list = await store.list("unknown-org");
    expect(list).toHaveLength(0);
  });
});

describe("cloudStorageStore — uses @google-cloud/storage", () => {
  it("has cloud kind", () => {
    expect(_internals_for_testing.cloudStorageStore.kind).toBe("cloud");
  });

  it("bucket name is env-dependent", () => {
    vi.stubEnv("ENVIRONMENT", "staging");
    expect(_internals_for_testing.bucketName()).toBe("odum-staging-onboarding-docs");
    vi.stubEnv("ENVIRONMENT", "production");
    expect(_internals_for_testing.bucketName()).toBe("odum-production-onboarding-docs");
  });
});

describe("canonical gs:// URI", () => {
  it("encodes environment + coordinates consistently", () => {
    const uri = _internals_for_testing.canonicalGcsUri(ORG, "pdf");
    expect(uri).toMatch(/^gs:\/\/odum-.*-onboarding-docs\/acme\/app-1\/licence\.pdf$/);
  });
});
