# Cineshek — System Design learning site

A static Next.js site that teaches system design as a sequence of short,
linked lessons. The curriculum — 14 modules, 179 topics — is generated from
`SDsyllabus.md` into MDX files under `content/system-design/`, then rendered
by a small set of routes: a landing page, `/courses`, `/syllabus`, a
per-module overview, and a three-column lesson page with sidebar navigation,
a table of contents, and per-browser progress tracking. Search is a `⌘K`
command palette backed by a build-time JSON index. Everything ships
statically — there is no server, no database, and no accounts; the only
optional runtime configuration is where the email-capture form posts to.

The site is built so a second course (the roadmap in `content/courses.ts`
lists `ai-research`, `ml-maths`, `inference-engineering` as placeholders) can
be added later as a content directory plus one registry entry, without new
page components.

Full design rationale: `docs/superpowers/specs/2026-09-08-cineshek-system-design-site-design.md`.
The task-by-task implementation plan that built this repo:
`docs/superpowers/plans/2026-09-08-cineshek-system-design-site.md`.

## Getting started

```bash
npm install
cp .env.example .env.local   # optional — see below
npm run dev
```

Then open `http://localhost:3000`.

### Environment variables

See `.env.example`. Both are optional in development:

- `NEXT_PUBLIC_SITE_URL` — absolute origin used to build the sitemap,
  `robots.txt`, and JSON-LD. Defaults to `http://localhost:3000` if unset
  (`lib/site.ts`).
