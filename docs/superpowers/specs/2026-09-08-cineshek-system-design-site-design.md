# Cineshek — System Design Learning Site

**Date:** 2026-09-08
**Status:** Approved design, pending implementation plan
**Author:** abhishek-iiit (with Claude)

## 1. Purpose

Build a learning website for the System Design curriculum in `SDsyllabus.md`
(14 modules, 179 topics). The site must feel like a finished product from the
first deploy, and must accept additional courses later without restructuring.

Reference inspiration: `fanout.sh` — paper-light editorial surface, pixel and
monospace display type, vivid per-module colour cards. Same idea, not a clone.

### Success criteria

1. All 179 topics reachable at stable, word-based URLs.
2. Landing page communicates the curriculum in one screen without scrolling to
   a wall of text.
3. A lesson page is comfortable to read for 15 minutes on a laptop and a phone.
4. Adding a second course (AI research, ML maths, …) requires new content files
   and one registry entry, not new page components.
5. WCAG 2.1 AA on text contrast, keyboard navigation, and reduced motion.

### Out of scope for v1

Accounts, payments, server-side progress, comments, video, certificates,
lesson gating. Progress is per-browser only. These are deliberately deferred;
section 12 records how each one lands later without a rewrite.

## 2. Scope decisions (settled with the user)

| Decision | Choice |
|---|---|
| v1 surface | Landing + full course browser + lesson pages. No accounts. |
| Stack | Next.js 15 App Router, Tailwind v4, MDX |
| Content volume | All 179 topics scaffolded; 3 lessons fully written |
| Theme | Paper-light matching the references, with a dark mode |

## 3. Content architecture

### 3.1 Chosen approach: MDX files in git

```
content/
  courses.ts                       course registry (System Design live, others planned)
  system-design/
    _module.01-foundations.yml     module metadata
    01-foundations/
      requirements-clarification.mdx
      logical-system-design.mdx
      ...
```

Content is read at build time with `fs` + `gray-matter`, and every lesson is
statically generated via `generateStaticParams`.

**Rejected alternatives.** A Sanity CMS (the user has Sanity MCP configured)
would add a project, dataset, schema deploy, and a network dependency on every
build, and would move prose out of git history — poor value for a curriculum the
owner authors alone in an editor. A single registry file holding all content
becomes unmanageable well before 179 lessons.

### 3.2 The content adapter (the important part)

No page component ever touches `fs`, `gray-matter`, or a file path. All content
access goes through one module:

```
lib/content/
  index.ts        public API — the only thing pages import
  source.ts       filesystem implementation (swappable)
  schema.ts       Zod frontmatter schema
  types.ts        Course, Module, Lesson, LessonRef
```

Public API:

```ts
getCourses(): Course[]
getCourse(courseSlug): Course | null
getModules(courseSlug): Module[]
getModule(courseSlug, moduleSlug): Module | null
getLessons(courseSlug, moduleSlug): Lesson[]
getLesson(courseSlug, moduleSlug, lessonSlug): Lesson | null
getLessonNeighbours(courseSlug, moduleSlug, lessonSlug): { prev, next }
getSearchIndex(courseSlug): SearchDoc[]
getAllLessonParams(): { course, module, lesson }[]
```

Swapping to a CMS later means rewriting `source.ts` only. This is the single
constraint that makes decision 3.1 reversible, so it is not optional.

### 3.3 Frontmatter schema

Validated with Zod at build time; an invalid file fails the build loudly rather
than rendering a broken page.

```yaml
title: "Requirements Clarification"          # required
number: "01.01"                              # required, matches syllabus
summary: "One or two sentences, <200 chars"  # required — used in cards, search, meta
status: published | draft                    # required, default draft
free: true                                   # required, default true
difficulty: intro | core | deep              # required
estMinutes: 12                               # required, integer
tags: [requirements, process]                # optional
updated: 2026-09-08                          # optional
```

`status: draft` lessons render with a visible "Draft" badge and are excluded
from search and from prev/next chains, but keep a working URL so they are
shareable while being written.

### 3.4 Module metadata

```yaml
id: "01"
slug: foundations
title: Foundations
blurb: "Scalability basics, system design process, tradeoffs, and capacity planning."
colorKey: cobalt
```

### 3.5 Generation script and a syllabus defect

`scripts/generate-content.ts` parses `SDsyllabus.md` and emits module metadata
plus 179 MDX stubs. It is idempotent: existing files are never overwritten, so
it can be re-run after the syllabus changes to add only what is missing.

