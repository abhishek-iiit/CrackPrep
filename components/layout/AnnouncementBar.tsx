"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { ANNOUNCEMENT_DISMISSED_ATTR, announcementStorageKey } from "@/lib/announcement";

type Props = { message: string; href?: string; cta?: string };

export function AnnouncementBar({ message, href, cta }: Props) {
  // No storage read during render, and no useMounted() gate. Whether the bar
  // starts hidden is decided before the first paint by the blocking script in
  // the root layout plus the `[data-announce-dismissed]` rule in globals.css
  // (see lib/announcement.ts), so this component only has to handle the click.
  //
  // Stamping the same attribute here — rather than holding a React state flag
  // — hides the bar immediately via that one CSS rule and keeps it hidden
  // across client-side navigations, where a remounted component's state would
  // reset. It is a write to <html>, outside React's tree, exactly as
  // next-themes' own toggle does.
  function dismiss() {
    try {
      window.localStorage.setItem(announcementStorageKey, "dismissed");
    } catch {
      // Storage unavailable — dismissal simply will not persist.
    }
    document.documentElement.setAttribute(ANNOUNCEMENT_DISMISSED_ATTR, "");
  }

  return (
    // data-announcement is what the CSS rule in globals.css hooks onto. The
    // literal is repeated there rather than imported, because a stylesheet
    // cannot read a TypeScript constant — a shared const would only look like
    // it coupled them.
    <div data-announcement="" className="border-b-2 border-structural bg-card">
      <div className="mx-auto flex max-w-[1200px] items-center gap-3 px-4 py-2">
        <p className="flex-1 text-center font-mono text-xs uppercase tracking-wider text-ink-muted">
          {message}
          {href && cta && (
            <Link href={href} className="ml-2 text-link underline">
              {cta}
            </Link>
          )}
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="grid size-11 shrink-0 place-items-center rounded-card transition-brut hover:bg-paper"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>
    </div>
  );
}