- `NEXT_PUBLIC_SUBSCRIBE_ENDPOINT` — where the landing page's email-capture
  form posts. If unset, the form does not fake a success state; it renders an
  honest "signup is not configured yet" message instead
  (`components/landing/Subscribe.tsx`).

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Next.js dev server. |
| `npm run build` | Production build. `prebuild` (below) runs first automatically. |
| `npm run prebuild` | Regenerates `public/search-index.json` from published lessons. Runs automatically before `build`; you should not need to call it directly. |
| `npm start` | Serves the production build from `.next/`. Run `build` first. |
| `npm run lint` | ESLint, zero errors and zero warnings required. |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm test` | Vitest unit/component/content-layer suite (single run). |
| `npm run test:watch` | Same suite in watch mode. |
| `npm run test:e2e` | Playwright end-to-end + accessibility suite across four viewports. Builds and starts the app itself (see `playwright.config.ts`'s `webServer`). |
| `npm run content:generate` | Regenerates `content/system-design/modules.ts` and creates any missing lesson stub `.mdx` files from `SDsyllabus.md`. Idempotent — see below. |
| `npm run content:index` | Regenerates `public/search-index.json` directly. This is what `prebuild` calls. |
| `npm run verify` | `lint && typecheck && test && build` — the fast pre-commit gate. Does **not** run the e2e suite. |
| `npm run verify:all` | Everything `verify` runs, plus `test:e2e` at the end. This is the full gate; run it before considering a change done. Expect the e2e portion to add roughly a minute on top of the build, since Playwright's `webServer` rebuilds and boots the app itself. |

## The curriculum: `SDsyllabus.md`

`SDsyllabus.md` at the repo root is the single source of truth for the
course outline — module ids, titles, blurbs, declared topic counts, and the
179 topics themselves. Nothing under `content/system-design/` should be
treated as authoritative on its own; it is generated output plus hand-written
lesson bodies.

Run `npm run content:generate` after editing the syllabus. It:

1. Parses `SDsyllabus.md` (via `scripts/lib/parse-syllabus.ts`) into 14
   modules and 179 topics, and refuses to proceed if those counts don't match.
2. Rewrites `content/system-design/modules.ts` (always — this file is
   generated and safe to overwrite).
3. Creates a stub `.mdx` file for any topic that doesn't already have one.
   **It never overwrites an existing lesson file.** Re-running the script
   after you've written real content for a topic is safe; only genuinely new
   topics get new stub files.

**A defect in `SDsyllabus.md` the parser has to work around:** the file lists
every module more than once — it opens with a table-of-contents block giving
each module's id and title but no topics, then the real per-module sections,
then a partial repeat. A parser that naively kept only the first occurrence
of each module id would read the topic-less table of contents and return 14
modules with zero topics. `parse-syllabus.ts` instead accumulates topics
across every occurrence of a module (deduped by topic number) and keeps the
first non-null title/blurb/count it sees. If you reorganize the syllabus
file, keep this in mind — the parser is tolerant of the duplication, not of a
structural change to how modules and topics are delimited.

## Writing a lesson

Each lesson is one `.mdx` file under
`content/system-design/<NN-module-slug>/<topic-slug>.mdx`, with frontmatter
validated by `lib/content/schema.ts`:

| Field | Type | Notes |
|---|---|---|
| `title` | string | Required. |
| `number` | string | Required, must match `NN.NN` (e.g. `"04.13"`). Determines ordering, not the URL. |
| `summary` | string | Required, ≤200 characters. Used in listings, search, and `<meta description>`. |
| `status` | `"published" \| "draft"` | Defaults to `"draft"`. See below. |
| `free` | boolean | Defaults to `true`. Parsed today but not yet enforced anywhere — reserved for a future paid-gating feature (spec §12). |
| `difficulty` | `"intro" \| "core" \| "deep"` | Required. |
| `estMinutes` | positive integer | Required. |
| `tags` | string[] | Defaults to `[]`. |
| `updated` | string or `null` | Defaults to `null`. Must match `YYYY-MM-DD` when set. |

**`status: draft`** keeps a lesson out of the search index
(`getSearchIndex`) and out of the previous/next chain (`getLessonNeighbours`
walks published lessons only) — but its page is still statically generated
and reachable at its URL, because `generateStaticParams` for the lesson
route includes every lesson regardless of status. A draft is unlisted, not
unpublished. Flip a lesson to `status: published` once its body is real.

MDX bodies have access to these components (registered in
`components/mdx/index.tsx`), on top of standard Markdown:

- `<Callout type="note|warn|tip|gotcha">` — a highlighted aside.
- `<Tradeoff forTitle forItems againstTitle againstItems>` — side-by-side
  pros/cons, the workhorse for system design content.
- `<KeyTakeaways items={[...]}>` — end-of-lesson summary list.
- `<Figure>` — image with a caption; **fails the build if `alt` is missing.**
- `<Steps>` / `<Step>` — numbered walkthroughs.
- `<Formula>` — a formatted formula/expression block.

The generator's stub template (`scripts/generate-content.ts`) shows the
expected shape: `## The problem`, `## How it works`, `## Tradeoffs` (with a
`<Tradeoff>`), `## In an interview`, then a `<KeyTakeaways>`.

Lesson bodies are compiled with `@mdx-js/mdx`'s `evaluate()`
(`app/system-design/[module]/[topic]/page.tsx`), deliberately **not**
`next-mdx-remote`. `next-mdx-remote` silently drops MDX expression
attributes — a stub's `<Tradeoff forItems={["...", "..."]}>` would arrive
with `forItems` as `undefined` and throw at render time. All 179 stubs use
this attribute style, so this is not an incidental choice; do not "simplify"
it back to `next-mdx-remote`.

## Architecture constraints enforced by tests

A few rules are structural, not stylistic, and are enforced by
`tests/content/boundaries.test.ts` rather than left to convention:

- **Filesystem access is confined to one file.** Only
  `lib/content/source.ts` may import `node:fs` from `app/`, `components/`,
  or `lib/`. Everything else reads content through `lib/content/index.ts`.
- **`gray-matter` may not be imported from `app/` or `components/`.**
  Frontmatter parsing happens once, in `lib/content/source.ts`.
