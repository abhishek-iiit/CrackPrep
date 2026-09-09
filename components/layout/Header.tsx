import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { SearchPalette } from "@/components/search/SearchPalette";
import { courseSlug, getCourseStats } from "@/lib/content";

const NAV = [
  { href: "/system-design", label: "Course" },
  { href: "/syllabus", label: "Syllabus" },
  { href: "/courses", label: "Paths" },
];

export function Header() {
  const stats = getCourseStats(courseSlug);

  return (
    <header className="sticky top-0 z-40 border-b-2 border-structural bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1200px] items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-pixel text-lg">cineshek</span>
          <span className="rounded-card border-2 border-structural px-1.5 font-mono text-[10px] uppercase">
            beta
          </span>
        </Link>

        <nav aria-label="Main" className="ml-4 hidden gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex min-h-11 items-center rounded-card px-3 text-sm transition-brut hover:bg-card"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* publishedCount, NOT topicCount: getSearchIndex() indexes published
              lessons only, so the placeholder has to promise the size of the
              index the palette actually fetches. */}
          <SearchPalette publishedCount={stats.publishedCount} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
