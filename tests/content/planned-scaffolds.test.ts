import { readdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { modules as leetcodeModules } from "@/content/leetcode/modules";
import { modules as designPatternModules } from "@/content/design-patterns/modules";
import { modules as caseStudiesModules } from "@/content/case-studies/modules";

function mdxCount(course: string): number {
  const root = join(process.cwd(), "content", course);
  let count = 0;
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    for (const file of readdirSync(join(root, entry.name))) {
      if (file.endsWith(".mdx")) count++;
    }
  }
  return count;
}

describe("secondary course content on disk", () => {
  it("has leetcode as 3 modules and 150 lessons", () => {
    expect(leetcodeModules).toHaveLength(3);
    expect(leetcodeModules.reduce((n, m) => n + m.topicCount, 0)).toBe(150);
    expect(mdxCount("leetcode")).toBe(150);
    expect(existsSync("LeetCodeSyllabus.md")).toBe(true);
    expect(readFileSync("LeetCodeSyllabus.md", "utf8")).toContain("Phase 1");
  });

  it("has design-patterns as 3 modules and 23 lessons", () => {
    expect(designPatternModules).toHaveLength(3);
    expect(designPatternModules.reduce((n, m) => n + m.topicCount, 0)).toBe(23);
    expect(mdxCount("design-patterns")).toBe(23);
    expect(existsSync("DesignPatternsSyllabus.md")).toBe(true);
    expect(readFileSync("DesignPatternsSyllabus.md", "utf8")).toContain("Creational");
  });

  it("has case-studies as 3 modules and 24 lessons", () => {
    expect(caseStudiesModules).toHaveLength(3);
    expect(caseStudiesModules.reduce((n, m) => n + m.topicCount, 0)).toBe(24);
    expect(mdxCount("case-studies")).toBe(24);
    expect(existsSync("CaseStudiesSyllabus.md")).toBe(true);
    expect(readFileSync("CaseStudiesSyllabus.md", "utf8")).toContain("Google Drive");
  });

  it("marks sample lessons as published with real summaries", () => {
    const sample = readFileSync(
      "content/leetcode/01-phase-1/two-sum.mdx",
      "utf8",
    );
    expect(sample).toMatch(/^status: published$/m);
    expect(sample).not.toMatch(/notes in progress/);
    const pattern = readFileSync(
      "content/design-patterns/01-creational/singleton.mdx",
      "utf8",
    );
    expect(pattern).toMatch(/^status: published$/m);
    expect(pattern).not.toMatch(/notes in progress/);
  });
});
