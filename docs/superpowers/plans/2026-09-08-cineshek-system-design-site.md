# Cineshek System Design Site — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a paper-light, statically generated learning site covering the 14-module / 179-topic System Design curriculum, with every topic reachable at a stable URL and three lessons fully written.

**Architecture:** Next.js App Router, fully static. Content is MDX in `content/`, read only through the `lib/content` adapter so the storage backend is swappable. Design tokens live in TypeScript and are mirrored into CSS custom properties; a test enforces WCAG contrast on all of them. Server Components everywhere except six named client leaves.

**Tech Stack:** Next.js 16.3.4, React 19.2.8, TypeScript 5, Tailwind CSS 4.3.3 (CSS-first `@theme`, no config file), `@mdx-js/mdx@3` (`evaluate`), Zod 4, Vitest 5, Playwright 1.63, `next-themes` 0.4, `lucide-react` 1.42.

**Spec:** `docs/superpowers/specs/2026-09-08-cineshek-system-design-site-design.md`

---

## Verified environment findings

A throwaway probe app was built end-to-end before this plan was written. These are measured facts, not assumptions:

1. **`next@16.3.4` / `react@19.2.8`** are current. `create-next-app` scaffolds Turbopack builds by default.
2. **Tailwind v4 has no `tailwind.config.ts`.** Configuration is CSS-first: `@import "tailwindcss";` plus an `@theme` block in `globals.css`, with `@tailwindcss/postcss` as the only PostCSS plugin.
3. **`PageProps<T>` / `LayoutProps<T>` are build-generated globals** written to `.next/types/`. They do not exist before the first `next build` or `next dev`, so `tsc --noEmit` fails on a clean checkout that uses them. **This plan therefore declares explicit local prop types**, which typecheck on a clean clone and in CI without a prior build.
4. **`next-mdx-remote@6` SILENTLY DROPS every MDX expression attribute, and must not be used.** My first probe of it looked fine because the only custom component I passed took just `children`. Re-probed properly with attributes: `<T str="a" num={1} arr={["x"]} obj={{k:1}} tmpl={`a`} />` delivers only `{"str":"a"}` — numbers, booleans, arrays, objects and template literals are all dropped, with no error. Passing `format: "mdx"` or `development: false` changes nothing. Since `Tradeoff` and `KeyTakeaways` take array props and appear in all 179 generated stubs, every lesson page would have thrown `items.filter is not a function`.

   **`@mdx-js/mdx`'s `evaluate()` handles them correctly** — the same input delivers `{"str":"a","num":1,"arr":["x","y"],"obj":{"k":1}}`. Verified end-to-end by rendering a real generated stub body through `evaluate()` with the full plugin chain and the real `mdxComponents` map: all components rendered, array props arrived intact, and the empty-item filtering behaved. Task 8 therefore uses `@mdx-js/mdx` directly.

   Frontmatter parsing is not needed from the MDX layer at all: `lib/content/source.ts` already strips it with gray-matter and returns a clean `body`.
5. **`Geist`, `Geist_Mono`, and `Geist_Pixel` are all live on Google Fonts** and importable from `next/font/google`. `Geist_Pixel` is single-weight and **requires `weight: "400"`**.
6. **`Geist_Pixel` has no font-override metrics.** The build warns `Failed to find font override values for font 'Geist Pixel'. Skipping generating a fallback font.` Next cannot auto-generate a metric-matched fallback, so it is a CLS risk. Mitigation is mandatory and specified in Task 3.

## Deviations from the spec

Recorded here because the spec is the argument and these are knowing departures from it:

| Spec says | Plan does | Why |
|---|---|---|
| Next.js 15 | Next.js 16.3.4 | 15 is superseded. The UI/UX stack guidance the design cites is itself verified against nextjs 16.2. |
| Module metadata as `_module.NN-slug.yml` (§3.4) | `content/system-design/modules.ts`, a typed array | 14 records the owner rarely edits. Typed gives `colorKey` autocomplete and compile-time checking, and drops the `js-yaml` dependency (whose v5 release has ambiguous typings). Still Zod-validated. |
| `PageProps` implied by Next idiom | Explicit local prop types | Finding 3 — generated types break clean-checkout typechecks. |

## Global Constraints

Every task's requirements implicitly include this section. Values are copied verbatim from the spec.

**Counts.** Exactly **14 modules** and **179 topics**. Per-module topic counts: 01/13, 02/13, 03/13, 04/14, 05/7, 06/13, 07/20, 08/10, 09/17, 10/13, 11/12, 12/8, 13/11, 14/15.

**Base tokens — light.** `--paper` `#FAF8F4` · `--ink` `#141414` · `--card` `#FFFFFF` · `--ink-muted` `#57534E` · `--link` `#2563EB` · `--border-structural` `#141414` · `--border-hairline` `#E5E0D8` · `--destructive` `#DC2626`

**Base tokens — dark.** `--paper` `#0E0E0E` · `--ink` `#F5F3EF` · `--card` `#171716` · `--ink-muted` `#A8A29E` · `--link` `#93B4FF` · `--border-structural` `#F5F3EF` · `--border-hairline` `#2A2A28` · `--destructive` `#F87171`

**`destructive` is per-theme, and must be.** Measured: `#DC2626` is 4.55:1 on light paper but only **4.00:1 on the dark ground**, and `#F87171` is 6.98:1 on dark but **2.61:1 on light**. Neither value is usable in both themes, so it belongs in `TokenSet` where the drift test and the contrast test both cover it.

**Border rule.** Hairline tokens are decorative separators **only** — they fail 3:1 by design. Every boundary conveying a UI component (card edge, button, input, focus ring) uses `--border-structural` at 2px.

**Typography.** `Geist Pixel` display accent only, never body text. `Geist` headings and UI. `Geist Mono` code, numbers, `NN.NN` labels. Long-form body **17px at line-height 1.7**. Prose column capped at **68ch** — Tailwind v4's built-in `--max-width-prose` is 65ch, so it is overridden in `@theme`; every use of the measure, the `max-w-prose` utility included, must resolve to 68ch.

**Style.** Refined neo-brutalism: 0–4px radius, 2px visible borders, hard offset shadows `4px 4px 0 var(--border-structural)`, bold display type. Transitions **150–200ms** on hover/focus/colour — never `0s`. Never transition or animate a property that forces layout: `width`, `height`, `top`/`right`/`bottom`/`left`, `margin`, `padding`. Express movement with `transform` and fades with `opacity`. Paint-only properties — `color`, `background-color`, `border-color`, `box-shadow`, `outline-color` — **may** be transitioned, and are what hover and focus feedback is made of.

**Motion.** Every non-essential animation guarded by `prefers-reduced-motion: reduce` rendering the final state immediately. The `.transition-brut` utility transitions `color`, `background-color`, `border-color`, `box-shadow` and `transform` — every one of them paint-only or compositor-only, none reflow-inducing. That is correct and intended; do not narrow it.

**Accessibility.** Text contrast ≥4.5:1 everywhere. Visible focus rings, never removed. Icons are SVG (`lucide-react`) — **never emoji**. Icon-only buttons carry `aria-label`. One `<h1>` per page. `alt` required on every meaningful image; decorative art `aria-hidden`.

**Target sizes.** ≥44×44px with ≥8px spacing for anything a touch user can reach — header controls, buttons, form fields, sidebar rows. Dense navigation that renders only at pointer widths is held to **WCAG 2.5.8 AA (24×24 CSS px)**, the level this project claims; the `xl:`-only table of contents qualifies. Full-width stacked rows are contiguous targets, so gaps under 8px between them are not a mis-tap risk.

**Rendering.** Server Components by default. `'use client'` is permitted in exactly six leaf components and nowhere else: `ThemeToggle`, `AnnouncementBar`, `SidebarTree`, `TableOfContents`, `ProgressTracker`, `SearchPalette`. No layout, page, or content component is a client component.

**Integrity.** No fabricated testimonials, no third-party or institutional logos. The subscribe form must show an explicit "not yet configured" state when `NEXT_PUBLIC_SUBSCRIBE_ENDPOINT` is unset — never a fake success.

**Responsive.** Breakpoints 375 / 768 / 1024 / 1440, mobile-first. No horizontal page scroll at any width; wide tables and code blocks scroll inside their own `overflow-x: auto` container.

**Commits.** Conventional Commits. Commit at the end of every task.

**Lint.** `npm run lint` must exit 0 and is part of the `verify` gate. Never silence a rule with a disable comment or by relaxing config — fix the cause. In particular `react-hooks/set-state-in-effect` is an error here: read browser-only state through `useMounted()` / `useSyncExternalStore`, not `useState` + `useEffect`.

**Warning-free test output — scope of the rule.** `npm test` must be free of
warnings *about the code and its correctness*: React warnings, deprecation
notices, unhandled rejections, act() warnings, duplicate-key warnings. It does
**not** extend to Vitest's own performance hints about how the runner is
configured, and those must never be silenced by weakening test isolation.

Specifically, this advisory is **accepted and must be left alone**:

```
Isolate  N workers spawned · ~690ms startup each (spawn + environment, per file)
         at least ~296ms faster with isolate: false — reuses workers across files
```

Do NOT set `isolate: false` or `pool: "vmThreads"` to remove it. Isolation is
load-bearing here: `tests/components/progress.test.tsx` uses
`vi.spyOn(window.localStorage, …)` and `vi.restoreAllMocks()` against a
module-level mutable store (`let completed`, `let snapshot`, `const listeners`),
and `tests/components/landing.test.tsx` uses `vi.stubEnv` / `vi.unstubAllEnvs`.
Sharing workers across files puts that state at risk of leaking between files
for a measured saving of ~296ms on a ~2s suite — a bad trade.

The contrast with the jsdom advisory is the point: that one had a legitimate
fix (right-size the environment per file), which removed it *and* made the
suite 3.6x faster. This one's only lever is weakening isolation semantics. A
constraint that can only be satisfied by giving up a correctness guarantee is a
badly written constraint, so it is scoped out here rather than obeyed.

---

## File structure

| Path | Responsibility |
|---|---|
| `lib/design/contrast.ts` | WCAG relative luminance and contrast ratio maths. Pure, no imports. |
| `lib/design/tokens.ts` | Light and dark base token values. Single source of truth. |
| `lib/design/modules.ts` | The 14 `colorKey → {surface, ink}` pairs. |
| `lib/content/types.ts` | `Course`, `Module`, `Lesson`, `LessonRef`, `SearchDoc`. |
| `lib/content/schema.ts` | Zod frontmatter and module-metadata schemas. |
| `lib/content/source.ts` | Filesystem implementation. **The only file that touches `fs`.** |
| `lib/content/index.ts` | Public content API. The only module pages import. |
| `lib/progress/useProgress.ts` | `localStorage` progress via `useSyncExternalStore`. |
| `scripts/lib/parse-syllabus.ts` | Pure `string → ParsedSyllabus`. Testable without I/O. |
| `scripts/generate-content.ts` | Writes `modules.ts` + 179 MDX stubs. Idempotent. |
| `scripts/build-search-index.ts` | Writes `public/search-index.json`. |
| `content/courses.ts` | Course registry. System Design live, three placeholder paths. |
| `content/system-design/modules.ts` | The 14 module records. |
| `content/system-design/NN-slug/*.mdx` | 179 lessons. |
| `components/ui/` | `Button`, `Card`, `Pill`, `Badge` — presentational primitives. |
| `components/layout/` | `Header`, `Footer`, `AnnouncementBar`, `ThemeToggle`. |
| `components/landing/` | `Hero`, `Stats`, `PathCards`, `ModuleGrid`, `Features`, `Audience`, `Subscribe`, `Testimonials`. |
| `components/lesson/` | `LessonHeader`, `LessonNav`, `SidebarTree`, `TableOfContents`, `ProgressTracker`. |
| `components/mdx/` | `Callout`, `Tradeoff`, `KeyTakeaways`, `Figure`, `Steps`, `Formula`, `CodeBlock`, `index.tsx` (the MDX component map). |
| `components/search/SearchPalette.tsx` | ⌘K palette. |
| `app/` | Routes only. Thin — every page delegates to `lib/content` and `components/`. |
| `tests/design/`, `tests/content/`, `tests/components/`, `tests/e2e/` | Vitest and Playwright suites. |

Files that change together live together: each component owns its markup and styling, and content concerns never leak past `lib/content/index.ts`.

---

## Task 1: Project scaffold and verification harness

**Files:**
- Create: `package.json`, `next.config.ts`, `postcss.config.mjs`, `tsconfig.json`, `vitest.config.mts`, `.gitignore`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `lib/cn.ts`, `tests/setup.ts`, `tests/harness.test.tsx`
- Modify: none

**Interfaces:**
- Consumes: nothing.
- Produces: a buildable app with **warning-free** test output, `npm test` (Vitest), `npm run build`, `npm run typecheck`. Path alias `@/*` → `./*`, resolving in both Next and Vitest. Also `lib/cn.ts` exporting `cn(...parts: Array<string | false | null | undefined>): string`, created here so the alias can be proven by a real assertion rather than assumed; Task 6 consumes it unchanged.

- [ ] **Step 1: Scaffold the app in place**

The repo root already contains `SDsyllabus.md` and `docs/`, so scaffold into a temp directory and move the files in. The directory name must not begin with a dot — `create-next-app` validates it as an npm package name and rejects leading dots. Run from the repo root:

```bash
npx --yes create-next-app@latest cineshek-scaffold-tmp \
  --typescript --tailwind --app --no-src-dir --no-import-alias \
  --use-npm --skip-install --disable-git --yes
cp -R cineshek-scaffold-tmp/app cineshek-scaffold-tmp/public .
cp cineshek-scaffold-tmp/package.json cineshek-scaffold-tmp/next.config.ts \
   cineshek-scaffold-tmp/postcss.config.mjs cineshek-scaffold-tmp/tsconfig.json \
   cineshek-scaffold-tmp/eslint.config.mjs cineshek-scaffold-tmp/next-env.d.ts \
   cineshek-scaffold-tmp/.gitignore .
rm -rf cineshek-scaffold-tmp
```

- [ ] **Step 2: Install dependencies**

```bash
npm install @mdx-js/mdx@^3 remark-gfm@^4 rehype-slug@^6 \
  rehype-autolink-headings@^7 rehype-pretty-code@^0.14 shiki@^4 \
  gray-matter@^4 zod@^4 next-themes@^0.4 lucide-react@^1 fuse.js@^7
npm install -D vitest@^5 @vitejs/plugin-react@^6 jsdom@^30 \
  @testing-library/react@^16 @testing-library/jest-dom@^7 \
  @playwright/test@^1.63 @axe-core/playwright@^4 tsx@^4
```

`vitest@5` requires `@types/node@^22`, while `create-next-app` pins `^20`. Bump
the existing devDependency rather than passing `--legacy-peer-deps`, which
"resolves" the peer conflict by skipping the install of `vite` itself:

```bash
npm install -D @types/node@^22
```

- [ ] **Step 3: Set `package.json` name and scripts**

Replace the `"name"` and `"scripts"` blocks:

```json
{
  "name": "cineshek",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "content:generate": "tsx scripts/generate-content.ts",
    "content:index": "tsx scripts/build-search-index.ts",
    "verify": "npm run lint && npm run typecheck && npm run test && npm run build"
  }
}
```

- [ ] **Step 4: Create `vitest.config.mts`**

The `.mts` extension is required, not cosmetic: `package.json` has no `"type": "module"`, so a `.ts` config is loaded as CommonJS and Vite warns on every single test run. Do NOT fix that by adding `"type": "module"` — that changes module resolution for the whole project, Next's own config files included, which is a far larger blast radius than the warning justifies.

Path aliases come from Vite's native `resolve.tsconfigPaths`, not the `vite-tsconfig-paths` plugin; current Vite warns that the plugin is redundant. Verified: `@/*` resolves in Vitest with the native option and no plugin.

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    // "node", not "jsdom". Only 3 of the suite's test files need a DOM, and a
    // global jsdom environment gets constructed once per file — measured at 9
    // constructions consuming 75% of total test time, which also makes Vitest
    // print an advisory that violates the warning-free-output gate. Files that
    // need a DOM opt in with a `// @vitest-environment jsdom` docblock.
    // Measured effect: advisory gone, suite 4.30s -> 1.19s.
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    exclude: ["tests/e2e/**"],
    globals: true,
  },
});
```

- [ ] **Step 5: Create `tests/setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 6: Write the harness test**

Create `tests/harness.test.tsx` — the `.tsx` extension is required because the file contains JSX. It needs a DOM, so it opens with a `// @vitest-environment jsdom` docblock (the suite default is `node`). This proves the runner, the path alias, and TSX transformation all work before any real code depends on them.

First create `lib/cn.ts` — the alias assertion needs something real to import, and Task 6 needs this helper anyway:

```ts
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
```

Then the harness test:

```tsx
// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { cn } from "@/lib/cn";

describe("verification harness", () => {
  it("runs vitest", () => {
    expect(1 + 1).toBe(2);
  });

  it("renders react into jsdom", () => {
    render(<span>harness ok</span>);
    expect(screen.getByText("harness ok")).toBeInTheDocument();
  });

  // Proves resolve.tsconfigPaths actually maps @/* — every later task's
  // tests import through this alias, so an assumption here is not enough.
  it("resolves the @/ path alias", () => {
    expect(cn("a", false, "b")).toBe("a b");
  });
});
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npm test`
Expected: 3 passing tests **and no warnings whatsoever**. Warning-free output is a requirement of this task, not a nicety — this suite runs on every one of the remaining 17 tasks, and recurring noise is what teaches a reader to stop reading output. Never silence a warning with a suppression flag such as `VITE_CONFIG_NATIVE_IGNORE_WARNING`; fix the cause. If the JSX test fails with a transform error, `@vitejs/plugin-react` is not wired into `vitest.config.mts`. If the `@/lib/cn` import fails to resolve, `resolve.tsconfigPaths` is not taking effect — reinstate `vite-tsconfig-paths@^6` as a plugin and accept its warning.

- [ ] **Step 8: Append project ignores to `.gitignore`**

```bash
cat >> .gitignore <<'EOF'

# project
.superpowers/
.code-review-graph/
.claude/settings.local.json
/test-results/
/playwright-report/
/public/search-index.json
EOF
```

`.superpowers/` must be re-added here: Step 1's `cp` of the scaffold `.gitignore` overwrites the root file, and that directory holds this plan's execution scratch.

```bash
```

`public/search-index.json` is a build artifact generated by Task 14.

- [ ] **Step 9: Verify the build succeeds**

Run: `npm run build`
Expected: `✓ Compiled successfully`, route table lists `/`.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with vitest harness

Adds SDsyllabus.md as the curriculum source of truth."
```

`SDsyllabus.md` is untracked in the repo today; `git add -A` brings it under version control here, which Task 4's parser tests depend on.

---

## Task 2: Design tokens and the contrast test

This task is the enforcement mechanism for the spec's colour arithmetic. Write the test first — it is the reason the three broken colours were caught during design.

**Files:**
- Create: `lib/design/contrast.ts`, `lib/design/tokens.ts`, `lib/design/modules.ts`, `tests/design/contrast.test.ts`
- Test: `tests/design/contrast.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `contrastRatio(a: string, b: string): number` — accepts `#RRGGBB`, case-insensitive.
  - `relativeLuminance(hex: string): number`
  - `baseTokens: { light: TokenSet; dark: TokenSet }` where `TokenSet = Record<TokenName, string>` and `TokenName = "paper" | "ink" | "card" | "inkMuted" | "link" | "borderStructural" | "borderHairline"`. `destructive` is exported separately as a flat constant at this task; **Task 3 moves it into `TokenSet` per-theme** — see the note there.
  - `moduleColors: Record<ColorKey, { surface: string; ink: string }>`
  - `type ColorKey = "cobalt" | "amber" | "mint" | "violet" | "rose" | "ink" | "teal" | "lime" | "orange" | "cyan" | "fuchsia" | "sky" | "cream" | "lavender"`

- [ ] **Step 1: Write the failing test**

Create `tests/design/contrast.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { contrastRatio, relativeLuminance } from "@/lib/design/contrast";
import { baseTokens } from "@/lib/design/tokens";
import { moduleColors } from "@/lib/design/modules";

const AA_TEXT = 4.5;
const AA_UI = 3;

describe("contrastRatio", () => {
  it("returns 21 for black on white", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 1);
  });

  it("returns 1 for a colour against itself", () => {
    expect(contrastRatio("#4F46E5", "#4F46E5")).toBeCloseTo(1, 5);
  });

  it("is symmetric", () => {
    expect(contrastRatio("#141414", "#FAF8F4")).toBeCloseTo(
      contrastRatio("#FAF8F4", "#141414"),
      5,
    );
  });

  it("accepts lowercase and omitted-hash forms", () => {
    expect(contrastRatio("#faf8f4", "141414")).toBeCloseTo(17.37, 1);
  });

  it("rejects malformed input", () => {
    expect(() => relativeLuminance("#12345")).toThrow(/invalid hex/i);
    expect(() => relativeLuminance("nope")).toThrow(/invalid hex/i);
  });
});

describe("module surfaces meet AA for their ink", () => {
  const entries = Object.entries(moduleColors);

  it("defines exactly 14 colour keys", () => {
    expect(entries).toHaveLength(14);
  });

  it.each(entries)("%s surface/ink is at least 4.5:1", (_key, pair) => {
    expect(contrastRatio(pair.surface, pair.ink)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it("uses no duplicate surfaces", () => {
    const surfaces = entries.map(([, p]) => p.surface.toUpperCase());
    expect(new Set(surfaces).size).toBe(14);
  });
});

describe("base tokens meet AA in both themes", () => {
  for (const theme of ["light", "dark"] as const) {
    const t = baseTokens[theme];

    it(`${theme}: ink on paper >= 4.5`, () => {
      expect(contrastRatio(t.ink, t.paper)).toBeGreaterThanOrEqual(AA_TEXT);
    });

    it(`${theme}: ink on card >= 4.5`, () => {
      expect(contrastRatio(t.ink, t.card)).toBeGreaterThanOrEqual(AA_TEXT);
    });

    it(`${theme}: inkMuted on paper >= 4.5`, () => {
      expect(contrastRatio(t.inkMuted, t.paper)).toBeGreaterThanOrEqual(AA_TEXT);
    });

    it(`${theme}: inkMuted on card >= 4.5`, () => {
      expect(contrastRatio(t.inkMuted, t.card)).toBeGreaterThanOrEqual(AA_TEXT);
    });

    it(`${theme}: link on paper >= 4.5`, () => {
      expect(contrastRatio(t.link, t.paper)).toBeGreaterThanOrEqual(AA_TEXT);
    });

    it(`${theme}: borderStructural on paper >= 3 (WCAG 1.4.11)`, () => {
      expect(contrastRatio(t.borderStructural, t.paper)).toBeGreaterThanOrEqual(AA_UI);
    });
  }

  it("documents that hairlines are decorative and below 3:1", () => {
    expect(
      contrastRatio(baseTokens.light.borderHairline, baseTokens.light.paper),
    ).toBeLessThan(AA_UI);
    expect(
      contrastRatio(baseTokens.dark.borderHairline, baseTokens.dark.paper),
    ).toBeLessThan(AA_UI);
  });
});
```

The final test is deliberately an assertion that hairlines are *low* contrast. It documents the spec's border rule as an executable fact, so anyone who "fixes" a hairline to pass AA has to confront the rule instead of silently changing the visual language.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/design/contrast.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/design/contrast"`.

- [ ] **Step 3: Implement `lib/design/contrast.ts`**

