"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { Search } from "lucide-react";
import type { SearchDoc } from "@/lib/content";

// topicCount is passed in by Header (a Server Component) rather than hardcoded,
// so the placeholder cannot drift from the real curriculum size.
export function SearchPalette({ topicCount }: { topicCount: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [docs, setDocs] = useState<SearchDoc[] | null>(null);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [fuse, setFuse] = useState<Fuse<SearchDoc> | null>(null);

  // Global shortcut.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // The index is fetched on first open, never in the initial bundle.
  useEffect(() => {
    if (!open || docs) return;
    let cancelled = false;
    fetch("/search-index.json")
      .then((res) => (res.ok ? res.json() : []))
      .then((loaded: SearchDoc[]) => {
        if (cancelled) return;
        setDocs(loaded);
        setFuse(
          new Fuse(loaded, {
            keys: [
              { name: "title", weight: 3 },
              { name: "number", weight: 2 },
              { name: "summary", weight: 1 },
              { name: "module", weight: 1 },
            ],
            threshold: 0.35,
            ignoreLocation: true,
          }),
        );
      })
      .catch(() => {
        // Guard the failure path too: a stale rejection arriving after a fresher
        // request succeeded would otherwise clobber an already-loaded index.
        if (!cancelled) setDocs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, docs]);

  // React runs every effect once on mount regardless of its dependency array,
  // so an unguarded `else` here would call triggerRef.focus() on EVERY page
  // load and steal focus onto the search button. wasOpen makes the restore
  // fire only on a real open -> closed transition.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open) inputRef.current?.focus();
    else if (wasOpen.current) triggerRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  const trimmedQuery = query.trim();
  const results = useMemo(
    () =>
      trimmedQuery.length > 0 && fuse
        ? fuse.search(trimmedQuery, { limit: 8 }).map((r) => r.item)
        : (docs ?? []).slice(0, 8),
    [trimmedQuery, fuse, docs],
  );

  const go = useCallback(
    (url: string) => {
      setOpen(false);
      setQuery("");
      router.push(url);
    },
    [router],
  );

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      setOpen(false);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && results[active]) {
      event.preventDefault();
      go(results[active].url);
    } else if (event.key === "Tab") {
      // aria-modal="true" promises focus stays inside. Only the input and the
      // option buttons are focusable and arrows already drive selection, so
      // trapping Tab on the input keeps that contract honest.
      event.preventDefault();
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search lessons"
        aria-keyshortcuts="Meta+K Control+K"
        className="grid size-11 place-items-center rounded-card border-2 border-structural bg-card transition-brut hover:shadow-hard-sm"
      >
        <Search aria-hidden className="size-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 p-4 pt-[12vh]"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search lessons"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={onKeyDown}
            className="w-full max-w-lg rounded-card border-2 border-structural bg-paper shadow-hard"
          >
            <label htmlFor="search-input" className="sr-only">
              Search lessons
            </label>
            <input
              id="search-input"
              ref={inputRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              placeholder={`Search ${topicCount} topics…`}
              autoComplete="off"
              role="combobox"
              aria-expanded
              aria-controls="search-results"
              // Focus never leaves the input while arrows move the selection, so without
              // this a screen reader is never told which option is active.
              aria-activedescendant={
                results.length > 0 ? `search-option-${active}` : undefined
              }
              className="min-h-13 w-full border-b-2 border-structural bg-transparent px-4 text-base"
            />

            {docs === null ? (
              <p className="p-4 font-mono text-xs text-ink-muted">Loading index…</p>
            ) : results.length === 0 ? (
              <p className="p-4 font-mono text-xs text-ink-muted">
                {docs.length === 0
                  ? "No lessons are published yet."
                  : `No lesson matches “${query}”.`}
              </p>
            ) : (
              <div
                id="search-results"
                role="listbox"
                aria-label="Search results"
                className="max-h-80 overflow-y-auto p-2"
              >
                {results.map((doc, i) => (
                  <div key={doc.url}>
                    <button
                      type="button"
                      role="option"
                      id={`search-option-${i}`}
                      aria-selected={i === active}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(doc.url)}
                      className={`flex w-full min-h-11 items-center gap-3 rounded-card px-3 text-left text-sm transition-brut ${
                        i === active ? "bg-card shadow-hard-sm" : ""
                      }`}
                    >
                      <span className="font-mono text-xs text-ink-muted">{doc.number}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{doc.title}</span>
                        <span className="block truncate text-xs text-ink-muted">{doc.module}</span>
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
