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
    slug: "leetcode", title: "LeetCode roadmap", eyebrow: "Interview path",
    blurb: "Curated 150 across three phases.", bullets: ["Phase 1: foundations"],
    status: "live" as const, colorKey: "cobalt" as const,
    moduleCount: 3, topicCount: 150, url: "/leetcode",
  },
  {
    slug: "design-patterns", title: "Design patterns", eyebrow: "Code craft path",
    blurb: "GoF patterns as decision tools.", bullets: ["Creational patterns"],
    status: "live" as const, colorKey: "violet" as const,
    moduleCount: 3, topicCount: 23, url: "/design-patterns",
  },
  {
    slug: "case-studies", title: "Design X case studies", eyebrow: "Case study path",
    blurb: "Most-asked Design X prompts.", bullets: ["Classics", "Products"],
    status: "live" as const, colorKey: "amber" as const,
    moduleCount: 3, topicCount: 24, url: "/case-studies",
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
    const withPlanned = [
      ...COURSES,
      {
        slug: "future-path", title: "Future path", eyebrow: "Roadmap",
        blurb: "Not yet.", bullets: ["Coming"],
        status: "planned" as const, colorKey: "lime" as const,
        moduleCount: 0, topicCount: 0, url: "",
      },
    ];
    render(<PathCards courses={withPlanned} />);
    expect(screen.getAllByText("Soon").length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: /Future path/ })).not.toBeInTheDocument();
  });

  it("links live leetcode with real counts", () => {
    render(<PathCards courses={COURSES} />);
    const link = screen.getByRole("link", { name: /LeetCode roadmap/ });
    expect(link).toHaveAttribute("href", "/leetcode");
    expect(screen.getByText(/150 topics/i)).toBeInTheDocument();
  });

  it("links live design-patterns with real counts", () => {
    render(<PathCards courses={COURSES} />);
    const link = screen.getByRole("link", { name: /Design patterns/ });
    expect(link).toHaveAttribute("href", "/design-patterns");
    expect(screen.getByText(/23 topics/i)).toBeInTheDocument();
  });

  it("links live case-studies with real counts", () => {
    render(<PathCards courses={COURSES} />);
    const link = screen.getByRole("link", { name: /Design X case studies/ });
    expect(link).toHaveAttribute("href", "/case-studies");
    expect(screen.getByText(/24 topics/i)).toBeInTheDocument();
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
