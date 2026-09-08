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

/**
 * Opacity applied to a "planned" (not-yet-live) path card in PathCards.tsx.
 * CSS `opacity` composites the surface AND the ink together onto the page
 * background, so a token pair that clears 4.5:1 in isolation can still fail
 * once composited — verified for all 14 colour keys, both themes, at this
 * exact value by tests/design/contrast.test.ts. 0.92 is the tightest value
 * where every key clears (worst case 4.50:1, too tight to rely on); 0.95
 * leaves headroom (worst case 4.75:1, orange on dark paper).
 */
export const PLANNED_CARD_OPACITY = 0.95;
