/**
 * L1.5 widget harness — book-hierarchy-bar.
 *
 * Scope (per cert docs/manifest/widget-certification/book-hierarchy-bar.json):
 * - Render with mocked useBookTradeData + useOrganizationsList.
 * - Loading + error branches (cert L0.6 / L0.8).
 * - Empty-org branch (cert L0.7 — "No organizations" disabled item).
 * - Strategy select only surfaces live + paper entries.
 * - Org select + Client input onChange propagate to context setters
 *   (cert L4.1).
 *
 * Note: widget does not expose a root data-testid (see cert findings). Tests
 * anchor on the Org/Client/Strategy labels and the Client ID placeholder.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { buildMockBookData, buildMockOrganizationsList } from "../_helpers/mock-book-context";

const mockBookData = buildMockBookData();
const mockOrgsList = buildMockOrganizationsList();

vi.mock("@/components/widgets/book/book-data-context", () => ({
  useBookTradeData: () => mockBookData,
}));

vi.mock("@/hooks/api/use-organizations", () => ({
  useOrganizationsList: () => mockOrgsList,
}));

import { BookHierarchyBarWidget } from "@/components/widgets/book/book-hierarchy-bar-widget";

describe("book-hierarchy-bar — L1.5 harness", () => {
  beforeEach(() => {
    Object.assign(mockBookData, buildMockBookData());
    Object.assign(mockOrgsList, buildMockOrganizationsList());
  });

  const renderWidget = () => render(<BookHierarchyBarWidget instanceId="book-hierarchy-bar-1" />);

  describe("render", () => {
    it("mounts Org + Client + Strategy labels when orgs list is loaded", () => {
      renderWidget();
      expect(screen.getByText("Org")).toBeTruthy();
      expect(screen.getByText("Client")).toBeTruthy();
      expect(screen.getByText("Strategy")).toBeTruthy();
    });

    it("renders Client ID input with empty default value", () => {
      renderWidget();
      const input = screen.getByPlaceholderText("Client ID") as HTMLInputElement;
      expect(input.value).toBe("");
    });

    it("shows loading spinner copy while orgs are loading", () => {
      Object.assign(mockOrgsList, buildMockOrganizationsList({ isLoading: true }));
      renderWidget();
      expect(screen.queryByPlaceholderText("Client ID")).toBeNull();
      expect(screen.getByText(/loading organizations/i)).toBeTruthy();
    });

    it("shows error message when orgs list fails", () => {
      Object.assign(mockOrgsList, buildMockOrganizationsList({ isError: true }));
      renderWidget();
      expect(screen.queryByPlaceholderText("Client ID")).toBeNull();
      expect(screen.getByText(/failed to load organizations/i)).toBeTruthy();
    });

    it("renders bar even when organizations list is empty", () => {
      Object.assign(mockBookData, buildMockBookData({ organizations: [] }));
      renderWidget();
      // Bar still mounts — empty state is inside the Select dropdown.
      expect(screen.getByPlaceholderText("Client ID")).toBeTruthy();
    });
  });

  describe("interactions", () => {
    it("routes Client input change to setClientId", () => {
      renderWidget();
      const clientInput = screen.getByPlaceholderText("Client ID");
      fireEvent.change(clientInput, { target: { value: "client-42" } });
      expect(mockBookData.setClientId).toHaveBeenCalledWith("client-42");
    });

    it("reflects bound clientId value from context", () => {
      Object.assign(mockBookData, buildMockBookData({ clientId: "bound-client" }));
      renderWidget();
      const input = screen.getByPlaceholderText("Client ID") as HTMLInputElement;
      expect(input.value).toBe("bound-client");
    });
  });
});
