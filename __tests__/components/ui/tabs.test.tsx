import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

describe("Tabs", () => {
  it("renders tabs with triggers and content", () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>,
    );
    expect(screen.getByText("Tab 1")).toBeInTheDocument();
    expect(screen.getByText("Tab 2")).toBeInTheDocument();
    expect(screen.getByText("Content 1")).toBeInTheDocument();
  });

  it("has correct data-slot attributes", () => {
    render(
      <Tabs defaultValue="a" data-testid="tabs-root">
        <TabsList data-testid="tabs-list">
          <TabsTrigger value="a">A</TabsTrigger>
        </TabsList>
        <TabsContent value="a" data-testid="tabs-content">
          Content A
        </TabsContent>
      </Tabs>,
    );
    expect(screen.getByTestId("tabs-root")).toHaveAttribute(
      "data-slot",
      "tabs",
    );
    expect(screen.getByTestId("tabs-list")).toHaveAttribute(
      "data-slot",
      "tabs-list",
    );
    expect(screen.getByText("A")).toHaveAttribute("data-slot", "tabs-trigger");
    expect(screen.getByTestId("tabs-content")).toHaveAttribute(
      "data-slot",
      "tabs-content",
    );
  });

  it("switches content when clicking a different tab", async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="first">
        <TabsList>
          <TabsTrigger value="first">First</TabsTrigger>
          <TabsTrigger value="second">Second</TabsTrigger>
        </TabsList>
        <TabsContent value="first">First content</TabsContent>
        <TabsContent value="second">Second content</TabsContent>
      </Tabs>,
    );
    // Initially first tab is shown
    expect(screen.getByText("First content")).toBeVisible();

    // Click second tab
    await user.click(screen.getByText("Second"));
    expect(screen.getByText("Second content")).toBeVisible();
  });

  it("marks active tab trigger with active state", () => {
    render(
      <Tabs defaultValue="active-tab">
        <TabsList>
          <TabsTrigger value="active-tab">Active</TabsTrigger>
          <TabsTrigger value="inactive-tab">Inactive</TabsTrigger>
        </TabsList>
        <TabsContent value="active-tab">Active content</TabsContent>
        <TabsContent value="inactive-tab">Inactive content</TabsContent>
      </Tabs>,
    );
    const activeTrigger = screen.getByText("Active");
    expect(activeTrigger).toHaveAttribute("data-state", "active");

    const inactiveTrigger = screen.getByText("Inactive");
    expect(inactiveTrigger).toHaveAttribute("data-state", "inactive");
  });

  it("applies custom className to Tabs", () => {
    render(
      <Tabs defaultValue="x" className="custom-tabs" data-testid="root">
        <TabsList>
          <TabsTrigger value="x">X</TabsTrigger>
        </TabsList>
        <TabsContent value="x">X content</TabsContent>
      </Tabs>,
    );
    expect(screen.getByTestId("root").className).toContain("custom-tabs");
  });

  it("fires onValueChange callback", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="a" onValueChange={onValueChange}>
        <TabsList>
          <TabsTrigger value="a">A</TabsTrigger>
          <TabsTrigger value="b">B</TabsTrigger>
        </TabsList>
        <TabsContent value="a">A content</TabsContent>
        <TabsContent value="b">B content</TabsContent>
      </Tabs>,
    );
    await user.click(screen.getByText("B"));
    expect(onValueChange).toHaveBeenCalledWith("b");
  });
});