- **Client components are limited to seven named leaves:** `ThemeToggle`,
  `AnnouncementBar`, `SidebarTree`, `TableOfContents`, `ProgressTracker`,
  `SearchPalette`, and `app/error.tsx` (Next.js requires error boundaries to
  be Client Components, so it's an allowed exception rather than an eighth
  interactive leaf). No layout, page, or content component may declare
  `"use client"`. This keeps the site server-rendered by default; adding a
  new interactive widget means either making it a leaf like the ones above
  or updating the allow-list in `boundaries.test.ts` deliberately, not by
  accident.

## Design tokens and module colours

`lib/design/modules.ts` defines one `{surface, ink}` colour pair per module
(14 total), and `lib/design/tokens.ts` defines the light/dark base palette.
`tests/design/contrast.test.ts` checks all of it against WCAG AA:

- Every module's surface/ink pair is ≥4.5:1 in isolation.
- Every module's surface/ink pair is **also** checked composited at
  `PLANNED_CARD_OPACITY` (the opacity applied to a not-yet-live "planned"
  path card on the landing page) against both light and dark page
  backgrounds. CSS `opacity` composites the ink as well as the surface onto
  whatever sits behind it, so a pair that clears 4.5:1 on its own can still
  fail once composited — this is why `components/landing/PathCards.tsx` has
  a "no opacity on real content, ever" rule enforced by its own guard in
  `boundaries.test.ts`; opacity there is confined to two decorative,
  `aria-hidden` values.
- Base text/link/destructive tokens are ≥4.5:1 (≥3:1 for the structural
  border, per WCAG 1.4.11) in both themes.

**Do not edit a module colour or `PLANNED_CARD_OPACITY` without re-running
`npx vitest run tests/design/contrast.test.ts`.** A colour that looks fine on
its own can still fail once it's the "planned" opacity variant.

## Testing

- `npm test` runs the Vitest suite: 301 tests across 15 files under
  `tests/` (content-layer correctness, frontmatter/schema validation,
  syllabus parsing, design-token contrast, component rendering). It uses the
  `node` environment by default; files that need a DOM opt in per-file with a
  `// @vitest-environment jsdom` docblock (see `vitest.config.mts` for why).
- `npm run test:e2e` runs the Playwright suite in `tests/e2e/` (smoke,
  interaction, and `@axe-core/playwright` accessibility scans) across four
  viewports (375/768/1024/1440). It builds and boots the app itself, so
  expect it to take noticeably longer than the unit suite.
- `npm run verify` is the fast gate (lint, typecheck, unit tests, build).
  `npm run verify:all` adds the e2e suite on the end and is the one to run
  before considering the branch done.

## Project structure

```
app/
  layout.tsx, error.tsx, not-found.tsx, robots.ts, sitemap.ts, globals.css
  (marketing)/            page.tsx (landing), courses/, syllabus/
  system-design/          course overview, [module]/ (module page),
                          [module]/[topic]/ (lesson page)
components/
  ui/          Button, Card, Pill, Badge
  layout/      Header, Footer, AnnouncementBar, ThemeToggle
  landing/     Hero, PathCards, ModuleGrid, Stats, Features, Audience,
               Subscribe, Testimonials
  course/      ModuleCard
  lesson/      SidebarTree, TableOfContents, LessonHeader, LessonNav,
               ProgressTracker
  mdx/         Callout, Tradeoff, KeyTakeaways, Figure, Steps, Formula,
               CodeBlock, index.tsx (the mdxComponents registry)
  search/      SearchPalette
  seo/         CourseJsonLd
lib/
  content/     source.ts (the only fs/gray-matter entry point), index.ts
               (public read API), schema.ts, types.ts, headings.ts
  design/      tokens.ts, modules.ts, contrast.ts
  progress/    store.ts, useProgress.ts
  site.ts, cn.ts, hooks/useMounted.ts
content/
  courses.ts, system-design/<NN-module-slug>/<topic-slug>.mdx (generated
  tree, plus the generated modules.ts)
scripts/
  generate-content.ts, build-search-index.ts, lib/parse-syllabus.ts
tests/
  content/, design/, components/, e2e/, setup.ts, harness.test.tsx
docs/superpowers/specs/, docs/superpowers/plans/
SDsyllabus.md
```
