import { render, screen } from "@testing-library/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

describe("Card", () => {
  it("renders card with content", () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("has correct data-slot attribute", () => {
    render(<Card>Content</Card>);
    expect(screen.getByText("Content")).toHaveAttribute("data-slot", "card");
  });

  it("applies custom className", () => {
    render(<Card className="my-card">Content</Card>);
    expect(screen.getByText("Content").className).toContain("my-card");
  });
});

describe("CardHeader", () => {
  it("renders with data-slot", () => {
    render(<CardHeader>Header</CardHeader>);
    expect(screen.getByText("Header")).toHaveAttribute(
      "data-slot",
      "card-header",
    );
  });
});

describe("CardTitle", () => {
  it("renders title text", () => {
    render(<CardTitle>My Title</CardTitle>);
    const title = screen.getByText("My Title");
    expect(title).toBeInTheDocument();
    expect(title).toHaveAttribute("data-slot", "card-title");
  });
});

describe("CardDescription", () => {
  it("renders description text", () => {
    render(<CardDescription>My description</CardDescription>);
    const desc = screen.getByText("My description");
    expect(desc).toBeInTheDocument();
    expect(desc).toHaveAttribute("data-slot", "card-description");
  });
});

describe("CardAction", () => {
  it("renders action content", () => {
    render(<CardAction>Action</CardAction>);
    expect(screen.getByText("Action")).toHaveAttribute(
      "data-slot",
      "card-action",
    );
  });
});

describe("CardContent", () => {
  it("renders content with data-slot", () => {
    render(<CardContent>Body</CardContent>);
    expect(screen.getByText("Body")).toHaveAttribute(
      "data-slot",
      "card-content",
    );
  });
});

describe("CardFooter", () => {
  it("renders footer content", () => {
    render(<CardFooter>Footer</CardFooter>);
    expect(screen.getByText("Footer")).toHaveAttribute(
      "data-slot",
      "card-footer",
    );
  });
});

describe("Card composition", () => {
  it("renders a full card with all sub-components", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
          <CardAction>Action</CardAction>
        </CardHeader>
        <CardContent>Body content</CardContent>
        <CardFooter>Footer content</CardFooter>
      </Card>,
    );
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();
    expect(screen.getByText("Body content")).toBeInTheDocument();
    expect(screen.getByText("Footer content")).toBeInTheDocument();
  });
});
