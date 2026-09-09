import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { waitForHydration } from "./helpers";

const PAGES = [
  "/",
  "/courses",
  "/syllabus",
  "/system-design",
  "/system-design/storage-engines",
  "/system-design/storage-engines/lsm-tree-storage-engine",
  // The only page in PAGES with a Formula (role="math") block, and a second
  // code sample. It does NOT cover a tabIndex fix — Formula's scroll-x/tabIndex
  // were removed (fix round 2: axe never fires there, since a formula wraps
  // instead of overflowing and so is never actually scrollable). What this
  // entry actually caught was a real dark-mode color-contrast defect in the
  // code block's syntax-highlighting theme — see fix round 1's report.
  "/system-design/nosql-partitioning-ids/bloom-filters",
];

const WCAG_AA = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

/**
 * Scans the page in its CURRENT state and returns only the violations that
 * should fail a build. `heading-order` and friends are tagged `best-practice`,
 * not WCAG, so the tag filter above excludes them by construction — a known
 * h2->h4 skip in the lesson layout will not trip these tests.
 */
async function blockingViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();
  return results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
}

type Violations = Awaited<ReturnType<typeof blockingViolations>>;

const describe = (violations: Violations) =>
  violations.map((v) => `${v.id}: ${v.help}`).join("\n");

async function expectClean(page: Page) {
  const blocking = await blockingViolations(page);
  expect(blocking, describe(blocking)).toEqual([]);
}

test("the open search dialog has no critical or serious axe violations", async ({ page }) => {
  // The page-level scans below never open the palette, so they cannot see the
  // combobox at all. Both of its ARIA IDREFs (aria-controls,
  // aria-activedescendant) are only present while it is open, and a dangling
  // IDREF is exactly what axe's aria-valid-attr-value catches — so the dialog
  // needs its own scan, across all three states it can render.
  await page.goto("/system-design");
  await waitForHydration(page);
  await page.keyboard.press("ControlOrMeta+k");
  await expect(page.getByRole("dialog", { name: /search lessons/i })).toBeVisible();

  // Empty query, index already loaded: results = docs.slice(0, 8) — a
  // POPULATED listbox with both IDREFs present. (This is not the
  // zero-results state; an earlier version of this comment claimed it was.)
  await expect(page.getByRole("option").first()).toBeVisible();
  await expectClean(page);

  await page.keyboard.type("bloom");
  await expect(page.getByRole("option").first()).toBeVisible();
  await expectClean(page);

  // The actual zero-results state: hasOptions === false, so aria-controls and
  // aria-activedescendant are both omitted from the combobox. Never scanned
  // before this — a dangling IDREF can't occur here, but a missing one that
  // should be present could.
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("zzzzzz");
  await expect(page.getByText(/No lesson matches/)).toBeVisible();
  await expectClean(page);
});

test("the search dialog has no violations while the index is still loading", async ({ page }) => {
  // The critical aria-required-attr bug this suite caught lived in exactly
  // the two states above never covered: docs === null (loading) and
  // docs !== null but empty (index fetched, zero published lessons). Both
  // are hasOptions === false, same as the zero-results state above, but that
  // state is reached via a real fetch that always resolves fast with real
  // data — it never actually exercises "docs === null" as observed state.
  // Holding the /search-index.json response open here is what does.
  let releaseIndex: () => void;
  const held = new Promise<void>((resolve) => {
    releaseIndex = resolve;
  });
  await page.route("**/search-index.json", async (route) => {
    await held;
    await route.fulfill({ json: [] });
  });

  await page.goto("/system-design");
  await waitForHydration(page);
  await page.keyboard.press("ControlOrMeta+k");
  await expect(page.getByRole("dialog", { name: /search lessons/i })).toBeVisible();
  await expect(page.getByText("Loading index…")).toBeVisible();
  await expectClean(page);

  releaseIndex!();
});

test("the search dialog has no violations when the index is empty", async ({ page }) => {
  await page.route("**/search-index.json", (route) => route.fulfill({ json: [] }));

  await page.goto("/system-design");
  await waitForHydration(page);
  await page.keyboard.press("ControlOrMeta+k");
  await expect(page.getByRole("dialog", { name: /search lessons/i })).toBeVisible();
  await expect(page.getByText("No lessons are published yet.")).toBeVisible();
  await expectClean(page);
});

for (const path of PAGES) {
  test(`${path} has no critical or serious axe violations (light)`, async ({ page }) => {
    // next-themes runs `defaultTheme="system" enableSystem`, so the emulated
    // media query is what picks the token set. Pin it instead of inheriting the
    // runner's preference, or "light" scans whatever the machine happens to want.
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto(path);
    await expect(page.locator("html")).not.toHaveClass(/\bdark\b/);
    await expectClean(page);
  });

  test(`${path} has no critical or serious axe violations (dark)`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto(path);
    // Assert the class actually landed before scanning. Dark mode is
    // class-strategy (`@custom-variant dark (&:where(.dark, .dark *))`), so if
    // next-themes ever stopped following the system preference this test would
    // keep passing while scanning light a second time. A green dark-mode result
    // that never rendered dark is worse than having no dark test at all.
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
    await expectClean(page);
  });
}
