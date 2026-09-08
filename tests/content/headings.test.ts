import { describe, expect, it } from "vitest";
import { extractHeadings } from "@/lib/content/headings";

describe("extractHeadings", () => {
  it("finds h2 and h3 with matching slug ids", () => {
    const body = `## The problem\n\nText.\n\n### A detail\n`;
    expect(extractHeadings(body)).toEqual([
      { id: "the-problem", text: "The problem", level: 2 },
      { id: "a-detail", text: "A detail", level: 3 },
    ]);
  });

  it("ignores h1 and h4", () => {
    const body = `# Title\n\n## Kept\n\n#### Dropped\n`;
    expect(extractHeadings(body).map((h) => h.text)).toEqual(["Kept"]);
  });

  it("ignores headings inside fenced code blocks", () => {
    const body = [
      "## Real heading",
      "",
      "```bash",
      "# not a heading",
      "## also not a heading",
      "```",
      "",
      "## Second real heading",
    ].join("\n");
    expect(extractHeadings(body).map((h) => h.text)).toEqual([
      "Real heading",
      "Second real heading",
    ]);
  });

  it("handles tilde-fenced blocks", () => {
    const body = `~~~\n## hidden\n~~~\n\n## visible\n`;
    expect(extractHeadings(body).map((h) => h.text)).toEqual(["visible"]);
  });

  it("does not let a tilde line close a backtick fence", () => {
    // CommonMark requires a matching delimiter. A boolean toggle would treat
    // the "~~~" as a close and expose "## not a heading" below it.
    const body = [
      "```bash",
      "~~~",
      "## not a heading",
      "```",
      "",
      "## real heading",
    ].join("\n");
    expect(extractHeadings(body).map((h) => h.text)).toEqual(["real heading"]);
  });

  it("does not let a backtick line close a tilde fence", () => {
    const body = ["~~~", "```", "## not a heading", "~~~", "", "## real heading"].join("\n");
    expect(extractHeadings(body).map((h) => h.text)).toEqual(["real heading"]);
  });

  it("handles fences longer than three characters", () => {
    const body = ["````", "```", "## not a heading", "````", "", "## real heading"].join("\n");
    expect(extractHeadings(body).map((h) => h.text)).toEqual(["real heading"]);
  });

  it("strips inline markdown from heading text", () => {
    const body = "## The `memtable` and **WAL**\n";
    const [heading] = extractHeadings(body);
    expect(heading.text).toBe("The memtable and WAL");
  });

  it("deduplicates repeated headings the way rehype-slug does", () => {
    const body = `## Tradeoffs\n\n## Tradeoffs\n`;
    expect(extractHeadings(body).map((h) => h.id)).toEqual(["tradeoffs", "tradeoffs-1"]);
  });

  it("returns an empty array for a body with no headings", () => {
    expect(extractHeadings("Just a paragraph.")).toEqual([]);
  });
});
