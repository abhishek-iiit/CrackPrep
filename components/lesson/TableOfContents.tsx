"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import type { Heading } from "@/lib/content/headings";

export function TableOfContents({
  headings,
  className,
}: {
  headings: Heading[];
  className?: string;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;

    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // The topmost intersecting heading wins, so scrolling up and down
        // both land on the section actually in view.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      // Offset the top by the sticky header so a heading counts as active
      // once it clears the chrome, not when it touches the viewport edge.
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav
      aria-label="On this page"
      className={cn("self-start xl:sticky xl:top-20", className)}
    >
      <p className="font-mono text-xs uppercase tracking-wider text-ink-muted">
        On this page
      </p>
      <ul className="mt-3 space-y-1 border-l-2 border-hairline">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              aria-current={activeId === heading.id ? "location" : undefined}
              className={cn(
                "-ml-0.5 block border-l-2 py-1 pr-2 text-sm transition-brut hover:text-ink",
                heading.level === 3 ? "pl-6" : "pl-3",
                activeId === heading.id
                  ? "border-structural font-medium text-ink"
                  : "border-transparent text-ink-muted",
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
