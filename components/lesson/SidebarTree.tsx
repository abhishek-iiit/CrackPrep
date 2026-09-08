"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { moduleColors, type ColorKey } from "@/lib/design/modules";

export type SidebarLesson = {
  slug: string;
  number: string;
  title: string;
  url: string;
  status: "published" | "draft";
};

export type SidebarModule = {
  id: string;
  slug: string;
  title: string;
  colorKey: ColorKey;
  lessons: SidebarLesson[];
};

type Props = {
  modules: SidebarModule[];
  currentModule: string;
  currentLesson: string;
};

export function SidebarTree({ modules, currentModule, currentLesson }: Props) {
  const [open, setOpen] = useState<Record<string, boolean>>(() => ({
    [currentModule]: true,
  }));

  const toggle = (slug: string) =>
    setOpen((prev) => ({ ...prev, [slug]: !prev[slug] }));

  return (
    <nav
      aria-label="Course contents"
      className="hidden self-start lg:sticky lg:top-20 lg:block lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto"
    >
      <ul className="space-y-1">
        {modules.map((mod) => {
          const expanded = Boolean(open[mod.slug]);
          const pair = moduleColors[mod.colorKey];
          const panelId = `sidebar-${mod.slug}`;

          return (
            <li key={mod.slug}>
              <button
                type="button"
                onClick={() => toggle(mod.slug)}
                aria-expanded={expanded}
                // Only reference the panel while it exists: aria-controls
                // pointing at a missing id fails axe's aria-valid-attr-value.
                aria-controls={expanded ? panelId : undefined}
                className="flex min-h-11 w-full items-center gap-2 rounded-card px-2 text-left text-sm transition-brut hover:bg-card"
              >
                <span
                  aria-hidden
                  style={{ backgroundColor: pair.surface }}
                  className="size-2.5 shrink-0 rounded-full border border-structural"
                />
                <span className="flex-1 font-medium">{mod.title}</span>
                <ChevronRight
                  aria-hidden
                  className={cn("size-4 shrink-0 transition-brut", expanded && "rotate-90")}
                />
              </button>

              {/* Collapsed content is removed from the tree entirely, so
                  screen readers and tab order match what is visible. */}
              {expanded && (
                <ul id={panelId} className="mt-1 space-y-0.5 border-l-2 border-hairline pl-3">
                  {mod.lessons.map((lesson) => {
                    const isCurrent =
                      mod.slug === currentModule && lesson.slug === currentLesson;
                    return (
                      <li key={lesson.slug}>
                        <Link
                          href={lesson.url}
                          aria-current={isCurrent ? "page" : undefined}
                          className={cn(
                            "flex min-h-11 items-center gap-2 rounded-card px-2 text-sm transition-brut hover:bg-card",
                            isCurrent && "bg-card font-medium shadow-hard-sm",
                          )}
                        >
                          <span className="font-mono text-[11px] text-ink-muted">
                            {lesson.number}
                          </span>
                          <span className="flex-1">{lesson.title}</span>
                          {lesson.status === "draft" && (
                            <span className="font-mono text-[10px] uppercase text-ink-muted">
                              Draft
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
