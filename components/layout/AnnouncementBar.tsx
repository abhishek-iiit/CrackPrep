"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useMounted } from "@/lib/hooks/useMounted";

type Props = { id: string; message: string; href?: string; cta?: string };

function readDismissed(id: string): boolean {
  try {
    return window.localStorage.getItem(`announce:${id}`) === "dismissed";
  } catch {
    // Private browsing or blocked site data: treat as not dismissed.
    return false;
  }
}

export function AnnouncementBar({ id, message, href, cta }: Props) {
  const mounted = useMounted();
  const [dismissedNow, setDismissedNow] = useState(false);

  // Storage is read only after hydration, so the server HTML and the first
  // client render agree. No effect, so no cascading render and no
  // setState-in-effect lint error — setState happens in the click handler only.
  const dismissed = dismissedNow || (mounted && readDismissed(id));

  function dismiss() {
    setDismissedNow(true);
    try {
      window.localStorage.setItem(`announce:${id}`, "dismissed");
    } catch {
      // Storage unavailable — dismissal simply will not persist.
    }
  }

  return (
    <div
      hidden={dismissed}
      className="border-b-2 border-structural bg-card"
    >
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
