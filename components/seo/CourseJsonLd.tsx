import type { Course, Lesson, Module } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

export function CourseJsonLd({
  lesson,
  module: mod,
  course,
}: {
  lesson: Lesson;
  module: Module;
  course?: Pick<Course, "title" | "slug">;
}) {
  const courseTitle = course?.title ?? "System design in depth";
  const coursePath = course?.slug ? `/${course.slug}` : "/system-design";

  const data = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: lesson.title,
    description: lesson.summary,
    url: `${SITE_URL}${lesson.url}`,
    learningResourceType: "Lesson",
    educationalLevel: lesson.difficulty,
    timeRequired: `PT${lesson.estMinutes}M`,
    isPartOf: {
      "@type": "Course",
      name: courseTitle,
      url: `${SITE_URL}${coursePath}`,
      hasPart: { "@type": "CourseInstance", name: mod.title },
    },
  };

  // React 19 expects inline script bodies as `children`, not
  // `dangerouslySetInnerHTML`. Content is our own frontmatter, but a
  // literal `</script>` in a title/summary would still close this tag
  // early — escaping `<` keeps the JSON valid (\u003c) and closes that hole.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return <script type="application/ld+json">{json}</script>;
}
