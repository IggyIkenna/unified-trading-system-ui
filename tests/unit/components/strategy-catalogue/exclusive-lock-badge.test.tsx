import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExclusiveLockBadge } from "@/components/strategy-catalogue/ExclusiveLockBadge";

describe("ExclusiveLockBadge", () => {
  it("renders Held by label", () => {
    render(<ExclusiveLockBadge holder="client_alpha" />);
    expect(screen.getByTestId("exclusive-lock-badge")).toHaveTextContent("Held by client_alpha");
  });

  it("compact variant suppresses inline text but keeps tooltip", () => {
    render(<ExclusiveLockBadge holder="client_alpha" compact />);
    const el = screen.getByTestId("exclusive-lock-badge");
    expect(el.textContent ?? "").not.toContain("Held by client_alpha");
    expect(el.getAttribute("title")).toBe("Held by client_alpha");
  });
});
