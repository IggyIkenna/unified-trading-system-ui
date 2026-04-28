/**
 * Regression test: the Firestore writer must never pass `undefined` to
 * `addDoc`. Firestore's client SDK rejects with:
 *   "Function addDoc() called with invalid data. Unsupported field
 *    value: undefined (found in field submitted_by.submissionId ...)"
 *
 * Surfaced 2026-04-25 when a UAT smoke E2E hit the success path and
 * Firestore refused the write — submitQuestionnaire was returning
 * `{success: false}`, which kept the user on the form and never
 * unlocked /briefings. Fix: strip `submissionId` via destructuring
 * instead of setting it to `undefined`.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { type QuestionnaireEnvelope, type QuestionnaireResponse } from "@/lib/questionnaire/types";

// Typed signature: addDoc(collectionRef, payload) — declaring the parameter
// shape so vi.fn().mock.calls[0] is inferred as `[unknown, unknown]` rather
// than `[]`, letting the destructuring `[_, payload]` access work in tests.
const addDocMock = vi.fn(async (_collectionRef: unknown, _data: unknown) => ({ id: "fake-doc-id" }));
const collectionMock = vi.fn((_db: unknown, name: string) => ({ name }));
const serverTimestampMock = vi.fn(() => "<<server-timestamp>>");

vi.mock("firebase/firestore", () => ({
  addDoc: (...args: unknown[]) => addDocMock(...(args as Parameters<typeof addDocMock>)),
  collection: (...args: unknown[]) => collectionMock(...(args as Parameters<typeof collectionMock>)),
  serverTimestamp: () => serverTimestampMock(),
}));

vi.mock("@/lib/auth/firebase-config", () => ({
  getFirebaseDb: () => ({
    /* opaque db handle */
  }),
}));

const RESPONSE: QuestionnaireResponse = {
  categories: ["TradFi"],
  instrument_types: ["spot"],
  venue_scope: "all",
  strategy_style: ["carry"],
  service_family: "DART",
  fund_structure: ["SMA"],
};

const ENVELOPE_WITH_ID: QuestionnaireEnvelope = {
  email: "alice@acme.com",
  firm_name: "Acme",
  access_code_fingerprint: "abc",
  submissionId: "previous-id",
};

const ENVELOPE_WITHOUT_ID: QuestionnaireEnvelope = {
  email: "alice@acme.com",
  firm_name: "Acme",
  access_code_fingerprint: "abc",
};

function hasUndefinedDeep(value: unknown): boolean {
  if (value === undefined) return true;
  if (value === null) return false;
  if (typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(hasUndefinedDeep);
  return Object.values(value).some(hasUndefinedDeep);
}

beforeEach(() => {
  addDocMock.mockClear();
  collectionMock.mockClear();
  serverTimestampMock.mockClear();
  // Force the Firestore sink — submit.ts treats non-localhost as Firestore.
  vi.stubEnv("VITE_MOCK_API", "false");
  Object.defineProperty(window, "location", {
    configurable: true,
    value: new URL("https://uat.odum-research.com/questionnaire"),
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("submitQuestionnaire — Firestore payload sanitisation", () => {
  it("never passes undefined values to addDoc when envelope has submissionId", async () => {
    const { submitQuestionnaire } = await import("@/lib/questionnaire/submit");
    const result = await submitQuestionnaire(RESPONSE, ENVELOPE_WITH_ID);
    expect(result.success).toBe(true);
    expect(addDocMock).toHaveBeenCalledTimes(1);
    const callArgs = addDocMock.mock.calls[0] as unknown as [unknown, unknown];
    const payload = callArgs[1];
    expect(hasUndefinedDeep(payload), `payload contained undefined: ${JSON.stringify(payload)}`).toBe(false);
  });

  it("never passes undefined values when envelope has no submissionId", async () => {
    const { submitQuestionnaire } = await import("@/lib/questionnaire/submit");
    const result = await submitQuestionnaire(RESPONSE, ENVELOPE_WITHOUT_ID);
    expect(result.success).toBe(true);
    const callArgs = addDocMock.mock.calls[0] as unknown as [unknown, unknown];
    const payload = callArgs[1];
    expect(hasUndefinedDeep(payload)).toBe(false);
  });

  it("never passes undefined values when envelope is null", async () => {
    const { submitQuestionnaire } = await import("@/lib/questionnaire/submit");
    const result = await submitQuestionnaire(RESPONSE, null);
    expect(result.success).toBe(true);
    const callArgs = addDocMock.mock.calls[0] as unknown as [unknown, unknown];
    const payload = callArgs[1];
    expect(hasUndefinedDeep(payload)).toBe(false);
  });

  it("strips submissionId from submitted_by — Firestore doc id supersedes any prior value", async () => {
    const { submitQuestionnaire } = await import("@/lib/questionnaire/submit");
    await submitQuestionnaire(RESPONSE, ENVELOPE_WITH_ID);
    const callArgs = addDocMock.mock.calls[0] as unknown as [unknown, unknown];
    const payload = callArgs[1];
    const submittedBy = (payload as { submitted_by?: { submissionId?: string } } | undefined)?.submitted_by;
    expect(submittedBy).toBeDefined();
    expect(submittedBy).not.toHaveProperty("submissionId");
    expect(submittedBy?.submissionId).toBeUndefined();
  });

  it("propagates the addDoc-returned id back as the result.submissionId", async () => {
    const { submitQuestionnaire } = await import("@/lib/questionnaire/submit");
    const result = await submitQuestionnaire(RESPONSE, ENVELOPE_WITHOUT_ID);
    expect(result.submissionId).toBe("fake-doc-id");
  });
});
