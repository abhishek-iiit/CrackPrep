import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { courseSlug, getCourseStats, getModules } from "@/lib/content";

describe("sitemap", () => {
  const entries = sitemap();

  it("includes every static page plus all modules and lessons", () => {
    const stats = getCourseStats(courseSlug);
    // 4 static (/, /courses, /syllabus, /system-design) + 14 modules + 179 lessons
    expect(entries).toHaveLength(4 + stats.moduleCount + stats.topicCount);
  });

  it("emits absolute urls", () => {
    for (const entry of entries) {
      expect(entry.url).toMatch(/^https?:\/\//);
    }
  });

  it("contains no duplicate urls", () => {
    const urls = entries.map((e) => e.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("includes a known lesson url", () => {
    const first = getModules(courseSlug)[0].lessons[0];
    expect(entries.some((e) => e.url.endsWith(first.url))).toBe(true);
  });
});