```ts
const HEX = /^#?([0-9a-f]{6})$/i;

/** WCAG 2.1 relative luminance for an `#RRGGBB` colour. */
export function relativeLuminance(hex: string): number {
  const match = HEX.exec(hex.trim());
  if (!match) throw new Error(`invalid hex colour: ${hex}`);
  const int = Number.parseInt(match[1], 16);
  const channels = [(int >> 16) & 255, (int >> 8) & 255, int & 255];
  const [r, g, b] = channels.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.1 contrast ratio, 1–21. Order-independent. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/** True when the pair is legible as body text at normal weight. */
export function meetsAAText(a: string, b: string): boolean {
  return contrastRatio(a, b) >= 4.5;
}
```

- [ ] **Step 4: Implement `lib/design/tokens.ts`**

```ts
export type TokenName =
  | "paper"
  | "ink"
  | "card"
  | "inkMuted"
  | "link"
  | "borderStructural"
  | "borderHairline";

export type TokenSet = Record<TokenName, string>;

/**
 * Base surface and text tokens. Values are fixed by the design spec and
 * verified by tests/design/contrast.test.ts — do not edit one without
 * running `npm test`.
 *
 * borderHairline is DECORATIVE ONLY and intentionally below 3:1. Any
 * boundary that conveys a UI component uses borderStructural at 2px.
 */
export const baseTokens: { light: TokenSet; dark: TokenSet } = {
  light: {
    paper: "#FAF8F4",
    ink: "#141414",
    card: "#FFFFFF",
    inkMuted: "#57534E",
    link: "#2563EB",
    borderStructural: "#141414",
    borderHairline: "#E5E0D8",
  },
  dark: {
    paper: "#0E0E0E",
    ink: "#F5F3EF",
    card: "#171716",
    inkMuted: "#A8A29E",
    link: "#93B4FF",
    borderStructural: "#F5F3EF",
    borderHairline: "#2A2A28",
  },
};

/** Shared across both themes. */
export const destructive = "#DC2626";

/** CSS custom property name for a token, e.g. "inkMuted" -> "--ink-muted". */
export function cssVarName(token: TokenName): string {
  return `--${token.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
}
```

- [ ] **Step 5: Implement `lib/design/modules.ts`**

```ts
export type ColorKey =
  | "cobalt" | "amber" | "mint" | "violet" | "rose" | "ink" | "teal"
  | "lime" | "orange" | "cyan" | "fuchsia" | "sky" | "cream" | "lavender";

export type ModuleColor = { surface: string; ink: string };

/**
 * One vivid surface per module. Every pair is verified at >= 4.5:1 by
 * tests/design/contrast.test.ts.
 *
 * History: teal was darkened from #0D9488 (3.74:1), and orange and fuchsia
 * switched from white to dark ink (3.56 and 3.46:1) so they could keep their
 * saturation. Do not revert without re-running the test.
 */
export const moduleColors: Record<ColorKey, ModuleColor> = {
  cobalt:   { surface: "#1D4ED8", ink: "#FFFFFF" }, // 6.70
  amber:    { surface: "#F59E0B", ink: "#141414" }, // 8.58
  mint:     { surface: "#34D399", ink: "#141414" }, // 9.58
  violet:   { surface: "#7C3AED", ink: "#FFFFFF" }, // 5.70
  rose:     { surface: "#FB7185", ink: "#141414" }, // 6.84
  ink:      { surface: "#141414", ink: "#FFFFFF" }, // 18.42
  teal:     { surface: "#0F766E", ink: "#FFFFFF" }, // 5.47
  lime:     { surface: "#A3E635", ink: "#141414" }, // 12.22
  orange:   { surface: "#EA580C", ink: "#141414" }, // 5.18
  cyan:     { surface: "#22D3EE", ink: "#141414" }, // 10.19
  fuchsia:  { surface: "#D946EF", ink: "#141414" }, // 5.33
  sky:      { surface: "#38BDF8", ink: "#141414" }, // 8.60
  cream:    { surface: "#FDE68A", ink: "#141414" }, // 14.79
  lavender: { surface: "#C4B5FD", ink: "#141414" }, // 9.98
};

export const colorKeys = Object.keys(moduleColors) as ColorKey[];
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run tests/design/contrast.test.ts`
Expected: PASS — 14 module pairs, 12 base-token assertions, 5 maths assertions, all green.

- [ ] **Step 7: Commit**

```bash
git add lib/design tests/design
git commit -m "feat: add design tokens with WCAG contrast enforcement

All 14 module surface/ink pairs and both theme token sets are verified
at AA by test. Hairline borders are asserted below 3:1 to document that
they are decorative-only."
```

---

## Task 3: Theme layer — CSS tokens, fonts, dark mode

**Files:**
- Create: `lib/hooks/useMounted.ts`, `components/layout/ThemeToggle.tsx`, `tests/design/css-tokens.test.ts`
- Modify: `app/globals.css` (replace entirely), `app/layout.tsx` (replace entirely), `lib/design/tokens.ts` (promote `destructive` into `TokenSet` — Step 0), `tests/design/contrast.test.ts` (cover it — Step 0b)

**Interfaces:**
- Consumes: `baseTokens`, `cssVarName`, `TokenName` from Task 2 — and amends all three, since Step 0 adds `destructive` to the `TokenName` union and both theme sets.
- Produces: Tailwind utilities `bg-paper`, `bg-card`, `text-ink`, `text-ink-muted`, `text-link`, `border-structural`, `border-hairline`, `font-sans`, `font-mono`, `font-pixel`; the `dark:` variant driven by a `.dark` class; `<ThemeToggle />`.

- [ ] **Step 0: Move `destructive` into `TokenSet` (per-theme)**

Task 2 left `destructive` as a single flat constant, which is wrong and is the
only base token with no test covering it. Measured contrast:

| Value | On light paper `#FAF8F4` | On dark paper `#0E0E0E` |
|---|---|---|
| `#DC2626` | 4.55 ✓ | **4.00 ✗** |
| `#F87171` | **2.61 ✗** | 6.98 ✓ |

No single value clears AA in both themes, so it must be per-theme. Promoting it
into `TokenSet` is what makes the drift test in Step 1 and the contrast test in
Step 0b cover it automatically, since both iterate `Object.keys(baseTokens.light)`.

In `lib/design/tokens.ts`: add `"destructive"` to the `TokenName` union, add
`destructive: "#DC2626"` to `baseTokens.light`, add `destructive: "#F87171"` to
`baseTokens.dark`, and delete the standalone `export const destructive` line
(nothing imports it yet — Task 2 was its only appearance).

- [ ] **Step 0b: Extend the contrast test to cover it**

Append to `tests/design/contrast.test.ts`, inside the existing
`describe("base tokens meet AA in both themes")` loop over `["light","dark"]`:

```ts
    it(`${theme}: destructive on paper >= 4.5`, () => {
      expect(contrastRatio(t.destructive, t.paper)).toBeGreaterThanOrEqual(AA_TEXT);
    });

    it(`${theme}: destructive on card >= 4.5`, () => {
      expect(contrastRatio(t.destructive, t.card)).toBeGreaterThanOrEqual(AA_TEXT);
    });
```

Run: `npx vitest run tests/design/contrast.test.ts`
Expected: PASS, four more assertions than before. If the light case fails, the
per-theme split was not applied; if the dark case fails at 4.00, `#DC2626` is
still being used for dark.

- [ ] **Step 1: Write the failing drift test**

Create `tests/design/css-tokens.test.ts`. Tokens live in two places — TypeScript for tests and CSS for rendering — so a test must prove they cannot drift apart.

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { baseTokens, cssVarName, type TokenName } from "@/lib/design/tokens";

const css = readFileSync("app/globals.css", "utf8");
const tokenNames = Object.keys(baseTokens.light) as TokenName[];

/**
 * Returns the declarations inside a CSS rule, matched by a selector anchored
 * at the start of a line.
 *
 * Do NOT slice on `css.indexOf(".dark")` instead: the file opens with
 * `@custom-variant dark (&:where(.dark, .dark *))`, whose `.dark` occurs
 * BEFORE `:root`, so an indexOf-based light-token slice comes out empty and
 * every light assertion fails. Anchoring on a selector followed by `{` also
 * skips the indented `html.dark {` rule inside `@layer base`.
 */
function ruleBody(source: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`^${escaped}\\s*\\{([^}]*)\\}`, "m").exec(source);
  if (!match) throw new Error(`no "${selector}" rule found in app/globals.css`);
  return match[1];
}

const rootBlock = ruleBody(css, ":root");
const darkBlock = ruleBody(css, ".dark");
const themeBlock = ruleBody(css, "@theme inline");

describe("globals.css mirrors lib/design/tokens.ts", () => {
  it("uses the class strategy for dark mode", () => {
    expect(css).toMatch(/@custom-variant\s+dark/);
  });

  it.each(tokenNames)("declares %s in :root with the light value", (token) => {
    expect(rootBlock).toContain(`${cssVarName(token)}: ${baseTokens.light[token]};`);
  });

  it.each(tokenNames)("declares %s in .dark with the dark value", (token) => {
    expect(darkBlock).toContain(`${cssVarName(token)}: ${baseTokens.dark[token]};`);
  });

  it("exposes every token to Tailwind via @theme inline", () => {
    for (const token of tokenNames) {
      expect(themeBlock).toContain(`var(${cssVarName(token)})`);
    }
  });

  it("never sets a zero-duration transition", () => {
    expect(css).not.toMatch(/transition[^;]*:\s*(none|0s|0ms)/);
  });

  it("guards motion behind prefers-reduced-motion", () => {
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/design/css-tokens.test.ts`
Expected: FAIL — the scaffolded `globals.css` has none of these declarations.

- [ ] **Step 3: Replace `app/globals.css`**

Each of `:root`, `.dark`, and `@theme inline` must appear as a rule whose selector starts a line — that is what the test's `ruleBody()` matches on. Their order does not matter.

```css
@import "tailwindcss";

/* Tailwind v4 defaults `dark:` to prefers-color-scheme. next-themes drives a
   class instead, so the variant is redefined. */
@custom-variant dark (&:where(.dark, .dark *));

:root {
  --paper: #FAF8F4;
  --ink: #141414;
  --card: #FFFFFF;
  --ink-muted: #57534E;
  --link: #2563EB;
  --border-structural: #141414;
  --border-hairline: #E5E0D8;
  --destructive: #DC2626;

  --shadow-hard: 4px 4px 0 var(--border-structural);
  --shadow-hard-sm: 2px 2px 0 var(--border-structural);
  --dur: 180ms;
  --ease: cubic-bezier(0.2, 0, 0.2, 1);
}

.dark {
  --paper: #0E0E0E;
  --ink: #F5F3EF;
  --card: #171716;
  --ink-muted: #A8A29E;
  --link: #93B4FF;
  --border-structural: #F5F3EF;
  --border-hairline: #2A2A28;
  --destructive: #F87171;
}

@theme inline {
  --color-paper: var(--paper);
  --color-ink: var(--ink);
  --color-card: var(--card);
  --color-ink-muted: var(--ink-muted);
  --color-link: var(--link);
  --color-structural: var(--border-structural);
  --color-hairline: var(--border-hairline);
  --color-destructive: var(--destructive);

  --font-sans: var(--font-geist), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, monospace;
  --font-pixel: var(--font-geist-pixel), var(--font-geist-mono), ui-monospace, monospace;

  --radius-card: 4px;

  /* Tailwind v4 ships --max-width-prose: 65ch. The spec fixes the measure at
     68ch, so override it here: that keeps the `max-w-prose` utility and the
     .prose-lesson class below on the same number instead of 65 vs 68. */
  --max-width-prose: 68ch;
}

@layer base {
  html {
    color-scheme: light;
  }
  html.dark {
    color-scheme: dark;
  }

  body {
    background-color: var(--paper);
    color: var(--ink);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
  }

  /* Focus rings are never removed. 2px structural, offset so it reads on
     both paper and coloured module surfaces. */
  :focus-visible {
    outline: 2px solid var(--border-structural);
    outline-offset: 2px;
  }

  /* Long-form reading: 17px / 1.7, capped at 68ch. */
  .prose-lesson {
    font-size: 17px;
    line-height: 1.7;
    max-width: var(--max-width-prose);
  }

  /* Geist Pixel ships without font-override metrics, so Next cannot generate a
     metric-matched fallback. An explicit line-height makes the box height
     font-independent, which is what keeps CLS at zero while the face swaps. */
  .font-pixel,
  [class*="font-pixel"] {
    font-family: var(--font-pixel);
    line-height: 1.1;
    letter-spacing: 0;
  }

  /* Wide content scrolls inside itself; the page never scrolls sideways. */
  .scroll-x {
    overflow-x: auto;
    max-width: 100%;
  }
}

@layer utilities {
  .shadow-hard {
    box-shadow: var(--shadow-hard);
  }
  .shadow-hard-sm {
    box-shadow: var(--shadow-hard-sm);
  }
  .transition-brut {
    transition-property: color, background-color, border-color, box-shadow, transform;
    transition-duration: var(--dur);
    transition-timing-function: var(--ease);
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
    scroll-behavior: auto !important;
  }
}
```

`1ms` rather than `0s` — the reduced-motion block still satisfies the "never zero-duration" rule while being imperceptible, and keeps `transitionend` listeners firing.

- [ ] **Step 4: Replace `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono, Geist_Pixel } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// Single-weight display face. It has no override metrics, so an explicit
// fallback is supplied here and an explicit line-height in globals.css.
const geistPixel = Geist_Pixel({
  variable: "--font-geist-pixel",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  preload: true,
  fallback: ["ui-monospace", "monospace"],
});

export const metadata: Metadata = {
  title: {
    default: "Cineshek — System design, in depth",
    template: "%s · Cineshek",
  },
  description:
    "A sequenced system design curriculum: 14 modules, 179 topics, from requirements clarification to storage engines.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geist.variable} ${geistMono.variable} ${geistPixel.variable}`}
    >
      <body className="min-h-dvh bg-paper text-ink">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

`suppressHydrationWarning` on `<html>` is required — `next-themes` writes the theme class before React hydrates, and without it every page logs a mismatch. `disableTransitionOnChange` stops all 180ms transitions firing at once when the theme flips.

- [ ] **Step 5: Create `components/layout/ThemeToggle.tsx`**

Client leaf 1 of 6.

First create the shared hook at `lib/hooks/useMounted.ts`. Both this component
and Task 6's `AnnouncementBar` need "has hydration happened yet", and the
`useState` + `useEffect` version of it trips the `react-hooks/set-state-in-effect`
lint rule and causes a cascading render. This is the mechanism the rule's own
message recommends, and the same one Task 10 uses for progress:

```ts
import { useSyncExternalStore } from "react";

// Module-level constants so the store identity never changes between renders.
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * False during server render and the first client render, true afterwards.
 *
 * Use this to gate reads of browser-only state (localStorage, matchMedia) so
 * the server HTML and the first client render agree. No effect is involved, so
 * there is no cascading render and no setState-in-effect lint error.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
```

Then the toggle:

```tsx
"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useMounted } from "@/lib/hooks/useMounted";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  const isDark = mounted && resolvedTheme === "dark";
  const label = mounted
    ? `Switch to ${isDark ? "light" : "dark"} theme`
    : "Switch theme";

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="grid size-11 place-items-center rounded-card border-2 border-structural bg-card transition-brut hover:shadow-hard-sm"
    >
      {/* Both icons render; visibility is CSS-driven so the button never
          changes size between server and client renders. */}
      <Sun aria-hidden className={isDark ? "hidden" : "size-5"} />
      <Moon aria-hidden className={isDark ? "size-5" : "hidden"} />
    </button>
  );
}
```

`size-11` is 44px, meeting the touch-target minimum. There is no `useEffect` here by design — see `useMounted` above.

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run tests/design/css-tokens.test.ts`
Expected: PASS — 6 describe groups, one assertion per token per theme.

- [ ] **Step 7: Verify the build and typecheck**

Run: `npm run typecheck && npm run build`
Expected: both succeed. The build logs `Failed to find font override values for font 'Geist Pixel'` — this warning is expected and already mitigated; do not attempt to silence it.

- [ ] **Step 8: Commit**

```bash
git add app/globals.css app/layout.tsx components/layout/ThemeToggle.tsx tests/design/css-tokens.test.ts
git commit -m "feat: add theme layer with token drift test

CSS custom properties mirror lib/design/tokens.ts, enforced by test.
Geist Pixel has no override metrics, so it gets an explicit fallback and
a fixed line-height to hold CLS at zero."
```

---

## Task 4: Syllabus parser and content generator

The parser algorithm in this task was prototyped against the real `SDsyllabus.md` and returned 14 modules / 179 topics with every declared count matching. **The spec's stated rule of "keep the first occurrence" is wrong** and is corrected here: the file opens with a table-of-contents block that carries module ids, titles, and counts but *no* topics, so keeping the first occurrence wholesale yields 14 modules with zero topics. The correct rule is **accumulate topics across all occurrences, and take the first non-null title, blurb, and declared count.**

**Files:**
- Create: `scripts/lib/parse-syllabus.ts`, `scripts/generate-content.ts`, `tests/content/parse-syllabus.test.ts`
- Test: `tests/content/parse-syllabus.test.ts`

**Interfaces:**
- Consumes: `ColorKey`, `colorKeys` from Task 2.
- Produces:
  - `parseSyllabus(raw: string): ParsedSyllabus`
  - `type ParsedTopic = { number: string; title: string; slug: string }`
  - `type ParsedModule = { id: string; title: string; blurb: string; declared: number; slug: string; topics: ParsedTopic[] }`
  - `type ParsedSyllabus = { modules: ParsedModule[]; totalTopics: number }`
  - `slugify(input: string): string`
  - `MODULE_SLUGS: Record<string, string>` — module id to directory slug
  - `MODULE_COLORS: Record<string, ColorKey>` — module id to colour key
  - Side effect: `content/system-design/modules.ts` and 179 `.mdx` files.

- [ ] **Step 1: Write the failing parser test**

Create `tests/content/parse-syllabus.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseSyllabus, slugify, MODULE_SLUGS, MODULE_COLORS } from "@/scripts/lib/parse-syllabus";
import { colorKeys } from "@/lib/design/modules";

const EXPECTED_COUNTS: Record<string, number> = {
  "01": 13, "02": 13, "03": 13, "04": 14, "05": 7, "06": 13, "07": 20,
  "08": 10, "09": 17, "10": 13, "11": 12, "12": 8, "13": 11, "14": 15,
};

/**
 * The required module order, written out literally.
 *
 * Do NOT derive this from `Object.keys(EXPECTED_COUNTS)`. In JavaScript,
 * "10".."14" are canonical array indices and are enumerated BEFORE the
 * non-canonical string keys "01".."09", so Object.keys returns
 * ["10","11","12","13","14","01",...,"09"]. Asserting against that would
 * demand the curriculum start at module 10.
 */
const EXPECTED_ORDER = [
  "01", "02", "03", "04", "05", "06", "07",
  "08", "09", "10", "11", "12", "13", "14",
];

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Requirements Clarification")).toBe("requirements-clarification");
  });

  it("drops ampersands and commas without leaving double hyphens", () => {
    expect(slugify("NoSQL, Partitioning & IDs")).toBe("nosql-partitioning-ids");
  });

  it("handles hyphens already present", () => {
    expect(slugify("Back-Of-The-Envelope Capacity Planning"))
      .toBe("back-of-the-envelope-capacity-planning");
  });

  it("strips leading and trailing separators", () => {
    expect(slugify("  MVCC  ")).toBe("mvcc");
  });
});

