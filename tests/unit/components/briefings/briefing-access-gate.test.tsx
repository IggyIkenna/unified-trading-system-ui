import { TestWrapper } from "@/tests/helpers/test-wrapper";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string } & Record<string, unknown>) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

// The component reads env vars at module-evaluation time, so we must
// vi.resetModules() + set env BEFORE each dynamic import.

describe("BriefingAccessGate", () => {
  beforeEach(() => {
    vi.resetModules();
    if (typeof window !== "undefined") {
      window.localStorage.clear();
    }
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders children directly when no access code is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_BRIEFING_ACCESS_CODE", "");
    vi.stubEnv("NEXT_PUBLIC_BRIEFING_ACCESS_CODE_INVESTMENT_MANAGEMENT", "");
    vi.stubEnv("NEXT_PUBLIC_BRIEFING_ACCESS_CODE_REGULATORY", "");
    vi.stubEnv("NEXT_PUBLIC_BRIEFING_ACCESS_CODE_PLATFORM", "");
    vi.stubEnv("NEXT_PUBLIC_BRIEFING_ACCESS_CODE_DART_SIGNALS_IN", "");
    vi.stubEnv("NEXT_PUBLIC_BRIEFING_ACCESS_CODE_DART_FULL", "");
    vi.stubEnv("NEXT_PUBLIC_BRIEFING_ACCESS_CODE_SIGNALS_OUT", "");
    const { BriefingAccessGate } = await import(
      "@/components/briefings/briefing-access-gate"
    );
    render(
      <BriefingAccessGate>
        <div data-testid="protected-child">visible</div>
      </BriefingAccessGate>,
      { wrapper: TestWrapper },
    );
    expect(screen.getByTestId("protected-child")).toBeTruthy();
  });

  it("shows the locked UI and the Contact us nudge when a code is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_BRIEFING_ACCESS_CODE", "secret123");
    vi.stubEnv("NEXT_PUBLIC_BRIEFING_ACCESS_CODE_INVESTMENT_MANAGEMENT", "");
    vi.stubEnv("NEXT_PUBLIC_BRIEFING_ACCESS_CODE_REGULATORY", "");
    vi.stubEnv("NEXT_PUBLIC_BRIEFING_ACCESS_CODE_PLATFORM", "");
    vi.stubEnv("NEXT_PUBLIC_BRIEFING_ACCESS_CODE_DART_SIGNALS_IN", "");
    vi.stubEnv("NEXT_PUBLIC_BRIEFING_ACCESS_CODE_DART_FULL", "");
    vi.stubEnv("NEXT_PUBLIC_BRIEFING_ACCESS_CODE_SIGNALS_OUT", "");
    const { BriefingAccessGate } = await import(
      "@/components/briefings/briefing-access-gate"
    );
    const { container } = render(
      <BriefingAccessGate>
        <div data-testid="protected-child">visible</div>
      </BriefingAccessGate>,
      { wrapper: TestWrapper },
    );
    expect(screen.queryByTestId("protected-child")).toBeNull();
    expect(screen.getByText("Briefings")).toBeTruthy();
    expect(screen.getByText("Continue")).toBeTruthy();
    // The Contact us nudge renders as a link to /contact (exact href match).
    const contactLink = screen.getByText("Contact us").closest("a");
    expect(contactLink).toBeTruthy();
    expect(contactLink?.getAttribute("href")).toBe("/contact");
    // container still has a reference for completeness (silences unused lint).
    expect(container).toBeTruthy();
  });

  it("shows an error on wrong code and unlocks children when the right code is entered", async () => {
    vi.stubEnv("NEXT_PUBLIC_BRIEFING_ACCESS_CODE", "goldenkey");
    vi.stubEnv("NEXT_PUBLIC_BRIEFING_ACCESS_CODE_INVESTMENT_MANAGEMENT", "");
    vi.stubEnv("NEXT_PUBLIC_BRIEFING_ACCESS_CODE_REGULATORY", "");
    vi.stubEnv("NEXT_PUBLIC_BRIEFING_ACCESS_CODE_PLATFORM", "");
    vi.stubEnv("NEXT_PUBLIC_BRIEFING_ACCESS_CODE_DART_SIGNALS_IN", "");
    vi.stubEnv("NEXT_PUBLIC_BRIEFING_ACCESS_CODE_DART_FULL", "");
    vi.stubEnv("NEXT_PUBLIC_BRIEFING_ACCESS_CODE_SIGNALS_OUT", "");
    const { BriefingAccessGate } = await import(
      "@/components/briefings/briefing-access-gate"
    );
    const { container } = render(
      <BriefingAccessGate>
        <div data-testid="protected-child">visible</div>
      </BriefingAccessGate>,
      { wrapper: TestWrapper },
    );

    const input = container.querySelector('input[type="password"]') as HTMLInputElement;
    expect(input).toBeTruthy();

    const form = container.querySelector("form") as HTMLFormElement;
    expect(form).toBeTruthy();

    // Wrong code path
    fireEvent.change(input, { target: { value: "nope" } });
    fireEvent.submit(form);
    expect(screen.getByText("Code does not match.")).toBeTruthy();
    expect(screen.queryByTestId("protected-child")).toBeNull();

    // Right code path
    fireEvent.change(input, { target: { value: "goldenkey" } });
    fireEvent.submit(form);
    expect(screen.getByTestId("protected-child")).toBeTruthy();
    // localStorage session marker written
    expect(window.localStorage.getItem("odum-briefing-session")).toBe("1");
  });
});
