import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScrollableTable } from "./scrollable-table";

describe("ScrollableTable", () => {
  it("renders children", () => {
    render(
      <ScrollableTable>
        <table>
          <tbody>
            <tr>
              <td>cell content</td>
            </tr>
          </tbody>
        </table>
      </ScrollableTable>,
    );
    expect(screen.getByText("cell content")).toBeInTheDocument();
  });

  it("has overflow-x auto for horizontal scroll", () => {
    const { container } = render(
      <ScrollableTable>
        <table>
          <tbody>
            <tr>
              <td>data</td>
            </tr>
          </tbody>
        </table>
      </ScrollableTable>,
    );
    // The scroll container is the inner div
    const scrollContainer = container.firstElementChild?.firstElementChild;
    expect(scrollContainer).toHaveStyle({ overflowX: "auto" });
  });

  it("applies maxHeight when provided", () => {
    const { container } = render(
      <ScrollableTable maxHeight="400px">
        <table>
          <tbody>
            <tr>
              <td>data</td>
            </tr>
          </tbody>
        </table>
      </ScrollableTable>,
    );
    const scrollContainer = container.firstElementChild?.firstElementChild;
    expect(scrollContainer).toHaveStyle({ maxHeight: "400px" });
  });

  it("does not set maxHeight when not provided", () => {
    const { container } = render(
      <ScrollableTable>
        <table>
          <tbody>
            <tr>
              <td>data</td>
            </tr>
          </tbody>
        </table>
      </ScrollableTable>,
    );
    const scrollContainer = container.firstElementChild
      ?.firstElementChild as HTMLElement;
    expect(scrollContainer.style.maxHeight).toBe("");
  });

  it("has border and rounded corners on outer container", () => {
    const { container } = render(
      <ScrollableTable>
        <table>
          <tbody>
            <tr>
              <td>data</td>
            </tr>
          </tbody>
        </table>
      </ScrollableTable>,
    );
    expect(container.firstElementChild).toHaveClass("border");
    expect(container.firstElementChild).toHaveClass("rounded-lg");
  });

  it("accepts className", () => {
    const { container } = render(
      <ScrollableTable className="my-table-wrapper">
        <table>
          <tbody>
            <tr>
              <td>data</td>
            </tr>
          </tbody>
        </table>
      </ScrollableTable>,
    );
    expect(container.firstElementChild).toHaveClass("my-table-wrapper");
  });
});
