import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { moduleColors } from "@/lib/design/modules";
import type { Lesson, Module } from "@/lib/content";

const DIFFICULTY: Record<Lesson["difficulty"], string> = {
  intro: "Intro",
  core: "Core",
  deep: "Deep",
};

export function LessonHeader({ lesson, module: mod }: { lesson: Lesson; module: Module }) {
  const pair = moduleColors[mod.colorKey];

  return (
    <header className="border-b-2 border-hairline pb-6">
      <p className="flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-wider">
        <span
          style={{ backgroundColor: pair.surface, color: pair.ink }}
          className="rounded-card px-2 py-0.5"
        >
          {lesson.number}
        </span>
        <Link href={mod.url} className="text-link underline">
          {mod.title}
        </Link>
      </p>

      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        {lesson.title}
      </h1>

      <p className="mt-3 max-w-prose text-ink-muted">{lesson.summary}</p>

      {lesson.problemUrl && (
        <p className="mt-3">
          <a
            href={lesson.problemUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-link underline"
          >
            Open on LeetCode
            <ExternalLink aria-hidden className="size-3.5" />
          </a>
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3 font-mono text-xs text-ink-muted">
        <span>{DIFFICULTY[lesson.difficulty]}</span>
        <span aria-hidden>·</span>
        <span>{lesson.estMinutes} min read</span>
        {lesson.updated && (
          <>
            <span aria-hidden>·</span>
            <span>
              Updated <time dateTime={lesson.updated}>{lesson.updated}</time>
            </span>
          </>
        )}
        <Badge status={lesson.status} />
      </div>
    </header>
  );
}
