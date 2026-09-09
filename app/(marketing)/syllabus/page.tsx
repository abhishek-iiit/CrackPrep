import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { moduleColors } from "@/lib/design/modules";
import { courseSlug, getCourseStats, getModules } from "@/lib/content";

// Derived, not literal — see the root layout for the reasoning.
export async function generateMetadata(): Promise<Metadata> {
  const stats = getCourseStats(courseSlug);
  return {
    title: "Syllabus",
    description: `Every topic in the system design curriculum: ${stats.moduleCount} modules, ${stats.topicCount} topics, in order.`,
  };
}

export default function SyllabusPage() {
  const modules = getModules(courseSlug);
  const stats = getCourseStats(courseSlug);

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-12">
      <h1 className="font-pixel text-4xl">Syllabus</h1>
      <p className="mt-3 font-mono text-xs uppercase tracking-wider text-ink-muted">
        {stats.moduleCount} modules · {stats.topicCount} topics
      </p>

      <nav aria-label="Jump to module" className="mt-6 flex flex-wrap gap-2">
        {modules.map((mod) => (
          <a
            key={mod.slug}
            href={`#module-${mod.id}`}
            // Without this the entire accessible name is the number, giving a
            // screen-reader user 14 links called "01".."14" with nothing to
            // choose between them.
            aria-label={`Module ${mod.id}: ${mod.title}`}
            className="inline-flex min-h-11 items-center rounded-card border-2 border-structural bg-card px-3 font-mono text-xs uppercase transition-brut hover:shadow-hard-sm"
          >
            {mod.id}
          </a>
        ))}
      </nav>

      <div className="mt-12 space-y-12">
        {modules.map((mod) => {
          const pair = moduleColors[mod.colorKey];
          return (
            <section key={mod.slug} id={`module-${mod.id}`} className="scroll-mt-24">
              <div className="flex items-baseline gap-3">
                {/* Announced, like every other module-id badge on the site
                    (ModuleCard, the module page): the number is real
                    information here, not a decoration duplicating the
                    heading beside it. */}
                <span
                  style={{ backgroundColor: pair.surface, color: pair.ink }}
                  className="rounded-card px-2 py-0.5 font-pixel text-lg"
                >
                  {mod.id}
                </span>
                <h2 className="text-2xl font-semibold">
                  <Link href={mod.url} className="hover:underline">
                    {mod.title}
                  </Link>
                </h2>
              </div>
              <p className="mt-2 max-w-prose text-sm text-ink-muted">{mod.blurb}</p>

              <ol className="mt-4 grid gap-x-8 gap-y-1 sm:grid-cols-2">
                {mod.lessons.map((lesson) => (
                  <li key={lesson.slug} className="flex min-w-0 items-center gap-2 py-1">
                    <span className="w-12 shrink-0 font-mono text-xs text-ink-muted">
                      {lesson.number}
                    </span>
                    <Link href={lesson.url} className="min-w-0 flex-1 truncate text-sm hover:underline">
                      {lesson.title}
                    </Link>
                    <Badge status={lesson.status} />
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}