**Defect found in the source syllabus.** `SDsyllabus.md` lists every module
twice — an initial pass, then a repeat with `---` separators and stray
`13 TOPICS` / `20 TOPICS` fragments between blocks. A naive parser produces
duplicate modules and duplicate routes. The parser therefore:

1. keys modules by their two-digit id and keeps the first occurrence;
2. ignores bare `N TOPICS` lines that are not inside a module block;
3. asserts the final result is exactly **14 modules and 179 unique topics**,
   with per-module counts matching the declared `N TOPICS`, and exits non-zero
   on mismatch.

The per-module counts it must reproduce:

| # | Slug | Title | Topics | Colour key |
|---|---|---|---|---|
| 01 | `foundations` | Foundations | 13 | cobalt |
| 02 | `apis-services-protocols` | APIs, Services & Protocols | 13 | amber |
| 03 | `data-modeling-sql` | Data Modeling & SQL | 13 | mint |
| 04 | `nosql-partitioning-ids` | NoSQL, Partitioning & IDs | 14 | violet |
| 05 | `caching-fast-reads` | Caching & Fast Reads | 7 | rose |
| 06 | `distributed-coordination` | Distributed Coordination | 13 | ink |
| 07 | `storage-engines` | Storage Engines | 20 | teal |
| 08 | `async-work-streams` | Async Work & Streams | 10 | lime |
| 09 | `search-retrieval` | Search & Retrieval | 17 | orange |
| 10 | `analytics-sketches` | Analytics & Sketches | 13 | cyan |
| 11 | `realtime-social-feeds` | Realtime, Social & Feeds | 12 | fuchsia |
| 12 | `geo-matching-recs` | Geo, Matching & Recs | 8 | sky |
| 13 | `media-files-cdn` | Media, Files & CDN | 11 | cream |
| 14 | `reliability-operations` | Reliability & Operations | 15 | lavender |
| | | **Total** | **179** | |

### 3.6 Stub template

Every generated stub carries the same skeleton so lessons stay structurally
consistent and are quick to fill in:

```mdx
## The problem
## How it works
## Tradeoffs
<Tradeoff> ... </Tradeoff>
## In an interview
<KeyTakeaways> ... </KeyTakeaways>
```

### 3.7 Fully written sample lessons

Three, chosen to exercise different rendering paths:

- `01.01 Requirements Clarification` — prose and lists, light formatting.
- `04.13 Bloom Filters` — maths, a formula block, a diagram, a tradeoff table.
- `07.09 LSM Tree Storage Engine` — heavy diagram, multi-step write/read path.

## 4. Design system

Grounded in the `ui-ux-pro-max` database. Every value below is marked
**[verified]** (a database match) or **[adapted]** (my derivation from one),
so later readers know which choices carry external support.

### 4.1 Typography — [verified]

The whole Geist family is present in the font database and is the type system
behind the reference aesthetic:

| Role | Family | Usage |
|---|---|---|
| Display accent | `Geist Pixel` (Display, `ELSH` axis) | Hero second line, path/module card titles, eyebrow labels. Never body text. |
| Headings, UI | `Geist` (variable 100–900) | Everything structural |
| Code, metadata | `Geist Mono` (variable 100–900) | Code, numbers, `NN.NN` labels, kbd |

Loaded through `next/font/google`, self-hosted, `latin` subset, `display: swap`.
Three variable families cost roughly what two static families would.

Verified fallback if Geist is ever unwanted: the database's "Developer Mono"
pairing — JetBrains Mono headings, IBM Plex Sans body.

**Type scale.** Long-form body is 17px at `line-height: 1.7` — above the 16px
floor and inside the verified 1.5–1.75 band. Prose column is capped at 68ch,
inside the verified 65–75 character rule.

### 4.2 Colour — base tokens

Structure taken from the verified *Knowledge Base / Documentation* palette
profile; the ground is warmed to match the references. **The warm shift is
[adapted], not a database match.**

Light:

| Token | Value | Note |
|---|---|---|
| `--paper` | `#FAF8F4` | page ground |
| `--ink` | `#141414` | body text — 17.37:1 on paper |
| `--card` | `#FFFFFF` | raised surface |
| `--ink-muted` | `#57534E` | secondary text — 7.19:1 on paper |
| `--link` | `#2563EB` | [verified] — 4.87:1 on paper |
| `--border-structural` | `#141414` | 2px card/button/input edges — 17.37:1 |
| `--border-hairline` | `#E5E0D8` | decorative separators only — 1.24:1 |
| `--destructive` | `#DC2626` | [verified] |

Dark:

