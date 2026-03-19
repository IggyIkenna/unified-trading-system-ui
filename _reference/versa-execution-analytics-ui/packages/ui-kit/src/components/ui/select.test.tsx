import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

function TestSelect({ placeholder = "Pick one" }: { placeholder?: string }) {
  return (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="a">Option A</SelectItem>
        <SelectItem value="b">Option B</SelectItem>
      </SelectContent>
    </Select>
  );
}

describe("Select", () => {
  it("renders trigger with placeholder", () => {
    render(<TestSelect placeholder="Choose…" />);
    expect(screen.getByText("Choose…")).toBeInTheDocument();
  });

  it("trigger is a button role", () => {
    render(<TestSelect />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("trigger has select-trigger class", () => {
    render(<TestSelect />);
    expect(screen.getByRole("combobox")).toHaveClass("select-trigger");
  });
});
