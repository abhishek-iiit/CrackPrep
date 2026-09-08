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

test("the search palette does not steal focus on page load", async ({ page }) => {
  // Regression guard. The palette's focus-restore effect originally had no
  // open->closed guard, and React runs every effect once on mount regardless
  // of its dependency array — so it focused the trigger on every one of the
  // 193 pages. Only a real app-router context reproduces this, which is why it
  // lives here rather than in a unit test: SearchPalette calls useRouter(),
  // so a bare jsdom render cannot mount it.
  await page.goto("/system-design");
  const trigger = page.getByRole("button", { name: /search lessons/i });
  await expect(trigger).not.toBeFocused();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("the search input keeps a visible focus ring", async ({ page }) => {
  // Tailwind v4's `outline-none` emits outline-style: none and outranks the
  // base :focus-visible rule, which silently removed the ring here once.
  await page.goto("/system-design");
  await page.keyboard.press("ControlOrMeta+k");
  const input = page.getByPlaceholder(/search 179 topics/i);
  await expect(input).toBeFocused();
  const outlineStyle = await input.evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outlineStyle).not.toBe("none");
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
  // Playwright 1.63's getByRole() filter set has no `current` option (only
  // checked/disabled/expanded/level/name/pressed/selected/includeHidden), so
  // the aria-current="page" link is matched directly by attribute instead.
  await expect(nav.locator('a[aria-current="page"]')).toContainText(/Bloom Filters/i);
  await expect(
    nav.getByRole("button", { name: /NoSQL, Partitioning & IDs/ }),
  ).toHaveAttribute("aria-expanded", "true");
});
