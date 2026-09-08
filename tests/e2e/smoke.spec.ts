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

test("an unknown module returns the themed 404", async ({ page }) => {
  // Both routes set dynamicParams = false, so an unlisted slug must 404 rather
  // than render on demand. The lesson route was covered; the module route was
  // not, and only a runtime request proves it.
  const response = await page.goto("/system-design/no-such-module");
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
