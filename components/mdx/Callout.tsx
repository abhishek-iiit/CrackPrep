import { Bug, Info, Lightbulb, TriangleAlert } from "lucide-react";

type CalloutType = "note" | "warn" | "tip" | "gotcha";

/**
 * Four types, four genuinely different glyphs.
 *
 * `AlertTriangle` is lucide's deprecated alias for `TriangleAlert` — the same
 * component object, not a similar one — so `warn` and `gotcha` used to render
 * the identical icon. With every type also tinted `bg-card`, the four
 * variants differed by exactly one word of label text. `Bug` carries
 * "gotcha" (a subtle trap in the mechanism) without reading as a severity
 * step above `warn`.
 *
 * The old `tint` field held "bg-card" four times, so it encoded nothing and
 * only made the four look configurable; the class is inlined below instead.
 * A per-type tint would need four new colour tokens and four contrast
 * assertions to be worth having.
 */
const META: Record<CalloutType, { label: string; icon: typeof Info }> = {
  note: { label: "Note", icon: Info },
  warn: { label: "Warning", icon: TriangleAlert },
  tip: { label: "Tip", icon: Lightbulb },
  gotcha: { label: "Gotcha", icon: Bug },
};

export function Callout({
  type = "note", children,
}: { type?: CalloutType; children: React.ReactNode }) {
  const meta = META[type];
  const Icon = meta.icon;

  return (
    <aside
      role="note"
      // The label doubles as the accessible name: the type is named in text,
      // never conveyed by the icon alone.
      aria-label={meta.label}
      className="my-6 rounded-card border-2 border-structural bg-card p-4"
    >
      <p className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-wider">
        <Icon aria-hidden className="size-4" />
        {meta.label}
      </p>
      <div className="[&>*:last-child]:mb-0">{children}</div>
    </aside>
  );
}
