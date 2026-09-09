import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** Returns [] for a directory that does not exist yet — `components/` is
 *  created in a later task than this test, and an ENOENT here would fail the
 *  suite for a reason that has nothing to do with the rule being enforced. */
function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

const ALLOWED_FS = [
  join("lib", "content", "source.ts"),
  join("scripts", ""),
  join("tests", ""),
];

describe("filesystem access is confined to the content source", () => {
  const files = [...walk("app"), ...walk("components"), ...walk("lib")];

  it("finds files to check", () => {
    // app/ and lib/ always exist by this task; components/ may not yet.
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)("%s does not import node:fs", (file) => {
    if (ALLOWED_FS.some((allowed) => file.includes(allowed))) return;
    const src = readFileSync(file, "utf8");
    expect(src).not.toMatch(/from\s+["'](node:)?fs["']/);
    expect(src).not.toMatch(/require\(["'](node:)?fs["']\)/);
  });

  // Matches IMPORTS, not any mention. A blind `not.toContain("gray-matter")`
  // also fires on comments, which forces contributors to weaken accurate
  // documentation to satisfy the guard — the exact opposite of what it is for.
  // Kept symmetrical with the node:fs check above.
  it("keeps gray-matter out of pages and components", () => {
    for (const file of [...walk("app"), ...walk("components")]) {
      const src = readFileSync(file, "utf8");
      expect(src).not.toMatch(/from\s+["']gray-matter["']/);
      expect(src).not.toMatch(/require\(["']gray-matter["']\)/);
    }
  });
});

describe("client components are limited to the seven named leaves", () => {
  const ALLOWED_CLIENT = new Set([
    "ThemeToggle", "AnnouncementBar", "SidebarTree",
    "TableOfContents", "ProgressTracker", "SearchPalette",
    "error", // Next.js requires error boundaries to be client components
  ]);

  it("declares 'use client' only in allowed files", () => {
    const offenders: string[] = [];
    for (const file of [...walk("app"), ...walk("components"), ...walk("lib")]) {
      const src = readFileSync(file, "utf8");
      if (!/^\s*["']use client["']/m.test(src)) continue;
      const base = file.split("/").pop()!.replace(/\.tsx?$/, "");
      if (!ALLOWED_CLIENT.has(base)) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });
});

describe("PathCards has no opacity beyond the two known-safe decorative ones", () => {
  // A nested opacity on TEXT here (e.g. the blurb <p> once had opacity-90)
  // compounds with PLANNED_CARD_OPACITY in a way
  // tests/design/contrast.test.ts's card-level compositing guard cannot see
  // — three colour keys rendered sub-AA the one time this happened (fix
  // round 2). A blanket "no opacity- class anywhere in the file" ban is too
  // strong, though: the decorative stacked-card motif (aria-hidden, not
  // text, never scanned for contrast) legitimately uses opacity-40 and
  // opacity-70 and predates this guard. So this pins the exact allowed set
  // instead of banning the token outright — any OTHER opacity-<N>
  // (including a reintroduced one on real text) changes the matched set and
  // fails. Matches actual Tailwind utility class tokens, not the word
  // "opacity" or the PLANNED_CARD_OPACITY identifier in prose/comments —
  // kept in the same spirit as the gray-matter import guard above.
  it("uses only opacity-40 and opacity-70 (the decorative motif)", () => {
    const src = readFileSync(join("components", "landing", "PathCards.tsx"), "utf8");
    const found = src.match(/\bopacity-\d+\b/g) ?? [];
    expect(new Set(found)).toEqual(new Set(["opacity-40", "opacity-70"]));
  });
});
