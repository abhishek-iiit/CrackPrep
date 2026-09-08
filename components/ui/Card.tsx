import { cn } from "@/lib/cn";
import { moduleColors, type ColorKey } from "@/lib/design/modules";

type Props = {
  children: React.ReactNode;
  colorKey?: ColorKey;
  interactive?: boolean;
  className?: string;
  as?: "div" | "article" | "li" | "section";
};

export function Card({
  children, colorKey, interactive = false, className, as: Tag = "div",
}: Props) {
  const pair = colorKey ? moduleColors[colorKey] : null;

  return (
    <Tag
      style={
        pair
          ? ({
              "--surface": pair.surface,
              "--on-surface": pair.ink,
            } as React.CSSProperties)
          : undefined
      }
      className={cn(
        "rounded-card border-2 border-structural",
        pair ? "bg-[var(--surface)] text-[var(--on-surface)]" : "bg-card text-ink",
        interactive && "transition-brut hover:-translate-y-0.5 hover:shadow-hard",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
