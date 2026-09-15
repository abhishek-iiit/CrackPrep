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

// walk() is only ever called on app/, components/ and lib/, so scripts/ and
// tests/ entries could never match anything and only made the allow-list look
// broader than it is. One file may reach the filesystem.
const ALLOWED_FS = [
  join("lib", "content", "source.ts"),
  join("lib", "content", "leetcode-urls.ts"),
];

describe("filesystem access is confined to the content source", () => {
  const files = [...walk("app"), ...walk("components"), ...walk("lib")];

  it("finds files to check", () => {
    // app/ and lib/ always exist by this task; components/ may not yet.
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)("%s does not import node:fs", (file) => {
    // Exact relative path, not `includes`: a substring match would also
    // exempt any future file whose path merely contains the allowed one.
    if (ALLOWED_FS.includes(file)) return;
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
  // Full relative paths, not basenames: a basename allow-list exempts a
  // second file of the same name anywhere in the tree, and — worse — an
  // offenders-only assertion cannot notice a DELETION. Deleting
  // SidebarTree.tsx left this suite green while both this describe title and
  // README's named-leaves claim became false. Comparing the exact set both
  // ways, asserting the list length, and asserting each path exists on disk
  // closes all three holes at once.
  const CLIENT_COMPONENTS = [
    join("app", "error.tsx"), // Next requires error boundaries to be client
    join("components", "layout", "AnnouncementBar.tsx"),
    join("components", "layout", "ThemeToggle.tsx"),
    join("components", "lesson", "ProgressTracker.tsx"),
    join("components", "lesson", "SidebarTree.tsx"),
    join("components", "lesson", "TableOfContents.tsx"),
    join("components", "search", "SearchPalette.tsx"),
    join("components", "theme", "ThemeProvider.tsx"),
  ];

  it("names exactly eight", () => {
    expect(CLIENT_COMPONENTS).toHaveLength(8);
  });

  it.each(CLIENT_COMPONENTS)("%s exists", (file) => {
    expect(existsSync(file)).toBe(true);
  });

  it("declares 'use client' in exactly those eight files", () => {
    const found = [...walk("app"), ...walk("components"), ...walk("lib")]
      .filter((file) => /^\s*["']use client["']/m.test(readFileSync(file, "utf8")))
      .sort();
    expect(found).toEqual([...CLIENT_COMPONENTS].sort());
  });
});
