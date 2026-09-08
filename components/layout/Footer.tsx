import Link from "next/link";
import { getCourseStats } from "@/lib/content";

export function Footer() {
  const stats = getCourseStats("system-design");

  return (
    <footer className="mt-24 border-t-2 border-structural">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center">
        <div>
          <p className="font-pixel text-base">cineshek</p>
          <p className="mt-1 font-mono text-xs text-ink-muted">
            {stats.moduleCount} modules · {stats.topicCount} topics
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-4 sm:ml-auto">
          <Link href="/system-design" className="text-sm text-link underline">Course</Link>
          <Link href="/syllabus" className="text-sm text-link underline">Syllabus</Link>
          <Link href="/courses" className="text-sm text-link underline">Paths</Link>
        </nav>
      </div>
    </footer>
  );
}
