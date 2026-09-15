import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { moduleColors } from "@/lib/design/modules";
import {
  getCourseStats,
  getCourses,
  getLiveCourseSlugs,
  getModules,
  getTotalPublishedCount,
} from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const live = getLiveCourseSlugs();
  const topicCount = live.reduce((n, slug) => n + getCourseStats(slug).topicCount, 0);
  return {
    title: "Syllabus",
    description: `Every lesson across ${live.length} CrackPrep paths — ${topicCount} topics in order.`,
  };
}

export default function SyllabusPage() {
  const courses = getCourses().filter((c) => c.status === "live");
  const topicCount = courses.reduce((n, c) => n + c.topicCount, 0);
  const publishedCount = getTotalPublishedCount();

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-12">
      <h1 className="font-pixel text-4xl">Syllabus</h1>
      <p className="mt-3 max-w-prose text-ink-muted">
        Every path on CrackPrep — system design, LeetCode, design patterns, and Design X
        case studies — in curriculum order.
      </p>
      <p className="mt-2 font-mono text-xs uppercase tracking-wider text-ink-muted">
        {courses.length} paths · {topicCount} lessons
        {publishedCount > 0 && ` · ${publishedCount} written`}
      </p>

      <nav aria-label="Jump to path" className="mt-6 flex flex-wrap gap-2">
        {courses.map((course) => (
          <a
            key={course.slug}
            href={`#path-${course.slug}`}
            className="inline-flex min-h-11 items-center rounded-card border-2 border-structural bg-card px-3 font-mono text-xs uppercase transition-brut hover:shadow-hard-sm"
          >
            {course.title}
          </a>
        ))}
      </nav>

      <div className="mt-16 space-y-20">
        {courses.map((course) => {
          const modules = getModules(course.slug);
          const pair = moduleColors[course.colorKey];

          return (
            <section
              key={course.slug}
              id={`path-${course.slug}`}
              className="scroll-mt-24"
            >
              <div className="border-b-2 border-hairline pb-4">
                <p className="font-mono text-xs uppercase tracking-wider text-ink-muted">
                  {course.eyebrow}
                </p>
                <h2 className="mt-2 font-pixel text-3xl">
                  <Link href={course.url} className="hover:underline">
                    {course.title}
                  </Link>
                </h2>
                <p className="mt-2 max-w-prose text-sm text-ink-muted">{course.blurb}</p>
                <p className="mt-3 font-mono text-xs uppercase tracking-wider text-ink-muted">
                  {course.moduleCount} modules · {course.topicCount} lessons
                </p>
              </div>

              <nav
                aria-label={`Jump to module in ${course.title}`}
                className="mt-6 flex flex-wrap gap-2"
              >
                {modules.map((mod) => (
                  <a
                    key={mod.slug}
                    href={`#${course.slug}-module-${mod.id}`}
                    aria-label={`${course.title} module ${mod.id}: ${mod.title}`}
                    className="inline-flex min-h-11 items-center rounded-card border-2 border-structural bg-card px-3 font-mono text-xs uppercase transition-brut hover:shadow-hard-sm"
                  >
                    {mod.id}
                  </a>
                ))}
              </nav>

              <div className="mt-10 space-y-12">
                {modules.map((mod) => {
                  const modPair = moduleColors[mod.colorKey];
                  return (
                    <section
                      key={mod.slug}
                      id={`${course.slug}-module-${mod.id}`}
                      className="scroll-mt-24"
                    >
                      <div className="flex items-baseline gap-3">
                        <span
                          style={{
                            backgroundColor: modPair.surface,
                            color: modPair.ink,
                          }}
                          className="rounded-card px-2 py-0.5 font-pixel text-lg"
                        >
                          {mod.id}
                        </span>
                        <h3 className="text-2xl font-semibold">
                          <Link href={mod.url} className="hover:underline">
                            {mod.title}
                          </Link>
                        </h3>
                      </div>
                      <p className="mt-2 max-w-prose text-sm text-ink-muted">{mod.blurb}</p>

                      <ol className="mt-4 grid gap-x-8 gap-y-1 sm:grid-cols-2">
                        {mod.lessons.map((lesson) => (
                          <li
                            key={lesson.slug}
                            className="flex min-w-0 items-center gap-2 py-1"
                          >
                            <span className="w-12 shrink-0 font-mono text-xs text-ink-muted">
                              {lesson.number}
                            </span>
                            <Link
                              href={lesson.url}
                              className="min-w-0 flex-1 truncate text-sm hover:underline"
                            >
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

              {/* Quiet use of course colour so paths feel distinct without cards. */}
              <div
                aria-hidden
                style={{ backgroundColor: pair.surface }}
                className="mt-12 h-1 w-16 rounded-card opacity-80"
              />
            </section>
          );
        })}
      </div>
    </div>
  );
}
