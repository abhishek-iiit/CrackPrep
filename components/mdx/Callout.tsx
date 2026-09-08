import { AlertTriangle, Info, Lightbulb, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";

type CalloutType = "note" | "warn" | "tip" | "gotcha";

const META: Record<CalloutType, { label: string; a11y: string; icon: typeof Info; tint: string }> = {
  note:   { label: "Note",    a11y: "Note",    icon: Info,          tint: "bg-card" },
  warn:   { label: "Warning", a11y: "Warning", icon: TriangleAlert, tint: "bg-card" },
  tip:    { label: "Tip",     a11y: "Tip",     icon: Lightbulb,     tint: "bg-card" },
  gotcha: { label: "Gotcha",  a11y: "Gotcha",  icon: AlertTriangle, tint: "bg-card" },
};

export function Callout({
  type = "note", children,
}: { type?: CalloutType; children: React.ReactNode }) {
  const meta = META[type];
  const Icon = meta.icon;

  return (
    <aside
      role="note"
      aria-label={meta.a11y}
      className={cn("my-6 rounded-card border-2 border-structural p-4", meta.tint)}
    >
      <p className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-wider">
        <Icon aria-hidden className="size-4" />
        {meta.label}
      </p>
      <div className="[&>*:last-child]:mb-0">{children}</div>
    </aside>
  );
}
