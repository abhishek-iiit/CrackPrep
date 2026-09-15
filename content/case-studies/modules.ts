// Live course: case-studies. Loaded via lib/content/source.ts.
import type { ColorKey } from "@/lib/design/modules";

export type ModuleRecord = {
  id: string;
  slug: string;
  dir: string;
  title: string;
  blurb: string;
  colorKey: ColorKey;
  topicCount: number;
};

export const modules: ModuleRecord[] = [
  {
    id: "01",
    slug: "classics",
    dir: "01-classics",
    title: "Classics",
    blurb: "The building-block designs every interviewer uses to test hashing, caching, and distributed state.",
    colorKey: "amber",
    topicCount: 8,
  },
  {
    id: "02",
    slug: "products",
    dir: "02-products",
    title: "Product systems",
    blurb: "Design Drive, YouTube, WhatsApp, and the other product prompts that dominate FAANG loops.",
    colorKey: "teal",
    topicCount: 10,
  },
  {
    id: "03",
    slug: "platform",
    dir: "03-platform",
    title: "Platform and search",
    blurb: "Notifications, autocomplete, maps, flash sales, ads metrics, and the RAG designs showing up in 2026.",
    colorKey: "rose",
    topicCount: 6,
  },
];
