import Link from "next/link";
import { getCourses, getTotalPublishedCount } from "@/lib/content";

export function Footer() {
  const live = getCourses().filter((c) => c.status === "live");
  const topicCount = live.reduce((n, c) => n + c.topicCount, 0);
  const publishedCount = getTotalPublishedCount();

  return (
    <footer className="mt-24 border-t-2 border-structural">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center">
        <div>
          <p className="font-pixel text-base">crackprep</p>
          <p className="mt-1 font-mono text-xs text-ink-muted">
            {live.length} paths · {topicCount} lessons
            {publishedCount > 0 && ` · ${publishedCount} written`}
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-4 sm:ml-auto">
          <Link href="/courses" className="text-sm text-link underline">
            Paths
          </Link>
          <Link href="/system-design" className="text-sm text-link underline">
            System design
          </Link>
          <Link href="/syllabus" className="text-sm text-link underline">
            Syllabus
          </Link>
        </nav>
      </div>
    </footer>
  );
}
