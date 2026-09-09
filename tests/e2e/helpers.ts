import { expect, type Page } from "@playwright/test";

/**
 * SearchPalette's Cmd+K listener is attached via `window.addEventListener`
 * inside a useEffect — outside React's delegated root. `page.goto()` resolves
 * on `load`, which precedes React running its effects, so a keydown
 * dispatched in that window is silently dropped and never retried (unlike a
 * click, which React replays against the pre-hydration DOM). Waiting on
 * ThemeToggle's label — "Switch theme" pre-hydration, directional after —
 * guarantees the post-hydration effect pass has already run, so the listener
 * is attached before the shortcut is pressed.
 *
 * Shared between a11y.spec.ts and interaction.spec.ts so the signal only has
 * to change in one place if it ever does.
 */
export async function waitForHydration(page: Page) {
  await expect(
    page.getByRole("button", { name: /switch to (dark|light) theme/i }),
  ).toBeVisible();
}
