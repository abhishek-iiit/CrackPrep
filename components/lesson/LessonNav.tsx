import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { LessonRef } from "@/lib/content";

function NavCard({ item: target, direction }: { item: LessonRef; direction: "prev" | "next" }) {
  const isNext = direction === "next";
  return (
    <Link
      href={target.url}
      rel={isNext ? "next" : "prev"}
      className={`group flex flex-1 flex-col gap-1 rounded-card border-2 border-structural bg-card p-4 transition-brut hover:shadow-hard ${
        isNext ? "items-end text-right" : "items-start"
      }`}
    >
      <span className="flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-ink-muted">
        {!isNext && <ArrowLeft aria-hidden className="size-3" />}
        {isNext ? "Next" : "Previous"}
        {isNext && <ArrowRight aria-hidden className="size-3" />}
      </span>
      <span className="font-medium">{target.title}</span>
      <span className="font-mono text-xs text-ink-muted">{target.number}</span>
    </Link>
  );
}

export function LessonNav({ prev, next }: { prev: LessonRef | null; next: LessonRef | null }) {
  if (!prev && !next) return null;

  return (
    <nav aria-label="Lesson navigation" className="mt-12 flex flex-col gap-4 sm:flex-row">
      {prev ? <NavCard item={prev} direction="prev" /> : <div className="flex-1" aria-hidden />}
      {next ? <NavCard item={next} direction="next" /> : <div className="flex-1" aria-hidden />}
    </nav>
  );
}
