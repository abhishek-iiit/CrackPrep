import type { Lesson, Module } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

export function CourseJsonLd({ lesson, module: mod }: { lesson: Lesson; module: Module }) {
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
      name: "System design in depth",
      url: `${SITE_URL}/system-design`,
      hasPart: { "@type": "CourseInstance", name: mod.title },
    },
  };

  return (
    <script
      type="application/ld+json"
      // Content is our own frontmatter, but `</script>` inside a lesson title
      // or summary would still close this tag early and drop the rest of the
      // page's markup into it. Escaping `<` keeps the JSON valid (JSON parsers
      // read \u003c as `<`) and makes that impossible.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
