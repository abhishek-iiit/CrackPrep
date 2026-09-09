import { describe, expect, it } from "vitest";
import { compositeOver, contrastRatio, relativeLuminance } from "@/lib/design/contrast";
import { baseTokens } from "@/lib/design/tokens";
import { moduleColors, PLANNED_CARD_OPACITY } from "@/lib/design/modules";

const AA_TEXT = 4.5;
const AA_UI = 3;

describe("contrastRatio", () => {
  it("returns 21 for black on white", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 1);
  });

  it("returns 1 for a colour against itself", () => {
    expect(contrastRatio("#4F46E5", "#4F46E5")).toBeCloseTo(1, 5);
  });

  it("is symmetric", () => {
    expect(contrastRatio("#141414", "#FAF8F4")).toBeCloseTo(
      contrastRatio("#FAF8F4", "#141414"),
      5,
    );
  });

  it("accepts lowercase and omitted-hash forms", () => {
    expect(contrastRatio("#faf8f4", "141414")).toBeCloseTo(17.37, 1);
  });

  it("rejects malformed input", () => {
    expect(() => relativeLuminance("#12345")).toThrow(/invalid hex/i);
    expect(() => relativeLuminance("nope")).toThrow(/invalid hex/i);
  });
});

describe("compositeOver", () => {
  it("returns the foreground unchanged at alpha 1", () => {
    expect(compositeOver("#1D4ED8", "#FAF8F4", 1)).toBe("#1D4ED8");
  });

  it("returns the background unchanged at alpha 0", () => {
    expect(compositeOver("#1D4ED8", "#FAF8F4", 0)).toBe("#FAF8F4");
  });

  it("rejects an out-of-range alpha", () => {
    expect(() => compositeOver("#1D4ED8", "#FAF8F4", 1.1)).toThrow(/alpha out of range/i);
    expect(() => compositeOver("#1D4ED8", "#FAF8F4", -0.1)).toThrow(/alpha out of range/i);
  });
});

describe("module surfaces meet AA for their ink", () => {
  const entries = Object.entries(moduleColors);

  it("defines exactly 14 colour keys", () => {
    expect(entries).toHaveLength(14);
  });

  it.each(entries)("%s surface/ink is at least 4.5:1", (_key, pair) => {
    expect(contrastRatio(pair.surface, pair.ink)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it("uses no duplicate surfaces", () => {
    const surfaces = entries.map(([, p]) => p.surface.toUpperCase());
    expect(new Set(surfaces).size).toBe(14);
  });
});

describe("planned-card compositing meets AA on the actual page", () => {
  // PathCards.tsx renders a "planned" card at PLANNED_CARD_OPACITY, which
  // composites BOTH the surface and the ink onto the page background before
  // the browser paints it — a pair that clears 4.5:1 in isolation (the
  // `it.each` block above) is not guaranteed to clear it once composited.
  // This is what actually caught the cobalt regression the axe suite found:
  // unit tests only ever saw the raw token pair, and the axe scan only ever
  // saw whichever colour keys happened to be in content/courses.ts that day.
  const entries = Object.entries(moduleColors);

  for (const theme of ["light", "dark"] as const) {
    const paper = baseTokens[theme].paper;

    it.each(entries)(
      `%s composited at PLANNED_CARD_OPACITY on ${theme} paper is at least 4.5:1`,
      (key, pair) => {
        const bg = compositeOver(pair.surface, paper, PLANNED_CARD_OPACITY);
        const fg = compositeOver(pair.ink, paper, PLANNED_CARD_OPACITY);
        const ratio = contrastRatio(bg, fg);
        expect(
          ratio,
          `${key} composites to ${ratio.toFixed(3)}:1 on ${theme} paper at opacity ${PLANNED_CARD_OPACITY} — below the 4.5:1 AA floor`,
        ).toBeGreaterThanOrEqual(AA_TEXT);
      },
    );
  }
});

describe("base tokens meet AA in both themes", () => {
  for (const theme of ["light", "dark"] as const) {
    const t = baseTokens[theme];

    it(`${theme}: ink on paper >= 4.5`, () => {
      expect(contrastRatio(t.ink, t.paper)).toBeGreaterThanOrEqual(AA_TEXT);
    });

    it(`${theme}: ink on card >= 4.5`, () => {
      expect(contrastRatio(t.ink, t.card)).toBeGreaterThanOrEqual(AA_TEXT);
    });

    it(`${theme}: inkMuted on paper >= 4.5`, () => {
      expect(contrastRatio(t.inkMuted, t.paper)).toBeGreaterThanOrEqual(AA_TEXT);
    });

    it(`${theme}: inkMuted on card >= 4.5`, () => {
      expect(contrastRatio(t.inkMuted, t.card)).toBeGreaterThanOrEqual(AA_TEXT);
    });

    it(`${theme}: link on paper >= 4.5`, () => {
      expect(contrastRatio(t.link, t.paper)).toBeGreaterThanOrEqual(AA_TEXT);
    });

    it(`${theme}: borderStructural on paper >= 3 (WCAG 1.4.11)`, () => {
      expect(contrastRatio(t.borderStructural, t.paper)).toBeGreaterThanOrEqual(AA_UI);
    });

    it(`${theme}: destructive on paper >= 4.5`, () => {
      expect(contrastRatio(t.destructive, t.paper)).toBeGreaterThanOrEqual(AA_TEXT);
    });

    it(`${theme}: destructive on card >= 4.5`, () => {
      expect(contrastRatio(t.destructive, t.card)).toBeGreaterThanOrEqual(AA_TEXT);
    });
  }

  it("documents that hairlines are decorative and below 3:1", () => {
    expect(
      contrastRatio(baseTokens.light.borderHairline, baseTokens.light.paper),
    ).toBeLessThan(AA_UI);
    expect(
      contrastRatio(baseTokens.dark.borderHairline, baseTokens.dark.paper),
    ).toBeLessThan(AA_UI);
  });
});