| Token | Value | Note |
|---|---|---|
| `--paper` | `#0E0E0E` | |
| `--ink` | `#F5F3EF` | 17.42:1 |
| `--card` | `#171716` | ink on card 16.19:1 |
| `--ink-muted` | `#A8A29E` | 7.65:1 on ground |
| `--link` | `#93B4FF` | 9.39:1 |
| `--border-structural` | `#F5F3EF` | 17.42:1 |
| `--border-hairline` | `#2A2A28` | decorative only — 1.34:1 |

**Border rule.** Hairline tokens fail 3:1 by design and may only be used for
decorative separators. Every boundary that conveys a UI component — card edge,
button, input, focus ring — uses `--border-structural` at 2px. This is what
satisfies WCAG 1.4.11 while keeping the neo-brutalist look.

### 4.3 Colour — the 14 module surfaces

Each module owns a `{ surface, ink }` pair. All fourteen were computed and
verified at ≥4.5:1; three initial choices failed and were corrected (teal
darkened; orange and fuchsia switched to dark ink to preserve saturation).

| # | Key | Surface | Ink | Ratio |
|---|---|---|---|---|
| 01 | cobalt | `#1D4ED8` | `#FFFFFF` | 6.70 |
| 02 | amber | `#F59E0B` | `#141414` | 8.58 |
| 03 | mint | `#34D399` | `#141414` | 9.58 |
| 04 | violet | `#7C3AED` | `#FFFFFF` | 5.70 |
| 05 | rose | `#FB7185` | `#141414` | 6.84 |
| 06 | ink | `#141414` | `#FFFFFF` | 18.42 |
| 07 | teal | `#0F766E` | `#FFFFFF` | 5.47 |
| 08 | lime | `#A3E635` | `#141414` | 12.22 |
| 09 | orange | `#EA580C` | `#141414` | 5.18 |
| 10 | cyan | `#22D3EE` | `#141414` | 10.19 |
| 11 | fuchsia | `#D946EF` | `#141414` | 5.33 |
| 12 | sky | `#38BDF8` | `#141414` | 8.60 |
| 13 | cream | `#FDE68A` | `#141414` | 14.79 |
| 14 | lavender | `#C4B5FD` | `#141414` | 9.98 |

Module surfaces are identical in dark mode — they are saturated enough to hold
against a near-black ground. Only base tokens flip.

These values are the fixture for the contrast test in section 10; the test, not
this table, is the enforcement mechanism.

### 4.4 Style: refined neo-brutalism — [adapted, deliberate override]

The database's verified style match for this product is **Brutalism**. Two of
its prescriptions are adopted and two are overridden.

Adopted: sharp corners (0–4px radius), visible heavy borders, bold display
typography, visible grid structure, large flat colour blocks, hard offset
shadows (`4px 4px 0 var(--border-structural)`).

Overridden, with reasons:

| Brutalism says | We do | Why |
|---|---|---|
| `transition: none` / instant state change | 150–200ms transitions on hover, focus, and colour | "Instant state changes (0ms)" is a listed anti-pattern under Touch & Interaction, which is priority 2 (CRITICAL); Style Selection is priority 4. The higher-priority rule wins. |
| Default system fonts, plain text | The Geist type system in 4.1 | The references are refined, not raw; the user asked for that aesthetic specifically. |

Recording this explicitly because it is a knowing deviation from a verified
result, not an oversight.

### 4.5 Motion

Standard tier. Card grids reveal on scroll with a ~60ms stagger,
300–450ms duration. Every non-essential animation is wrapped in a
`prefers-reduced-motion: reduce` guard that renders the final state
immediately. Nothing animates `width` or `height`; transforms and opacity only.

### 4.6 Spacing and layout

4px base scale: 4, 8, 12, 16, 24, 32, 48, 64, 96. Content max width 1200px;
prose column 68ch. Breakpoints 375 / 768 / 1024 / 1440, mobile-first.
No horizontal page scroll at any width — wide tables and code blocks scroll
inside their own `overflow-x: auto` container.

## 5. Routes

| Route | Rendering | Content |
|---|---|---|
| `/` | static | Landing |
| `/courses` | static | All paths; System Design live, others planned |
| `/system-design` | static | Course overview, 14 module cards, progress |
| `/system-design/[module]` | static, 14 pages | Module intro + topic list |
| `/system-design/[module]/[topic]` | static, 179 pages | Lesson |
| `/syllabus` | static | Flat filterable index of all 179 topics |
| `not-found.tsx`, `error.tsx` | static | Themed 404 and error boundaries (special files, not routes) |

Slugs are words, never numbers: `/system-design/foundations/requirements-clarification`.
Ordering comes from frontmatter `number`, so a topic can be renumbered without
breaking its URL.

