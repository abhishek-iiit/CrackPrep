export type TokenName =
  | "paper"
  | "ink"
  | "card"
  | "inkMuted"
  | "link"
  | "borderStructural"
  | "borderHairline"
  | "destructive";

export type TokenSet = Record<TokenName, string>;

/**
 * Base surface and text tokens. Values are fixed by the design spec and
 * verified by tests/design/contrast.test.ts — do not edit one without
 * running `npm test`.
 *
 * borderHairline is DECORATIVE ONLY and intentionally below 3:1. Any
 * boundary that conveys a UI component uses borderStructural at 2px.
 */
export const baseTokens: { light: TokenSet; dark: TokenSet } = {
  light: {
    paper: "#FAF8F4",
    ink: "#141414",
    card: "#FFFFFF",
    inkMuted: "#57534E",
    link: "#2563EB",
    borderStructural: "#141414",
    borderHairline: "#E5E0D8",
    destructive: "#DC2626",
  },
  dark: {
    paper: "#0E0E0E",
    ink: "#F5F3EF",
    card: "#171716",
    inkMuted: "#A8A29E",
    link: "#93B4FF",
    borderStructural: "#F5F3EF",
    borderHairline: "#2A2A28",
    destructive: "#F87171",
  },
};

/** CSS custom property name for a token, e.g. "inkMuted" -> "--ink-muted". */
export function cssVarName(token: TokenName): string {
  return `--${token.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
}
