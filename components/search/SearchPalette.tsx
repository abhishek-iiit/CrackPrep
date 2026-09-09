"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { Search } from "lucide-react";
import type { SearchDoc } from "@/lib/content";

// publishedCount is passed in by Header (a Server Component) rather than
// hardcoded, so the placeholder cannot drift from the index. It is the count of
// PUBLISHED lessons — the ones getSearchIndex() actually indexes — and is named
// after the CourseStats field it comes from so the wiring is hard to get wrong:
// this prop was once fed stats.topicCount and advertised 179 searchable topics
// over an index of 3.
export function SearchPalette({ publishedCount }: { publishedCount: number }) {
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

  // `active` is raw state and can drift out of range — ArrowDown's clamp
  // evaluates Math.min(i + 1, -1) = -1 when there are no results yet, and
  // nothing resets it when the index later loads. Everything downstream uses
  // safeActive instead, so a dangling aria-activedescendant is impossible by
  // construction rather than by remembering to guard each use.
  const hasOptions = results.length > 0;
  const safeActive = hasOptions
    ? Math.min(Math.max(active, 0), results.length - 1)
    : -1;

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
      setActive((i) => Math.min(i + 1, Math.max(0, results.length - 1)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && results[safeActive]) {
      event.preventDefault();
      go(results[safeActive].url);
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
              placeholder={`Search ${publishedCount} topics…`}
              autoComplete="off"
              role="combobox"
              aria-expanded
              // combobox's aria-controls is a REQUIRED property (axe:
              // aria-required-attr, critical), not merely nice-to-have, so it
              // is always "search-results" now — never omitted. The element
              // it points at is unconditionally rendered below, so this can
              // never dangle the way the old hasOptions-gated version could.
              aria-controls="search-results"
              // aria-activedescendant is different: it names one specific
              // *option*, which only exists in the DOM when hasOptions is
              // true, so it still must be omitted otherwise or it would dangle.
              aria-activedescendant={
                hasOptions ? `search-option-${safeActive}` : undefined
              }
              className="min-h-13 w-full border-b-2 border-structural bg-transparent px-4 text-base"
            />

            {/* Always rendered — see aria-controls above — so the listbox
                role and its "Search results" label are only applied while
                option children actually exist. A listbox with a stray
                loading/no-match paragraph instead of option children would
                trip aria-required-children. */}
            <div
              id="search-results"
              role={hasOptions ? "listbox" : undefined}
              aria-label={hasOptions ? "Search results" : undefined}
              className={hasOptions ? "max-h-80 overflow-y-auto p-2" : undefined}
            >
              {docs === null ? (
                <p className="p-4 font-mono text-xs text-ink-muted">Loading index…</p>
              ) : results.length === 0 ? (
                <p className="p-4 font-mono text-xs text-ink-muted">
                  {docs.length === 0
                    ? "No lessons are published yet."
                    : `No lesson matches “${query}”.`}
                </p>
              ) : (
                results.map((doc, i) => (
                  <div key={doc.url}>
                    <button
                      type="button"
                      role="option"
                      // Arrow keys drive selection and Tab is trapped on the
                      // input, so an option must not be its own tab stop.
                      tabIndex={-1}
                      id={`search-option-${i}`}
                      aria-selected={i === safeActive}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(doc.url)}
                      className={`flex w-full min-h-11 items-center gap-3 rounded-card px-3 text-left text-sm transition-brut ${
                        i === safeActive ? "bg-card shadow-hard-sm" : ""
                      }`}
                    >
                      <span className="font-mono text-xs text-ink-muted">{doc.number}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{doc.title}</span>
                        <span className="block truncate text-xs text-ink-muted">{doc.module}</span>
                      </span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
