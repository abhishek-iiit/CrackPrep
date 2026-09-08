const HEX = /^#?([0-9a-f]{6})$/i;

/** WCAG 2.1 relative luminance for an `#RRGGBB` colour. */
export function relativeLuminance(hex: string): number {
  const match = HEX.exec(hex.trim());
  if (!match) throw new Error(`invalid hex colour: ${hex}`);
  const int = Number.parseInt(match[1], 16);
  const channels = [(int >> 16) & 255, (int >> 8) & 255, int & 255];
  const [r, g, b] = channels.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.1 contrast ratio, 1–21. Order-independent. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/** True when the pair is legible as body text at normal weight. */
export function meetsAAText(a: string, b: string): boolean {
  return contrastRatio(a, b) >= 4.5;
}

/**
 * Alpha-composites an already-opaque `fg` colour over `bg`, the way CSS
 * `opacity` composites a whole element (background AND text together) onto
 * whatever sits behind it. This is not a general translucent-colour blend —
 * it models one fully-opaque layer rendered through an `opacity` multiplier,
 * which is exactly what turns a token pair that passes `contrastRatio` in
 * isolation into one that fails once it is actually painted on a page.
 */
export function compositeOver(fg: string, bg: string, alpha: number): string {
  if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) {
    throw new Error(`alpha out of range [0,1]: ${alpha}`);
  }
  const fgMatch = HEX.exec(fg.trim());
  const bgMatch = HEX.exec(bg.trim());
  if (!fgMatch) throw new Error(`invalid hex colour: ${fg}`);
  if (!bgMatch) throw new Error(`invalid hex colour: ${bg}`);

  const fgInt = Number.parseInt(fgMatch[1], 16);
  const bgInt = Number.parseInt(bgMatch[1], 16);
  const blend = (shift: number) => {
    const f = (fgInt >> shift) & 255;
    const b = (bgInt >> shift) & 255;
    return Math.round(alpha * f + (1 - alpha) * b);
  };
  return (
    "#" +
    [blend(16), blend(8), blend(0)]
      .map((c) => c.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}
