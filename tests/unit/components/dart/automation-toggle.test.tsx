import "@testing-library/jest-dom/vitest";
import { TestWrapper } from "@/tests/helpers/test-wrapper";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AutomationToggle,
  type OperationalMode,
} from "@/components/dart/automation-toggle";

interface TransitionResponse {
  archetype_id: string;
  operational_mode: OperationalMode;
  transitioned_at: string;
}

function makeFetcher(
  next: OperationalMode,
  archetypeId = "carry_staked_basis",
): ReturnType<typeof vi.fn<(url: string, token: string | null, options?: RequestInit) => Promise<unknown>>> {
  return vi.fn(async (_url: string, _token: string | null, _options?: RequestInit) => {
    const response: TransitionResponse = {
      archetype_id: archetypeId,
      operational_mode: next,
      transitioned_at: "2026-05-10T11:00:00Z",
    };
    return response;
  });
}

describe("AutomationToggle", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the current mode badge + description for each mode", () => {
    const { rerender } = render(
      <AutomationToggle archetypeId="carry_staked_basis" initialMode="MANUAL" />,
      { wrapper: TestWrapper },
    );
    expect(screen.getByTestId("automation-toggle-current-mode")).toHaveAttribute("data-mode", "MANUAL");
    expect(screen.getByTestId("automation-toggle-description")).toHaveTextContent(/Operator-driven/);

    rerender(<AutomationToggle archetypeId="carry_staked_basis" initialMode="PAPER" />);
    expect(screen.getByTestId("automation-toggle-current-mode")).toHaveAttribute("data-mode", "PAPER");
    expect(screen.getByTestId("automation-toggle-description")).toHaveTextContent(/matching engine/);

    rerender(<AutomationToggle archetypeId="carry_staked_basis" initialMode="LIVE" />);
    expect(screen.getByTestId("automation-toggle-current-mode")).toHaveAttribute("data-mode", "LIVE");
    expect(screen.getByTestId("automation-toggle-description")).toHaveTextContent(/real venues/);
  });

  it("offers MANUAL → PAPER as the only forward transition from MANUAL", () => {
    render(<AutomationToggle archetypeId="carry_staked_basis" initialMode="MANUAL" />, {
      wrapper: TestWrapper,
    });
    expect(screen.getByTestId("automation-toggle-transition-paper")).toBeInTheDocument();
    expect(screen.queryByTestId("automation-toggle-transition-live")).not.toBeInTheDocument();
    expect(screen.queryByTestId("automation-toggle-kill-switch")).not.toBeInTheDocument();
  });

  it("offers PAPER → LIVE + PAPER → MANUAL as legal transitions from PAPER", () => {
    render(<AutomationToggle archetypeId="carry_staked_basis" initialMode="PAPER" />, {
      wrapper: TestWrapper,
    });
    expect(screen.getByTestId("automation-toggle-transition-live")).toBeInTheDocument();
    expect(screen.getByTestId("automation-toggle-transition-manual")).toBeInTheDocument();
  });

  it("renders kill-switch + zero forward actions on LIVE", () => {
    render(<AutomationToggle archetypeId="carry_staked_basis" initialMode="LIVE" />, {
      wrapper: TestWrapper,
    });
    expect(screen.getByTestId("automation-toggle-kill-switch")).toBeInTheDocument();
    expect(screen.queryByTestId("automation-toggle-forward-actions")).not.toBeInTheDocument();
  });

  it("calls the operational-mode endpoint with the target mode + admin Bearer token", async () => {
    const fetcher = makeFetcher("PAPER");
    render(
      <AutomationToggle archetypeId="carry_staked_basis" initialMode="MANUAL" fetcher={fetcher} />,
      { wrapper: TestWrapper },
    );

    fireEvent.click(screen.getByTestId("automation-toggle-transition-paper"));
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));

    const call = fetcher.mock.calls[0];
    expect(call[0]).toBe("/api/archetypes/carry_staked_basis/operational-mode");
    expect(call[1]).toBe("test-token-mock");
    const init = call[2] as RequestInit;
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({ "Content-Type": "application/json" });
    expect(init.body).toBe(JSON.stringify({ operational_mode: "PAPER" }));
  });

  it("flips the displayed mode after a successful transition + fires onModeChanged", async () => {
    const onChange = vi.fn();
    const fetcher = makeFetcher("PAPER");
    render(
      <AutomationToggle
        archetypeId="carry_staked_basis"
        initialMode="MANUAL"
        fetcher={fetcher}
        onModeChanged={onChange}
      />,
      { wrapper: TestWrapper },
    );

    fireEvent.click(screen.getByTestId("automation-toggle-transition-paper"));
    await waitFor(() => {
      expect(screen.getByTestId("automation-toggle-current-mode")).toHaveAttribute("data-mode", "PAPER");
    });
    expect(onChange).toHaveBeenCalledWith("PAPER");
  });

  it("kill-switch reverts LIVE → MANUAL and triggers onModeChanged", async () => {
    const onChange = vi.fn();
    const fetcher = makeFetcher("MANUAL");
    render(
      <AutomationToggle
        archetypeId="carry_staked_basis"
        initialMode="LIVE"
        fetcher={fetcher}
        onModeChanged={onChange}
      />,
      { wrapper: TestWrapper },
    );

    fireEvent.click(screen.getByTestId("automation-toggle-kill-switch"));
    await waitFor(() => {
      expect(screen.getByTestId("automation-toggle-current-mode")).toHaveAttribute("data-mode", "MANUAL");
    });
    const init = fetcher.mock.calls[0][2] as RequestInit;
    expect(init.body).toBe(JSON.stringify({ operational_mode: "MANUAL" }));
    expect(onChange).toHaveBeenCalledWith("MANUAL");
  });

  it("renders the route's 409 message verbatim on a rejected transition", async () => {
    const fetcher = vi.fn(async () => {
      throw new Error("409 Conflict — MANUAL → LIVE is not a legal transition");
    });
    render(
      <AutomationToggle archetypeId="carry_staked_basis" initialMode="PAPER" fetcher={fetcher} />,
      { wrapper: TestWrapper },
    );

    fireEvent.click(screen.getByTestId("automation-toggle-transition-live"));
    await waitFor(() => {
      expect(screen.getByTestId("automation-toggle-error")).toBeInTheDocument();
    });
    expect(screen.getByTestId("automation-toggle-error")).toHaveTextContent(
      /409 Conflict.*not a legal transition/,
    );
    // Mode does not advance on rejection.
    expect(screen.getByTestId("automation-toggle-current-mode")).toHaveAttribute("data-mode", "PAPER");
  });

  it("disables transition buttons while a transition is in flight", async () => {
    let resolveFetch: (value: unknown) => void = () => {};
    const fetcher = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );
    render(
      <AutomationToggle archetypeId="carry_staked_basis" initialMode="PAPER" fetcher={fetcher} />,
      { wrapper: TestWrapper },
    );

    fireEvent.click(screen.getByTestId("automation-toggle-transition-live"));
    expect(screen.getByTestId("automation-toggle-transition-live")).toBeDisabled();
    expect(screen.getByTestId("automation-toggle-transition-manual")).toBeDisabled();

    resolveFetch({
      archetype_id: "carry_staked_basis",
      operational_mode: "LIVE",
      transitioned_at: "2026-05-10T11:00:00Z",
    });

    await waitFor(() => {
      expect(screen.getByTestId("automation-toggle-current-mode")).toHaveAttribute("data-mode", "LIVE");
    });
  });

  it("encodes special characters in the archetype id in the URL", async () => {
    const fetcher = vi.fn(async (url: string) => {
      expect(url).toContain("/api/archetypes/carry%2Fstaked/operational-mode");
      return {
        archetype_id: "carry/staked",
        operational_mode: "PAPER",
        transitioned_at: "2026-05-10T11:00:00Z",
      };
    });
    render(
      <AutomationToggle archetypeId="carry/staked" initialMode="MANUAL" fetcher={fetcher} />,
      { wrapper: TestWrapper },
    );

    fireEvent.click(screen.getByTestId("automation-toggle-transition-paper"));
    await waitFor(() => expect(fetcher).toHaveBeenCalled());
  });
});
