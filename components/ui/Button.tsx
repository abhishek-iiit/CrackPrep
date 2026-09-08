import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-ink text-paper border-structural hover:shadow-hard",
  secondary: "bg-card text-ink border-structural hover:shadow-hard",
  ghost: "bg-transparent text-ink border-transparent hover:border-structural",
};

const SIZES: Record<Size, string> = {
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-13 px-6 text-base",
};

type Props = {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  href?: string;
  className?: string;
  type?: "button" | "submit";
  "aria-label"?: string;
  onClick?: () => void;
};

export function Button({
  children, variant = "primary", size = "md", href, className, type = "button", ...rest
}: Props) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-card border-2 font-medium transition-brut",
    VARIANTS[variant],
    SIZES[size],
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
}
