import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { baseTokens, cssVarName, type TokenName } from "@/lib/design/tokens";

const css = readFileSync("app/globals.css", "utf8");
const tokenNames = Object.keys(baseTokens.light) as TokenName[];

/**
 * Returns the declarations inside a CSS rule, matched by a selector anchored
 * at the start of a line.
 *
 * Do NOT slice on `css.indexOf(".dark")` instead: the file opens with
 * `@custom-variant dark (&:where(.dark, .dark *))`, whose `.dark` occurs
 * BEFORE `:root`, so an indexOf-based light-token slice comes out empty and
 * every light assertion fails. Anchoring on a selector followed by `{` also
 * skips the indented `html.dark {` rule inside `@layer base`.
 */
function ruleBody(source: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`^${escaped}\\s*\\{([^}]*)\\}`, "m").exec(source);
  if (!match) throw new Error(`no "${selector}" rule found in app/globals.css`);
  return match[1];
}

const rootBlock = ruleBody(css, ":root");
const darkBlock = ruleBody(css, ".dark");
const themeBlock = ruleBody(css, "@theme inline");

describe("globals.css mirrors lib/design/tokens.ts", () => {
  it("uses the class strategy for dark mode", () => {
    expect(css).toMatch(/@custom-variant\s+dark/);
  });

  it.each(tokenNames)("declares %s in :root with the light value", (token) => {
    expect(rootBlock).toContain(`${cssVarName(token)}: ${baseTokens.light[token]};`);
  });

  it.each(tokenNames)("declares %s in .dark with the dark value", (token) => {
    expect(darkBlock).toContain(`${cssVarName(token)}: ${baseTokens.dark[token]};`);
  });

  it("exposes every token to Tailwind via @theme inline", () => {
    for (const token of tokenNames) {
      expect(themeBlock).toContain(`var(${cssVarName(token)})`);
    }
  });

  it("never sets a zero-duration transition", () => {
    expect(css).not.toMatch(/transition[^;]*:\s*(none|0s|0ms)/);
  });

  it("guards motion behind prefers-reduced-motion", () => {
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  });
});
