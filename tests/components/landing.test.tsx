// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { PathCards } from "@/components/landing/PathCards";
import { Subscribe } from "@/components/landing/Subscribe";
import { Testimonials } from "@/components/landing/Testimonials";

const COURSES = [
  {
    slug: "system-design", title: "System design in depth", eyebrow: "Engineering path",
    blurb: "Requirements to storage engines.", bullets: ["Notes and case studies"],
    status: "live" as const, colorKey: "mint" as const,
    moduleCount: 14, topicCount: 179, url: "/system-design",
  },
  {
    slug: "ai-research", title: "AI research", eyebrow: "Research path",
    blurb: "Maths to papers.", bullets: ["Landmark papers"],
    status: "planned" as const, colorKey: "cobalt" as const,
    moduleCount: 0, topicCount: 0, url: "",
  },
];

afterEach(() => vi.unstubAllEnvs());

describe("PathCards", () => {
  it("links the live path and shows its real counts", () => {
    render(<PathCards courses={COURSES} />);
    const link = screen.getByRole("link", { name: /System design in depth/ });
    expect(link).toHaveAttribute("href", "/system-design");
    expect(screen.getByText(/14 modules/i)).toBeInTheDocument();
    expect(screen.getByText(/179 topics/i)).toBeInTheDocument();
  });

  it("marks a planned path as Soon and does not link it", () => {
    render(<PathCards courses={COURSES} />);
    expect(screen.getByText("Soon")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /AI research/ })).not.toBeInTheDocument();
  });

  it("never invents counts for a planned path", () => {
    render(<PathCards courses={COURSES} />);
    expect(screen.queryByText(/0 modules/i)).not.toBeInTheDocument();
  });
});

describe("Subscribe", () => {
  it("says so plainly when no endpoint is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_SUBSCRIBE_ENDPOINT", "");
    render(<Subscribe />);
    expect(screen.getByText(/not yet configured/i)).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("renders a labelled email field when configured", () => {
    vi.stubEnv("NEXT_PUBLIC_SUBSCRIBE_ENDPOINT", "https://example.com/subscribe");
    render(<Subscribe />);
    const input = screen.getByLabelText(/email/i);
    expect(input).toHaveAttribute("type", "email");
    expect(input).toBeRequired();
  });
});

describe("Testimonials", () => {
  it("renders nothing when there are no real quotes", () => {
    const { container } = render(<Testimonials quotes={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("requires name and role alongside each quote", () => {
    render(
      <Testimonials
        quotes={[{ quote: "Genuinely useful.", name: "A. Reader", role: "Staff engineer" }]}
      />,
    );
    expect(screen.getByText(/Genuinely useful./)).toBeInTheDocument();
    expect(screen.getByText("A. Reader")).toBeInTheDocument();
    expect(screen.getByText("Staff engineer")).toBeInTheDocument();
  });
});
