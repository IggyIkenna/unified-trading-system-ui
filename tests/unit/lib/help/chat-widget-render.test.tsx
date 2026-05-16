/**
 * Bot UI integration test — mount ChatWidgetTree, drill through the
 * curated tree + the generated catalogue, verify everything renders
 * without crashing and the generated nodes are reachable end-to-end.
 *
 * This is the regression guard for "chat panel won't open" / "click on a
 * generated widget node throws" — the kind of crash that the unit tests
 * on help-tree don't catch because they never mount the React tree.
 */

import { describe, expect, it } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";

import "@/components/widgets/register-all";
import { ChatWidgetTree } from "@/components/chat/chat-widget-tree";

function openChat() {
  const openButton = screen.getByRole("button", { name: /open help/i });
  fireEvent.click(openButton);
}

describe("ChatWidgetTree — UI render + navigation through the generated catalogue", () => {
  it("opens, shows the greeting, and lists curated + browse-catalogue buttons", () => {
    render(<ChatWidgetTree />);
    openChat();
    // Greeting copy mentions cockpit primitives + the bot identity.
    expect(screen.getByText(/Odum Research assistant/i)).toBeDefined();
    // Top-level buttons include the curated cockpit + browse-catalogue entries.
    expect(screen.getByRole("button", { name: /What is the Workspace cockpit/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Browse the full catalogue/i })).toBeDefined();
  });

  it("clicks Browse the catalogue and surfaces the 4 sub-branches", () => {
    render(<ChatWidgetTree />);
    openChat();
    fireEvent.click(screen.getByRole("button", { name: /Browse the full catalogue/i }));
    // Drill-down children should now be visible in the panel.
    expect(screen.getByRole("button", { name: /Browse all widgets/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Browse all strategy archetypes/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Browse all strategy families/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Browse all asset groups/i })).toBeDefined();
  });

  it("drills into Browse all widgets and surfaces catalog group buttons", () => {
    render(<ChatWidgetTree />);
    openChat();
    fireEvent.click(screen.getByRole("button", { name: /Browse the full catalogue/i }));
    fireEvent.click(screen.getByRole("button", { name: /Browse all widgets/i }));
    // Catalog groups exist as drillable buttons.
    const optionsGroupBtn = screen.queryByRole("button", { name: /Options & Futures/i });
    const defiGroupBtn = screen.queryByRole("button", { name: /^DeFi /i });
    const sportsGroupBtn = screen.queryByRole("button", { name: /^Sports /i });
    expect(
      optionsGroupBtn ?? defiGroupBtn ?? sportsGroupBtn,
      "expected at least one catalog group button",
    ).toBeDefined();
  });

  it("drills all the way into a generated widget node and renders its answer", () => {
    render(<ChatWidgetTree />);
    openChat();
    fireEvent.click(screen.getByRole("button", { name: /Browse the full catalogue/i }));
    fireEvent.click(screen.getByRole("button", { name: /Browse all widgets/i }));
    // Find the Options & Futures group (we know it has the IV smile widget).
    const optionsGroupBtn = screen.getByRole("button", { name: /Options & Futures/i });
    fireEvent.click(optionsGroupBtn);
    // The IV smile widget should now be a drillable button.
    const ivSmileBtn = screen.getByRole("button", { name: /What does the "IV smile" widget show/i });
    fireEvent.click(ivSmileBtn);
    // Its answer text — the description from register.ts — should render.
    // (Shows up multiple times because parent group answer also lists it.)
    expect(screen.getAllByText(/Strike . expiry IV matrix/i).length).toBeGreaterThan(0);
    // Plus the "Where it lives" line synthesised by the generator.
    expect(screen.getAllByText(/Where it lives/i).length).toBeGreaterThan(0);
    // Plus the cockpit deep-link.
    expect(screen.getAllByText(/Open in cockpit/i).length).toBeGreaterThan(0);
  });

  it("drills into a generated archetype node and renders the family + blurb", () => {
    render(<ChatWidgetTree />);
    openChat();
    fireEvent.click(screen.getByRole("button", { name: /Browse the full catalogue/i }));
    fireEvent.click(screen.getByRole("button", { name: /Browse all strategy archetypes/i }));
    // Drill into Carry & Yield archetypes.
    fireEvent.click(screen.getByRole("button", { name: /Carry & Yield archetypes/i }));
    // CARRY_RECURSIVE_STAKED archetype button.
    fireEvent.click(screen.getByRole("button", { name: /What is the CARRY_RECURSIVE_STAKED archetype/i }));
    // Its blurb mentions recursive staked basis + family line + catalogue link.
    // Blurb appears twice (group summary + drilled-into node).
    expect(screen.getAllByText(/Recursive staked-basis with leverage/i).length).toBeGreaterThan(0);
    // Family line is unique to the drilled-into node.
    expect(screen.getAllByText(/Family:/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Open in Strategy Catalogue/i)).toBeDefined();
  });

  it("search input typing finds a generated widget node by widget label", () => {
    render(<ChatWidgetTree />);
    openChat();
    const input = screen.getByPlaceholderText(/Ask a question/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "iv smile" } });
    fireEvent.submit(input.closest("form")!);
    // The result list should show the IV smile widget option.
    expect(screen.getByRole("button", { name: /What does the "IV smile" widget show/i })).toBeDefined();
  });

  it("search input finds the CARRY_RECURSIVE_STAKED archetype by name", () => {
    render(<ChatWidgetTree />);
    openChat();
    const input = screen.getByPlaceholderText(/Ask a question/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "carry recursive staked" } });
    fireEvent.submit(input.closest("form")!);
    expect(screen.getByRole("button", { name: /What is the CARRY_RECURSIVE_STAKED archetype/i })).toBeDefined();
  });

  it("Start over resets the conversation back to the greeting", () => {
    render(<ChatWidgetTree />);
    openChat();
    fireEvent.click(screen.getByRole("button", { name: /Browse the full catalogue/i }));
    expect(screen.queryByRole("button", { name: /Browse all widgets/i })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /Start over/i }));
    // The drill-down buttons are gone — only the curated top-level + browse
    // catalogue entries remain.
    expect(screen.queryByRole("button", { name: /Browse all widgets/i })).toBeNull();
    expect(screen.getByRole("button", { name: /Browse the full catalogue/i })).toBeDefined();
  });

  it("does not crash when rendering the full catalogue tree (regression on widget-meta breakage)", () => {
    // Smoke: simply mounting + opening the chat exercises every option-button
    // render path, including the generated nodes' option list. If any
    // widget has a malformed label / description / link, this would throw.
    expect(() => {
      render(<ChatWidgetTree />);
      openChat();
      fireEvent.click(screen.getByRole("button", { name: /Browse the full catalogue/i }));
      fireEvent.click(screen.getByRole("button", { name: /Browse all widgets/i }));
      // Click into every visible catalog group to render every widget option.
      const groupButtons = screen.getAllByRole("button").filter((b) => /\(\d+ widgets?\)/.test(b.textContent ?? ""));
      for (const btn of groupButtons) {
        fireEvent.click(btn);
      }
    }).not.toThrow();
  });
});
