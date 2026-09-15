import type { MetadataRoute } from "next";
import { getLiveCourseSlugs, getModules } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

// Required for `output: "export"` — otherwise Next treats this as a dynamic route.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const liveSlugs = getLiveCourseSlugs();

  const staticPages = ["/", "/courses", "/syllabus", ...liveSlugs.map((s) => `/${s}`)].map(
    (path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: path === "/" ? 1 : 0.8,
    }),
  );

  const modulePages = liveSlugs.flatMap((slug) =>
    getModules(slug).map((mod) => ({
      url: `${SITE_URL}${mod.url}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  );

  const lessonPages = liveSlugs.flatMap((slug) =>
    getModules(slug).flatMap((mod) =>
      mod.lessons.map((lesson) => ({
        url: `${SITE_URL}${lesson.url}`,
        lastModified: lesson.updated ? new Date(lesson.updated) : now,
        changeFrequency: "monthly" as const,
        priority: lesson.status === "published" ? 0.6 : 0.3,
      })),
    ),
  );

  return [...staticPages, ...modulePages, ...lessonPages];
}
