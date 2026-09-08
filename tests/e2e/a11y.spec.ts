import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const PAGES = [
  "/",
  "/courses",
  "/syllabus",
  "/system-design",
  "/system-design/storage-engines",
  "/system-design/storage-engines/lsm-tree-storage-engine",
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
  // needs its own scan. Scanned in the zero-results state too, because with no
  // query typed that is the state every open lands in.
  await page.goto("/system-design");
  await page.keyboard.press("ControlOrMeta+k");
  await expect(page.getByRole("dialog", { name: /search lessons/i })).toBeVisible();
  await expectClean(page);

  await page.keyboard.type("bloom");
  await expect(page.getByRole("option").first()).toBeVisible();
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
