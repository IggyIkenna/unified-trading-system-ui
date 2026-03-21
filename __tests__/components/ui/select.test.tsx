import { render, screen } from "@testing-library/react"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"

describe("Select", () => {
  it("renders trigger with placeholder", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Pick one" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Option A</SelectItem>
          <SelectItem value="b">Option B</SelectItem>
        </SelectContent>
      </Select>
    )
    expect(screen.getByText("Pick one")).toBeInTheDocument()
  })

  it("renders trigger with data-slot attribute", () => {
    render(
      <Select>
        <SelectTrigger data-testid="trigger">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="x">X</SelectItem>
        </SelectContent>
      </Select>
    )
    const trigger = screen.getByTestId("trigger")
    expect(trigger).toHaveAttribute("data-slot", "select-trigger")
  })

  it("renders trigger as a combobox role", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Choose" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="alpha">Alpha</SelectItem>
        </SelectContent>
      </Select>
    )
    expect(screen.getByRole("combobox")).toBeInTheDocument()
  })

  it("renders with small size trigger", () => {
    render(
      <Select>
        <SelectTrigger size="sm" data-testid="sm-trigger">
          <SelectValue placeholder="Small" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>
    )
    const trigger = screen.getByTestId("sm-trigger")
    expect(trigger).toHaveAttribute("data-size", "sm")
  })

  it("renders with a controlled value", () => {
    render(
      <Select value="beta">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="alpha">Alpha</SelectItem>
          <SelectItem value="beta">Beta</SelectItem>
        </SelectContent>
      </Select>
    )
    expect(screen.getByText("Beta")).toBeInTheDocument()
  })

  it("applies custom className to trigger", () => {
    render(
      <Select>
        <SelectTrigger className="custom-trigger" data-testid="ct">
          <SelectValue placeholder="Styled" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>
    )
    expect(screen.getByTestId("ct").className).toContain("custom-trigger")
  })

  it("trigger has aria-expanded attribute", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Choose" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="alpha">Alpha</SelectItem>
        </SelectContent>
      </Select>
    )
    const combobox = screen.getByRole("combobox")
    expect(combobox).toHaveAttribute("aria-expanded", "false")
  })

  it("renders disabled trigger", () => {
    render(
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Disabled" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>
    )
    const combobox = screen.getByRole("combobox")
    expect(combobox).toBeDisabled()
  })
})
