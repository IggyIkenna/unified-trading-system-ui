import { TestWrapper } from "@/tests/helpers/test-wrapper";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithTerms } from "@/components/marketing/render-with-terms";

function RenderCopy({ text }: { text: string }) {
  return <p data-testid="copy">{renderWithTerms(text)}</p>;
}

describe("renderWithTerms", () => {
  it("renders {{strong:...}} as semibold text", () => {
    render(<RenderCopy text="{{strong:Start here}}. Rest." />, { wrapper: TestWrapper });
    const el = screen.getByText("Start here");
    expect(el.tagName).toBe("STRONG");
    expect(el.className).toContain("font-semibold");
    expect(screen.getByText(/Rest\./)).toBeTruthy();
  });

  it("interleaves strong and term tokens in order", () => {
    render(<RenderCopy text="{{strong:Start here}}. See {{term:im|Investment Management}}." />, {
      wrapper: TestWrapper,
    });
    expect(screen.getByText("Start here").tagName).toBe("STRONG");
    expect(screen.getByText("Investment Management")).toBeTruthy();
  });
});
