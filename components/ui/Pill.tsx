import { cn } from "@/lib/cn";

type Props = {
  children: React.ReactNode;
  tone?: "default" | "inverse";
  className?: string;
};

export function Pill({ children, tone = "default", className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border-2 px-3 py-1 font-mono text-xs uppercase tracking-wider",
        tone === "inverse"
          ? "border-paper bg-paper text-ink"
          : "border-structural bg-card text-ink",
        className,
      )}
    >
      {children}
    </span>
  );
}