Course slug is a path segment from day one, which is what makes criterion 4
(adding a second course) cheap.

## 6. Landing page

Section order, adapting the verified *Newsletter / Content First* pattern
("paper-like background, text focus, accent for subscribe") with the
feature-grid structure of the references:

1. **Announcement bar** — dismissible, choice persisted in `localStorage`.
2. **Sticky header** — wordmark, nav, ⌘K search trigger, theme toggle, CTA.
3. **Hero** — mixed-type headline (Geist + Geist Pixel), sub-copy, primary CTA
   "Start learning free" and secondary "Browse syllabus". Tilted paper-card
   decorations, `aria-hidden`, hidden below 768px.
4. **Stats strip** — 14 modules · 179 topics · free. Values derived from the
   content layer, never hardcoded, so they cannot drift.
5. **Choose where to start** — path cards with stacked-card illustrations.
   System Design is live; other paths render a "Soon" pill and are not
   clickable.
6. **Module grid** — 14 colour cards, blurb and topic count each.
7. **What you get** — three feature cards.
8. **Who this is for** — see integrity note below.
9. **Email capture.**
10. **Footer.**

### 6.1 Integrity decisions — deviations from the reference

The reference has a testimonial carousel and a "SHARED AROUND THE WORLD"
university logo wall. The site has no users and no institutional adopters, so
neither is reproduced. Fabricated quotes or borrowed logos would be a false
claim to third parties about real organisations.

- The testimonial slot becomes **"Who this is for"** — honest audience framing.
- A `<Testimonials />` component is built and left unused, ready for real
  attributed quotes. Verified guidance requires photo, name, and role, and
  requires subscriber/adopter counts to be current and dated or replaced with
  qualitative proof.
- The email form has no backend in v1. It posts to
  `NEXT_PUBLIC_SUBSCRIBE_ENDPOINT`; when that variable is unset the form shows
  an explicit "not yet configured" message rather than a fake success state.
  Faking submission success is a listed Forms & Feedback anti-pattern.

### 6.2 Future path cards are placeholders

`content/courses.ts` seeds exactly three planned paths so the section has
visual weight at desktop widths: `ai-research`, `ml-maths`, `inference-engineering`.
These are **placeholders**, not a committed roadmap — the user renames or deletes
them in that one file. Each carries `status: 'planned'`, which renders a "Soon"
pill and suppresses the link.

## 7. Lesson page

Three-column at ≥1280px, collapsing to single column with a drawer at <1024px.

- **Left, sticky** — module tree; current lesson marked with `aria-current`;
  other modules collapsed; completed lessons ticked.
- **Centre** — eyebrow (`NN.NN` + module name in module colour), title,
  metadata row (difficulty, estimated minutes, updated), then MDX body at 68ch.
- **Right, sticky** — table of contents with scroll-spy from `h2`/`h3`, plus a
  reading-progress indicator.
- **Footer** — previous/next cards, "Mark complete", edit-on-GitHub link.

### 7.1 MDX components

`<Callout type="note|warn|tip|gotcha">`, `<Tradeoff>` (side-by-side
pros/cons — the workhorse for system design), `<KeyTakeaways>`, `<Figure>`
(caption, `alt` required), `<Steps>`, `<Formula>`, `<Term>` (inline glossary),
and code blocks with language label and copy button.

`<Figure>` fails the build if `alt` is missing. Diagrams are inline SVG with
theme-aware `currentColor` strokes — never raster screenshots of text.

### 7.2 Rendering strategy

