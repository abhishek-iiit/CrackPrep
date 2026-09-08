import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseSyllabus, slugify, MODULE_SLUGS, MODULE_COLORS } from "@/scripts/lib/parse-syllabus";
import { colorKeys } from "@/lib/design/modules";

const EXPECTED_COUNTS: Record<string, number> = {
  "01": 13, "02": 13, "03": 13, "04": 14, "05": 7, "06": 13, "07": 20,
  "08": 10, "09": 17, "10": 13, "11": 12, "12": 8, "13": 11, "14": 15,
};

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Requirements Clarification")).toBe("requirements-clarification");
  });

  it("drops ampersands and commas without leaving double hyphens", () => {
    expect(slugify("NoSQL, Partitioning & IDs")).toBe("nosql-partitioning-ids");
  });

  it("handles hyphens already present", () => {
    expect(slugify("Back-Of-The-Envelope Capacity Planning"))
      .toBe("back-of-the-envelope-capacity-planning");
  });

  it("strips leading and trailing separators", () => {
    expect(slugify("  MVCC  ")).toBe("mvcc");
  });
});

describe("parseSyllabus on the real curriculum", () => {
  const parsed = parseSyllabus(readFileSync("SDsyllabus.md", "utf8"));

  it("finds exactly 14 modules", () => {
    expect(parsed.modules).toHaveLength(14);
  });

  it("finds exactly 179 topics", () => {
    expect(parsed.totalTopics).toBe(179);
  });

  it("returns modules in id order", () => {
    expect(parsed.modules.map((m) => m.id)).toEqual(Object.keys(EXPECTED_COUNTS));
  });

  it.each(Object.entries(EXPECTED_COUNTS))(
    "module %s has %i topics and matches its declared count",
    (id, count) => {
      const mod = parsed.modules.find((m) => m.id === id);
      expect(mod).toBeDefined();
      expect(mod!.topics).toHaveLength(count);
      expect(mod!.declared).toBe(count);
    },
  );

  it("gives every module a non-empty title and blurb", () => {
    for (const mod of parsed.modules) {
      expect(mod.title.length).toBeGreaterThan(0);
      expect(mod.blurb.length).toBeGreaterThan(0);
    }
  });

  it("gives every topic a number, title, and slug", () => {
    for (const mod of parsed.modules) {
      for (const topic of mod.topics) {
        expect(topic.number).toMatch(/^\d{2}\.\d{2}$/);
        expect(topic.title.length).toBeGreaterThan(0);
        expect(topic.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      }
    }
  });

  it("keeps topic numbers unique across the whole course", () => {
    const numbers = parsed.modules.flatMap((m) => m.topics.map((t) => t.number));
    expect(new Set(numbers).size).toBe(179);
  });

  it("keeps topic slugs unique within each module", () => {
    for (const mod of parsed.modules) {
      const slugs = mod.topics.map((t) => t.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });

  it("orders topics by number inside each module", () => {
    for (const mod of parsed.modules) {
      const numbers = mod.topics.map((t) => t.number);
      expect(numbers).toEqual([...numbers].sort());
    }
  });
});

describe("duplicate-module defect in the source file", () => {
  it("does not emit a module twice when the input repeats it", () => {
    const doubled = `01
Foundations

Some blurb here.

2 TOPICS
01.01
First Topic
01.02
Second Topic

---

01
Foundations

Some blurb here.

2 TOPICS
01.01
First Topic
01.02
Second Topic
`;
    const parsed = parseSyllabus(doubled);
    expect(parsed.modules).toHaveLength(1);
    expect(parsed.modules[0].topics).toHaveLength(2);
    expect(parsed.totalTopics).toBe(2);
  });

  it("survives a table-of-contents block that lists modules without topics", () => {
    // This is the shape that breaks a naive keep-first-occurrence parser:
    // the TOC has the id, title and count but no topics at all.
    const withToc = `01
Foundations
2 TOPICS

---

01
Foundations

Some blurb here.

2 TOPICS
01.01
First Topic
01.02
Second Topic
`;
    const parsed = parseSyllabus(withToc);
    expect(parsed.modules).toHaveLength(1);
    expect(parsed.modules[0].topics).toHaveLength(2);
    expect(parsed.modules[0].blurb).toBe("Some blurb here.");
  });

  it("throws when a declared count disagrees with the topics found", () => {
    const wrong = `01
Foundations

Blurb.

5 TOPICS
01.01
Only Topic
`;
    expect(() => parseSyllabus(wrong)).toThrow(/module 01 declares 5.*found 1/i);
  });
});

describe("module slug and colour maps", () => {
  it("covers all 14 module ids", () => {
    expect(Object.keys(MODULE_SLUGS)).toHaveLength(14);
    expect(Object.keys(MODULE_COLORS)).toHaveLength(14);
  });

  it("assigns each module a distinct colour key from the design system", () => {
    const used = Object.values(MODULE_COLORS);
    expect(new Set(used).size).toBe(14);
    for (const key of used) expect(colorKeys).toContain(key);
  });

  it("uses the slugs named in the spec", () => {
    expect(MODULE_SLUGS["01"]).toBe("foundations");
    expect(MODULE_SLUGS["04"]).toBe("nosql-partitioning-ids");
    expect(MODULE_SLUGS["14"]).toBe("reliability-operations");
  });
});
