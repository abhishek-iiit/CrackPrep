"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useMounted } from "@/lib/hooks/useMounted";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  const isDark = mounted && resolvedTheme === "dark";
  const label = mounted
    ? `Switch to ${isDark ? "light" : "dark"} theme`
    : "Switch theme";

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="grid size-11 place-items-center rounded-card border-2 border-structural bg-card transition-brut hover:shadow-hard-sm"
    >
      {/* Both icons render; visibility is CSS-driven so the button never
          changes size between server and client renders. */}
      <Sun aria-hidden className={isDark ? "hidden" : "size-5"} />
      <Moon aria-hidden className={isDark ? "size-5" : "hidden"} />
    </button>
  );
}
