import { afterEach, describe, expect, it, vi } from "vitest";
import sitemap from "@/app/sitemap";
import { courseSlug, getCourseStats, getLiveCourseSlugs, getModules } from "@/lib/content";

describe("sitemap", () => {
  const entries = sitemap();

  it("includes every static page plus all live modules and lessons", () => {
    const live = getLiveCourseSlugs();
    const moduleCount = live.reduce((n, s) => n + getCourseStats(s).moduleCount, 0);
    const topicCount = live.reduce((n, s) => n + getCourseStats(s).topicCount, 0);
    // /, /courses, /syllabus + one entry per live course home + modules + lessons
    expect(entries).toHaveLength(3 + live.length + moduleCount + topicCount);
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

  it("includes a known system-design lesson url", () => {
    const first = getModules(courseSlug)[0].lessons[0];
    expect(entries.some((e) => e.url.endsWith(first.url))).toBe(true);
  });

  it("includes the leetcode course home", () => {
    expect(entries.some((e) => e.url.endsWith("/leetcode"))).toBe(true);
  });

  it("includes the design-patterns course home", () => {
    expect(entries.some((e) => e.url.endsWith("/design-patterns"))).toBe(true);
  });

  it("includes the case-studies course home", () => {
    expect(entries.some((e) => e.url.endsWith("/case-studies"))).toBe(true);
  });
});

describe("SITE_URL", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("refuses a production build with no configured origin", async () => {
    // The sitemap's own "emits absolute urls" test above passes for
    // http://localhost:3000, so nothing here would have noticed a deploy that
    // forgot the variable. lib/site.ts throws at module load instead; this
    // proves it, since a guard nobody has ever seen fire is a guard nobody
    // can trust.
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    await expect(import("@/lib/site")).rejects.toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  it("uses the configured origin when there is one", async () => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://cineshek.example");
    const { SITE_URL } = await import("@/lib/site");
    expect(SITE_URL).toBe("https://cineshek.example");
  });
});