describe("parseSyllabus on the real curriculum", () => {
  const parsed = parseSyllabus(readFileSync("SDsyllabus.md", "utf8"));

  it("finds exactly 14 modules", () => {
    expect(parsed.modules).toHaveLength(14);
  });

  it("finds exactly 179 topics", () => {
    expect(parsed.totalTopics).toBe(179);
  });

  it("returns modules in ascending id order, starting at Foundations", () => {
    expect(parsed.modules.map((m) => m.id)).toEqual(EXPECTED_ORDER);
  });

  it("puts module 01 first and module 14 last", () => {
    // The curriculum's whole value is that it is sequenced, so this is a
    // product requirement, not a tidiness preference.
    expect(parsed.modules[0].id).toBe("01");
    expect(parsed.modules[0].title).toBe("Foundations");
    expect(parsed.modules[13].id).toBe("14");
  });

  it.each(Object.entries(EXPECTED_COUNTS))(
    "module %s has %i topics and matches its declared count",
    (id, count) => {
      const mod = parsed.modules.find((m) => m.id === id);
      expect(mod).toBeDefined();
      expect(mod!.topics).toHaveLength(count);
      expect(mod!.declared).toBe(count);
    },
  );

  it("gives every module a non-empty title and blurb", () => {
    for (const mod of parsed.modules) {
      expect(mod.title.length).toBeGreaterThan(0);
      expect(mod.blurb.length).toBeGreaterThan(0);
    }
  });

  it("gives every topic a number, title, and slug", () => {
    for (const mod of parsed.modules) {
      for (const topic of mod.topics) {
        expect(topic.number).toMatch(/^\d{2}\.\d{2}$/);
        expect(topic.title.length).toBeGreaterThan(0);
        expect(topic.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      }
    }
  });

  it("keeps topic numbers unique across the whole course", () => {
    const numbers = parsed.modules.flatMap((m) => m.topics.map((t) => t.number));
    expect(new Set(numbers).size).toBe(179);
  });

  it("keeps topic slugs unique within each module", () => {
    for (const mod of parsed.modules) {
      const slugs = mod.topics.map((t) => t.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });

  it("orders topics by number inside each module", () => {
    for (const mod of parsed.modules) {
      const numbers = mod.topics.map((t) => t.number);
      expect(numbers).toEqual([...numbers].sort());
    }
  });
});

describe("duplicate-module defect in the source file", () => {
  it("does not emit a module twice when the input repeats it", () => {
    const doubled = `01
Foundations

Some blurb here.

2 TOPICS
01.01
First Topic
01.02
Second Topic

---

01
Foundations

Some blurb here.

2 TOPICS
01.01
First Topic
01.02
Second Topic
`;
    const parsed = parseSyllabus(doubled);
    expect(parsed.modules).toHaveLength(1);
    expect(parsed.modules[0].topics).toHaveLength(2);
    expect(parsed.totalTopics).toBe(2);
  });

  it("survives a table-of-contents block that lists modules without topics", () => {
    // This is the shape that breaks a naive keep-first-occurrence parser:
    // the TOC has the id, title and count but no topics at all.
    const withToc = `01
Foundations
2 TOPICS

---

01
Foundations

Some blurb here.

2 TOPICS
01.01
First Topic
01.02
Second Topic
`;
    const parsed = parseSyllabus(withToc);
    expect(parsed.modules).toHaveLength(1);
    expect(parsed.modules[0].topics).toHaveLength(2);
    expect(parsed.modules[0].blurb).toBe("Some blurb here.");
  });

  it("throws when a declared count disagrees with the topics found", () => {
    const wrong = `01
Foundations

Blurb.

5 TOPICS
01.01
Only Topic
`;
    expect(() => parseSyllabus(wrong)).toThrow(/module 01 declares 5.*found 1/i);
  });
});

describe("module slug and colour maps", () => {
  it("covers all 14 module ids", () => {
    expect(Object.keys(MODULE_SLUGS)).toHaveLength(14);
    expect(Object.keys(MODULE_COLORS)).toHaveLength(14);
  });

  it("assigns each module a distinct colour key from the design system", () => {
    const used = Object.values(MODULE_COLORS);
    expect(new Set(used).size).toBe(14);
    for (const key of used) expect(colorKeys).toContain(key);
  });

  it("uses the slugs named in the spec", () => {
    expect(MODULE_SLUGS["01"]).toBe("foundations");
    expect(MODULE_SLUGS["04"]).toBe("nosql-partitioning-ids");
    expect(MODULE_SLUGS["14"]).toBe("reliability-operations");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/content/parse-syllabus.test.ts`
Expected: FAIL — `Failed to resolve import "@/scripts/lib/parse-syllabus"`.

- [ ] **Step 3: Implement `scripts/lib/parse-syllabus.ts`**

```ts
import type { ColorKey } from "@/lib/design/modules";

const MODULE_ID = /^(\d{2})$/;
const TOPIC_NO = /^(\d{2})\.(\d{2})$/;
const COUNT = /^(\d+)\s+TOPICS$/i;

export type ParsedTopic = { number: string; title: string; slug: string };

export type ParsedModule = {
  id: string;
  title: string;
  blurb: string;
  declared: number;
  slug: string;
  topics: ParsedTopic[];
};

export type ParsedSyllabus = { modules: ParsedModule[]; totalTopics: number };

/** Directory slug per module id. Fixed by the spec; URLs depend on these. */
export const MODULE_SLUGS: Record<string, string> = {
  "01": "foundations",
  "02": "apis-services-protocols",
  "03": "data-modeling-sql",
  "04": "nosql-partitioning-ids",
  "05": "caching-fast-reads",
  "06": "distributed-coordination",
  "07": "storage-engines",
  "08": "async-work-streams",
  "09": "search-retrieval",
  "10": "analytics-sketches",
  "11": "realtime-social-feeds",
  "12": "geo-matching-recs",
  "13": "media-files-cdn",
  "14": "reliability-operations",
};

export const MODULE_COLORS: Record<string, ColorKey> = {
  "01": "cobalt",
  "02": "amber",
  "03": "mint",
  "04": "violet",
  "05": "rose",
  "06": "ink",
  "07": "teal",
  "08": "lime",
  "09": "orange",
  "10": "cyan",
  "11": "fuchsia",
  "12": "sky",
  "13": "cream",
  "14": "lavender",
};

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type Draft = {
  id: string;
  title: string | null;
  blurb: string | null;
  declared: number | null;
  topics: Map<string, ParsedTopic>;
};

function isStructural(line: string | undefined): boolean {
  if (!line) return true;
  return MODULE_ID.test(line) || TOPIC_NO.test(line) || COUNT.test(line);
}

/**
 * Parses SDsyllabus.md into modules and topics.
 *
 * The source file lists every module more than once: an opening
 * table-of-contents pass with ids, titles and counts but no topics, then the
 * real content, then a partial repeat with `---` separators and stray
 * "N TOPICS" fragments. Topics are therefore accumulated across every
 * occurrence and deduped by number, while title, blurb and declared count take
 * the first non-null value seen. Keeping only the first occurrence wholesale
 * would return 14 empty modules.
 */
export function parseSyllabus(raw: string): ParsedSyllabus {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && l !== "---");

  const drafts = new Map<string, Draft>();
  const draft = (id: string): Draft => {
    let d = drafts.get(id);
    if (!d) {
      d = { id, title: null, blurb: null, declared: null, topics: new Map() };
      drafts.set(id, d);
    }
    return d;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const topicMatch = TOPIC_NO.exec(line);
    if (topicMatch) {
      const title = lines[i + 1];
      if (!isStructural(title)) {
        const d = draft(topicMatch[1]);
        if (!d.topics.has(line)) {
          d.topics.set(line, { number: line, title, slug: slugify(title) });
        }
        i++;
      }
      continue;
    }

    const moduleMatch = MODULE_ID.exec(line);
    if (!moduleMatch) continue;

    const title = lines[i + 1];
    if (isStructural(title)) continue;

    const d = draft(moduleMatch[1]);
    d.title ??= title;

    const next = lines[i + 2];
    if (next && !isStructural(next)) {
      d.blurb ??= next;
      const countMatch = COUNT.exec(lines[i + 3] ?? "");
      if (countMatch) d.declared ??= Number(countMatch[1]);
    } else if (next) {
      const countMatch = COUNT.exec(next);
      if (countMatch) d.declared ??= Number(countMatch[1]);
    }
  }

  const modules: ParsedModule[] = [...drafts.values()]
    // Ascending by zero-padded id: "01" ... "14". localeCompare is correct
    // here precisely BECAUSE the ids are zero-padded fixed-width strings.
    // Never sort these by replicating Object.keys enumeration order — that
    // puts "10".."14" first and starts the curriculum at module 10.
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((d) => {
      const topics = [...d.topics.values()].sort((a, b) =>
        a.number.localeCompare(b.number),
      );
      if (!d.title) throw new Error(`module ${d.id} has no title`);
      if (!d.blurb) throw new Error(`module ${d.id} has no blurb`);
      if (d.declared === null) {
        throw new Error(`module ${d.id} has no declared topic count`);
      }
      if (d.declared !== topics.length) {
        throw new Error(
          `module ${d.id} declares ${d.declared} topics but found ${topics.length}`,
        );
      }
      const slug = MODULE_SLUGS[d.id];
      if (!slug) throw new Error(`module ${d.id} has no slug in MODULE_SLUGS`);
      return {
        id: d.id,
        title: d.title,
        blurb: d.blurb,
        declared: d.declared,
        slug,
        topics,
      };
    });

  return {
    modules,
    totalTopics: modules.reduce((sum, m) => sum + m.topics.length, 0),
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/content/parse-syllabus.test.ts`
Expected: PASS — including all 14 per-module count assertions.

- [ ] **Step 5: Commit the parser**

```bash
git add scripts/lib/parse-syllabus.ts tests/content/parse-syllabus.test.ts
git commit -m "feat: add syllabus parser tolerant of duplicated modules

The source file repeats every module and opens with a topic-less table of
contents, so topics accumulate across occurrences while metadata takes the
first non-null value. Declared counts are asserted against topics found."
```

- [ ] **Step 6: Implement `scripts/generate-content.ts`**

Idempotent by design: an existing `.mdx` is never rewritten, so the script can be re-run after the syllabus grows.

```ts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  MODULE_COLORS,
  parseSyllabus,
  type ParsedModule,
  type ParsedTopic,
} from "./lib/parse-syllabus";

const ROOT = process.cwd();
const COURSE_DIR = join(ROOT, "content", "system-design");

function moduleDir(mod: ParsedModule): string {
  return join(COURSE_DIR, `${mod.id}-${mod.slug}`);
}

function stub(mod: ParsedModule, topic: ParsedTopic): string {
  return `---
title: "${topic.title.replace(/"/g, '\\"')}"
number: "${topic.number}"
summary: "${topic.title} — notes in progress."
status: draft
free: true
difficulty: core
estMinutes: 12
---

## The problem

What breaks without this, and the situation that forces the decision.

## How it works

The mechanism, step by step.

## Tradeoffs

<Tradeoff
  forTitle="Reach for it when"
  againstTitle="Avoid it when"
  forItems={["", ""]}
  againstItems={["", ""]}
/>

## In an interview

How to introduce this, and the follow-up questions it invites.

<KeyTakeaways items={["", "", ""]} />
`;
}

function modulesFile(modules: ParsedModule[]): string {
  const records = modules
    .map((mod) => {
      const color = MODULE_COLORS[mod.id];
      return `  {
    id: "${mod.id}",
    slug: "${mod.slug}",
    dir: "${mod.id}-${mod.slug}",
    title: ${JSON.stringify(mod.title)},
    blurb: ${JSON.stringify(mod.blurb)},
    colorKey: "${color}",
    topicCount: ${mod.topics.length},
  },`;
    })
    .join("\n");

  return `// GENERATED by scripts/generate-content.ts — re-run \`npm run content:generate\`.
// Edits to titles and blurbs are safe; the shape is validated by lib/content/schema.ts.
import type { ColorKey } from "@/lib/design/modules";

export type ModuleRecord = {
  id: string;
  slug: string;
  dir: string;
  title: string;
  blurb: string;
  colorKey: ColorKey;
  topicCount: number;
};

export const modules: ModuleRecord[] = [
${records}
];
`;
}

function main(): void {
  const parsed = parseSyllabus(readFileSync(join(ROOT, "SDsyllabus.md"), "utf8"));

  if (parsed.modules.length !== 14 || parsed.totalTopics !== 179) {
    throw new Error(
      `refusing to generate: expected 14 modules and 179 topics, got ${parsed.modules.length} and ${parsed.totalTopics}`,
    );
  }

  mkdirSync(COURSE_DIR, { recursive: true });
  writeFileSync(join(COURSE_DIR, "modules.ts"), modulesFile(parsed.modules), "utf8");

  let created = 0;
  let kept = 0;
  for (const mod of parsed.modules) {
    const dir = moduleDir(mod);
    mkdirSync(dir, { recursive: true });
    for (const topic of mod.topics) {
      const file = join(dir, `${topic.slug}.mdx`);
      if (existsSync(file)) {
        kept++;
        continue;
      }
      writeFileSync(file, stub(mod, topic), "utf8");
      created++;
    }
  }

  console.log(
    `modules.ts written · ${created} stub(s) created · ${kept} existing file(s) untouched · ${parsed.totalTopics} topics total`,
  );
}

main();
```

- [ ] **Step 7: Run the generator**

Run: `npm run content:generate`
Expected: `modules.ts written · 179 stub(s) created · 0 existing file(s) untouched · 179 topics total`

- [ ] **Step 8: Verify idempotency**

Run: `npm run content:generate`
Expected: `179 stub(s)` becomes `0 stub(s) created · 179 existing file(s) untouched`. If it reports creating files again, the `existsSync` guard or the slug derivation is unstable.

- [ ] **Step 9: Verify the file count on disk**

```bash
find content/system-design -name '*.mdx' | wc -l   # expect 179
ls content/system-design | wc -l                   # expect 15 (14 dirs + modules.ts)
```

- [ ] **Step 10: Commit**

```bash
git add scripts/generate-content.ts content/system-design
git commit -m "feat: generate 179 lesson stubs and module registry

Generator is idempotent: existing .mdx files are never overwritten, so it
can be re-run as the syllabus grows."
```

---

## Task 5: Content layer

The only file in the project permitted to touch `fs` is `lib/content/source.ts`. Pages import `lib/content` and nothing else. This is what makes the storage choice reversible, so it is enforced by a test.

**Files:**
- Create: `content/courses.ts`, `lib/content/types.ts`, `lib/content/schema.ts`, `lib/content/source.ts`, `lib/content/index.ts`, `tests/content/content-layer.test.ts`, `tests/content/boundaries.test.ts`
- Test: `tests/content/content-layer.test.ts`, `tests/content/boundaries.test.ts`

**Interfaces:**
- Consumes: `modules` (`ModuleRecord[]`) from `content/system-design/modules.ts`; `parseSyllabus` from Task 4; `ColorKey`, `moduleColors` from Task 2.
- Produces:

```ts
type Difficulty = "intro" | "core" | "deep";
type Status = "published" | "draft";

type LessonMeta = {
  courseSlug: string; moduleId: string; moduleSlug: string; slug: string;
  number: string; title: string; summary: string; status: Status;
  free: boolean; difficulty: Difficulty; estMinutes: number;
  tags: string[]; updated: string | null; url: string;
};
type Lesson = LessonMeta & { body: string };

type Module = {
  id: string; slug: string; title: string; blurb: string;
  colorKey: ColorKey; url: string; lessons: LessonMeta[];
  publishedCount: number; totalCount: number;
};

type Course = {
  slug: string; title: string; eyebrow: string; blurb: string;
  bullets: string[]; status: "live" | "planned"; colorKey: ColorKey;
  moduleCount: number; topicCount: number; url: string;
};

type LessonRef = { title: string; number: string; url: string };
type SearchDoc = { number: string; title: string; summary: string; module: string; url: string };

getCourses(): Course[]
getCourse(courseSlug: string): Course | null
getModules(courseSlug: string): readonly Module[]
getModule(courseSlug: string, moduleSlug: string): Module | null
getLessons(courseSlug: string, moduleSlug: string): readonly LessonMeta[]
getLesson(courseSlug: string, moduleSlug: string, lessonSlug: string): Lesson | null
getLessonNeighbours(courseSlug, moduleSlug, lessonSlug): { prev: LessonRef | null; next: LessonRef | null }
getSearchIndex(courseSlug: string): SearchDoc[]
getAllLessonParams(): { module: string; topic: string }[]
getCourseStats(courseSlug: string): { moduleCount: number; topicCount: number; publishedCount: number }
```

- [ ] **Step 1: Write the failing content-layer test**

Create `tests/content/content-layer.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  getAllLessonParams, getCourse, getCourses, getCourseStats, getLesson,
  getLessonNeighbours, getLessons, getModule, getModules, getSearchIndex,
  type LessonMeta, type Module,
} from "@/lib/content";
import { parseSyllabus } from "@/scripts/lib/parse-syllabus";

const COURSE = "system-design";
const syllabus = parseSyllabus(readFileSync("SDsyllabus.md", "utf8"));

describe("courses", () => {
  it("registers system-design as the only live course", () => {
    const live = getCourses().filter((c) => c.status === "live");
    expect(live).toHaveLength(1);
    expect(live[0].slug).toBe(COURSE);
  });

  it("registers three placeholder planned courses", () => {
    expect(getCourses().filter((c) => c.status === "planned")).toHaveLength(3);
  });

  it("gives every course a distinct colour key", () => {
    const keys = getCourses().map((c) => c.colorKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("returns null for an unknown course", () => {
    expect(getCourse("does-not-exist")).toBeNull();
  });
});

describe("modules", () => {
  const modules = getModules(COURSE);

  it("exposes 14 modules", () => {
    expect(modules).toHaveLength(14);
  });

  it("matches the syllabus module titles and order", () => {
    expect(modules.map((m) => m.id)).toEqual(syllabus.modules.map((m) => m.id));
    expect(modules.map((m) => m.title)).toEqual(syllabus.modules.map((m) => m.title));
  });

  it("counts lessons per module exactly as the syllabus declares", () => {
    for (const expected of syllabus.modules) {
      const mod = modules.find((m) => m.id === expected.id);
      expect(mod, `module ${expected.id} missing`).toBeDefined();
      expect(mod!.totalCount).toBe(expected.topics.length);
      expect(mod!.lessons).toHaveLength(expected.topics.length);
    }
  });

  it("builds urls under the course slug", () => {
    for (const mod of modules) {
      expect(mod.url).toBe(`/${COURSE}/${mod.slug}`);
    }
  });

  it("returns null for an unknown module", () => {
    expect(getModule(COURSE, "nope")).toBeNull();
  });
});

describe("lessons", () => {
  it("resolves every syllabus topic to exactly one lesson", () => {
    for (const mod of syllabus.modules) {
      for (const topic of mod.topics) {
        const lesson = getLesson(COURSE, mod.slug, topic.slug);
        expect(lesson, `${topic.number} ${topic.title} did not resolve`).not.toBeNull();
        expect(lesson!.number).toBe(topic.number);
        expect(lesson!.title).toBe(topic.title);
      }
    }
  });

  it("totals 179 lessons", () => {
    expect(getCourseStats(COURSE).topicCount).toBe(179);
  });

  it("keeps lesson numbers unique across the course", () => {
    const numbers = getModules(COURSE).flatMap((m) => m.lessons.map((l) => l.number));
    expect(new Set(numbers).size).toBe(179);
  });

  it("keeps lesson slugs unique within a module", () => {
    for (const mod of getModules(COURSE)) {
      const slugs = mod.lessons.map((l) => l.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });

  it("orders lessons by number within a module", () => {
    for (const mod of getModules(COURSE)) {
      const numbers = mod.lessons.map((l) => l.number);
      expect(numbers).toEqual([...numbers].sort());
    }
  });

  it("returns a body only from getLesson, never from listings", () => {
    const first = getModules(COURSE)[0];
    expect(first.lessons[0]).not.toHaveProperty("body");
    const full = getLesson(COURSE, first.slug, first.lessons[0].slug);
    expect(typeof full!.body).toBe("string");
  });

  it("returns null for an unknown lesson", () => {
    expect(getLesson(COURSE, "foundations", "nope")).toBeNull();
  });

  it("getLessons returns exactly the module's lesson list", () => {
    expect(getLessons(COURSE, "foundations")).toEqual(
      getModule(COURSE, "foundations")!.lessons,
    );
    expect(getLessons(COURSE, "nope")).toEqual([]);
  });

  it("validates frontmatter on every one of the 179 files", () => {
    // getLesson throws on a schema violation, so touching all of them is the assertion.
    for (const mod of getModules(COURSE)) {
      for (const meta of mod.lessons) {
        expect(() => getLesson(COURSE, mod.slug, meta.slug)).not.toThrow();
      }
    }
  });
});

describe("getAllLessonParams", () => {
  const params = getAllLessonParams();

  it("returns one entry per lesson", () => {
    expect(params).toHaveLength(179);
  });

  it("returns unique module/topic pairs", () => {
    const keys = params.map((p) => `${p.module}/${p.topic}`);
    expect(new Set(keys).size).toBe(179);
  });

  it("returns params that all resolve", () => {
    for (const p of params) {
      expect(getLesson(COURSE, p.module, p.topic)).not.toBeNull();
    }
  });
});

describe("getLessonNeighbours forms one unbroken chain", () => {
  const published = getModules(COURSE)
    .flatMap((m) => m.lessons.map((l) => ({ mod: m.slug, lesson: l })))
    .filter((x) => x.lesson.status === "published");

  it("gives the first published lesson no previous", () => {
    if (published.length === 0) return;
    const first = published[0];
    expect(getLessonNeighbours(COURSE, first.mod, first.lesson.slug).prev).toBeNull();
  });

  it("gives the last published lesson no next", () => {
    if (published.length === 0) return;
    const last = published[published.length - 1];
    expect(getLessonNeighbours(COURSE, last.mod, last.lesson.slug).next).toBeNull();
  });

  it("links next and prev symmetrically", () => {
    for (let i = 0; i < published.length - 1; i++) {
      const here = published[i];
      const there = published[i + 1];
      const next = getLessonNeighbours(COURSE, here.mod, here.lesson.slug).next;
      expect(next?.number).toBe(there.lesson.number);
      const back = getLessonNeighbours(COURSE, there.mod, there.lesson.slug).prev;
      expect(back?.number).toBe(here.lesson.number);
    }
  });

  it("never points a lesson at itself", () => {
    for (const { mod, lesson } of published) {
      const { prev, next } = getLessonNeighbours(COURSE, mod, lesson.slug);
      expect(prev?.number).not.toBe(lesson.number);
      expect(next?.number).not.toBe(lesson.number);
    }
  });

  it("excludes drafts from the chain", () => {
    const draftNumbers = new Set(
      getModules(COURSE)
        .flatMap((m) => m.lessons)
        .filter((l) => l.status === "draft")
        .map((l) => l.number),
    );
    for (const { mod, lesson } of published) {
      const { prev, next } = getLessonNeighbours(COURSE, mod, lesson.slug);
      if (prev) expect(draftNumbers.has(prev.number)).toBe(false);
      if (next) expect(draftNumbers.has(next.number)).toBe(false);
    }
  });
});

describe("the cached module tree is immutable", () => {
  // The cache is a process-wide singleton reused across static generation, so
  // an in-place mutation by any caller would corrupt every later page. These
  // assert the freeze holds at every level — a shallow freeze leaves the
  // nested lessons arrays mutable, which would be the easy mistake.
  it("rejects mutation of the modules array", () => {
    const mods = getModules(COURSE);
    expect(() => (mods as Module[]).push(mods[0])).toThrow(TypeError);
    expect(() => (mods as Module[]).sort()).toThrow(TypeError);
  });

  it("rejects mutation of a module object", () => {
    const mod = getModules(COURSE)[0];
    expect(() => {
      (mod as { title: string }).title = "hacked";
    }).toThrow(TypeError);
  });

  it("rejects mutation of a module's lessons array", () => {
    const lessons = getModules(COURSE)[0].lessons;
    expect(() => (lessons as LessonMeta[]).push(lessons[0])).toThrow(TypeError);
    expect(() => (lessons as LessonMeta[]).reverse()).toThrow(TypeError);
  });

  it("rejects mutation of a lesson object", () => {
    const lesson = getModules(COURSE)[0].lessons[0];
    expect(() => {
      (lesson as { title: string }).title = "hacked";
    }).toThrow(TypeError);
  });

  it("still returns the same cached reference on repeated calls", () => {
    expect(getModules(COURSE)).toBe(getModules(COURSE));
  });
});

describe("search index", () => {
  it("contains only published lessons", () => {
    const index = getSearchIndex(COURSE);
    const publishedCount = getCourseStats(COURSE).publishedCount;
    expect(index).toHaveLength(publishedCount);
  });

  it("carries no lesson body", () => {
    for (const doc of getSearchIndex(COURSE)) {
      expect(doc).not.toHaveProperty("body");
      expect(Object.keys(doc).sort()).toEqual(
        ["module", "number", "summary", "title", "url"],
      );
    }
  });
});
```

Draft-sensitive tests are written to pass whether or not any lesson is published yet, so this suite stays green through Task 16 when the three samples flip to `published`.

- [ ] **Step 2: Write the failing boundary test**

Create `tests/content/boundaries.test.ts`. The adapter's whole value is that it is the only filesystem consumer — an architectural rule is worth nothing unenforced.

```ts
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

describe("client components are limited to the six named leaves", () => {
  const ALLOWED_CLIENT = new Set([
    "ThemeToggle", "AnnouncementBar", "SidebarTree",
    "TableOfContents", "ProgressTracker", "SearchPalette",
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
```

`lib/progress/useProgress.ts` is a hook consumed by `ProgressTracker`, not a component, and carries no `'use client'` of its own — the directive lives in the component that uses it. The test above is written to that rule.

- [ ] **Step 3: Run both tests to verify they fail**

Run: `npx vitest run tests/content/`
Expected: FAIL — `Failed to resolve import "@/lib/content"`.

- [ ] **Step 4: Create `content/courses.ts`**

The three planned courses are placeholders for the owner to rename or delete, per spec §6.2.

```ts
import type { ColorKey } from "@/lib/design/modules";

export type CourseRecord = {
  slug: string;
  title: string;
  eyebrow: string;
  blurb: string;
  bullets: string[];
  status: "live" | "planned";
  colorKey: ColorKey;
};

/**
 * PLACEHOLDERS: every entry with status "planned" is a stand-in so the
 * "Choose where to start" section has visual weight. Rename or delete them
 * freely — this file is the only place the roadmap is expressed.
 */
export const courses: CourseRecord[] = [
  {
    slug: "system-design",
    title: "System design in depth",
    eyebrow: "Engineering path",
    blurb: "Requirements to storage engines, sequenced so each idea rests on the last.",
    bullets: ["Notes and case studies", "Tradeoffs made explicit", "Built for senior interviews"],
    status: "live",
    colorKey: "mint",
  },
  {
    slug: "ai-research",
    title: "AI research",
    eyebrow: "Research path",
    blurb: "Maths foundations through to landmark papers, read in order.",
    bullets: ["Maths foundations to LLMs", "Landmark papers, sequenced", "GPU and tooling practice"],
    status: "planned",
    colorKey: "cobalt",
  },
  {
    slug: "ml-maths",
    title: "Advanced ML maths",
    eyebrow: "Foundations path",
    blurb: "The linear algebra, probability and optimisation the papers assume you know.",
    bullets: ["Sets and logic to inference", "Linear algebra and calculus", "Worked derivations"],
    status: "planned",
    colorKey: "cream",
  },
  {
    slug: "inference-engineering",
    title: "Inference engineering",
    eyebrow: "Production path",
    blurb: "Serving models under latency and cost budgets that actually bind.",
    bullets: ["Latency and cost budgets", "KV cache and batching maths", "Quantisation tradeoffs"],
    status: "planned",
    colorKey: "ink",
  },
];
```

- [ ] **Step 5: Create `lib/content/types.ts`**

```ts
import type { ColorKey } from "@/lib/design/modules";

export type Difficulty = "intro" | "core" | "deep";
export type Status = "published" | "draft";

/** Lesson metadata without the MDX body. Used by every listing. */
export type LessonMeta = {
  courseSlug: string;
  moduleId: string;
  moduleSlug: string;
  slug: string;
  number: string;
  title: string;
  summary: string;
  status: Status;
  free: boolean;
  difficulty: Difficulty;
  estMinutes: number;
  tags: string[];
  updated: string | null;
  url: string;
};

/** A lesson with its raw MDX body. Only getLesson returns this. */
export type Lesson = LessonMeta & { body: string };

export type Module = {
  id: string;
  slug: string;
  title: string;
  blurb: string;
  colorKey: ColorKey;
  url: string;
  lessons: LessonMeta[];
  publishedCount: number;
  totalCount: number;
};

export type Course = {
  slug: string;
  title: string;
  eyebrow: string;
  blurb: string;
  bullets: string[];
  status: "live" | "planned";
  colorKey: ColorKey;
  moduleCount: number;
  topicCount: number;
  url: string;
};

export type LessonRef = { title: string; number: string; url: string };

export type SearchDoc = {
  number: string;
  title: string;
  summary: string;
  module: string;
  url: string;
};

export type CourseStats = {
  moduleCount: number;
  topicCount: number;
  publishedCount: number;
};
```

- [ ] **Step 6: Create `lib/content/schema.ts`**

```ts
import { z } from "zod";
import { colorKeys } from "@/lib/design/modules";

export const frontmatterSchema = z.object({
  title: z.string().min(1),
  number: z.string().regex(/^\d{2}\.\d{2}$/, "number must look like 04.13"),
  summary: z.string().min(1).max(200),
  status: z.enum(["published", "draft"]).default("draft"),
  free: z.boolean().default(true),
  difficulty: z.enum(["intro", "core", "deep"]),
  estMinutes: z.number().int().positive(),
  tags: z.array(z.string()).default([]),
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
});

export type Frontmatter = z.infer<typeof frontmatterSchema>;

export const moduleRecordSchema = z.object({
  id: z.string().regex(/^\d{2}$/),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  dir: z.string().min(1),
  title: z.string().min(1),
  blurb: z.string().min(1),
  // No cast: z.enum accepts ColorKey[] directly and narrows colorKey to
  // ColorKey. Casting to [string, ...string[]] would widen it to string and
  // force a second cast where the Module is built.
  colorKey: z.enum(colorKeys),
  topicCount: z.number().int().positive(),
});
```

- [ ] **Step 7: Create `lib/content/source.ts`**

The only `fs` consumer. Reads are memoised — 179 pages each asking for the module tree would otherwise re-read the directory 179 times.

```ts
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { modules as moduleRecords } from "@/content/system-design/modules";
import { frontmatterSchema, moduleRecordSchema } from "./schema";
import type { Lesson, LessonMeta, Module } from "./types";

const COURSE_SLUG = "system-design";
const CONTENT_ROOT = join(process.cwd(), "content", COURSE_SLUG);

function lessonUrl(moduleSlug: string, slug: string): string {
  return `/${COURSE_SLUG}/${moduleSlug}/${slug}`;
}

function readLessonFile(dir: string, file: string) {
  const raw = readFileSync(join(CONTENT_ROOT, dir, file), "utf8");
  const parsed = matter(raw);
  const result = frontmatterSchema.safeParse(parsed.data);
  if (!result.success) {
    throw new Error(
      `invalid frontmatter in content/${COURSE_SLUG}/${dir}/${file}:\n${result.error.issues
        .map((i) => `  ${i.path.join(".") || "(root)"}: ${i.message}`)
        .join("\n")}`,
    );
  }
  return { frontmatter: result.data, body: parsed.content };
}

let cache: readonly Module[] | null = null;

/**
 * Recursively freezes the module tree.
 *
 * The cache is a process-wide singleton and Next reuses one process across many
 * static-generation calls, so handing it out by reference would let any caller
 * corrupt it for every later page with one in-place `.sort()`. Freezing costs
 * nothing per call (unlike copying on every read) and turns that silent
 * corruption into an immediate TypeError at the offending call site.
 *
 * A shallow freeze is NOT enough — the nested `lessons` arrays and the lesson
 * objects inside them stay mutable unless frozen individually.
 */
function freezeModules(modules: Module[]): readonly Module[] {
  for (const mod of modules) {
    for (const lesson of mod.lessons) Object.freeze(lesson);
    Object.freeze(mod.lessons);
    Object.freeze(mod);
  }
  return Object.freeze(modules);
}

/** Builds the full module tree once per process. Metadata only — no bodies. */
export function loadModules(): readonly Module[] {
  if (cache) return cache;

  const built: Module[] = moduleRecords.map((record) => {
    const validated = moduleRecordSchema.parse(record);

    const files = readdirSync(join(CONTENT_ROOT, validated.dir))
      .filter((f) => f.endsWith(".mdx"))
      .sort();

    const lessons: LessonMeta[] = files
      .map((file) => {
        const { frontmatter } = readLessonFile(validated.dir, file);
        const slug = file.replace(/\.mdx$/, "");
        return {
          courseSlug: COURSE_SLUG,
          moduleId: validated.id,
          moduleSlug: validated.slug,
          slug,
          url: lessonUrl(validated.slug, slug),
          ...frontmatter,
        } satisfies LessonMeta;
      })
      .sort((a, b) => a.number.localeCompare(b.number));

    if (lessons.length !== validated.topicCount) {
      throw new Error(
        `module ${validated.id} declares ${validated.topicCount} topics but ${lessons.length} .mdx files were found in ${validated.dir}`,
      );
    }

    return {
      id: validated.id,
      slug: validated.slug,
      title: validated.title,
      blurb: validated.blurb,
      colorKey: validated.colorKey,
      url: `/${COURSE_SLUG}/${validated.slug}`,
      lessons,
      publishedCount: lessons.filter((l) => l.status === "published").length,
      totalCount: lessons.length,
    };
  });

  cache = freezeModules(built);
  return cache;
}

/** Reads one lesson including its MDX body. */
export function loadLesson(moduleSlug: string, lessonSlug: string): Lesson | null {
  const mod = loadModules().find((m) => m.slug === moduleSlug);
  if (!mod) return null;
  const meta = mod.lessons.find((l) => l.slug === lessonSlug);
  if (!meta) return null;

  const record = moduleRecords.find((r) => r.slug === moduleSlug);
  if (!record) return null;

  const { body } = readLessonFile(record.dir, `${lessonSlug}.mdx`);
  return { ...meta, body };
}

export const courseSlug = COURSE_SLUG;
```

- [ ] **Step 8: Create `lib/content/index.ts`**

```ts
import { courses as courseRecords } from "@/content/courses";
import { courseSlug, loadLesson, loadModules } from "./source";
import type {
  Course, CourseStats, Lesson, LessonMeta, LessonRef, Module, SearchDoc,
} from "./types";

export type {
  Course, CourseStats, Difficulty, Lesson, LessonMeta, LessonRef, Module,
  SearchDoc, Status,
} from "./types";

function isLive(slug: string): boolean {
  return slug === courseSlug;
}

export function getCourses(): Course[] {
  return courseRecords.map((record) => {
    const live = record.status === "live" && isLive(record.slug);
    const mods = live ? loadModules() : [];
    return {
      ...record,
      moduleCount: mods.length,
      topicCount: mods.reduce((sum, m) => sum + m.totalCount, 0),
      url: live ? `/${record.slug}` : "",
    };
  });
}

export function getCourse(slug: string): Course | null {
  return getCourses().find((c) => c.slug === slug) ?? null;
}

// Returns readonly views: the underlying tree is a frozen process-wide cache,
// so the types tell callers to copy before sorting rather than discovering it
// as a TypeError at runtime.
export function getModules(course: string): readonly Module[] {
  return isLive(course) ? loadModules() : [];
}

export function getModule(course: string, moduleSlug: string): Module | null {
  return getModules(course).find((m) => m.slug === moduleSlug) ?? null;
}

export function getLessons(course: string, moduleSlug: string): readonly LessonMeta[] {
  return getModule(course, moduleSlug)?.lessons ?? [];
}

export function getLesson(
  course: string,
  moduleSlug: string,
  lessonSlug: string,
): Lesson | null {
  return isLive(course) ? loadLesson(moduleSlug, lessonSlug) : null;
}

/** Published lessons in course order — the spine for prev/next. */
function publishedChain(course: string): LessonMeta[] {
  return getModules(course)
    .flatMap((m) => m.lessons)
    .filter((l) => l.status === "published")
    .sort((a, b) => a.number.localeCompare(b.number));
}

function toRef(lesson: LessonMeta): LessonRef {
  return { title: lesson.title, number: lesson.number, url: lesson.url };
}

export function getLessonNeighbours(
  course: string,
  moduleSlug: string,
  lessonSlug: string,
): { prev: LessonRef | null; next: LessonRef | null } {
  const chain = publishedChain(course);
  const i = chain.findIndex(
    (l) => l.moduleSlug === moduleSlug && l.slug === lessonSlug,
  );
  if (i === -1) return { prev: null, next: null };
  return {
    prev: i > 0 ? toRef(chain[i - 1]) : null,
    next: i < chain.length - 1 ? toRef(chain[i + 1]) : null,
  };
}

export function getSearchIndex(course: string): SearchDoc[] {
  return getModules(course)
    .flatMap((m) =>
      m.lessons
        .filter((l) => l.status === "published")
        .map((l) => ({
          number: l.number,
          title: l.title,
          summary: l.summary,
          module: m.title,
          url: l.url,
        })),
    )
    .sort((a, b) => a.number.localeCompare(b.number));
}

export function getAllLessonParams(): { module: string; topic: string }[] {
  return getModules(courseSlug).flatMap((m) =>
    m.lessons.map((l) => ({ module: m.slug, topic: l.slug })),
  );
}

export function getCourseStats(course: string): CourseStats {
  const mods = getModules(course);
  return {
    moduleCount: mods.length,
    topicCount: mods.reduce((sum, m) => sum + m.totalCount, 0),
    publishedCount: mods.reduce((sum, m) => sum + m.publishedCount, 0),
  };
}

export { courseSlug };
```

- [ ] **Step 9: Run the tests to verify they pass**

Run: `npx vitest run tests/content/`
Expected: PASS. The "resolves every syllabus topic" test walks all 179 topics; a failure there names the exact topic whose slug does not match its filename.

- [ ] **Step 10: Verify typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 11: Commit**

```bash
git add content/courses.ts lib/content tests/content/content-layer.test.ts tests/content/boundaries.test.ts
git commit -m "feat: add content layer behind a swappable adapter

Pages import lib/content only. A boundary test asserts that node:fs
appears nowhere outside lib/content/source.ts and that 'use client'
appears only in the six named leaf components."
```

---

## Task 6: UI primitives and layout chrome

**Files:**
- Create: `components/ui/Button.tsx`, `components/ui/Card.tsx`, `components/ui/Pill.tsx`, `components/ui/Badge.tsx`, `components/layout/Header.tsx`, `components/layout/Footer.tsx`, `components/layout/AnnouncementBar.tsx`, `components/search/SearchPalette.tsx` (placeholder), `tests/components/ui.test.tsx`
- Already exists from Task 1: `lib/cn.ts` — verify, do not recreate
- Test: `tests/components/ui.test.tsx`

**Interfaces:**
- Consumes: `ThemeToggle` and `useMounted` (`lib/hooks/useMounted.ts`) from Task 3; `getCourseStats`, `Status` from Task 5; `cn` from `lib/cn.ts`, which **Task 1 already created** while proving the path alias.
- Produces: `cn(...)`; `<Button variant href? size?>`, `<Card as? colorKey? interactive?>`, `<Pill tone?>`, `<Badge status>`, `<Header />`, `<Footer />`, `<AnnouncementBar id message href? cta? />`.

- [ ] **Step 1: Write the failing test**

Create `tests/components/ui.test.tsx`. It renders components, so it must open with a `// @vitest-environment jsdom` docblock:

```tsx
// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

describe("cn", () => {
  it("joins truthy classes and drops falsy ones", () => {
    expect(cn("a", false && "b", undefined, "c")).toBe("a c");
  });
});

describe("Button", () => {
  it("renders a button element by default", () => {
    render(<Button>Start learning</Button>);
    expect(screen.getByRole("button", { name: "Start learning" })).toBeInTheDocument();
  });

  it("renders an anchor when href is given", () => {
    render(<Button href="/system-design">Open course</Button>);
    const link = screen.getByRole("link", { name: "Open course" });
    expect(link).toHaveAttribute("href", "/system-design");
  });

  it("never emits a zero-duration transition class", () => {
    const { container } = render(<Button>Go</Button>);
    expect(container.innerHTML).not.toMatch(/duration-0\b/);
  });

  it("meets the 44px touch target at default size", () => {
    const { container } = render(<Button>Go</Button>);
    expect(container.firstElementChild?.className).toMatch(/min-h-11/);
  });
});

describe("Card", () => {
  it("applies module colours as inline custom properties", () => {
    const { container } = render(<Card colorKey="cobalt">body</Card>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.getPropertyValue("--surface")).toBe("#1D4ED8");
    expect(el.style.getPropertyValue("--on-surface")).toBe("#FFFFFF");
  });

  it("sets no colour properties when colorKey is omitted", () => {
    const { container } = render(<Card>body</Card>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.getPropertyValue("--surface")).toBe("");
  });
});

describe("Badge", () => {
  it("labels a draft lesson in text, not colour alone", () => {
    render(<Badge status="draft" />);
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });

  it("renders nothing for a published lesson", () => {
    const { container } = render(<Badge status="published" />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

The Badge tests encode the "never rely on colour alone" rule: a draft is identified by the word *Draft*, and a published lesson needs no badge at all.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/components/ui.test.tsx`
Expected: FAIL — unresolved imports.

- [ ] **Step 3: Verify `lib/cn.ts` already exists**

Task 1 created this file to prove the `@/*` alias resolves in Vitest. Do not recreate it — confirm it reads exactly:

```ts
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
```

If it differs, reconcile to the above, since the `cn` test in Step 1 asserts this behaviour.

- [ ] **Step 4: Create `components/ui/Button.tsx`**

```tsx
import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-ink text-paper border-structural hover:shadow-hard",
  secondary: "bg-card text-ink border-structural hover:shadow-hard",
  ghost: "bg-transparent text-ink border-transparent hover:border-structural",
};

const SIZES: Record<Size, string> = {
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-13 px-6 text-base",
};

type Props = {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  href?: string;
  className?: string;
  type?: "button" | "submit";
  "aria-label"?: string;
};

export function Button({
  children, variant = "primary", size = "md", href, className, type = "button", ...rest
}: Props) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-card border-2 font-medium transition-brut",
    VARIANTS[variant],
    SIZES[size],
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
}
```

`min-h-11` is 44px and `min-h-13` is 52px, both meeting the touch minimum.

- [ ] **Step 5: Create `components/ui/Card.tsx`**

Module colours are per-record data, so they are passed as inline custom properties rather than generated class names — Tailwind cannot safely produce 14 dynamic colour classes from runtime data.

```tsx
import { cn } from "@/lib/cn";
import { moduleColors, type ColorKey } from "@/lib/design/modules";

type Props = {
  children: React.ReactNode;
  colorKey?: ColorKey;
  interactive?: boolean;
  className?: string;
  as?: "div" | "article" | "li" | "section";
};

export function Card({
  children, colorKey, interactive = false, className, as: Tag = "div",
}: Props) {
  const pair = colorKey ? moduleColors[colorKey] : null;

  return (
    <Tag
      style={
        pair
          ? ({
              "--surface": pair.surface,
              "--on-surface": pair.ink,
            } as React.CSSProperties)
          : undefined
      }
      className={cn(
        "rounded-card border-2 border-structural",
        pair ? "bg-[var(--surface)] text-[var(--on-surface)]" : "bg-card text-ink",
        interactive && "transition-brut hover:-translate-y-0.5 hover:shadow-hard",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
```

`hover:-translate-y-0.5` uses a transform, never `width`/`height`.

- [ ] **Step 6: Create `components/ui/Pill.tsx`**

```tsx
import { cn } from "@/lib/cn";

type Props = {
  children: React.ReactNode;
  tone?: "default" | "inverse";
  className?: string;
};

export function Pill({ children, tone = "default", className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border-2 px-3 py-1 font-mono text-xs uppercase tracking-wider",
        tone === "inverse"
          ? "border-paper bg-paper text-ink"
          : "border-structural bg-card text-ink",
        className,
      )}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 7: Create `components/ui/Badge.tsx`**

```tsx
import type { Status } from "@/lib/content";
import { Pill } from "./Pill";

/** Renders only for drafts — a published lesson needs no marker. */
export function Badge({ status }: { status: Status }) {
  if (status === "published") return null;
  return <Pill>Draft</Pill>;
}
```

- [ ] **Step 8: Create `components/layout/AnnouncementBar.tsx`**

Client leaf 2 of 6.

```tsx
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
```

`hidden` sits on the outer element, and the bar renders **visible** on the
server. Two consequences, both deliberate:

- The bar is in the server HTML, so it works with JavaScript disabled, and the
  common case — a visitor who has not dismissed it — sees no shift at all.
- A returning visitor who previously dismissed it sees the bar collapse once
  after hydration. That is the minority case, and it is the better trade: the
  alternative (hidden until mount) makes the bar appear for *everyone*, which is
  a shift for the majority rather than the minority.

Dismissal itself is user-initiated, and layout shifts within 500ms of user input
are excluded from CLS by definition, so clicking the close button costs nothing.

- [ ] **Step 9: Create `components/layout/Header.tsx`**

```tsx
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { SearchPalette } from "@/components/search/SearchPalette";

const NAV = [
  { href: "/system-design", label: "Course" },
  { href: "/syllabus", label: "Syllabus" },
  { href: "/courses", label: "Paths" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-structural bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1200px] items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-pixel text-lg">cineshek</span>
          <span className="rounded-card border-2 border-structural px-1.5 font-mono text-[10px] uppercase">
            beta
          </span>
        </Link>

        <nav aria-label="Main" className="ml-4 hidden gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex min-h-11 items-center rounded-card px-3 text-sm transition-brut hover:bg-card"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <SearchPalette />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
```

`SearchPalette` is built in Task 14. Until then this file will not compile — Task 14 is therefore a prerequisite for the first successful `npm run build` that includes the header. To keep each task independently verifiable, **create a placeholder now** at `components/search/SearchPalette.tsx`:

```tsx
"use client";

/** Placeholder — replaced with the real ⌘K palette in Task 14. */
export function SearchPalette() {
  return null;
}
```

- [ ] **Step 10: Create `components/layout/Footer.tsx`**

```tsx
import Link from "next/link";
import { getCourseStats } from "@/lib/content";

export function Footer() {
  const stats = getCourseStats("system-design");

  return (
    <footer className="mt-24 border-t-2 border-structural">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center">
        <div>
          <p className="font-pixel text-base">cineshek</p>
          <p className="mt-1 font-mono text-xs text-ink-muted">
            {stats.moduleCount} modules · {stats.topicCount} topics
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-4 sm:ml-auto">
          <Link href="/system-design" className="text-sm text-link underline">Course</Link>
          <Link href="/syllabus" className="text-sm text-link underline">Syllabus</Link>
          <Link href="/courses" className="text-sm text-link underline">Paths</Link>
        </nav>
      </div>
    </footer>
  );
}
```

Counts come from the content layer, so they cannot drift from reality.

- [ ] **Step 11: Run the test to verify it passes**

Run: `npx vitest run tests/components/ui.test.tsx`
Expected: PASS.

- [ ] **Step 12: Verify the boundary test still passes**

Run: `npx vitest run tests/content/boundaries.test.ts`
Expected: PASS — `AnnouncementBar` and `SearchPalette` are both on the allowed client list.

- [ ] **Step 13: Commit**

```bash
git add lib/cn.ts components/ui components/layout components/search tests/components/ui.test.tsx
git commit -m "feat: add UI primitives and layout chrome

Module colours pass through inline custom properties because Tailwind
cannot generate class names from runtime data. Announcement bar toggles
with [hidden] so its layout slot stays stable."
```

---

## Task 7: MDX component library

**Files:**
- Create: `components/mdx/Callout.tsx`, `components/mdx/Tradeoff.tsx`, `components/mdx/KeyTakeaways.tsx`, `components/mdx/Figure.tsx`, `components/mdx/Steps.tsx`, `components/mdx/Formula.tsx`, `components/mdx/CodeBlock.tsx`, `components/mdx/index.tsx`, `tests/components/mdx.test.tsx`
- Test: `tests/components/mdx.test.tsx`

**Interfaces:**
- Consumes: `cn` from Task 6.
- Produces: `mdxComponents` — the component map handed to the compiled MDX component at render time (Task 8); each component individually exported.

- [ ] **Step 1: Write the failing test**

Create `tests/components/mdx.test.tsx`. It renders components, so it must open with a `// @vitest-environment jsdom` docblock:

```tsx
// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Callout } from "@/components/mdx/Callout";
import { Figure } from "@/components/mdx/Figure";
import { KeyTakeaways } from "@/components/mdx/KeyTakeaways";
import { Tradeoff } from "@/components/mdx/Tradeoff";
import { InlineCode } from "@/components/mdx/CodeBlock";
import { mdxComponents } from "@/components/mdx";

describe("Callout", () => {
  it("names its type in text, not colour alone", () => {
    render(<Callout type="gotcha">Watch the clock skew.</Callout>);
    expect(screen.getByText("Gotcha")).toBeInTheDocument();
    expect(screen.getByText("Watch the clock skew.")).toBeInTheDocument();
  });

  it("uses a semantic aside with an accessible name", () => {
    render(<Callout type="warn">Careful.</Callout>);
    expect(screen.getByRole("note", { name: /warning/i })).toBeInTheDocument();
  });
});

describe("Tradeoff", () => {
  it("renders both columns with their headings and items", () => {
    render(
      <Tradeoff
        forTitle="Reach for it when"
        againstTitle="Avoid it when"
        forItems={["Reads dominate", "Staleness is tolerable"]}
        againstItems={["Writes dominate"]}
      />,
    );
    expect(screen.getByRole("heading", { name: "Reach for it when" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Avoid it when" })).toBeInTheDocument();
    expect(screen.getByText("Reads dominate")).toBeInTheDocument();
    expect(screen.getByText("Writes dominate")).toBeInTheDocument();
  });

  it("drops empty items so stub placeholders render nothing", () => {
    render(
      <Tradeoff forTitle="For" againstTitle="Against" forItems={["", ""]} againstItems={[""]} />,
    );
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });
});

describe("KeyTakeaways", () => {
  it("renders a titled list", () => {
    render(<KeyTakeaways items={["One", "Two"]} />);
    expect(screen.getByRole("heading", { name: /key takeaways/i })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("renders nothing when every item is blank", () => {
    const { container } = render(<KeyTakeaways items={["", "", ""]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("Figure", () => {
  it("requires alt text", () => {
    // @ts-expect-error alt is intentionally omitted to prove the guard fires
    expect(() => render(<Figure src="/d.svg" caption="A diagram" />)).toThrow(/alt/i);
  });

  it("throws on empty alt text", () => {
    expect(() => render(<Figure src="/d.svg" alt="   " caption="A diagram" />)).toThrow(/alt/i);
  });

  it("renders a figure with caption and alt", () => {
    render(<Figure src="/d.svg" alt="LSM write path" caption="Writes land in the memtable" width={640} height={360} />);
    expect(screen.getByRole("img", { name: "LSM write path" })).toBeInTheDocument();
    expect(screen.getByText("Writes land in the memtable")).toBeInTheDocument();
  });
});

describe("InlineCode vs block code", () => {
  it("styles inline code as a pill", () => {
    const { container } = render(<InlineCode>npm test</InlineCode>);
    expect(container.querySelector("code")?.className).toMatch(/border-hairline/);
  });

  it("leaves block code untouched so the pill does not wrap a whole block", () => {
    // rehype-pretty-code sets data-language on the <code> inside <pre>;
    // MDX routes that element through this same component.
    const { container } = render(
      <InlineCode data-language="ts">{"const x = 1;"}</InlineCode>,
    );
    const code = container.querySelector("code")!;
    expect(code.className).toBe("");
    expect(code).toHaveAttribute("data-language", "ts");
  });
});

describe("mdxComponents map", () => {
  it("exposes every custom component the stub template uses", () => {
    for (const name of ["Callout", "Tradeoff", "KeyTakeaways", "Figure", "Steps", "Formula"]) {
      expect(mdxComponents).toHaveProperty(name);
    }
  });

  it("overrides table and pre so wide content scrolls inside itself", () => {
    expect(mdxComponents).toHaveProperty("table");
    expect(mdxComponents).toHaveProperty("pre");
  });
});
```

The `Figure` guard is the interesting one: a missing `alt` must fail loudly at render time, because 179 lessons of diagrams is exactly where alt text quietly goes missing.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/components/mdx.test.tsx`
Expected: FAIL — unresolved imports.

- [ ] **Step 3: Create `components/mdx/Callout.tsx`**

```tsx
import { AlertTriangle, Info, Lightbulb, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";

type CalloutType = "note" | "warn" | "tip" | "gotcha";

const META: Record<CalloutType, { label: string; a11y: string; icon: typeof Info; tint: string }> = {
  note:   { label: "Note",    a11y: "Note",    icon: Info,          tint: "bg-card" },
  warn:   { label: "Warning", a11y: "Warning", icon: TriangleAlert, tint: "bg-card" },
  tip:    { label: "Tip",     a11y: "Tip",     icon: Lightbulb,     tint: "bg-card" },
  gotcha: { label: "Gotcha",  a11y: "Gotcha",  icon: AlertTriangle, tint: "bg-card" },
};

export function Callout({
  type = "note", children,
}: { type?: CalloutType; children: React.ReactNode }) {
  const meta = META[type];
  const Icon = meta.icon;

  return (
    <aside
      role="note"
      aria-label={meta.a11y}
      className={cn("my-6 rounded-card border-2 border-structural p-4", meta.tint)}
    >
      <p className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-wider">
        <Icon aria-hidden className="size-4" />
        {meta.label}
      </p>
      <div className="[&>*:last-child]:mb-0">{children}</div>
    </aside>
  );
}
```

- [ ] **Step 4: Create `components/mdx/Tradeoff.tsx`**

```tsx
type Props = {
  forTitle: string;
  againstTitle: string;
  forItems: string[];
  againstItems: string[];
};

function Column({ title, items }: { title: string; items: string[] }) {
  const real = items.filter((i) => i.trim().length > 0);
  return (
    <div className="flex-1 rounded-card border-2 border-structural bg-card p-4">
      <h4 className="font-mono text-xs uppercase tracking-wider">{title}</h4>
      {real.length > 0 && (
        <ul className="mt-3 space-y-2 text-sm">
          {real.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden className="font-mono">+</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Side-by-side comparison — the workhorse structure for system design. */
export function Tradeoff({ forTitle, againstTitle, forItems, againstItems }: Props) {
  return (
    <div className="my-6 flex flex-col gap-4 md:flex-row">
      <Column title={forTitle} items={forItems} />
      <Column title={againstTitle} items={againstItems} />
    </div>
  );
}
```

Empty items are filtered so the generated stubs render a clean empty column rather than a list of blank bullets.

- [ ] **Step 5: Create `components/mdx/KeyTakeaways.tsx`**

```tsx
export function KeyTakeaways({ items }: { items: string[] }) {
  const real = items.filter((i) => i.trim().length > 0);
  if (real.length === 0) return null;

  return (
    <section className="my-8 rounded-card border-2 border-structural bg-card p-5 shadow-hard-sm">
      <h3 className="font-mono text-xs uppercase tracking-wider">Key takeaways</h3>
      <ul className="mt-3 space-y-2">
        {real.map((item) => (
          <li key={item} className="flex gap-2 text-sm">
            <span aria-hidden className="font-mono">→</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 6: Create `components/mdx/Figure.tsx`**

```tsx
import Image from "next/image";

type Props = {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
};

/**
 * Throws when alt text is missing or blank. Failing loudly is deliberate:
 * across 179 lessons a silent default would let unlabelled diagrams ship.
 */
export function Figure({ src, alt, caption, width = 1200, height = 675 }: Props) {
  if (typeof alt !== "string" || alt.trim().length === 0) {
    throw new Error(
      `<Figure src="${src}"> is missing alt text. Describe what the diagram shows, or use aria-hidden markup for purely decorative art.`,
    );
  }

  return (
    <figure className="my-8">
      <div className="rounded-card border-2 border-structural bg-card p-2">
        <Image src={src} alt={alt} width={width} height={height} className="h-auto w-full" />
      </div>
      {caption && (
        <figcaption className="mt-2 font-mono text-xs text-ink-muted">{caption}</figcaption>
      )}
    </figure>
  );
}
```

Explicit `width`/`height` reserve space, which is what holds CLS under 0.1.

- [ ] **Step 7: Create `components/mdx/Steps.tsx`**

```tsx
export function Steps({ children }: { children: React.ReactNode }) {
  return (
    <ol className="my-6 space-y-4 border-l-2 border-hairline pl-6 [counter-reset:step]">
      {children}
    </ol>
  );
}

export function Step({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <li className="relative">
      <span
        aria-hidden
        className="absolute -left-[calc(1.5rem+1px)] top-1 size-2 -translate-x-1/2 rounded-full bg-ink"
      />
      <h4 className="font-medium">{title}</h4>
      {children && <div className="mt-1 text-sm text-ink-muted">{children}</div>}
    </li>
  );
}
```

- [ ] **Step 8: Create `components/mdx/Formula.tsx`**

```tsx
/**
 * A displayed formula. Rendered as monospace text rather than typeset maths —
 * the curriculum's formulas are short, and this keeps the page dependency-free
 * and selectable. `label` names it for screen readers.
 */
export function Formula({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <div
      role="math"
      aria-label={label}
      className="scroll-x my-6 rounded-card border-2 border-structural bg-card p-4 text-center font-mono text-base"
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 9: Create `components/mdx/CodeBlock.tsx`**

`rehype-pretty-code` produces the highlighted markup, so this only supplies the scroll container and the language label. Its output was captured from the installed version and has this exact shape:

```html
<figure data-rehype-pretty-code-figure="">
  <pre tabindex="0" data-language="ts" data-theme="github-light github-dark">
    <code data-language="ts" style="display: grid;">
      <span data-line=""><span style="--shiki-light:#D73A49;--shiki-dark:#F97583">const</span>…</span>
```

Three things follow from it: `data-language` is available on the `pre` props; the `tabindex="0"` it adds must be preserved by spreading `...props`, since it is what makes an overflowing block keyboard-scrollable; and the nested `<code>` carries `data-language`, which is how `InlineCode` below tells block code from inline code.

```tsx
import { cn } from "@/lib/cn";

type PreProps = React.ComponentPropsWithoutRef<"pre"> & {
  "data-language"?: string;
};

export function Pre({ children, className, ...props }: PreProps) {
  const language = props["data-language"];
  return (
    <div className="my-6 overflow-hidden rounded-card border-2 border-structural bg-card">
      {language && (
        <p className="border-b-2 border-hairline px-4 py-1.5 font-mono text-[11px] uppercase tracking-wider text-ink-muted">
          {language}
        </p>
      )}
      <pre {...props} className={cn("scroll-x p-4 text-sm leading-relaxed", className)}>
        {children}
      </pre>
    </div>
  );
}

type CodeProps = React.ComponentPropsWithoutRef<"code"> & {
  "data-language"?: string;
};

/**
 * MDX maps EVERY `code` element to this component — both inline `code` spans
 * and the `<code>` that rehype-pretty-code nests inside `<pre>`. Block code
 * must pass through untouched, or the inline pill styling (border, background,
 * padding) wraps the whole highlighted block.
 *
 * rehype-pretty-code sets `data-language` on the block `<code>`; inline code
 * has no such attribute, which is what distinguishes the two.
 */
export function InlineCode({ children, ...props }: CodeProps) {
  if (props["data-language"] !== undefined) {
    return <code {...props}>{children}</code>;
  }

  return (
    <code
      {...props}
      className="rounded border border-hairline bg-card px-1 py-0.5 font-mono text-[0.9em]"
    >
      {children}
    </code>
  );
}
```

- [ ] **Step 10: Create `components/mdx/index.tsx`**

```tsx
import { Callout } from "./Callout";
import { InlineCode, Pre } from "./CodeBlock";
import { Figure } from "./Figure";
import { Formula } from "./Formula";
import { KeyTakeaways } from "./KeyTakeaways";
import { Step, Steps } from "./Steps";
import { Tradeoff } from "./Tradeoff";

/** Given to the compiled MDX body. Element overrides keep wide content inside its box. */
export const mdxComponents = {
  Callout,
  Tradeoff,
  KeyTakeaways,
  Figure,
  Steps,
  Step,
  Formula,

  h2: (p: React.ComponentPropsWithoutRef<"h2">) => (
    <h2 {...p} className="mt-12 scroll-mt-24 text-2xl font-semibold tracking-tight" />
  ),
  h3: (p: React.ComponentPropsWithoutRef<"h3">) => (
    <h3 {...p} className="mt-8 scroll-mt-24 text-lg font-semibold" />
  ),
  p: (p: React.ComponentPropsWithoutRef<"p">) => <p {...p} className="mt-4" />,
  ul: (p: React.ComponentPropsWithoutRef<"ul">) => (
    <ul {...p} className="mt-4 list-disc space-y-2 pl-6" />
  ),
  ol: (p: React.ComponentPropsWithoutRef<"ol">) => (
    <ol {...p} className="mt-4 list-decimal space-y-2 pl-6" />
  ),
  a: (p: React.ComponentPropsWithoutRef<"a">) => (
    <a {...p} className="text-link underline underline-offset-2" />
  ),
  blockquote: (p: React.ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote {...p} className="my-6 border-l-2 border-structural pl-4 italic" />
  ),
  table: (p: React.ComponentPropsWithoutRef<"table">) => (
    <div className="scroll-x my-6 rounded-card border-2 border-structural">
      <table {...p} className="w-full border-collapse text-sm" />
    </div>
  ),
  th: (p: React.ComponentPropsWithoutRef<"th">) => (
    <th {...p} className="border-b-2 border-hairline px-3 py-2 text-left font-mono text-xs uppercase" />
  ),
  td: (p: React.ComponentPropsWithoutRef<"td">) => (
    <td {...p} className="border-b border-hairline px-3 py-2 align-top" />
  ),
  pre: Pre,
  code: InlineCode,
};
```

`scroll-mt-24` on headings keeps the sticky header from covering an anchored heading when the table of contents jumps to it.

- [ ] **Step 11: Run the test to verify it passes**

Run: `npx vitest run tests/components/mdx.test.tsx`
Expected: PASS. React logs the thrown `Figure` error to stderr during the two guard tests — that is expected noise, not a failure.

- [ ] **Step 12: Commit**

```bash
git add components/mdx tests/components/mdx.test.tsx
git commit -m "feat: add MDX component library

Figure throws without alt text so unlabelled diagrams cannot ship across
179 lessons. Tables and code blocks scroll inside their own container so
the page never scrolls sideways."
```

---

## Task 8: Lesson route and MDX pipeline

**Files:**
- Create: `lib/content/headings.ts`, `components/lesson/LessonHeader.tsx`, `components/lesson/LessonNav.tsx`, `components/lesson/SidebarTree.tsx` (placeholder), `components/lesson/TableOfContents.tsx` (placeholder), `components/lesson/ProgressTracker.tsx` (placeholder), `app/system-design/[module]/[topic]/page.tsx`, `app/system-design/layout.tsx`, `tests/content/headings.test.ts`
- Modify: `app/globals.css` (append the Shiki dual-theme block)
- Test: `tests/content/headings.test.ts`

**Interfaces:**
- Consumes: `getLesson`, `getLessonNeighbours`, `getModule`, `getAllLessonParams`, `courseSlug` from Task 5; `mdxComponents` from Task 7; `Header`, `Footer`, `Badge`, `Pill` from Task 6.
- Produces:
  - `extractHeadings(body: string): Heading[]` where `Heading = { id: string; text: string; level: 2 | 3 }`
  - `<LessonHeader lesson module />`, `<LessonNav prev next />`
  - 179 statically generated lesson routes.

- [ ] **Step 1: Install the slugger and swap the MDX compiler**

Task 1 installed `next-mdx-remote`, which must be replaced: it silently drops
every MDX expression attribute, so `<Tradeoff forItems={[...]}>` and
`<KeyTakeaways items={[...]}>` — present in all 179 stubs — would receive
`undefined` and throw `items.filter is not a function`. `@mdx-js/mdx` (which
`next-mdx-remote` merely wraps) passes them through correctly; I verified this
end-to-end against a real generated stub.

```bash
npm install github-slugger@^2 @mdx-js/mdx@^3
npm uninstall next-mdx-remote
```

`github-slugger@2` ships its own `index.d.ts`, so no `@types` package is needed. It is the same slugger `rehype-slug` uses, which is why the table-of-contents ids will match the rendered heading ids exactly.

`github-slugger@2` ships its own `index.d.ts`, so no `@types` package is needed. It is the same slugger `rehype-slug` uses, which is why the table of contents ids will match the rendered heading ids exactly.

- [ ] **Step 2: Write the failing headings test**

Create `tests/content/headings.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { extractHeadings } from "@/lib/content/headings";

describe("extractHeadings", () => {
  it("finds h2 and h3 with matching slug ids", () => {
    const body = `## The problem\n\nText.\n\n### A detail\n`;
    expect(extractHeadings(body)).toEqual([
      { id: "the-problem", text: "The problem", level: 2 },
      { id: "a-detail", text: "A detail", level: 3 },
    ]);
  });

  it("ignores h1 and h4", () => {
    const body = `# Title\n\n## Kept\n\n#### Dropped\n`;
    expect(extractHeadings(body).map((h) => h.text)).toEqual(["Kept"]);
  });

  it("ignores headings inside fenced code blocks", () => {
    const body = [
      "## Real heading",
      "",
      "```bash",
      "# not a heading",
      "## also not a heading",
      "```",
      "",
      "## Second real heading",
    ].join("\n");
    expect(extractHeadings(body).map((h) => h.text)).toEqual([
      "Real heading",
      "Second real heading",
    ]);
  });

  it("handles tilde-fenced blocks", () => {
    const body = `~~~\n## hidden\n~~~\n\n## visible\n`;
    expect(extractHeadings(body).map((h) => h.text)).toEqual(["visible"]);
  });

  it("does not let a tilde line close a backtick fence", () => {
    // CommonMark requires a matching delimiter. A boolean toggle would treat
    // the "~~~" as a close and expose "## not a heading" below it.
    const body = [
      "```bash",
      "~~~",
      "## not a heading",
      "```",
      "",
      "## real heading",
    ].join("\n");
    expect(extractHeadings(body).map((h) => h.text)).toEqual(["real heading"]);
  });

  it("does not let a backtick line close a tilde fence", () => {
    const body = ["~~~", "```", "## not a heading", "~~~", "", "## real heading"].join("\n");
    expect(extractHeadings(body).map((h) => h.text)).toEqual(["real heading"]);
  });

  it("handles fences longer than three characters", () => {
    const body = ["````", "```", "## not a heading", "````", "", "## real heading"].join("\n");
    expect(extractHeadings(body).map((h) => h.text)).toEqual(["real heading"]);
  });

  it("strips inline markdown from heading text", () => {
    const body = "## The `memtable` and **WAL**\n";
    const [heading] = extractHeadings(body);
    expect(heading.text).toBe("The memtable and WAL");
  });

  it("deduplicates repeated headings the way rehype-slug does", () => {
    const body = `## Tradeoffs\n\n## Tradeoffs\n`;
    expect(extractHeadings(body).map((h) => h.id)).toEqual(["tradeoffs", "tradeoffs-1"]);
  });

  it("returns an empty array for a body with no headings", () => {
    expect(extractHeadings("Just a paragraph.")).toEqual([]);
  });
});
```

The fenced-code cases matter: several lessons will contain shell snippets whose comments begin with `#`, and a naive line-regex would put them in the table of contents.

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run tests/content/headings.test.ts`
Expected: FAIL — unresolved import.

- [ ] **Step 4: Implement `lib/content/headings.ts`**

```ts
import GithubSlugger from "github-slugger";

export type Heading = { id: string; text: string; level: 2 | 3 };

const FENCE = /^(`{3,}|~{3,})/;
const HEADING = /^(#{2,3})\s+(.*\S)\s*$/;

/** Removes inline code, emphasis, and link syntax from heading text. */
function plain(text: string): string {
  return text
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .trim();
}

/**
 * Extracts h2 and h3 headings from raw MDX for the table of contents.
 *
 * Ids come from the same slugger rehype-slug uses, including its duplicate
 * suffixing, so the ids here always match the ids in the rendered HTML.
 * Lines inside fenced code blocks are skipped — shell comments start with `#`
 * and would otherwise be mistaken for headings.
 */
export function extractHeadings(body: string): Heading[] {
  const slugger = new GithubSlugger();
  const headings: Heading[] = [];

  // Tracks BOTH which delimiter opened the current fence and how long it was.
  // CommonMark requires the closing fence to use the same character AND be at
  // least as long as the opening one. A boolean toggle would let a "~~~" line
  // inside a ```-fenced block close it early; tracking only the character
  // would let a 3-backtick line close a 4-backtick block. Either way the
  // shell comments inside would be exposed as headings.
  let fenceChar: "`" | "~" | null = null;
  let fenceLen = 0;

  for (const line of body.split(/\r?\n/)) {
    const fence = FENCE.exec(line.trim());
    if (fence) {
      const marker = fence[1];
      const char = marker[0] as "`" | "~";
      if (fenceChar === null) {
        fenceChar = char;
        fenceLen = marker.length;
      } else if (fenceChar === char && marker.length >= fenceLen) {
        fenceChar = null;
        fenceLen = 0;
      }
      // A non-matching or too-short marker inside a fence is content — ignore it.
      continue;
    }
    if (fenceChar !== null) continue;

    const match = HEADING.exec(line);
    if (!match) continue;

    const text = plain(match[2]);
    if (!text) continue;

    headings.push({
      id: slugger.slug(text),
      text,
      level: match[1].length as 2 | 3,
    });
  }

  return headings;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run tests/content/headings.test.ts`
Expected: PASS — 7 tests.

- [ ] **Step 6: Create `components/lesson/LessonHeader.tsx`**

```tsx
import Link from "next/link";
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
```

- [ ] **Step 7: Create `components/lesson/LessonNav.tsx`**

```tsx
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { LessonRef } from "@/lib/content";

// The prop is `item`, NOT `ref`: eslint's react-hooks/refs rule treats any
// prop literally named `ref` as a React ref and errors on it.
function NavCard({ item: target, direction }: { item: LessonRef; direction: "prev" | "next" }) {
  const isNext = direction === "next";
  return (
    <Link
      href={target.url}
      rel={isNext ? "next" : "prev"}
      className={`group flex flex-1 flex-col gap-1 rounded-card border-2 border-structural bg-card p-4 transition-brut hover:shadow-hard ${
        isNext ? "items-end text-right" : "items-start"
      }`}
    >
      <span className="flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-ink-muted">
        {!isNext && <ArrowLeft aria-hidden className="size-3" />}
        {isNext ? "Next" : "Previous"}
        {isNext && <ArrowRight aria-hidden className="size-3" />}
      </span>
      <span className="font-medium">{target.title}</span>
      <span className="font-mono text-xs text-ink-muted">{target.number}</span>
    </Link>
  );
}

export function LessonNav({ prev, next }: { prev: LessonRef | null; next: LessonRef | null }) {
  if (!prev && !next) return null;

  return (
    <nav aria-label="Lesson navigation" className="mt-12 flex flex-col gap-4 sm:flex-row">
      {prev ? <NavCard item={prev} direction="prev" /> : <div className="flex-1" aria-hidden />}
      {next ? <NavCard item={next} direction="next" /> : <div className="flex-1" aria-hidden />}
    </nav>
  );
}
```

- [ ] **Step 7b: Create typed placeholders for the three components Tasks 9 and 10 own**

The lesson page imports `SidebarTree` and `TableOfContents` (Task 9) and
`ProgressTracker` (Task 10). Without these, Task 8 cannot build on its own.
Create them now as placeholders carrying the EXACT final signatures, so Tasks 9
and 10 replace the bodies without touching any call site — the same approach
Task 6 used for `SearchPalette`.

`components/lesson/SidebarTree.tsx`:

```tsx
"use client";

import type { ColorKey } from "@/lib/design/modules";

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

/** Placeholder — Task 9 implements the real collapsible tree. */
export function SidebarTree(_props: {
  modules: SidebarModule[];
  currentModule: string;
  currentLesson: string;
}) {
  return null;
}
```

`components/lesson/TableOfContents.tsx`:

```tsx
"use client";

import type { Heading } from "@/lib/content/headings";

/** Placeholder — Task 9 implements the real scroll-spy list. */
export function TableOfContents(_props: { headings: Heading[]; className?: string }) {
  return null;
}
```

`components/lesson/ProgressTracker.tsx`:

```tsx
"use client";

/** Placeholder — Task 10 implements the real localStorage-backed tracker. */
export function ProgressTracker(_props: { lessonKey: string }) {
  return null;
}

/** Placeholder — Task 10 implements this; Task 11's course page consumes it. */
export function CourseProgress(_props: { total: number }) {
  return null;
}
```

All three are on the six-component `'use client'` allow-list already, so the
boundary test accepts them. Prefixing the unused props with `_` keeps
`npm run lint` at exit 0.

- [ ] **Step 8: Create `app/system-design/layout.tsx`**

```tsx
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export default function CourseLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 9: Create `app/system-design/[module]/[topic]/page.tsx`**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { evaluate, type EvaluateOptions } from "@mdx-js/mdx";
import * as jsxRuntime from "react/jsx-runtime";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { mdxComponents } from "@/components/mdx";
import { LessonHeader } from "@/components/lesson/LessonHeader";
import { LessonNav } from "@/components/lesson/LessonNav";
import { ProgressTracker } from "@/components/lesson/ProgressTracker";
import { SidebarTree } from "@/components/lesson/SidebarTree";
import { TableOfContents } from "@/components/lesson/TableOfContents";
import {
  courseSlug, getAllLessonParams, getLesson, getLessonNeighbours, getModule, getModules,
} from "@/lib/content";
import { extractHeadings } from "@/lib/content/headings";

type Params = { module: string; topic: string };

// Every lesson is known at build time, so an unlisted param is a 404 rather
// than an on-demand render.
export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return getAllLessonParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { module: moduleSlug, topic } = await params;
  const lesson = getLesson(courseSlug, moduleSlug, topic);
  if (!lesson) return {};
  return {
    title: `${lesson.number} ${lesson.title}`,
    description: lesson.summary,
    openGraph: { title: lesson.title, description: lesson.summary, type: "article" },
    twitter: { card: "summary_large_image", title: lesson.title, description: lesson.summary },
  };
}

/**
 * MDX evaluation options.
 *
 * Uses `@mdx-js/mdx` directly rather than `next-mdx-remote`: that package
 * silently drops every MDX expression attribute, so `<Tradeoff forItems={[...]}>`
 * and `<KeyTakeaways items={[...]}>` — which appear in all 179 stubs — would
 * receive `undefined` and throw. Verified: `evaluate()` passes arrays, numbers
 * and objects through intact.
 *
 * No frontmatter option is needed. `lib/content/source.ts` already strips
 * frontmatter with gray-matter, so `lesson.body` is clean MDX.
 *
 * Deliberately not `as const`: that would make the plugin arrays readonly
 * tuples, and the plugin options expect a mutable PluggableList.
 */
const MDX_OPTIONS = {
  development: false,
  remarkPlugins: [remarkGfm],
  rehypePlugins: [
    rehypeSlug,
    [rehypeAutolinkHeadings, { behavior: "wrap" }],
    [
      rehypePrettyCode,
      { theme: { light: "github-light", dark: "github-dark" }, keepBackground: false },
    ],
  ],
} satisfies Partial<EvaluateOptions>;

export default async function LessonPage({ params }: { params: Promise<Params> }) {
  const { module: moduleSlug, topic } = await params;

  const mod = getModule(courseSlug, moduleSlug);
  const lesson = getLesson(courseSlug, moduleSlug, topic);
  if (!mod || !lesson) notFound();

  // evaluate() compiles and evaluates the MDX at build time and returns a
  // component; `components` is supplied at render, not compile, time.
  const { default: MDXBody } = await evaluate(lesson.body, {
    ...jsxRuntime,
    ...MDX_OPTIONS,
  } as EvaluateOptions);

  const headings = extractHeadings(lesson.body);
  const { prev, next } = getLessonNeighbours(courseSlug, moduleSlug, topic);

  return (
    <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-10 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_220px]">
      <SidebarTree
        modules={getModules(courseSlug).map((m) => ({
          id: m.id,
          slug: m.slug,
          title: m.title,
          colorKey: m.colorKey,
          lessons: m.lessons.map((l) => ({
            slug: l.slug,
            number: l.number,
            title: l.title,
            url: l.url,
            status: l.status,
          })),
        }))}
        currentModule={moduleSlug}
        currentLesson={topic}
      />

      <article className="min-w-0">
        <LessonHeader lesson={lesson} module={mod} />
        <div className="prose-lesson mt-8">
          <MDXBody components={mdxComponents} />
        </div>
        <ProgressTracker lessonKey={`${moduleSlug}/${topic}`} />
        <LessonNav prev={prev} next={next} />
      </article>

      <TableOfContents headings={headings} className="hidden xl:block" />
    </div>
  );
}
```

The sidebar receives a mapped, plain-object projection rather than the `Module[]` objects themselves — client component props must be serialisable, and passing only the fields the tree renders keeps the payload small across 179 pages.

- [ ] **Step 10: Append the Shiki dual-theme block to `app/globals.css`**

`rehype-pretty-code` with two themes emits both colours as custom properties on every token; CSS chooses which one applies. Append at the end of the file; Task 3's `ruleBody()` matcher is order-independent, so this cannot disturb it.

```css
/* rehype-pretty-code dual themes: tokens carry both colours, CSS picks one. */
html:not(.dark) [data-rehype-pretty-code-figure] span {
  color: var(--shiki-light);
}
html.dark [data-rehype-pretty-code-figure] span {
  color: var(--shiki-dark);
}
[data-rehype-pretty-code-figure] pre {
  background: transparent;
}
/* Autolinked headings must not look like body links. */
.prose-lesson :is(h2, h3) a {
  color: inherit;
  text-decoration: none;
}
```

- [ ] **Step 11: Run the full test suite**

Run: `npm test`
Expected: PASS. `tests/content/boundaries.test.ts` must still pass — the lesson page imports client components but is not one itself.

- [ ] **Step 12: Build and confirm 179 static pages**

Run: `npm run build`
Expected: the route table lists `/system-design/[module]/[topic]` with 179 generated entries. Confirm with:

```bash
find .next/server/app/system-design -name '*.html' | wc -l   # expect 179
```

- [ ] **Step 13: Commit**

```bash
git add lib/content/headings.ts components/lesson app/system-design tests/content/headings.test.ts app/globals.css
git commit -m "feat: add lesson route with 179 static pages

Table of contents ids come from the same slugger rehype-slug uses, so
they always match rendered heading ids. Fenced code blocks are skipped
so shell comments are not mistaken for headings."
```

---

## Task 9: Sidebar tree and table of contents

**Files:**
- Replace (Task 8 created typed placeholders): `components/lesson/SidebarTree.tsx`, `components/lesson/TableOfContents.tsx`
- Modify: `tests/setup.ts` (add the IntersectionObserver stub — Step 0)
- Create: `tests/components/lesson-nav.test.tsx`
- Test: `tests/components/lesson-nav.test.tsx`

**Interfaces:**
- Consumes: `Heading` from Task 8; `ColorKey` from Task 2.
- Produces:
  - `<SidebarTree modules currentModule currentLesson />` with `SidebarModule = { id, slug, title, colorKey, lessons: SidebarLesson[] }` and `SidebarLesson = { slug, number, title, url, status }`
  - `<TableOfContents headings className? />`

- [ ] **Step 0: Add the `IntersectionObserver` stub to `tests/setup.ts`**

Mandatory, not conditional. jsdom 30 ships no `IntersectionObserver` (verified),
and `TableOfContents` constructs one. `setupFiles` runs for every test file
including node-environment ones, so the stub touches only `globalThis` and
never `window`, and it is guarded so a future jsdom that provides the real
thing wins.

Replace `tests/setup.ts` with:

```ts
import "@testing-library/jest-dom/vitest";

// jsdom 30 has no IntersectionObserver, and TableOfContents constructs one.
// Guarded so a jsdom release that provides the real implementation wins.
if (!("IntersectionObserver" in globalThis)) {
  class IntersectionObserverStub implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = "";
    readonly thresholds: readonly number[] = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  Object.defineProperty(globalThis, "IntersectionObserver", {
    value: IntersectionObserverStub,
    writable: true,
    configurable: true,
  });
}
```

The stub deliberately never fires a callback: the scroll-spy's *active* heading
is browser behaviour and is covered by the Playwright test in Task 17
("table of contents jumps to the matching heading"). These unit tests cover the
markup, the anchors, the indentation and the landmark — not scroll position.

- [ ] **Step 1: Write the failing test**

Create `tests/components/lesson-nav.test.tsx`. It renders components, so it must open with a `// @vitest-environment jsdom` docblock:

```tsx
// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SidebarTree } from "@/components/lesson/SidebarTree";
import { TableOfContents } from "@/components/lesson/TableOfContents";

const MODULES = [
  {
    id: "01", slug: "foundations", title: "Foundations", colorKey: "cobalt" as const,
    lessons: [
      { slug: "requirements-clarification", number: "01.01", title: "Requirements Clarification", url: "/system-design/foundations/requirements-clarification", status: "published" as const },
      { slug: "logical-system-design", number: "01.02", title: "Logical System Design", url: "/system-design/foundations/logical-system-design", status: "draft" as const },
    ],
  },
  {
    id: "07", slug: "storage-engines", title: "Storage Engines", colorKey: "teal" as const,
    lessons: [
      { slug: "lsm-tree-storage-engine", number: "07.09", title: "LSM Tree Storage Engine", url: "/system-design/storage-engines/lsm-tree-storage-engine", status: "published" as const },
    ],
  },
];

describe("SidebarTree", () => {
  it("marks the current lesson with aria-current", () => {
    render(<SidebarTree modules={MODULES} currentModule="foundations" currentLesson="requirements-clarification" />);
    const current = screen.getByRole("link", { current: "page" });
    expect(current).toHaveAccessibleName(/Requirements Clarification/);
  });

  it("expands the current module and collapses the others", () => {
    render(<SidebarTree modules={MODULES} currentModule="foundations" currentLesson="requirements-clarification" />);
    expect(screen.getByRole("button", { name: /Foundations/ })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: /Storage Engines/ })).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps collapsed lessons out of the accessibility tree", () => {
    render(<SidebarTree modules={MODULES} currentModule="foundations" currentLesson="requirements-clarification" />);
    expect(screen.queryByRole("link", { name: /LSM Tree Storage Engine/ })).not.toBeInTheDocument();
  });

  it("labels drafts in text so status is not colour-only", () => {
    render(<SidebarTree modules={MODULES} currentModule="foundations" currentLesson="requirements-clarification" />);
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });

  it("uses a labelled navigation landmark", () => {
    render(<SidebarTree modules={MODULES} currentModule="foundations" currentLesson="requirements-clarification" />);
    expect(screen.getByRole("navigation", { name: /course contents/i })).toBeInTheDocument();
  });
});

describe("TableOfContents", () => {
  const HEADINGS = [
    { id: "the-problem", text: "The problem", level: 2 as const },
    { id: "a-detail", text: "A detail", level: 3 as const },
  ];

  it("links each heading to its anchor", () => {
    render(<TableOfContents headings={HEADINGS} />);
    expect(screen.getByRole("link", { name: "The problem" })).toHaveAttribute("href", "#the-problem");
    expect(screen.getByRole("link", { name: "A detail" })).toHaveAttribute("href", "#a-detail");
  });

  it("indents level-3 headings further than level-2", () => {
    // Asserting only /pl-/ would pass even if both levels collapsed to the
    // same padding, which is the failure this test exists to catch.
    render(<TableOfContents headings={HEADINGS} />);
    expect(screen.getByRole("link", { name: "The problem" }).className).toMatch(/\bpl-3\b/);
    expect(screen.getByRole("link", { name: "A detail" }).className).toMatch(/\bpl-6\b/);
  });

  it("bounds its own height so a long contents list stays reachable", () => {
    render(<TableOfContents headings={HEADINGS} />);
    const nav = screen.getByRole("navigation", { name: /on this page/i });
    expect(nav.className).toMatch(/overflow-y-auto/);
    expect(nav.className).toMatch(/max-h-/);
  });

  it("renders nothing when there are no headings", () => {
    const { container } = render(<TableOfContents headings={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("uses a labelled navigation landmark", () => {
    render(<TableOfContents headings={HEADINGS} />);
    expect(screen.getByRole("navigation", { name: /on this page/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/components/lesson-nav.test.tsx`
Expected: FAIL — unresolved imports.

- [ ] **Step 3: Create `components/lesson/SidebarTree.tsx`**

Client leaf 3 of 6.

```tsx
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
```

- [ ] **Step 4: Create `components/lesson/TableOfContents.tsx`**

Client leaf 4 of 6.

```tsx
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
      // max-h + overflow mirrors SidebarTree. Without it a lesson with many
      // headings runs past the sticky viewport with no way to reach the tail —
      // currently masked because stubs have at most 4 headings, but Task 16
      // writes real lessons with far more.
      className={cn(
        "self-start xl:sticky xl:top-20 xl:max-h-[calc(100dvh-6rem)] xl:overflow-y-auto",
        className,
      )}
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
                // py-2 gives a 36px target: comfortably past WCAG 2.5.8's
                // 24px minimum without the density cost of forcing 44px.
                "-ml-0.5 block border-l-2 py-2 pr-2 text-sm transition-brut hover:text-ink",
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
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run tests/components/lesson-nav.test.tsx`
Expected: PASS — 9 tests.

This only passes because of Step 0 below. **jsdom 30 does not implement
`IntersectionObserver`** — I verified this directly: asserting
`"IntersectionObserver" in globalThis` inside a jsdom-environment test fails.
`TableOfContents` constructs one in an effect, so without a stub the test
throws on the constructor. Do Step 0 first, not "if a test errors".



- [ ] **Step 6: Commit**

```bash
git add components/lesson/SidebarTree.tsx components/lesson/TableOfContents.tsx tests/components/lesson-nav.test.tsx tests/setup.ts
git commit -m "feat: add sidebar tree and scroll-spy table of contents

Collapsed sidebar sections are removed from the DOM so tab order and the
accessibility tree match what is visible. TOC rootMargin offsets the
sticky header so headings activate after clearing the chrome."
```

---

## Task 10: Progress tracking

**Files:**
- Create: `lib/progress/store.ts`, `lib/progress/useProgress.ts`, `tests/components/progress.test.tsx`
- Replace (Task 8 created a typed placeholder, including the `CourseProgress` export Task 11 consumes): `components/lesson/ProgressTracker.tsx`
- Test: `tests/components/progress.test.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `progressStore` with `subscribe(cb): () => void`, `getSnapshot(): string`, `getServerSnapshot(): string`, `toggle(key: string): void`, `has(key: string): boolean`, `count(): number`, `clear(): void`, `__resetForTests(): void`
  - `useProgress(): { completed: Set<string>; toggle(key: string): void; isComplete(key: string): boolean }`
  - `<ProgressTracker lessonKey />`

- [ ] **Step 1: Write the failing test**

Create `tests/components/progress.test.tsx`. It renders components and touches `window.localStorage`, so it must open with a `// @vitest-environment jsdom` docblock:

```tsx
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { ProgressTracker } from "@/components/lesson/ProgressTracker";
import { progressStore } from "@/lib/progress/store";

const KEY = "cineshek:progress:v1";

beforeEach(() => {
  window.localStorage.clear();
  // Drops the module-level cache. Without this, clear() would leave a
  // populated cache behind and the three storage-failure tests below would
  // never reach the read/parse path they exist to cover.
  progressStore.__resetForTests();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("progressStore", () => {
  it("starts empty", () => {
    expect(progressStore.count()).toBe(0);
  });

  it("toggles a key on and off", () => {
    progressStore.toggle("foundations/requirements-clarification");
    expect(progressStore.has("foundations/requirements-clarification")).toBe(true);
    progressStore.toggle("foundations/requirements-clarification");
    expect(progressStore.has("foundations/requirements-clarification")).toBe(false);
  });

  it("persists to localStorage under a versioned key", () => {
    progressStore.toggle("a/b");
    expect(JSON.parse(window.localStorage.getItem(KEY)!)).toEqual(["a/b"]);
  });

  it("notifies subscribers on change", () => {
    const seen = vi.fn();
    const unsubscribe = progressStore.subscribe(seen);
    progressStore.toggle("a/b");
    expect(seen).toHaveBeenCalledTimes(1);
    unsubscribe();
    progressStore.toggle("c/d");
    expect(seen).toHaveBeenCalledTimes(1);
  });

  it("returns a stable server snapshot representing nothing completed", () => {
    expect(progressStore.getServerSnapshot()).toBe(progressStore.getServerSnapshot());
    expect(JSON.parse(progressStore.getServerSnapshot())).toEqual([]);
  });

  it("survives unreadable storage", () => {
    vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => progressStore.count()).not.toThrow();
    expect(progressStore.count()).toBe(0);
  });

  it("survives unwritable storage", () => {
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => progressStore.toggle("a/b")).not.toThrow();
    expect(progressStore.has("a/b")).toBe(true);
  });

  it("ignores corrupt stored data", () => {
    window.localStorage.setItem(KEY, "{not json");
    expect(() => progressStore.count()).not.toThrow();
    expect(progressStore.count()).toBe(0);
  });

  it("hydrates existing progress from storage on first read", () => {
    window.localStorage.setItem(KEY, JSON.stringify(["a/b", "c/d"]));
    expect(progressStore.count()).toBe(2);
    expect(progressStore.has("a/b")).toBe(true);
  });

  it("discards non-string entries in stored data", () => {
    window.localStorage.setItem(KEY, JSON.stringify(["a/b", 42, null]));
    expect(progressStore.count()).toBe(1);
  });
});

describe("ProgressTracker", () => {
  it("offers to mark the lesson complete", () => {
    render(<ProgressTracker lessonKey="foundations/requirements-clarification" />);
    expect(screen.getByRole("button", { name: /mark complete/i })).toBeInTheDocument();
  });

  it("reflects completion in text, not colour alone", () => {
    render(<ProgressTracker lessonKey="foundations/requirements-clarification" />);
    act(() => {
      screen.getByRole("button", { name: /mark complete/i }).click();
    });
    expect(screen.getByRole("button", { name: /completed/i })).toBeInTheDocument();
  });

  it("exposes pressed state to assistive technology", () => {
    render(<ProgressTracker lessonKey="a/b" />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-pressed", "false");
    act(() => button.click());
    expect(button).toHaveAttribute("aria-pressed", "true");
  });
});
```

The storage-failure tests are the point of this task: private browsing throws on `localStorage` access in some browsers, and a learning site must keep rendering when it does.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/components/progress.test.tsx`
Expected: FAIL — unresolved imports.

- [ ] **Step 3: Implement `lib/progress/store.ts`**

An external store rather than component state, so `useSyncExternalStore` can give React a server snapshot and avoid a hydration mismatch.

```ts
const STORAGE_KEY = "cineshek:progress:v1";
const EMPTY_SNAPSHOT = "[]";

type Listener = () => void;

let completed: Set<string> | null = null;
let snapshot = EMPTY_SNAPSHOT;
const listeners = new Set<Listener>();

function read(): Set<string> {
  if (completed) return completed;
  completed = new Set();
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) if (typeof item === "string") completed.add(item);
      }
    }
  } catch {
    // Unreadable, blocked, or corrupt storage: start from empty rather than throw.
  }
  snapshot = JSON.stringify([...completed].sort());
  return completed;
}

function commit(): void {
  const set = read();
  snapshot = JSON.stringify([...set].sort());
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, snapshot);
  } catch {
    // Quota or private browsing: keep the in-memory state, lose persistence.
  }
  for (const listener of listeners) listener();
}

export const progressStore = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /** A JSON string so React can compare snapshots by value. */
  getSnapshot(): string {
    read();
    return snapshot;
  },

  /** The server always renders "nothing completed", which stops a hydration flash. */
  getServerSnapshot(): string {
    return EMPTY_SNAPSHOT;
  },

  toggle(key: string): void {
    const set = read();
    if (set.has(key)) set.delete(key);
    else set.add(key);
    commit();
  },

  has(key: string): boolean {
    return read().has(key);
  },

  count(): number {
    return read().size;
  },

  clear(): void {
    completed = new Set();
    commit();
  },

  /** Test-only: drops the cache so the next read re-parses storage. */
  __resetForTests(): void {
    completed = null;
    snapshot = EMPTY_SNAPSHOT;
    listeners.clear();
  },
};

export { STORAGE_KEY };
```

- [ ] **Step 4: Implement `lib/progress/useProgress.ts`**

No `'use client'` here — the directive belongs to the component that consumes the hook, which is what `tests/content/boundaries.test.ts` asserts.

```ts
import { useCallback, useMemo, useSyncExternalStore } from "react";
import { progressStore } from "./store";

export function useProgress() {
  const snapshot = useSyncExternalStore(
    progressStore.subscribe,
    progressStore.getSnapshot,
    progressStore.getServerSnapshot,
  );

  const completed = useMemo(() => new Set<string>(JSON.parse(snapshot)), [snapshot]);

  const toggle = useCallback((key: string) => progressStore.toggle(key), []);
  const isComplete = useCallback((key: string) => completed.has(key), [completed]);

  return { completed, toggle, isComplete };
}
```

- [ ] **Step 5: Create `components/lesson/ProgressTracker.tsx`**

Client leaf 5 of 6.

```tsx
"use client";

import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/cn";
import { useProgress } from "@/lib/progress/useProgress";

export function ProgressTracker({ lessonKey }: { lessonKey: string }) {
  const { isComplete, toggle } = useProgress();
  const done = isComplete(lessonKey);

  return (
    <div className="mt-12 border-t-2 border-hairline pt-6">
      <button
        type="button"
        aria-pressed={done}
        onClick={() => toggle(lessonKey)}
        className={cn(
          "inline-flex min-h-11 items-center gap-2 rounded-card border-2 border-structural px-4 text-sm font-medium transition-brut hover:shadow-hard",
          done ? "bg-ink text-paper" : "bg-card text-ink",
        )}
      >
        {done ? <Check aria-hidden className="size-4" /> : <Circle aria-hidden className="size-4" />}
        {done ? "Completed" : "Mark complete"}
      </button>
      <p className="mt-2 font-mono text-xs text-ink-muted">
        Progress is stored in this browser only.
      </p>
    </div>
  );
}
```

The helper text is not decoration — it is the honest statement that there is no account behind this.

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run tests/components/progress.test.tsx`
Expected: PASS — 11 tests.

- [ ] **Step 7: Commit**

```bash
git add lib/progress components/lesson/ProgressTracker.tsx tests/components/progress.test.tsx
git commit -m "feat: add per-browser progress tracking

useSyncExternalStore with an empty server snapshot avoids a hydration
flash. Every storage access is guarded, so blocked or corrupt storage
degrades to 'no progress recorded' instead of throwing."
```

---

## Task 11: Course overview and module pages

**Files:**
- Create: `components/course/ModuleCard.tsx`, `app/system-design/page.tsx`, `app/system-design/[module]/page.tsx`, `tests/components/module-card.test.tsx`
- Modify: `components/lesson/ProgressTracker.tsx` (add the `CourseProgress` export — see Step 4)
- Test: `tests/components/module-card.test.tsx`

**Interfaces:**
- Consumes: `getModules`, `getModule`, `getCourse`, `getCourseStats`, `courseSlug` from Task 5; `Card`, `Pill` from Task 6; `useProgress` from Task 10.
- Produces: `<ModuleCard module />`, `<CourseProgress total />`, routes `/system-design` and `/system-design/[module]`.

- [ ] **Step 1: Write the failing test**

Create `tests/components/module-card.test.tsx`. It renders components, so it must open with a `// @vitest-environment jsdom` docblock:

```tsx
// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ModuleCard } from "@/components/course/ModuleCard";

const MODULE = {
  id: "07",
  slug: "storage-engines",
  title: "Storage Engines",
  blurb: "LSM trees, B-trees, SSTables, compaction, object storage, and write-ahead logs.",
  colorKey: "teal" as const,
  url: "/system-design/storage-engines",
  lessons: [],
  publishedCount: 2,
  totalCount: 20,
};

describe("ModuleCard", () => {
  it("links to the module and names it in the accessible name", () => {
    render(<ModuleCard module={MODULE} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/system-design/storage-engines");
    expect(link).toHaveAccessibleName(/Storage Engines/);
  });

  it("shows the module number and topic count", () => {
    render(<ModuleCard module={MODULE} />);
    expect(screen.getByText("07")).toBeInTheDocument();
    expect(screen.getByText(/20 topics/i)).toBeInTheDocument();
  });

  it("reports written progress honestly rather than padding it", () => {
    render(<ModuleCard module={MODULE} />);
    expect(screen.getByText(/2 written/i)).toBeInTheDocument();
  });

  it("omits the written count when nothing is written yet", () => {
    render(<ModuleCard module={{ ...MODULE, publishedCount: 0 }} />);
    expect(screen.queryByText(/written/i)).not.toBeInTheDocument();
  });

  it("applies the module colour as custom properties", () => {
    const { container } = render(<ModuleCard module={MODULE} />);
    const el = container.querySelector("[style]") as HTMLElement;
    expect(el.style.getPropertyValue("--surface")).toBe("#0F766E");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/components/module-card.test.tsx`
Expected: FAIL — unresolved import.

- [ ] **Step 3: Create `components/course/ModuleCard.tsx`**

```tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { moduleColors } from "@/lib/design/modules";
import type { Module } from "@/lib/content";

export function ModuleCard({ module: mod }: { module: Module }) {
  const pair = moduleColors[mod.colorKey];

  return (
    <Link
      href={mod.url}
      style={
        { "--surface": pair.surface, "--on-surface": pair.ink } as React.CSSProperties
      }
      className="group flex flex-col rounded-card border-2 border-structural bg-[var(--surface)] p-5 text-[var(--on-surface)] transition-brut hover:-translate-y-0.5 hover:shadow-hard"
    >
      <span className="font-pixel text-2xl">{mod.id}</span>
      <h3 className="mt-3 text-lg font-semibold">{mod.title}</h3>
      <p className="mt-2 flex-1 text-sm opacity-90">{mod.blurb}</p>
      <span className="mt-4 flex items-center gap-2 font-mono text-xs uppercase tracking-wider">
        {mod.totalCount} topics
        {mod.publishedCount > 0 && <>· {mod.publishedCount} written</>}
        <ArrowRight aria-hidden className="ml-auto size-4" />
      </span>
    </Link>
  );
}
```

The written count appears only when it is above zero — showing "0 written" on fourteen cards would be worse than saying nothing.

- [ ] **Step 4: Add `CourseProgress` to `components/lesson/ProgressTracker.tsx`**

`CourseProgress` reads the client-side progress store, so it must sit inside an existing client boundary. Giving it its own file would make it a seventh client component and fail `tests/content/boundaries.test.ts`. It therefore lives in the already-client `ProgressTracker.tsx` and is exported from there. Append to `components/lesson/ProgressTracker.tsx`:

```tsx
/** Course-level completion count. Exported for the course overview page. */
export function CourseProgress({ total }: { total: number }) {
  const { completed } = useProgress();
  if (completed.size === 0) return null;

  return (
    <p className="font-mono text-xs text-ink-muted">
      {completed.size} of {total} marked complete in this browser
    </p>
  );
}
```

This is the simplest way to honour the client-leaf constraint without introducing a context provider.

- [ ] **Step 5: Create `app/system-design/page.tsx`**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ModuleCard } from "@/components/course/ModuleCard";
import { CourseProgress } from "@/components/lesson/ProgressTracker";
import { courseSlug, getCourse, getCourseStats, getModules } from "@/lib/content";

export const metadata: Metadata = {
  title: "System design in depth",
  description:
    "Fourteen modules and 179 topics, sequenced from requirements clarification through storage engines and reliability.",
};

export default function CoursePage() {
  const course = getCourse(courseSlug);
  if (!course) notFound();

  const modules = getModules(courseSlug);
  const stats = getCourseStats(courseSlug);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-12">
      <p className="font-mono text-xs uppercase tracking-wider text-ink-muted">
        {course.eyebrow}
      </p>
      <h1 className="mt-3 font-pixel text-4xl sm:text-5xl">{course.title}</h1>
      <p className="mt-4 max-w-prose text-lg text-ink-muted">{course.blurb}</p>

      <div className="mt-6 flex flex-wrap items-center gap-4 font-mono text-xs uppercase tracking-wider">
        <span>{stats.moduleCount} modules</span>
        <span aria-hidden>·</span>
        <span>{stats.topicCount} topics</span>
        {stats.publishedCount > 0 && (
          <>
            <span aria-hidden>·</span>
            <span>{stats.publishedCount} written</span>
          </>
        )}
      </div>

      <div className="mt-2">
        <CourseProgress total={stats.topicCount} />
      </div>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((mod) => (
          <li key={mod.slug} className="flex">
            <ModuleCard module={mod} />
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 6: Create `app/system-design/[module]/page.tsx`**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { moduleColors } from "@/lib/design/modules";
import { courseSlug, getModule, getModules } from "@/lib/content";

type Params = { module: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return getModules(courseSlug).map((m) => ({ module: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { module: slug } = await params;
  const mod = getModule(courseSlug, slug);
  if (!mod) return {};
  return {
    title: `${mod.id} ${mod.title}`,
    description: mod.blurb,
  };
}

export default async function ModulePage({ params }: { params: Promise<Params> }) {
  const { module: slug } = await params;
  const mod = getModule(courseSlug, slug);
  if (!mod) notFound();

  const pair = moduleColors[mod.colorKey];

  return (
    <div className="mx-auto max-w-[900px] px-4 py-12">
      <nav aria-label="Breadcrumb" className="font-mono text-xs uppercase tracking-wider">
        <Link href="/system-design" className="text-link underline">
          System design
        </Link>
      </nav>

      <div
        style={{ "--surface": pair.surface, "--on-surface": pair.ink } as React.CSSProperties}
        className="mt-4 rounded-card border-2 border-structural bg-[var(--surface)] p-6 text-[var(--on-surface)]"
      >
        <span className="font-pixel text-3xl">{mod.id}</span>
        <h1 className="mt-2 text-3xl font-semibold">{mod.title}</h1>
        <p className="mt-2 max-w-prose opacity-90">{mod.blurb}</p>
        <p className="mt-4 font-mono text-xs uppercase tracking-wider">
          {mod.totalCount} topics
          {mod.publishedCount > 0 && ` · ${mod.publishedCount} written`}
        </p>
      </div>

      <ol className="mt-8 divide-y-2 divide-hairline border-y-2 border-hairline">
        {mod.lessons.map((lesson) => (
          <li key={lesson.slug}>
            <Link
              href={lesson.url}
              className="group flex min-h-14 items-center gap-4 py-3 transition-brut hover:bg-card"
            >
              <span className="w-12 shrink-0 font-mono text-xs text-ink-muted">
                {lesson.number}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{lesson.title}</span>
                <span className="block truncate text-sm text-ink-muted">{lesson.summary}</span>
              </span>
              <span className="hidden shrink-0 font-mono text-xs text-ink-muted sm:block">
                {lesson.estMinutes} min
              </span>
              <Badge status={lesson.status} />
              <ArrowRight aria-hidden className="size-4 shrink-0" />
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
```

- [ ] **Step 7: Run the tests and build**

Run: `npm test && npm run build`
Expected: tests pass; route table shows 14 entries for `/system-design/[module]` and 179 for the lesson route.

- [ ] **Step 8: Commit**

```bash
git add components/course app/system-design/page.tsx "app/system-design/[module]/page.tsx" components/lesson/ProgressTracker.tsx tests/components/module-card.test.tsx
git commit -m "feat: add course overview and module pages

Written counts are shown only when above zero — fourteen cards reading
'0 written' would be worse than silence."
```

---

## Task 12: Syllabus index

**Files:**
- Create: `app/(marketing)/layout.tsx`, `app/(marketing)/syllabus/page.tsx`
- Modify: none
- Test: covered by the Playwright suite in Task 17; no unit test is added here because the page is a pure projection of already-tested content-layer data.

**Interfaces:**
- Consumes: `getModules`, `getCourseStats`, `courseSlug` from Task 5; `Header`, `Footer` from Task 6.
- Produces: route `/syllabus`; a shared marketing layout used by `/`, `/courses`, and `/syllabus`.

- [ ] **Step 1: Create `app/(marketing)/layout.tsx`**

A route group, so it adds the chrome without adding a URL segment.

```tsx
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Create `app/(marketing)/syllabus/page.tsx`**

The route group adds no URL segment, so this file inherits the chrome and still serves `/syllabus`.

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { moduleColors } from "@/lib/design/modules";
import { courseSlug, getCourseStats, getModules } from "@/lib/content";

export const metadata: Metadata = {
  title: "Syllabus",
  description:
    "Every topic in the system design curriculum: 14 modules, 179 topics, in order.",
};

export default function SyllabusPage() {
  const modules = getModules(courseSlug);
  const stats = getCourseStats(courseSlug);

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-12">
      <h1 className="font-pixel text-4xl">Syllabus</h1>
      <p className="mt-3 font-mono text-xs uppercase tracking-wider text-ink-muted">
        {stats.moduleCount} modules · {stats.topicCount} topics
      </p>

      <nav aria-label="Jump to module" className="mt-6 flex flex-wrap gap-2">
        {modules.map((mod) => (
          <a
            key={mod.slug}
            href={`#module-${mod.id}`}
            className="inline-flex min-h-11 items-center rounded-card border-2 border-structural bg-card px-3 font-mono text-xs uppercase transition-brut hover:shadow-hard-sm"
          >
            {mod.id}
          </a>
        ))}
      </nav>

      <div className="mt-12 space-y-12">
        {modules.map((mod) => {
          const pair = moduleColors[mod.colorKey];
          return (
            <section key={mod.slug} id={`module-${mod.id}`} className="scroll-mt-24">
              <div className="flex items-baseline gap-3">
                <span
                  aria-hidden
                  style={{ backgroundColor: pair.surface, color: pair.ink }}
                  className="rounded-card px-2 py-0.5 font-pixel text-lg"
                >
                  {mod.id}
                </span>
                <h2 className="text-2xl font-semibold">
                  <Link href={mod.url} className="hover:underline">
                    {mod.title}
                  </Link>
                </h2>
              </div>
              <p className="mt-2 max-w-prose text-sm text-ink-muted">{mod.blurb}</p>

              <ol className="mt-4 grid gap-x-8 gap-y-1 sm:grid-cols-2">
                {mod.lessons.map((lesson) => (
                  <li key={lesson.slug} className="flex items-center gap-2 py-1">
                    <span className="w-12 shrink-0 font-mono text-xs text-ink-muted">
                      {lesson.number}
                    </span>
                    <Link href={lesson.url} className="min-w-0 flex-1 truncate text-sm hover:underline">
                      {lesson.title}
                    </Link>
                    <Badge status={lesson.status} />
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify the route and no horizontal scroll**

Run: `npm run build && npm start`
Then open `http://localhost:3000/syllabus` and check at 375px width that all 179 topics list and the page does not scroll sideways.

- [ ] **Step 4: Commit**

```bash
git add "app/(marketing)"
git commit -m "feat: add full syllabus index with module jump links"
```

---

## Task 13: Landing page

**Files:**
- Create: `components/landing/Hero.tsx`, `components/landing/Stats.tsx`, `components/landing/PathCards.tsx`, `components/landing/ModuleGrid.tsx`, `components/landing/Features.tsx`, `components/landing/Audience.tsx`, `components/landing/Subscribe.tsx`, `components/landing/Testimonials.tsx`, `app/(marketing)/page.tsx`, `app/(marketing)/courses/page.tsx`, `tests/components/landing.test.tsx`
- Modify: delete the scaffolded `app/page.tsx`
- Test: `tests/components/landing.test.tsx`

**Interfaces:**
- Consumes: `getCourses`, `getModules`, `getCourseStats`, `courseSlug` from Task 5; `Button`, `Pill`, `Card` from Task 6; `ModuleCard` from Task 11; `AnnouncementBar` from Task 6.
- Produces: `<Hero />`, `<Stats />`, `<PathCards />`, `<ModuleGrid />`, `<Features />`, `<Audience />`, `<Subscribe />`, `<Testimonials quotes />`; routes `/` and `/courses`.

- [ ] **Step 1: Write the failing test**

Create `tests/components/landing.test.tsx`. It renders components, so it must open with a `// @vitest-environment jsdom` docblock:

```tsx
// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { PathCards } from "@/components/landing/PathCards";
import { Subscribe } from "@/components/landing/Subscribe";
import { Testimonials } from "@/components/landing/Testimonials";

const COURSES = [
  {
    slug: "system-design", title: "System design in depth", eyebrow: "Engineering path",
    blurb: "Requirements to storage engines.", bullets: ["Notes and case studies"],
    status: "live" as const, colorKey: "mint" as const,
    moduleCount: 14, topicCount: 179, url: "/system-design",
  },
  {
    slug: "ai-research", title: "AI research", eyebrow: "Research path",
    blurb: "Maths to papers.", bullets: ["Landmark papers"],
    status: "planned" as const, colorKey: "cobalt" as const,
    moduleCount: 0, topicCount: 0, url: "",
  },
];

afterEach(() => vi.unstubAllEnvs());

describe("PathCards", () => {
  it("links the live path and shows its real counts", () => {
    render(<PathCards courses={COURSES} />);
    const link = screen.getByRole("link", { name: /System design in depth/ });
    expect(link).toHaveAttribute("href", "/system-design");
    expect(screen.getByText(/14 modules/i)).toBeInTheDocument();
    expect(screen.getByText(/179 topics/i)).toBeInTheDocument();
  });

  it("marks a planned path as Soon and does not link it", () => {
    render(<PathCards courses={COURSES} />);
    expect(screen.getByText("Soon")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /AI research/ })).not.toBeInTheDocument();
  });

  it("never invents counts for a planned path", () => {
    render(<PathCards courses={COURSES} />);
    expect(screen.queryByText(/0 modules/i)).not.toBeInTheDocument();
  });
});

describe("Subscribe", () => {
  it("says so plainly when no endpoint is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_SUBSCRIBE_ENDPOINT", "");
    render(<Subscribe />);
    expect(screen.getByText(/not yet configured/i)).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("renders a labelled email field when configured", () => {
    vi.stubEnv("NEXT_PUBLIC_SUBSCRIBE_ENDPOINT", "https://example.com/subscribe");
    render(<Subscribe />);
    const input = screen.getByLabelText(/email/i);
    expect(input).toHaveAttribute("type", "email");
    expect(input).toBeRequired();
  });
});

describe("Testimonials", () => {
  it("renders nothing when there are no real quotes", () => {
    const { container } = render(<Testimonials quotes={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("requires name and role alongside each quote", () => {
    render(
      <Testimonials
        quotes={[{ quote: "Genuinely useful.", name: "A. Reader", role: "Staff engineer" }]}
      />,
    );
    expect(screen.getByText(/Genuinely useful./)).toBeInTheDocument();
    expect(screen.getByText("A. Reader")).toBeInTheDocument();
    expect(screen.getByText("Staff engineer")).toBeInTheDocument();
  });
});
```

The `Subscribe` and `Testimonials` tests are the executable form of the spec's integrity rules: an unconfigured form must not present an input at all, and a testimonial cannot render without attribution.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/components/landing.test.tsx`
Expected: FAIL — unresolved imports.

- [ ] **Step 3: Create `components/landing/Hero.tsx`**

```tsx
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function Hero({ topicCount, moduleCount }: { topicCount: number; moduleCount: number }) {
  return (
    <section className="relative mx-auto max-w-[1200px] px-4 pt-16 pb-12 text-center">
      {/* Decorative tilted cards. Hidden below md and from assistive tech. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden md:block">
        <div className="absolute left-4 top-8 h-40 w-32 -rotate-12 rounded-card border-2 border-structural bg-card shadow-hard" />
        <div className="absolute right-6 top-20 h-36 w-28 rotate-[8deg] rounded-card border-2 border-structural bg-card shadow-hard" />
        <div className="absolute bottom-0 left-16 h-28 w-40 rotate-6 rounded-card border-2 border-structural bg-card shadow-hard" />
      </div>

      <div className="relative">
        <h1 className="mx-auto max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
          Everything a senior engineer knows.{" "}
          <span className="font-pixel">Mapped.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg text-ink-muted">
          A sequenced system design curriculum — {moduleCount} modules,{" "}
          {topicCount} topics, each one resting on the last.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button href="/system-design" size="lg">
            Start learning free
            <ArrowRight aria-hidden className="size-4" />
          </Button>
          <Button href="/syllabus" variant="secondary" size="lg">
            Browse syllabus
          </Button>
        </div>
      </div>
    </section>
  );
}
```

The headline splits grotesque and pixel across one line, which is the reference's central typographic move.

- [ ] **Step 4: Create `components/landing/Stats.tsx`**

```tsx
export function Stats({
  moduleCount, topicCount, publishedCount,
}: {
  moduleCount: number;
  topicCount: number;
  publishedCount: number;
}) {
  const items = [
    { value: String(moduleCount), label: "Modules" },
    { value: String(topicCount), label: "Topics" },
    ...(publishedCount > 0
      ? [{ value: String(publishedCount), label: "Written" }]
      : []),
    { value: "Free", label: "To read" },
  ];

  return (
    <section className="border-y-2 border-structural bg-card">
      <dl className="mx-auto flex max-w-[1200px] flex-wrap justify-center gap-x-12 gap-y-6 px-4 py-8">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <dd className="font-pixel text-3xl">{item.value}</dd>
            <dt className="mt-1 font-mono text-xs uppercase tracking-wider text-ink-muted">
              {item.label}
            </dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
```

- [ ] **Step 5: Create `components/landing/PathCards.tsx`**

```tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Pill } from "@/components/ui/Pill";
import { moduleColors } from "@/lib/design/modules";
import type { Course } from "@/lib/content";

function Inner({ course }: { course: Course }) {
  return (
    <>
      <div aria-hidden className="mb-6 flex justify-center">
        {/* Stacked-card motif, echoing the reference illustration. */}
        <div className="relative h-24 w-32">
          <span className="absolute inset-0 translate-x-3 translate-y-3 rounded-card border-2 border-structural opacity-40" />
          <span className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-card border-2 border-structural opacity-70" />
          <span className="absolute inset-0 grid place-items-center rounded-card border-2 border-structural bg-[var(--surface)] font-pixel text-xs">
            {course.slug.replace(/-/g, " ")}
          </span>
        </div>
      </div>

      <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider">
        {course.eyebrow}
        {course.status === "planned" && <Pill tone="inverse">Soon</Pill>}
      </p>

      <h3 className="mt-3 font-pixel text-2xl">{course.title}</h3>
      <p className="mt-3 text-sm opacity-90">{course.blurb}</p>

      <ul className="mt-4 space-y-1 text-sm">
        {course.bullets.map((bullet) => (
          <li key={bullet} className="flex gap-2">
            <span aria-hidden className="font-mono">+</span>
            {bullet}
          </li>
        ))}
      </ul>

      {course.status === "live" && (
        <>
          <p className="mt-5 font-mono text-[11px] uppercase tracking-wider">
            {course.moduleCount} modules · {course.topicCount} topics
          </p>
          <span className="mt-4 flex items-center gap-2 font-medium">
            Open course
            <ArrowRight aria-hidden className="ml-auto size-4" />
          </span>
        </>
      )}
    </>
  );
}

export function PathCards({ courses }: { courses: Course[] }) {
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-16">
      <h2 className="text-2xl font-semibold tracking-tight">Choose where to start</h2>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {courses.map((course) => {
          const pair = moduleColors[course.colorKey];
          const style = {
            "--surface": pair.surface,
            "--on-surface": pair.ink,
          } as React.CSSProperties;
          const shell =
            "flex h-full flex-col rounded-card border-2 border-structural bg-[var(--surface)] p-5 text-[var(--on-surface)]";

          return (
            <li key={course.slug} className="flex">
              {course.status === "live" ? (
                <Link
                  href={course.url}
                  style={style}
                  className={`${shell} transition-brut hover:-translate-y-0.5 hover:shadow-hard`}
                >
                  <Inner course={course} />
                </Link>
              ) : (
                // Planned paths are not links: there is nowhere to go yet.
                <div style={style} className={`${shell} opacity-80`}>
                  <Inner course={course} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
```

- [ ] **Step 6: Create `components/landing/ModuleGrid.tsx`**

```tsx
import { ModuleCard } from "@/components/course/ModuleCard";
import type { Module } from "@/lib/content";

// readonly: getModules() returns a frozen, readonly view of the process-wide
// cache, and a mutable Module[] prop would not accept it.
export function ModuleGrid({ modules }: { modules: readonly Module[] }) {
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-16">
      <h2 className="text-2xl font-semibold tracking-tight">The fourteen modules</h2>
      <p className="mt-2 max-w-prose text-ink-muted">
        In order. Each one assumes the ones before it.
      </p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((mod) => (
          <li key={mod.slug} className="flex">
            <ModuleCard module={mod} />
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 7: Create `components/landing/Features.tsx`**

```tsx
import { GitCompare, ListOrdered, Ruler } from "lucide-react";

const FEATURES = [
  {
    icon: ListOrdered,
    title: "Sequenced, not searched",
    body: "Topics are ordered so each one rests on the last. You can read straight through.",
  },
  {
    icon: GitCompare,
    title: "Tradeoffs made explicit",
    body: "Every design choice is presented as what it buys and what it costs, side by side.",
  },
  {
    icon: Ruler,
    title: "Numbers, not vibes",
    body: "Capacity estimates, latency budgets, and amplification factors, worked out.",
  },
];

export function Features() {
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-16">
      <ul className="grid gap-4 sm:grid-cols-3">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <li
              key={feature.title}
              className="rounded-card border-2 border-structural bg-card p-5"
            >
              <Icon aria-hidden className="size-6" />
              <h3 className="mt-3 font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-ink-muted">{feature.body}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
```

- [ ] **Step 8: Create `components/landing/Audience.tsx`**

This replaces the reference's testimonial wall, per spec §6.1.

```tsx
const FOR = [
  "Engineers preparing for senior and staff system design interviews",
  "Backend developers who can build services but want the reasoning behind the choices",
  "Anyone who has read scattered blog posts and wants one ordered path",
];

const NOT_FOR = [
  "Complete beginners — this assumes you have written and shipped a service",
  "Anyone looking for memorisable answers rather than tradeoffs",
];

export function Audience() {
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-16">
      <h2 className="text-2xl font-semibold tracking-tight">Who this is for</h2>

      <div className="mt-8 flex flex-col gap-4 md:flex-row">
        <div className="flex-1 rounded-card border-2 border-structural bg-card p-5">
          <h3 className="font-mono text-xs uppercase tracking-wider">Written for</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {FOR.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden className="font-mono">+</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex-1 rounded-card border-2 border-structural bg-card p-5">
          <h3 className="font-mono text-xs uppercase tracking-wider">Not written for</h3>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            {NOT_FOR.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden className="font-mono">−</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 9: Create `components/landing/Testimonials.tsx`**

Built now, rendered nowhere until real quotes exist.

```tsx
export type Quote = { quote: string; name: string; role: string };

/**
 * Renders nothing without real, attributed quotes. Name and role are
 * required by the type, so an unattributed testimonial cannot compile.
 * Not currently rendered anywhere — wire it in when quotes are collected.
 */
export function Testimonials({ quotes }: { quotes: Quote[] }) {
  if (quotes.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1200px] px-4 py-16">
      <h2 className="text-2xl font-semibold tracking-tight">What readers say</h2>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quotes.map((item) => (
          <li key={item.quote} className="rounded-card border-2 border-structural bg-card p-5">
            <blockquote className="text-sm">{item.quote}</blockquote>
            <p className="mt-4 font-mono text-xs">
              <span className="block">{item.name}</span>
              <span className="block text-ink-muted">{item.role}</span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 10: Create `components/landing/Subscribe.tsx`**

```tsx
export function Subscribe() {
  // Read inside the component, not at module scope: a module-level constant is
  // captured at import time, which makes vi.stubEnv in the test a no-op. Next
  // still inlines NEXT_PUBLIC_* at build time, so this stays a Server
  // Component with no client JavaScript.
  const endpoint = process.env.NEXT_PUBLIC_SUBSCRIBE_ENDPOINT;
  const configured = Boolean(endpoint && endpoint.length > 0);

  return (
    <section className="mx-auto max-w-[1200px] px-4 py-16">
      <div className="rounded-card border-2 border-structural bg-card p-8 shadow-hard">
        <h2 className="text-2xl font-semibold tracking-tight">
          Get told when a module lands
        </h2>

        {configured ? (
          <form
            action={endpoint}
            method="post"
            className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <label htmlFor="subscribe-email" className="block font-mono text-xs uppercase tracking-wider">
                Email address
              </label>
              <input
                id="subscribe-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="mt-2 min-h-11 w-full rounded-card border-2 border-structural bg-paper px-3 text-base"
              />
            </div>
            <button
              type="submit"
              className="min-h-11 rounded-card border-2 border-structural bg-ink px-5 font-medium text-paper transition-brut hover:shadow-hard"
            >
              Notify me
            </button>
          </form>
        ) : (
          // No backend exists yet. Saying so beats a form that pretends to work.
          <p className="mt-4 max-w-prose text-sm text-ink-muted">
            Email signup is not yet configured, so there is no list to join
            right now. In the meantime the whole syllabus is already readable —
            no account needed.
          </p>
        )}
      </div>
    </section>
  );
}
```

`process.env.NEXT_PUBLIC_*` is inlined at build time, so this stays a Server Component with no client JavaScript. Reading it inside the function body rather than at module scope is what makes the `vi.stubEnv` test in Step 1 meaningful.

- [ ] **Step 11: Create `app/(marketing)/page.tsx` and delete the scaffolded home page**

```bash
rm app/page.tsx
```

```tsx
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Audience } from "@/components/landing/Audience";
import { Features } from "@/components/landing/Features";
import { Hero } from "@/components/landing/Hero";
import { ModuleGrid } from "@/components/landing/ModuleGrid";
import { PathCards } from "@/components/landing/PathCards";
import { Stats } from "@/components/landing/Stats";
import { Subscribe } from "@/components/landing/Subscribe";
import { courseSlug, getCourses, getCourseStats, getModules } from "@/lib/content";

export default function HomePage() {
  const stats = getCourseStats(courseSlug);

  return (
    <>
      <AnnouncementBar
        id="launch-2026-09"
        message="System design is live — 14 modules, 179 topics"
        href="/system-design"
        cta="Start reading"
      />
      <Hero moduleCount={stats.moduleCount} topicCount={stats.topicCount} />
      <Stats {...stats} />
      <PathCards courses={getCourses()} />
      <ModuleGrid modules={getModules(courseSlug)} />
      <Features />
      <Audience />
      <Subscribe />
    </>
  );
}
```

The announcement bar sits inside the page rather than the layout so only the home page carries it.

- [ ] **Step 12: Create `app/(marketing)/courses/page.tsx`**

```tsx
import type { Metadata } from "next";
import { PathCards } from "@/components/landing/PathCards";
import { getCourses } from "@/lib/content";

export const metadata: Metadata = {
  title: "Paths",
  description: "Learning paths on Cineshek. System design is live; more are planned.",
};

export default function CoursesPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-12">
      <h1 className="font-pixel text-4xl">Paths</h1>
      <p className="mt-3 max-w-prose text-ink-muted">
        System design is written and readable now. The rest are planned, not promised.
      </p>
      <PathCards courses={getCourses()} />
    </div>
  );
}
```

- [ ] **Step 13: Run the tests and build**

Run: `npm test && npm run build`
Expected: tests pass; the route table lists `/`, `/courses`, `/syllabus`, `/system-design`, plus the 14 module and 179 lesson routes.

- [ ] **Step 14: Commit**

```bash
git add components/landing "app/(marketing)" tests/components/landing.test.tsx
git commit -m "feat: add landing page

No testimonial wall and no institutional logos — there are no users yet,
so Audience replaces that slot and Testimonials ships unused behind a
type that requires attribution. Subscribe states plainly that there is no
list rather than faking a success state."
```

---

## Task 14: Search palette

**Files:**
- Create: `scripts/build-search-index.ts`, `tests/content/search-index.test.ts`
- Modify: `components/search/SearchPalette.tsx` (replace the Task 6 placeholder), `package.json` (add `prebuild`)
- Test: `tests/content/search-index.test.ts`

**Interfaces:**
- Consumes: `getSearchIndex`, `courseSlug` from Task 5.
- Produces: `public/search-index.json` (a `SearchDoc[]`); the real `<SearchPalette />`.

- [ ] **Step 1: Write the failing test**

Create `tests/content/search-index.test.ts`:

```ts
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { getSearchIndex, courseSlug } from "@/lib/content";

const OUT = "public/search-index.json";

describe("build-search-index script", () => {
  beforeAll(() => {
    rmSync(OUT, { force: true });
    execFileSync("npx", ["tsx", "scripts/build-search-index.ts"], { stdio: "pipe" });
  });

  it("writes the index file", () => {
    expect(existsSync(OUT)).toBe(true);
  });

  it("matches what the content layer reports", () => {
    const written = JSON.parse(readFileSync(OUT, "utf8"));
    expect(written).toEqual(getSearchIndex(courseSlug));
  });

  it("carries only the five search fields", () => {
    const written: Array<Record<string, unknown>> = JSON.parse(readFileSync(OUT, "utf8"));
    for (const doc of written) {
      expect(Object.keys(doc).sort()).toEqual(["module", "number", "summary", "title", "url"]);
    }
  });

  it("stays small enough to fetch on demand", () => {
    const bytes = readFileSync(OUT).byteLength;
    expect(bytes).toBeLessThan(200_000);
  });
});
```

The size assertion is a budget, not trivia: the index is fetched on first palette open, and a runaway index would make that open feel slow.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/content/search-index.test.ts`
Expected: FAIL — the script does not exist, so `execFileSync` throws in `beforeAll`.

- [ ] **Step 3: Implement `scripts/build-search-index.ts`**

```ts
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { courseSlug, getSearchIndex } from "@/lib/content";

const OUT_DIR = join(process.cwd(), "public");
const OUT_FILE = join(OUT_DIR, "search-index.json");

const docs = getSearchIndex(courseSlug);
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_FILE, JSON.stringify(docs), "utf8");

console.log(`search index written: ${docs.length} published lesson(s) -> public/search-index.json`);
```

`tsx` resolves the `@/` alias from `tsconfig.json`, so no extra configuration is needed.

- [ ] **Step 4: Add the `prebuild` script to `package.json`**

The index is a build artifact and is gitignored, so it must be regenerated before every build.

```json
"prebuild": "npm run content:index",
```

- [ ] **Step 5: Replace `components/search/SearchPalette.tsx`**

Client leaf 6 of 6.

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { Search } from "lucide-react";
import type { SearchDoc } from "@/lib/content";

export function SearchPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [docs, setDocs] = useState<SearchDoc[] | null>(null);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const fuseRef = useRef<Fuse<SearchDoc> | null>(null);

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
        fuseRef.current = new Fuse(loaded, {
          keys: [
            { name: "title", weight: 3 },
            { name: "number", weight: 2 },
            { name: "summary", weight: 1 },
            { name: "module", weight: 1 },
          ],
          threshold: 0.35,
          ignoreLocation: true,
        });
      })
      .catch(() => setDocs([]));
    return () => {
      cancelled = true;
    };
  }, [open, docs]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    else triggerRef.current?.focus(); // focus returns to the trigger on close
  }, [open]);

  const results =
    query.trim().length > 0 && fuseRef.current
      ? fuseRef.current.search(query.trim(), { limit: 8 }).map((r) => r.item)
      : (docs ?? []).slice(0, 8);

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
              placeholder="Search 179 topics…"
              autoComplete="off"
              className="min-h-13 w-full border-b-2 border-structural bg-transparent px-4 text-base outline-none"
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
              <ul role="listbox" aria-label="Search results" className="max-h-80 overflow-y-auto p-2">
                {results.map((doc, i) => (
                  <li key={doc.url}>
                    <button
                      type="button"
                      role="option"
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
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
```

The empty state distinguishes "nothing published yet" from "no match for this query" — with 179 drafts those are very different messages.

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run tests/content/search-index.test.ts`
Expected: PASS.

- [ ] **Step 7: Verify the full build**

Run: `npm run build`
Expected: `prebuild` logs the index line before the build starts.

- [ ] **Step 8: Commit**

```bash
git add scripts/build-search-index.ts components/search/SearchPalette.tsx package.json tests/content/search-index.test.ts
git commit -m "feat: add command-palette search

Index is fetched on first open rather than shipped in the bundle, and is
regenerated by prebuild since it is a gitignored build artifact."
```

---

## Task 15: Metadata, sitemap, and error states

**Files:**
- Create: `lib/site.ts`, `app/sitemap.ts`, `app/robots.ts`, `app/not-found.tsx`, `app/error.tsx`, `components/seo/CourseJsonLd.tsx`, `tests/content/sitemap.test.ts`
- Modify: `app/system-design/[module]/[topic]/page.tsx` (add JSON-LD)
- Test: `tests/content/sitemap.test.ts`

**Interfaces:**
- Consumes: `getModules`, `getCourseStats`, `courseSlug` from Task 5.
- Produces: `SITE_URL` from `lib/site.ts`, `sitemap()`, `robots()`, `<CourseJsonLd lesson module />`, themed 404 and error boundaries. `SITE_URL` reads `NEXT_PUBLIC_SITE_URL`, defaulting to `http://localhost:3000`.

- [ ] **Step 1: Write the failing test**

Create `tests/content/sitemap.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { courseSlug, getCourseStats, getModules } from "@/lib/content";

describe("sitemap", () => {
  const entries = sitemap();

  it("includes every static page plus all modules and lessons", () => {
    const stats = getCourseStats(courseSlug);
    // 4 static (/, /courses, /syllabus, /system-design) + 14 modules + 179 lessons
    expect(entries).toHaveLength(4 + stats.moduleCount + stats.topicCount);
  });

  it("emits absolute urls", () => {
    for (const entry of entries) {
      expect(entry.url).toMatch(/^https?:\/\//);
    }
  });

  it("contains no duplicate urls", () => {
    const urls = entries.map((e) => e.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("includes a known lesson url", () => {
    const first = getModules(courseSlug)[0].lessons[0];
    expect(entries.some((e) => e.url.endsWith(first.url))).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/content/sitemap.test.ts`
Expected: FAIL — unresolved import.

- [ ] **Step 3: Create `lib/site.ts`, then `app/sitemap.ts`**

`SITE_URL` lives in its own module rather than in `app/sitemap.ts`, so a component importing it does not pull a route handler into its module graph.

```ts
// lib/site.ts
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
```

```ts
// app/sitemap.ts
import type { MetadataRoute } from "next";
import { courseSlug, getModules } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const modules = getModules(courseSlug);

  const staticPages = ["/", "/courses", "/syllabus", `/${courseSlug}`].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "/" ? 1 : 0.8,
  }));

  const modulePages = modules.map((mod) => ({
    url: `${SITE_URL}${mod.url}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const lessonPages = modules.flatMap((mod) =>
    mod.lessons.map((lesson) => ({
      url: `${SITE_URL}${lesson.url}`,
      lastModified: lesson.updated ? new Date(lesson.updated) : now,
      changeFrequency: "monthly" as const,
      priority: lesson.status === "published" ? 0.6 : 0.3,
    })),
  );

  return [...staticPages, ...modulePages, ...lessonPages];
}
```

- [ ] **Step 4: Create `app/robots.ts`**

```ts
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
```

- [ ] **Step 5: Create `components/seo/CourseJsonLd.tsx`**

```tsx
import type { Lesson, Module } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

export function CourseJsonLd({ lesson, module: mod }: { lesson: Lesson; module: Module }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: lesson.title,
    description: lesson.summary,
    url: `${SITE_URL}${lesson.url}`,
    learningResourceType: "Lesson",
    educationalLevel: lesson.difficulty,
    timeRequired: `PT${lesson.estMinutes}M`,
    isPartOf: {
      "@type": "Course",
      name: "System design in depth",
      url: `${SITE_URL}/system-design`,
      hasPart: { "@type": "CourseInstance", name: mod.title },
    },
  };

  return (
    <script
      type="application/ld+json"
      // Content is our own frontmatter, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

- [ ] **Step 6: Render the JSON-LD in the lesson page**

In `app/system-design/[module]/[topic]/page.tsx`, add the import and place the component as the first child of `<article>`:

```tsx
import { CourseJsonLd } from "@/components/seo/CourseJsonLd";
```

```tsx
      <article className="min-w-0">
        <CourseJsonLd lesson={lesson} module={mod} />
        <LessonHeader lesson={lesson} module={mod} />
```

- [ ] **Step 7: Create `app/not-found.tsx`**

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-4 text-center">
      <p className="font-pixel text-6xl">404</p>
      <h1 className="mt-4 text-2xl font-semibold">That page is not here</h1>
      <p className="mt-3 text-ink-muted">
        The lesson may have been renamed. The syllabus lists every topic that exists.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href="/syllabus">Browse syllabus</Button>
        <Button href="/" variant="secondary">
          Home
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Create `app/error.tsx`**

An error boundary must be a Client Component — this is a framework requirement, not a seventh discretionary client leaf, so add `"error"` to the allow-list in `tests/content/boundaries.test.ts`:

```ts
  const ALLOWED_CLIENT = new Set([
    "ThemeToggle", "AnnouncementBar", "SidebarTree",
    "TableOfContents", "ProgressTracker", "SearchPalette",
    "error", // Next.js requires error boundaries to be client components
  ]);
```

```tsx
"use client";

import { Button } from "@/components/ui/Button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-4 text-center">
      <p className="font-pixel text-5xl">Oops</p>
      <h1 className="mt-4 text-2xl font-semibold">Something broke rendering this page</h1>
      <p className="mt-3 text-ink-muted">
        This is a bug on our side, not something you did.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button href="/" variant="secondary">
          Home
        </Button>
      </div>
    </div>
  );
}
```

`Button` currently accepts no `onClick`. Add it to `components/ui/Button.tsx`'s `Props`:

```tsx
  onClick?: () => void;
```

and spread it through `...rest`, which the existing implementation already does.

- [ ] **Step 9: Run the tests and build**

Run: `npm test && npm run build`
Expected: tests pass, including the updated boundary test. Build emits `/sitemap.xml` and `/robots.txt`.

- [ ] **Step 10: Commit**

```bash
git add lib/site.ts app/sitemap.ts app/robots.ts app/not-found.tsx app/error.tsx components/seo "app/system-design/[module]/[topic]/page.tsx" components/ui/Button.tsx tests/content/sitemap.test.ts tests/content/boundaries.test.ts
git commit -m "feat: add sitemap, robots, JSON-LD, and themed error states

Draft lessons get lower sitemap priority than written ones. The error
boundary is on the client allow-list because Next requires it to be one."
```

---

## Task 16: Write the three sample lessons

**Files:**
- Modify: `content/system-design/01-foundations/requirements-clarification.mdx`, `content/system-design/04-nosql-partitioning-ids/bloom-filters.mdx`, `content/system-design/07-storage-engines/lsm-tree-storage-engine.mdx`
- Test: existing content-layer tests cover them; one new assertion is added.

**Interfaces:**
- Consumes: the MDX components from Task 7.
- Produces: three lessons with `status: published`, which activates prev/next chaining and populates the search index.

- [ ] **Step 1: Add the failing assertion**

Append to `tests/content/content-layer.test.ts`:

```ts
describe("sample lessons are written", () => {
  const SAMPLES = [
    { module: "foundations", slug: "requirements-clarification" },
    { module: "nosql-partitioning-ids", slug: "bloom-filters" },
    { module: "storage-engines", slug: "lsm-tree-storage-engine" },
  ];

  it.each(SAMPLES)("$slug is published with real content", ({ module, slug }) => {
    const lesson = getLesson("system-design", module, slug);
    expect(lesson).not.toBeNull();
    expect(lesson!.status).toBe("published");
    expect(lesson!.body.length).toBeGreaterThan(1500);
    expect(lesson!.body).not.toContain('forItems={["", ""]}');
  });

  it("chains the three published lessons in course order", () => {
    const index = getSearchIndex("system-design");
    expect(index.map((d) => d.number)).toEqual(["01.01", "04.13", "07.09"]);
  });
});
```

The `forItems={["", ""]}` assertion catches a lesson that was marked published while still carrying stub placeholders.

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/content/content-layer.test.ts`
Expected: FAIL — the three lessons are still `status: draft` stubs.

- [ ] **Step 3: Write `01.01 Requirements Clarification`**

Frontmatter to set: `status: published`, `difficulty: intro`, `estMinutes: 9`, `updated: 2026-09-08`, `summary: "The questions that turn a vague prompt into a bounded problem, and why guessing scale early is the most expensive mistake."`, `tags: [requirements, process, scoping]`.

Body structure — prose, lists, one `<Callout type="gotcha">`, one `<Tradeoff>`, one `<KeyTakeaways>`. No diagram. Content must cover: functional versus non-functional split; who the actors are; the read/write ratio question; the four numbers worth asking for (DAU, requests per second at peak, payload size, retention); what to do when the interviewer will not give numbers; and the distinction between clarifying and stalling.

- [ ] **Step 4: Write `04.13 Bloom Filters`**

Frontmatter: `status: published`, `difficulty: core`, `estMinutes: 14`, `updated: 2026-09-08`, `summary: "A probabilistic set membership test that answers 'definitely not present' with certainty and 'probably present' with a tunable error rate."`, `tags: [probabilistic, filters, storage]`.

Body must include a `<Formula label="False positive probability">` carrying `p ≈ (1 − e^(−kn/m))^k`, a worked numeric example (n = 1,000,000, p = 1%, giving m ≈ 9.6 Mbit ≈ 1.2 MB and k ≈ 7), a `<Steps>` walkthrough of insert and query, a `<Tradeoff>` on Bloom versus an exact set, a `<Callout type="gotcha">` on the impossibility of deletion without a counting variant, and a GFM table of operation costs. Cover where it is actually used: LSM read paths and cache-miss avoidance.

- [ ] **Step 5: Write `07.09 LSM Tree Storage Engine`**

Frontmatter: `status: published`, `difficulty: deep`, `estMinutes: 22`, `updated: 2026-09-08`, `summary: "Why write-optimised engines buffer in memory and merge on disk, and what that costs on the read path."`, `tags: [storage, lsm, compaction]`.

Body must include an inline-SVG diagram via `<Figure>` showing memtable → WAL → SSTable levels → compaction, a `<Steps>` write path and a separate `<Steps>` read path, a `<Tradeoff>` of LSM versus B-tree, a table of write/read/space amplification, and a `<Callout type="note">` cross-referencing `04.13 Bloom Filters` for the read-path filter.

The diagram must be an inline SVG using `currentColor` for strokes so it works in both themes, saved to `public/diagrams/lsm-tree.svg`, and referenced with real `alt` text describing the flow — `<Figure>` throws otherwise.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS. The prev/next chain tests now exercise a real three-lesson chain instead of an empty one, and the search-index count test now expects 3.

- [ ] **Step 7: Read the rendered pages**

Run: `npm run build && npm start`

Open all three lessons and confirm: the table of contents matches the headings, `<Tradeoff>` columns sit side by side above 768px and stack below it, the code and formula blocks scroll rather than widening the page, prev/next links connect the three lessons, and the diagram is legible in both themes.

- [ ] **Step 8: Commit**

```bash
git add content/system-design public/diagrams tests/content/content-layer.test.ts
git commit -m "content: write the three sample lessons

Requirements Clarification, Bloom Filters, and LSM Tree Storage Engine
are published, which activates prev/next chaining and the search index.
A test asserts published lessons carry no leftover stub placeholders."
```

---

## Task 17: End-to-end and accessibility suite

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/smoke.spec.ts`, `tests/e2e/a11y.spec.ts`, `tests/e2e/interaction.spec.ts`
- Test: the files themselves

**Interfaces:**
- Consumes: the built site.
- Produces: `npm run test:e2e`.

- [ ] **Step 1: Create `playwright.config.ts`**

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: "http://localhost:3000", trace: "on-first-retry" },
  projects: [
    { name: "mobile-375", use: { ...devices["Desktop Chrome"], viewport: { width: 375, height: 700 } } },
    { name: "tablet-768", use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 900 } } },
    { name: "laptop-1024", use: { ...devices["Desktop Chrome"], viewport: { width: 1024, height: 800 } } },
    { name: "desktop-1440", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: "npm run build && npm start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
```

- [ ] **Step 2: Install the browser binary**

```bash
npx playwright install chromium
```

- [ ] **Step 3: Create `tests/e2e/smoke.spec.ts`**

```ts
import { expect, test } from "@playwright/test";

const PAGES = [
  { path: "/", heading: /Everything a senior engineer knows/i },
  { path: "/courses", heading: /^Paths$/ },
  { path: "/syllabus", heading: /^Syllabus$/ },
  { path: "/system-design", heading: /System design in depth/i },
  { path: "/system-design/foundations", heading: /Foundations/i },
  {
    path: "/system-design/foundations/requirements-clarification",
    heading: /Requirements Clarification/i,
  },
];

for (const page_ of PAGES) {
  test(`${page_.path} renders with exactly one h1`, async ({ page }) => {
    await page.goto(page_.path);
    const h1s = page.locator("h1");
    await expect(h1s).toHaveCount(1);
    await expect(h1s.first()).toHaveText(page_.heading);
  });

  test(`${page_.path} does not scroll horizontally`, async ({ page }) => {
    await page.goto(page_.path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    // Allow 1px for subpixel rounding.
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

test("an unknown lesson returns the themed 404", async ({ page }) => {
  const response = await page.goto("/system-design/foundations/no-such-lesson");
  expect(response?.status()).toBe(404);
  await expect(page.getByText("That page is not here")).toBeVisible();
});

test("all 14 module cards link somewhere real", async ({ page }) => {
  await page.goto("/system-design");
  const links = page.locator("ul li a[href^='/system-design/']");
  await expect(links).toHaveCount(14);
  for (const href of await links.evaluateAll((els) => els.map((e) => e.getAttribute("href")))) {
    const response = await page.request.get(href!);
    expect(response.status(), `${href} should resolve`).toBe(200);
  }
});
```

- [ ] **Step 4: Create `tests/e2e/a11y.spec.ts`**

```ts
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES = [
  "/",
  "/courses",
  "/syllabus",
  "/system-design",
  "/system-design/storage-engines",
  "/system-design/storage-engines/lsm-tree-storage-engine",
];

for (const path of PAGES) {
  test(`${path} has no critical or serious axe violations (light)`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(
      blocking,
      blocking.map((v) => `${v.id}: ${v.help}`).join("\n"),
    ).toEqual([]);
  });

  test(`${path} has no critical or serious axe violations (dark)`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(
      blocking,
      blocking.map((v) => `${v.id}: ${v.help}`).join("\n"),
    ).toEqual([]);
  });
}
```

Both themes are scanned because the contrast tests in Task 2 cover the token pairs but not what the pairs actually get composed into on a page.

- [ ] **Step 5: Create `tests/e2e/interaction.spec.ts`**

```ts
import { expect, test } from "@playwright/test";

test("search palette is fully keyboard operable", async ({ page }) => {
  await page.goto("/system-design");
  await page.keyboard.press("ControlOrMeta+k");

  const dialog = page.getByRole("dialog", { name: /search lessons/i });
  await expect(dialog).toBeVisible();
  await expect(page.getByPlaceholder(/search 179 topics/i)).toBeFocused();

  await page.keyboard.type("bloom");
  const option = page.getByRole("option").first();
  await expect(option).toContainText(/Bloom Filters/i);

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/bloom-filters$/);
  await expect(page.locator("h1")).toContainText(/Bloom Filters/i);
});

test("escape closes the palette and returns focus to the trigger", async ({ page }) => {
  await page.goto("/system-design");
  const trigger = page.getByRole("button", { name: /search lessons/i });
  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("theme choice survives a reload without a flash of the wrong theme", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /switch to dark theme/i }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.reload();
  // Asserted immediately after load: a post-hydration correction would fail here.
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("marking a lesson complete persists across a reload", async ({ page }) => {
  const url = "/system-design/nosql-partitioning-ids/bloom-filters";
  await page.goto(url);

  const button = page.getByRole("button", { name: /mark complete/i });
  await button.click();
  await expect(page.getByRole("button", { name: /completed/i })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await page.reload();
  await expect(page.getByRole("button", { name: /completed/i })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("table of contents jumps to the matching heading", async ({ page, viewport }) => {
  test.skip((viewport?.width ?? 0) < 1280, "table of contents is xl-only");

  await page.goto("/system-design/storage-engines/lsm-tree-storage-engine");
  const toc = page.getByRole("navigation", { name: /on this page/i });
  const first = toc.getByRole("link").first();
  const href = await first.getAttribute("href");
  await first.click();

  const target = page.locator(href!);
  await expect(target).toBeInViewport();
});

test("announcement bar stays dismissed", async ({ page }) => {
  await page.goto("/");
  const dismiss = page.getByRole("button", { name: /dismiss announcement/i });
  await dismiss.click();
  await expect(dismiss).toBeHidden();

  await page.reload();
  await expect(page.getByRole("button", { name: /dismiss announcement/i })).toBeHidden();
});

test("reduced motion renders final states", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
  const duration = await page
    .locator("a[href='/system-design']")
    .first()
    .evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(duration).toBe("0.001s");
});

test("sidebar collapses other modules and marks the current lesson", async ({ page, viewport }) => {
  test.skip((viewport?.width ?? 0) < 1024, "sidebar is lg-only");

  await page.goto("/system-design/nosql-partitioning-ids/bloom-filters");
  const nav = page.getByRole("navigation", { name: /course contents/i });
  await expect(nav.getByRole("link", { current: "page" })).toContainText(/Bloom Filters/i);
  await expect(
    nav.getByRole("button", { name: /NoSQL, Partitioning & IDs/ }),
  ).toHaveAttribute("aria-expanded", "true");
});
```

- [ ] **Step 6: Run the suite**

Run: `npm run test:e2e`
Expected: all projects pass. Fix any failure before proceeding — an axe violation here is a real defect, not test noise.

- [ ] **Step 7: Commit**

```bash
git add playwright.config.ts tests/e2e
git commit -m "test: add e2e smoke, axe, and interaction suites

Runs at 375/768/1024/1440 and scans axe in both themes, since token-pair
contrast tests cannot see what pairs get composed into on a page."
```

---

## Task 18: README and final verification

**Files:**
- Create: `README.md`, `.env.example`
- Modify: `package.json` (add `verify:all`)

**Interfaces:**
- Consumes: everything.
- Produces: a documented, verified repository.

- [ ] **Step 1: Create `.env.example`**

```bash
# Absolute site origin, used for sitemap, robots, and JSON-LD.
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Where the newsletter form posts. Leave unset and the form honestly says
# signup is not configured rather than faking a success state.
NEXT_PUBLIC_SUBSCRIBE_ENDPOINT=
```

- [ ] **Step 2: Create `README.md`**

Must document: what the project is; `npm install` then `npm run dev`; the full script table; that `SDsyllabus.md` is the curriculum source of truth and `npm run content:generate` is idempotent; how to write a lesson (frontmatter fields, the MDX components available, and that `status: draft` keeps a lesson out of search and prev/next while leaving its URL live); that the six client components are a deliberate constraint enforced by `tests/content/boundaries.test.ts`; that module colours are enforced at AA by `tests/design/contrast.test.ts` and must not be edited without re-running it; and links to the spec and this plan.

- [ ] **Step 3: Add the aggregate verification script**

```json
"verify:all": "npm run lint && npm run typecheck && npm run test && npm run build && npm run test:e2e",
```

- [ ] **Step 4: Run the full verification**

Run: `npm run verify:all`
Expected: typecheck clean, all Vitest suites pass, build generates 179 lesson pages plus 14 module pages, Playwright green on all four viewports.

- [ ] **Step 5: Confirm the counts one final time**

```bash
find content/system-design -name '*.mdx' | wc -l              # 179
find .next/server/app/system-design -name '*.html' | wc -l    # 179
grep -rl '"use client"' app components lib | sort             # 7 files: the six leaves + app/error.tsx
```

- [ ] **Step 6: Commit**

```bash
git add README.md .env.example package.json
git commit -m "docs: add README and aggregate verification script"
```

---

## Self-review

Run after the plan is written, before execution.

**Spec coverage.** Every numbered spec section maps to a task:

| Spec | Task |
|---|---|
| §3.1–3.2 content architecture and adapter | 5 |
| §3.3 frontmatter schema | 5 |
| §3.4 module metadata | 4 (as typed TS — see Deviations) |
| §3.5 generator and syllabus defect | 4 |
| §3.6 stub template | 4 |
| §3.7 three sample lessons | 16 |
| §4.1 typography | 3 |
| §4.2 base colour tokens | 2, 3 |
| §4.3 the 14 module surfaces | 2 |
| §4.4 refined neo-brutalism | 3, 6 |
| §4.5 motion and reduced motion | 3, 17 |
| §4.6 spacing, breakpoints, no sideways scroll | 3, 7, 17 |
| §5 routes | 8, 11, 12, 13, 15 |
| §6 landing sections | 13 |
| §6.1 integrity decisions | 13 |
| §6.2 placeholder paths | 5 |
| §7 lesson page and three columns | 8, 9 |
| §7.1 MDX components | 7 |
| §7.2 server-first, six client leaves | 5 (enforced), 3, 6, 9, 10, 14 |
| §7.3 progress tracking | 10 |
| §8 search | 14 |
| §9 accessibility, performance, SEO, theming | 3, 15, 17 |
| §10 testing | 2, 4, 5, 8, 9, 10, 14, 15, 17 |
| §11 project structure | file-structure table |
| §12 deferred features | 5 (`free` parsed, adapter boundary), 10 (hook interface) |

No spec section is unimplemented.

**Placeholder scan.** No `TBD`, `TODO`, "implement later", "add error handling", or "similar to Task N" appears in any step. Task 16 specifies lesson content by required structure and exact frontmatter values rather than pasting 4,000 words of prose — the deliverable is bounded by the assertions in its Step 1, which fail on leftover stub markers and on bodies under 1,500 characters.

**Type consistency.** Checked across tasks:
- `getLesson` returns `Lesson | null` everywhere; only `getLesson` carries `body`, and Task 5's test asserts listings do not.
- `LessonRef` has exactly `{ title, number, url }` in Task 5 and is consumed with those fields in Task 8's `LessonNav`.
- `SidebarModule` / `SidebarLesson` shapes in Task 9 match the projection built in Task 8's page.
- `Heading` is `{ id, text, level: 2 | 3 }` in Task 8 and consumed unchanged in Task 9.
- `ColorKey` is defined once in Task 2 and imported by Tasks 4, 5, 6, 9, 11, 13.
- `progressStore` exposes the same eight members in Task 10's implementation, test, and `useProgress`.
- `Module` carries `publishedCount` and `totalCount` in Task 5 and both are read in Tasks 11 and 13.

**Six issues found and fixed inline while reviewing:**

1. `CourseProgress` was originally its own file in `components/course/`, which would have made a seventh client component and failed the boundary test. It now lives in the already-client `ProgressTracker.tsx`, and Task 11's Files block no longer lists the separate file.
2. `app/error.tsx` must be a Client Component because Next requires it. Task 15 Step 8 now updates the boundary test's allow-list rather than leaving behind a test that would fail.
3. `Header` imports `SearchPalette`, which Task 14 builds. Task 6 Step 9 now creates a null-returning placeholder so Task 6 is independently buildable.
4. Task 12's Files block named `app/syllabus/page.tsx` while its steps used the route-group path. Both now read `app/(marketing)/syllabus/page.tsx`.
5. `SITE_URL` was exported from `app/sitemap.ts` and imported by `CourseJsonLd`, which would pull a route handler into a component's module graph. It now lives in `lib/site.ts`, imported by both.
6. The spec's syllabus-parsing rule ("keep the first occurrence") was found to be wrong when the algorithm was prototyped against the real file — it yields 14 modules with zero topics, because the file opens with a topic-less table of contents. Task 4 documents the correction and carries a regression test for exactly that input shape.
