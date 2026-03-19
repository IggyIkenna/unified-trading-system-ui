import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

function TestTabs({ variant }: { variant?: "underline" | "pill" }) {
  return (
    <Tabs defaultValue="tab1">
      <TabsList variant={variant}>
        <TabsTrigger value="tab1">Tab One</TabsTrigger>
        <TabsTrigger value="tab2">Tab Two</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">Content One</TabsContent>
      <TabsContent value="tab2">Content Two</TabsContent>
    </Tabs>
  );
}

describe("Tabs", () => {
  it("renders tab list", () => {
    render(<TestTabs />);
    expect(screen.getByRole("tab", { name: "Tab One" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Tab Two" })).toBeInTheDocument();
  });

  it("shows default tab content", () => {
    render(<TestTabs />);
    expect(screen.getByText("Content One")).toBeInTheDocument();
  });

  it("switches content on tab click", async () => {
    render(<TestTabs />);
    await userEvent.click(screen.getByRole("tab", { name: "Tab Two" }));
    expect(screen.getByText("Content Two")).toBeInTheDocument();
  });

  it("renders underline variant without crashing", () => {
    render(<TestTabs variant="underline" />);
    expect(screen.getByRole("tablist")).toBeInTheDocument();
  });

  it("renders pill variant without crashing", () => {
    render(<TestTabs variant="pill" />);
    expect(screen.getByRole("tablist")).toBeInTheDocument();
  });
});
