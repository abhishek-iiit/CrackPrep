// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SidebarTree } from "@/components/lesson/SidebarTree";
import { TableOfContents } from "@/components/lesson/TableOfContents";

const MODULES = [
  {
    id: "01", slug: "foundations", title: "Foundations", colorKey: "cobalt" as const,
    lessons: [
      { slug: "requirements-clarification", number: "01.01", title: "Requirements Clarification", url: "/system-design/foundations/requirements-clarification", status: "published" as const },
      { slug: "logical-system-design", number: "01.02", title: "Logical System Design", url: "/system-design/foundations/logical-system-design", status: "draft" as const },
    ],
  },
  {
    id: "07", slug: "storage-engines", title: "Storage Engines", colorKey: "teal" as const,
    lessons: [
      { slug: "lsm-tree-storage-engine", number: "07.09", title: "LSM Tree Storage Engine", url: "/system-design/storage-engines/lsm-tree-storage-engine", status: "published" as const },
    ],
  },
];

describe("SidebarTree", () => {
  it("marks the current lesson with aria-current", () => {
    render(<SidebarTree modules={MODULES} currentModule="foundations" currentLesson="requirements-clarification" />);
    const current = screen.getByRole("link", { current: "page" });
    expect(current).toHaveAccessibleName(/Requirements Clarification/);
  });

  it("expands the current module and collapses the others", () => {
    render(<SidebarTree modules={MODULES} currentModule="foundations" currentLesson="requirements-clarification" />);
    expect(screen.getByRole("button", { name: /Foundations/ })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: /Storage Engines/ })).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps collapsed lessons out of the accessibility tree", () => {
    render(<SidebarTree modules={MODULES} currentModule="foundations" currentLesson="requirements-clarification" />);
    expect(screen.queryByRole("link", { name: /LSM Tree Storage Engine/ })).not.toBeInTheDocument();
  });

  it("labels drafts in text so status is not colour-only", () => {
    render(<SidebarTree modules={MODULES} currentModule="foundations" currentLesson="requirements-clarification" />);
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });

  it("uses a labelled navigation landmark", () => {
    render(<SidebarTree modules={MODULES} currentModule="foundations" currentLesson="requirements-clarification" />);
    expect(screen.getByRole("navigation", { name: /course contents/i })).toBeInTheDocument();
  });
});

describe("TableOfContents", () => {
  const HEADINGS = [
    { id: "the-problem", text: "The problem", level: 2 as const },
    { id: "a-detail", text: "A detail", level: 3 as const },
  ];

  it("links each heading to its anchor", () => {
    render(<TableOfContents headings={HEADINGS} />);
    expect(screen.getByRole("link", { name: "The problem" })).toHaveAttribute("href", "#the-problem");
    expect(screen.getByRole("link", { name: "A detail" })).toHaveAttribute("href", "#a-detail");
  });

  it("indents level-3 headings further than level-2", () => {
    // Asserting only /pl-/ would pass even if both levels collapsed to the
    // same padding, which is the failure this test exists to catch.
    render(<TableOfContents headings={HEADINGS} />);
    expect(screen.getByRole("link", { name: "The problem" }).className).toMatch(/\bpl-3\b/);
    expect(screen.getByRole("link", { name: "A detail" }).className).toMatch(/\bpl-6\b/);
  });

  it("bounds its own height so a long contents list stays reachable", () => {
    render(<TableOfContents headings={HEADINGS} />);
    const nav = screen.getByRole("navigation", { name: /on this page/i });
    expect(nav.className).toMatch(/overflow-y-auto/);
    expect(nav.className).toMatch(/max-h-/);
  });

  it("renders nothing when there are no headings", () => {
    const { container } = render(<TableOfContents headings={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("uses a labelled navigation landmark", () => {
    render(<TableOfContents headings={HEADINGS} />);
    expect(screen.getByRole("navigation", { name: /on this page/i })).toBeInTheDocument();
  });
});
