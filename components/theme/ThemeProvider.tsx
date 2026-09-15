"use client";

import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes";

/**
 * Thin client wrapper around next-themes.
 *
 * React 19 warns when a Client Component renders a `<script>` (next-themes
 * injects a FOUC-prevention script). SSR still needs that script executable;
 * on the client we pass `type: "application/json"` so React stops warning —
 * the script already ran from the server HTML. See
 * https://github.com/pacocoursey/next-themes/issues/387
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      {...props}
      scriptProps={
        typeof window === "undefined" ? undefined : { type: "application/json" }
      }
    >
      {children}
    </NextThemesProvider>
  );
}
