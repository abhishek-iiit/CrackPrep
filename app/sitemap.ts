import type { MetadataRoute } from "next";
import { courseSlug, getModules } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const modules = getModules(courseSlug);

  const staticPages = ["/", "/courses", "/syllabus", `/${courseSlug}`].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "/" ? 1 : 0.8,
  }));

  const modulePages = modules.map((mod) => ({
    url: `${SITE_URL}${mod.url}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const lessonPages = modules.flatMap((mod) =>
    mod.lessons.map((lesson) => ({
      url: `${SITE_URL}${lesson.url}`,
      lastModified: lesson.updated ? new Date(lesson.updated) : now,
      changeFrequency: "monthly" as const,
      priority: lesson.status === "published" ? 0.6 : 0.3,
    })),
  );

  return [...staticPages, ...modulePages, ...lessonPages];
}
