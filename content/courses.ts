import type { ColorKey } from "@/lib/design/modules";

export type CourseRecord = {
  slug: string;
  title: string;
  eyebrow: string;
  blurb: string;
  bullets: string[];
  status: "live" | "planned";
  colorKey: ColorKey;
};

/**
 * Course registry. status "planned" keeps a card on the Paths page without
 * loading content. Live courses must also be registered in
 * lib/content/source.ts COURSE_MODULES and have routes under app/<slug>/.
 */
export const courses: CourseRecord[] = [
  {
    slug: "system-design",
    title: "System design in depth",
    eyebrow: "Engineering path",
    blurb: "Requirements to storage engines, sequenced so each idea rests on the last.",
    bullets: ["Notes and case studies", "Tradeoffs made explicit", "Built for senior interviews"],
    status: "live",
    colorKey: "mint",
  },
  {
    slug: "leetcode",
    title: "LeetCode roadmap",
    eyebrow: "Interview path",
    blurb: "A curated 150 problems in three phases — fundamentals, patterns, then harder variants.",
    bullets: ["Phase 1: foundations (50)", "Phase 2: core patterns (50)", "Phase 3: advanced (50)"],
    status: "live",
    colorKey: "cobalt",
  },
  {
    slug: "design-patterns",
    title: "Design patterns",
    eyebrow: "Code craft path",
    blurb: "The Gang of Four patterns as decision tools — when each earns its complexity.",
    bullets: ["Creational patterns", "Structural patterns", "Behavioral patterns"],
    status: "live",
    colorKey: "violet",
  },
  {
    slug: "case-studies",
    title: "Design X case studies",
    eyebrow: "Case study path",
    blurb: "The most-asked Design X prompts as of 2026 — what to clarify, estimate, draw, and say out loud.",
    bullets: ["Classics like URL shortener", "Products like Drive and YouTube", "Platform designs including RAG"],
    status: "live",
    colorKey: "amber",
  },
];