Server Components by default (verified Next.js rule: "Server Components
reduce client JS bundle", severity High). `'use client'` is confined to
exactly six interactive leaves:

`ThemeToggle`, `AnnouncementBar`, `SidebarTree`, `TableOfContents`,
`ProgressTracker`, `SearchPalette`.

Every one of these is a leaf. No layout, page, or content component is a client
component.

### 7.3 Progress tracking

`localStorage` under one versioned key, read through a `useSyncExternalStore`
hook with a server snapshot of "nothing completed". This avoids both a
hydration mismatch and a flash of wrong state. Storage access is wrapped in
`try/catch` — private browsing and blocked site data must degrade to "no
progress recorded", never to a crash.

## 8. Search

⌘K / Ctrl-K command palette over a build-generated index of all published
lessons (number, title, summary, module, url) — roughly 30KB, fetched on first
open, not in the initial bundle. Client-side fuzzy match, no external service.
Fully keyboard operable: arrows, Enter, Escape, focus trap, focus restored to
the trigger on close.

## 9. Non-functional requirements

**Accessibility (priority 1).** Text contrast ≥4.5:1 everywhere — enforced by
test. Visible focus rings, never removed. Full keyboard reachability. Semantic
landmarks and one `h1` per page. `alt` on every meaningful image; decorative
art `aria-hidden`. Interactive targets ≥44×44px with ≥8px spacing. Icons are
SVG (Lucide) — never emoji. Icon-only buttons carry `aria-label`.

**Performance (priority 3).** Fully static; no runtime data fetching. Fonts
self-hosted and preloaded. CLS <0.1 — the announcement bar and any async
element reserve their space. Images use `next/image` with explicit dimensions.
No layout-shifting skeletons on statically rendered content.

**SEO.** Per-page metadata from frontmatter, Open Graph and Twitter cards,
`sitemap.xml` and `robots.txt` generated from the content layer, JSON-LD
`Course` and `LearningResource` structured data.

**Theming.** `next-themes`, class strategy, with an inline pre-hydration script
so there is no theme flash. Respects `prefers-color-scheme` until the user
chooses.

## 10. Testing

**Content layer (Vitest).** These are the tests that keep 179 files honest:

1. Every topic in `SDsyllabus.md` resolves to exactly one lesson file.
2. Exactly 14 modules and 179 lessons; per-module counts match the section 3.5 table.
3. Slugs unique within a module; `number` unique across the course.
4. Frontmatter passes the Zod schema for every file.
5. `getLessonNeighbours` forms one unbroken chain — first has no `prev`, last
   no `next`, no cycles, no orphans, drafts excluded.
6. Syllabus parser rejects the duplicate-module input rather than emitting
   duplicates (regression test for the section 3.5 defect).

**Design tokens (Vitest).** All 14 module `{surface, ink}` pairs ≥4.5:1; light
and dark base text pairs ≥4.5:1; `--border-structural` ≥3:1 against its ground
in both modes. This is the section 4.3 arithmetic wired to CI, so a future
palette edit cannot silently ship an unreadable card.

**End to end (Playwright).** Smoke on landing, course, module, and lesson at
375 / 768 / 1024 / 1440: no horizontal scroll, one `h1`, nav works. `axe-core`
scan with zero critical or serious violations. Keyboard-only journey: tab to
search, open, arrow, enter, land on a lesson. Theme toggle persists across
reload with no flash. `prefers-reduced-motion` renders final states.

TDD applies to the content layer and token tests — they are written against the
described behaviour before the implementation exists.

## 11. Project structure

```
app/
  layout.tsx  page.tsx  courses/  system-design/  syllabus/
components/
  ui/          primitives — Button, Card, Pill, Badge
  layout/      Header, Footer, AnnouncementBar, ThemeToggle
  landing/     Hero, PathCards, ModuleGrid, Stats, Features, Audience, Subscribe
  lesson/      SidebarTree, TableOfContents, LessonHeader, LessonNav, ProgressTracker
  mdx/         Callout, Tradeoff, KeyTakeaways, Figure, Steps, Formula, CodeBlock
  search/      SearchPalette
lib/
  content/     the adapter from 3.2
  design/      tokens.ts, modules.ts, contrast.ts
  progress/    useProgress.ts
content/       courses.ts + system-design/
scripts/       generate-content.ts, build-search-index.ts
tests/         content/, design/, e2e/
docs/superpowers/specs/
```

## 12. How the deferred features land later

Recorded so v1 does not paint us into a corner:

- **Accounts** — add an auth provider and swap the `useProgress` storage
  backend from `localStorage` to an API route. The hook interface is designed
  not to change.
- **Paid gating** — `free: false` already exists in the frontmatter schema and
  is parsed but unused; gating reads it at render time.
- **A second course** — content directory plus one `courses.ts` entry. Routes
  already carry the course slug.
- **CMS** — rewrite `lib/content/source.ts` only.

## 13. Risks

| Risk | Mitigation |
|---|---|
| 179 stubs make the site feel empty | `status: draft` badges are explicit about what is unwritten; module pages show written/total counts. Honest beats padded. |
| Build time at 179+ static pages | Static generation only, no per-page network calls. If a full build exceeds ~2 minutes, adopt `dynamicParams` with ISR for the long tail. |
| Three font families | All variable, self-hosted, single `latin` subset, preloaded. Geist Pixel is display-only and used sparingly. |
| Neo-brutalist look versus AA contrast | Structural borders carry contrast at 2px; hairlines are decorative only. Enforced by the token test. |
| Syllabus is duplicated and loosely formatted | Parser dedupes, asserts exact counts, and is covered by a regression test. |
