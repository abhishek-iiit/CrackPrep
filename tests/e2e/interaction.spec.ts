import { expect, test } from "@playwright/test";
import { searchPlaceholder, waitForHydration } from "./helpers";

test("search palette is fully keyboard operable", async ({ page }) => {
  await page.goto("/system-design");
  await waitForHydration(page);
  await page.keyboard.press("ControlOrMeta+k");

  const dialog = page.getByRole("dialog", { name: /search lessons/i });
  await expect(dialog).toBeVisible();
  await expect(page.getByPlaceholder(await searchPlaceholder(page))).toBeFocused();

  await page.keyboard.type("bloom");
  const option = page.getByRole("option").first();
  await expect(option).toContainText(/Bloom Filters/i);

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/bloom-filters$/);
  await expect(page.locator("h1")).toContainText(/Bloom Filters/i);
});

test("the search palette does not steal focus on page load", async ({ page }) => {
  // Regression guard. The palette's focus-restore effect originally had no
  // open->closed guard, and React runs every effect once on mount regardless
  // of its dependency array — so it focused the trigger on every one of the
  // 193 pages. Only a real app-router context reproduces this, which is why it
  // lives here rather than in a unit test: SearchPalette calls useRouter(),
  // so a bare jsdom render cannot mount it.
  await page.goto("/system-design");
  // Wait for hydration before asserting. Checked too early — before React has
  // run any effects at all — the negative assertions below are vacuously true
  // whether or not the bug is present, which is no guard at all.
  await waitForHydration(page);
  const trigger = page.getByRole("button", { name: /search lessons/i });
  await expect(trigger).not.toBeFocused();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("the search input keeps a visible focus ring", async ({ page }) => {
  // Tailwind v4's `outline-none` emits outline-style: none and outranks the
  // base :focus-visible rule, which silently removed the ring here once.
  await page.goto("/system-design");
  await waitForHydration(page);
  await page.keyboard.press("ControlOrMeta+k");
  const input = page.getByPlaceholder(await searchPlaceholder(page));
  await expect(input).toBeFocused();
  const outlineStyle = await input.evaluate((el) => getComputedStyle(el).outlineStyle);
  // Chromium's UA focus ring alone computes to "auto", not "none" — so
  // `not.toBe("none")` would still pass with the app's own `:focus-visible`
  // rule deleted entirely. Assert the actual value the app sets.
  expect(outlineStyle).toBe("solid");
});

test("escape closes the palette and returns focus to the trigger", async ({ page }) => {
  await page.goto("/system-design");
  const trigger = page.getByRole("button", { name: /search lessons/i });
  const dialog = page.getByRole("dialog");
  await trigger.click();
  // Without this, a swallowed click (palette never opens) still passes:
  // toBeHidden() is satisfied by a dialog that never existed, and
  // toBeFocused() by the click that was supposed to open it.
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("theme choice survives a reload without a flash of the wrong theme", async ({ page }) => {
  // Pin the media preference. ThemeToggle's accessible name is derived from the
  // RESOLVED theme — "Switch to dark theme" when light is active, "Switch to
  // light theme" when dark is. With defaultTheme="system", a host that prefers
  // dark would flip the label and this locator would never match, failing on
  // timeout rather than for a real reason. Pinning it makes the test
  // deterministic instead of dependent on a Playwright default or the CI OS.
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");

  // The label is "Switch theme" in the server HTML, because useMounted() is
  // false during SSR, and only becomes the directional label after hydration.
  // Playwright's locators auto-wait, so asserting on it also waits for hydrate.
  const toggle = page.getByRole("button", { name: /switch to dark theme/i });
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);

  // `toHaveClass` auto-retries for up to 5s, so it cannot tell a genuinely
  // flash-free reload apart from one that starts light and self-corrects a
  // moment later — the exact failure mode the blocking inline script in the
  // root layout exists to prevent. Reading the class synchronously right
  // after `commit` (before the browser has even painted) is what actually
  // proves there was no flash.
  await page.reload({ waitUntil: "commit" });
  expect(await page.evaluate(() => document.documentElement.className)).toMatch(/\bdark\b/);
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
  // The first heading is already in the viewport before any click at
  // 1440x900, so asserting on it passes even with every anchor jump
  // prevented outright. The last heading starts off-screen, so the jump
  // actually has to happen for this to pass.
  const target = toc.getByRole("link").last();
  const href = await target.getAttribute("href");
  await target.click();

  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await expect(page.locator(href!)).toBeInViewport({ ratio: 1 });
});

test("a dismissed announcement bar never paints again", async ({ page }) => {
  await page.goto("/");
  const dismiss = page.getByRole("button", { name: /dismiss announcement/i });
  await dismiss.click();
  await expect(dismiss).toBeHidden();

  // `toBeHidden()` auto-retries for 5s, so on a reload it cannot tell a bar
  // that was never painted apart from one that painted and then vanished —
  // and the second is what actually shipped, shifting the hero down by the
  // bar's height on every visit after a dismissal. Same failure mode as the
  // theme test above, which was the only one of the two defended. Two
  // assertions replace it.

  // 1. Document order, which is what makes the fix airtight rather than fast:
  //    the blocking script that stamps <html> is emitted BEFORE the bar's
  //    markup, so a dismissed bar is not merely hidden quickly — it cannot be
  //    painted at all.
  const html = await (await page.request.get("/")).text();
  const scriptAt = html.indexOf("announce:");
  const barAt = html.indexOf("data-announcement");
  expect(scriptAt, "no inline dismissal script in the served HTML").toBeGreaterThan(-1);
  expect(barAt, "no announcement bar in the served HTML").toBeGreaterThan(-1);
  expect(barAt).toBeGreaterThan(scriptAt);

  // 2. A synchronous read, before React has hydrated — the technique the theme
  //    test uses. The old post-hydration `hidden={dismissed}` stamped no
  //    attribute and left the bar displayed at this point.
  await page.reload({ waitUntil: "domcontentloaded" });
  expect(
    await page.evaluate(() => {
      const bar = document.querySelector("[data-announcement]");
      return {
        stamped: document.documentElement.hasAttribute("data-announce-dismissed"),
        display: bar ? getComputedStyle(bar).display : "no bar element",
      };
    }),
  ).toEqual({ stamped: true, display: "none" });

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
  // Playwright 1.63's getByRole() filter set has no `current` option (only
  // checked/disabled/expanded/level/name/pressed/selected/includeHidden), so
  // the aria-current="page" link is matched directly by attribute instead.
  // `[href]` is required too: an <a> with no href computes to role
  // "generic", not "link", so without it this could silently match a
  // non-link element that happens to carry the attribute.
  await expect(nav.locator('a[href][aria-current="page"]')).toContainText(/Bloom Filters/i);
  await expect(
    nav.getByRole("button", { name: /NoSQL, Partitioning & IDs/ }),
  ).toHaveAttribute("aria-expanded", "true");
});
