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
