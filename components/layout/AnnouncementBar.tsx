"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

type Props = { id: string; message: string; href?: string; cta?: string };

export function AnnouncementBar({ id, message, href, cta }: Props) {
  // Rendered only after mount so the dismissed state never flashes visible.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(`announce:${id}`) !== "dismissed");
    } catch {
      setVisible(true);
    }
  }, [id]);

  function dismiss() {
    setVisible(false);
    try {
      window.localStorage.setItem(`announce:${id}`, "dismissed");
    } catch {
      // Private browsing or blocked storage — dismissal simply will not persist.
    }
  }

  // The wrapper always occupies its slot in the layout, so mounting cannot
  // shift the page. Only the contents toggle.
  return (
    <div className="border-b-2 border-structural bg-card">
      <div hidden={!visible} className="mx-auto flex max-w-[1200px] items-center gap-3 px-4 py-2">
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
