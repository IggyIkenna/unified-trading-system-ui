import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

describe("Dialog", () => {
  it("does not show content before trigger is clicked", () => {
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Test Dialog</DialogTitle>
          <DialogDescription>Dialog description</DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.queryByText("Test Dialog")).not.toBeInTheDocument();
  });

  it("shows content after trigger click", async () => {
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Test Dialog</DialogTitle>
          <DialogDescription>Dialog description</DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    await userEvent.click(screen.getByText("Open"));
    expect(screen.getByText("Test Dialog")).toBeInTheDocument();
    expect(screen.getByText("Dialog description")).toBeInTheDocument();
  });

  it("closes when close button clicked", async () => {
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Test Dialog</DialogTitle>
          <DialogDescription>description</DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    await userEvent.click(screen.getByText("Open"));
    expect(screen.getByText("Test Dialog")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByText("Test Dialog")).not.toBeInTheDocument();
  });

  it("overlay has backdrop-blur-sm class", async () => {
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>T</DialogTitle>
          <DialogDescription>D</DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    await userEvent.click(screen.getByText("Open"));
    const overlays = document.querySelectorAll(".backdrop-blur-sm");
    expect(overlays.length).toBeGreaterThan(0);
  });
});
