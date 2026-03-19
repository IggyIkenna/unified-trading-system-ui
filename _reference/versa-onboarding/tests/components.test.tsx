import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock useRouter for Next.js components
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/",
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

// Mock firebase auth
vi.mock("@/lib/firebaseClient", () => ({
  firebaseAuth: null,
  getFirebaseAuth: () => null,
}));

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: vi.fn((_auth, _callback) => () => {}),
  signOut: vi.fn(),
}));

import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Footer", () => {
  it("renders footer element with links", () => {
    render(<Footer />);
    const footer = document.querySelector("footer");
    expect(footer).toBeTruthy();
    expect(screen.getByText("Quick links")).toBeDefined();
    expect(screen.getByText("Disclaimer")).toBeDefined();
  });

  it("renders contact email", () => {
    render(<Footer />);
    expect(screen.getByText("info@odum-research.com")).toBeDefined();
  });

  it("renders LinkedIn link", () => {
    render(<Footer />);
    expect(screen.getByText("LinkedIn")).toBeDefined();
  });
});

describe("ContactForm", () => {
  it("renders form fields with labels", () => {
    render(<ContactForm />);
    expect(screen.getByText("Name")).toBeDefined();
    expect(screen.getByText("Email")).toBeDefined();
    expect(screen.getByText("Message")).toBeDefined();
  });

  it("renders submit button", () => {
    render(<ContactForm />);
    expect(screen.getByText("Send message")).toBeDefined();
  });

  it("renders a form element", () => {
    render(<ContactForm />);
    const form = document.querySelector("form");
    expect(form).toBeDefined();
  });
});
