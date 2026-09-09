# Known issues

Everything here was found by the final whole-branch review, verified against a
specific line, and consciously left rather than missed. Nothing below is a
correctness bug in what ships today; each entry says what would make it one.

The review's Critical count was zero, and every user-visible defect it found
was fixed before merge. What remains is latent or cosmetic.

## 1. Every lesson page ships the whole 179-lesson tree in its RSC payload

`app/system-design/[module]/[topic]/page.tsx:102-118` maps all 14 modules and
all 179 lessons into `SidebarTree`'s props on every lesson page. Measured on one
built page: 79,178 bytes total, of which the escaped `"lessons":[…]` arrays are
**35,752 bytes — 45% of the page**. The rendered DOM contains 14 lesson URLs;
the payload contains 180. `SidebarTree` removes collapsed content from the DOM
entirely, so 165 of those entries exist only to make a *possible* client-side
expansion work. Across 179 pages that is roughly 6.4 MB of build output and
~36 KB of extra uncompressed transfer per lesson view.

Not a bug — the pages are correct and fast enough to serve statically — but it
is the single largest easy win on the site, and it gets harder to change as
more consumers depend on the prop shape.

**Two honest fixes.** (a) Behaviour-preserving: emit the tree once as a static
`/module-tree.json` and have `SidebarTree` fetch it on first expand, so it
caches across navigations instead of re-downloading per page. The
`scripts/build-search-index.ts` pattern already does exactly this for search.
(b) Smaller change, small behaviour loss: pass only the current module's
lessons and make collapsed module headers link to the module page instead of
expanding. Deferred because (a) is a design decision, not a cleanup.

## 2. `extractHeadings` can diverge from `rehype-slug`, producing dead TOC links

`lib/content/headings.ts:14`. The TOC ids are re-derived by a hand-written
`plain()` rather than read from the pipeline that assigns them, and the two
disagree in two cases:

| MDX heading | TOC anchor | rendered `id` |
|---|---|---|
| `## Setting read_quorum and write_quorum` | `#setting-readquorum-and-writequorum` | `setting-read_quorum-and-write_quorum` |
| `## A heading with a <br /> tag` | `#a-heading-with-a-br--tag` | `a-heading-with-a--tag` |

`plain()` strips `_x_` as emphasis, but CommonMark does not treat intraword
underscores as delimiters. The failure is silent: the link goes nowhere and the
heading never highlights, with no build error and no failing test. The
docstring at `:19-26` claims the ids "always match" — it is wrong.

**Currently unreachable**: no heading in any of the 179 files has two
underscores, inline JSX, or a `{}` expression. But two snake_case identifiers in
one heading is entirely ordinary in a systems curriculum, so this will be
reached eventually.

**Fix:** stop re-deriving. Harvest the ids from the same pipeline the page
renders — a ~10-line rehype plugin in `MDX_OPTIONS` that collects `h2`/`h3` ids
*after* `rehypeSlug` assigns them. That deletes `plain()`, the fence tracker and
the whole divergence class (~70 lines to ~15) and makes the docstring true by
construction. Deferred only because it touches the render pipeline for all 179
pages and deserves its own verification pass, not because the stopgap regex is
adequate — it does not cover the JSX case.

## 3. The same counts are formatted in 11 places, none pluralised

`app/layout.tsx:40`, `app/(marketing)/page.tsx:18`,
`app/(marketing)/syllabus/page.tsx:12,24`, `app/system-design/page.tsx:12,32,34,38`,
`app/system-design/[module]/page.tsx:54-55`, `Hero.tsx:21-22`,
`ModuleGrid.tsx:12`, `Footer.tsx:13`, `ModuleCard.tsx:21-22`,
`PathCards.tsx:54`, `SearchPalette.tsx:161` — with `"{n} modules · {n} topics"`
appearing verbatim three times.

The visible symptom is pluralisation: a course with one module renders
"1 modules · 1 topics". That is not reachable today (system design has 14) but
becomes reachable the moment a second course is added, which is the stated plan
— a new course's natural first state is one module. The real finding is the
duplication: a pluralisation fix has to land in 11 places and will not land
consistently. **Fix:** one `lib/format.ts` helper, then use it everywhere.

## 4. Dead code that the tests keep alive

- `components/ui/Card.tsx` — imported only by its own test. It exists to do
  exactly what `ModuleCard.tsx:12-15`, `PathCards.tsx:74-79` and
  `app/system-design/[module]/page.tsx:47-48` each open-code separately, so
  adopting it would remove three duplications and also settle the two
  competing colour-application idioms (`--surface` custom properties in some
  files, inline `style={{ backgroundColor, color }}` in `LessonHeader.tsx:19`
  and `syllabus/page.tsx:47`).
- `components/landing/Testimonials.tsx` — imported only by its own test.
  Deliberately renders nothing without real attributed quotes, so it is
  correct, just unreachable.
- `Button`'s `ghost` variant (`Button.tsx:10`) — referenced nowhere.
- `getLessons` — exported, used only by tests.
- The `destructive` token — defined in four places (`tokens.ts:9,30,40`,
  `globals.css:15,31,42`), guarded by ~8 assertions, and used by **no
  component**. Either wire it into `app/error.tsx` or delete it.

A test that is a component's only consumer proves it compiles, not that it
works. Either use these or delete them.

## 5. Smaller items, each verified

- **`app/(marketing)/layout.tsx` and `app/system-design/layout.tsx` are
  byte-identical** apart from the function name. Extract one `SiteShell`.
- **The nav is maintained twice** — `Header.tsx:6-10` has a `NAV` array;
  `Footer.tsx:17-19` open-codes the same three pairs.
- **`ModuleCard`/`PathCards` fill their grid cell only incidentally** — the
  card root is `flex: 0 1 auto` with no `w-full`, so its base size is
  `max-content` and it fills only while the blurbs stay long. `modules.ts`
  says "edits to titles and blurbs are safe"; shortening one would render a
  narrow card in a wide cell. Add `w-full`.
- **`app/globals.css:88`** — `.font-pixel` is redundant with the
  `[class*="font-pixel"]` rule on the next line, which is a strict superset.
- **`next.config.ts:4`** still carries the scaffold comment over an empty
  config; **`eslint.config.mjs:9-15`** re-lists eslint-config-next's own
  default ignores under a comment claiming it overrides them.

## Two spec items deliberately not built

- **`<Term>` (inline glossary)**, spec §7.1. Nothing in the curriculum
  references it, and the spec never defined the glossary storage it would read
  from. Recorded in the spec itself.
- **The mobile sidebar drawer.** Cut as a scope reduction; the lesson sidebar
  is `lg`-only and the module page is the mobile navigation path.
