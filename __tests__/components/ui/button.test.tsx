import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Button } from "@/components/ui/button"

describe("Button", () => {
  it("renders with default variant and size", () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole("button", { name: "Click me" })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute("data-slot", "button")
  })

  it("handles click events", async () => {
    const user = userEvent.setup()
    const onClick = jest.fn()
    render(<Button onClick={onClick}>Click</Button>)
    await user.click(screen.getByRole("button", { name: "Click" }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("renders destructive variant", () => {
    render(<Button variant="destructive">Delete</Button>)
    const button = screen.getByRole("button", { name: "Delete" })
    expect(button.className).toContain("bg-destructive")
  })

  it("renders outline variant", () => {
    render(<Button variant="outline">Outline</Button>)
    const button = screen.getByRole("button", { name: "Outline" })
    expect(button.className).toContain("border")
  })

  it("renders secondary variant", () => {
    render(<Button variant="secondary">Secondary</Button>)
    const button = screen.getByRole("button", { name: "Secondary" })
    expect(button.className).toContain("bg-secondary")
  })

  it("renders ghost variant", () => {
    render(<Button variant="ghost">Ghost</Button>)
    expect(screen.getByRole("button", { name: "Ghost" })).toBeInTheDocument()
  })

  it("renders link variant", () => {
    render(<Button variant="link">Link</Button>)
    const button = screen.getByRole("button", { name: "Link" })
    expect(button.className).toContain("underline-offset")
  })

  it("renders small size", () => {
    render(<Button size="sm">Small</Button>)
    const button = screen.getByRole("button", { name: "Small" })
    expect(button.className).toContain("h-8")
  })

  it("renders large size", () => {
    render(<Button size="lg">Large</Button>)
    const button = screen.getByRole("button", { name: "Large" })
    expect(button.className).toContain("h-10")
  })

  it("renders icon size", () => {
    render(<Button size="icon">X</Button>)
    const button = screen.getByRole("button", { name: "X" })
    expect(button.className).toContain("size-9")
  })

  it("is disabled when disabled prop is set", async () => {
    const user = userEvent.setup()
    const onClick = jest.fn()
    render(
      <Button disabled onClick={onClick}>
        Disabled
      </Button>
    )
    const button = screen.getByRole("button", { name: "Disabled" })
    expect(button).toBeDisabled()
    await user.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it("renders as child component when asChild is true", () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    )
    const link = screen.getByText("Link Button")
    expect(link.tagName).toBe("A")
    expect(link).toHaveAttribute("href", "/test")
  })

  it("applies custom className", () => {
    render(<Button className="my-custom">Styled</Button>)
    const button = screen.getByRole("button", { name: "Styled" })
    expect(button.className).toContain("my-custom")
  })
})
