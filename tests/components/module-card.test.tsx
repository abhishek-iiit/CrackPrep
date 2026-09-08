// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ModuleCard } from "@/components/course/ModuleCard";

const MODULE = {
  id: "07",
  slug: "storage-engines",
  title: "Storage Engines",
  blurb: "LSM trees, B-trees, SSTables, compaction, object storage, and write-ahead logs.",
  colorKey: "teal" as const,
  url: "/system-design/storage-engines",
  lessons: [],
  publishedCount: 2,
  totalCount: 20,
};

describe("ModuleCard", () => {
  it("links to the module and names it in the accessible name", () => {
    render(<ModuleCard module={MODULE} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/system-design/storage-engines");
    expect(link).toHaveAccessibleName(/Storage Engines/);
  });

  it("shows the module number and topic count", () => {
    render(<ModuleCard module={MODULE} />);
    expect(screen.getByText("07")).toBeInTheDocument();
    expect(screen.getByText(/20 topics/i)).toBeInTheDocument();
  });

  it("reports written progress honestly rather than padding it", () => {
    render(<ModuleCard module={MODULE} />);
    expect(screen.getByText(/2 written/i)).toBeInTheDocument();
  });

  it("omits the written count when nothing is written yet", () => {
    render(<ModuleCard module={{ ...MODULE, publishedCount: 0 }} />);
    expect(screen.queryByText(/written/i)).not.toBeInTheDocument();
  });

  it("applies the module colour as custom properties", () => {
    const { container } = render(<ModuleCard module={MODULE} />);
    const el = container.querySelector("[style]") as HTMLElement;
    expect(el.style.getPropertyValue("--surface")).toBe("#0F766E");
  });
});
