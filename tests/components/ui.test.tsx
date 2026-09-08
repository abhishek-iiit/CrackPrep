import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

describe("cn", () => {
  it("joins truthy classes and drops falsy ones", () => {
    expect(cn("a", false && "b", undefined, "c")).toBe("a c");
  });
});

describe("Button", () => {
  it("renders a button element by default", () => {
    render(<Button>Start learning</Button>);
    expect(screen.getByRole("button", { name: "Start learning" })).toBeInTheDocument();
  });

  it("renders an anchor when href is given", () => {
    render(<Button href="/system-design">Open course</Button>);
    const link = screen.getByRole("link", { name: "Open course" });
    expect(link).toHaveAttribute("href", "/system-design");
  });

  it("never emits a zero-duration transition class", () => {
    const { container } = render(<Button>Go</Button>);
    expect(container.innerHTML).not.toMatch(/duration-0\b/);
  });

  it("meets the 44px touch target at default size", () => {
    const { container } = render(<Button>Go</Button>);
    expect(container.firstElementChild?.className).toMatch(/min-h-11/);
  });
});

describe("Card", () => {
  it("applies module colours as inline custom properties", () => {
    const { container } = render(<Card colorKey="cobalt">body</Card>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.getPropertyValue("--surface")).toBe("#1D4ED8");
    expect(el.style.getPropertyValue("--on-surface")).toBe("#FFFFFF");
  });

  it("sets no colour properties when colorKey is omitted", () => {
    const { container } = render(<Card>body</Card>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.getPropertyValue("--surface")).toBe("");
  });
});

describe("Badge", () => {
  it("labels a draft lesson in text, not colour alone", () => {
    render(<Badge status="draft" />);
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });

  it("renders nothing for a published lesson", () => {
    const { container } = render(<Badge status="published" />);
    expect(container).toBeEmptyDOMElement();
  });
});
