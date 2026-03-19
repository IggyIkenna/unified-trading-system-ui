import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";

describe("Card", () => {
  it("renders children", () => {
    render(<Card>card body</Card>);
    expect(screen.getByText("card body")).toBeInTheDocument();
  });

  it("has border class", () => {
    const { container } = render(<Card>x</Card>);
    expect(container.firstChild).toHaveClass("border");
  });
});

describe("CardHeader", () => {
  it("renders children", () => {
    render(<CardHeader>header</CardHeader>);
    expect(screen.getByText("header")).toBeInTheDocument();
  });

  it("has bottom border divider", () => {
    const { container } = render(<CardHeader>h</CardHeader>);
    expect(container.firstChild).toHaveClass("border-b");
  });
});

describe("CardTitle", () => {
  it("renders as h3", () => {
    render(<CardTitle>My Title</CardTitle>);
    expect(
      screen.getByRole("heading", { name: "My Title" }),
    ).toBeInTheDocument();
  });
});

describe("CardDescription", () => {
  it("renders children", () => {
    render(<CardDescription>desc</CardDescription>);
    expect(screen.getByText("desc")).toBeInTheDocument();
  });
});

describe("CardContent", () => {
  it("renders children", () => {
    render(<CardContent>content</CardContent>);
    expect(screen.getByText("content")).toBeInTheDocument();
  });
});

describe("CardFooter", () => {
  it("renders children", () => {
    render(<CardFooter>footer</CardFooter>);
    expect(screen.getByText("footer")).toBeInTheDocument();
  });

  it("has top border divider", () => {
    const { container } = render(<CardFooter>f</CardFooter>);
    expect(container.firstChild).toHaveClass("border-t");
  });
});
