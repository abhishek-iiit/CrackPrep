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
 * PLACEHOLDERS: every entry with status "planned" is a stand-in so the
 * "Choose where to start" section has visual weight. Rename or delete them
 * freely — this file is the only place the roadmap is expressed.
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
    slug: "ai-research",
    title: "AI research",
    eyebrow: "Research path",
    blurb: "Maths foundations through to landmark papers, read in order.",
    bullets: ["Maths foundations to LLMs", "Landmark papers, sequenced", "GPU and tooling practice"],
    status: "planned",
    colorKey: "cobalt",
  },
  {
    slug: "ml-maths",
    title: "Advanced ML maths",
    eyebrow: "Foundations path",
    blurb: "The linear algebra, probability and optimisation the papers assume you know.",
    bullets: ["Sets and logic to inference", "Linear algebra and calculus", "Worked derivations"],
    status: "planned",
    colorKey: "cream",
  },
  {
    slug: "inference-engineering",
    title: "Inference engineering",
    eyebrow: "Production path",
    blurb: "Serving models under latency and cost budgets that actually bind.",
    bullets: ["Latency and cost budgets", "KV cache and batching maths", "Quantisation tradeoffs"],
    status: "planned",
    colorKey: "ink",
  },
];
