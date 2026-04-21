/**
 * Phase-3 regression tests for the admin org questionnaire section.
 *
 * Plan: unified-trading-pm/plans/active/reg_umbrella_questionnaire_and_onboarding_docs_2026_04_21.plan.md
 */

import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OrgQuestionnaireSection } from "@/components/admin/organizations/org-questionnaire-section";

// We mock the admin firebase shim so tests never touch real Firestore.
// Each test rewires the mock to simulate a different Firestore state.
vi.mock("@/lib/admin/firebase", () => ({
  firebaseDb: null,
}));

const ORG = {
  id: "org-acme",
  name: "Acme Capital",
  contact_email: "ops@acme.com",
};

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("OrgQuestionnaireSection", () => {
  it("shows the error state when Firebase is not configured (mock mode)", async () => {
    render(<OrgQuestionnaireSection org={ORG} />);
    await waitFor(() => {
      expect(screen.getByTestId("org-questionnaire-error")).toBeInTheDocument();
    });
    expect(screen.getByTestId("org-questionnaire-error").textContent).toContain(
      "mock mode",
    );
  });

  it("always renders the card header even before Firestore settles", () => {
    render(<OrgQuestionnaireSection org={ORG} />);
    expect(screen.getByText("Prospect questionnaire")).toBeInTheDocument();
    expect(screen.getByTestId("org-questionnaire-section")).toBeInTheDocument();
  });
});
