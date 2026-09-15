import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ModuleCard } from "@/components/course/ModuleCard";
import { CourseProgress } from "@/components/lesson/ProgressTracker";
import { getCourse, getCourseStats, getModules } from "@/lib/content";

const COURSE = "leetcode";

export async function generateMetadata(): Promise<Metadata> {
  const stats = getCourseStats(COURSE);
  return {
    title: "LeetCode roadmap",
    description: `${stats.moduleCount} phases and ${stats.topicCount} curated problems — foundations, core patterns, then advanced.`,
  };
}

export default function CoursePage() {
  const course = getCourse(COURSE);
  if (!course) notFound();

  const modules = getModules(COURSE);
  const stats = getCourseStats(COURSE);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-12">
      <p className="font-mono text-xs uppercase tracking-wider text-ink-muted">
        {course.eyebrow}
      </p>
      <h1 className="mt-3 font-pixel text-4xl sm:text-5xl">{course.title}</h1>
      <p className="mt-4 max-w-prose text-lg text-ink-muted">{course.blurb}</p>

      <div className="mt-6 flex flex-wrap items-center gap-4 font-mono text-xs uppercase tracking-wider">
        <span>{stats.moduleCount} phases</span>
        <span aria-hidden>·</span>
        <span>{stats.topicCount} problems</span>
        {stats.publishedCount > 0 && (
          <>
            <span aria-hidden>·</span>
            <span>{stats.publishedCount} written</span>
          </>
        )}
      </div>

      <div className="mt-2">
        <CourseProgress total={stats.topicCount} />
      </div>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((mod) => (
          <li key={mod.slug} className="flex">
            <ModuleCard module={mod} />
          </li>
        ))}
      </ul>
    </div>
  );
}
