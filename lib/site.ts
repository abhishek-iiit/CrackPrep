const configured = process.env.NEXT_PUBLIC_SITE_URL;

// A production build with this unset used to fall back to localhost and ship
// 197 `http://localhost:3000` sitemap entries, a robots.txt pointing at
// localhost, and JSON-LD with localhost URLs — silently, because the sitemap
// test only asserts /^https?:\/\// and localhost satisfies that happily.
// There is nothing correct to guess for a deploy, so a production build
// without an origin fails at module load instead of producing broken output.
// Development and test keep the localhost default.
if (process.env.NODE_ENV === "production" && !configured) {
  throw new Error(
    "NEXT_PUBLIC_SITE_URL is required for a production build: the sitemap, " +
      "robots.txt and JSON-LD all need an absolute origin, and there is no " +
      "safe default. Run `cp .env.example .env.local` locally, or set it in " +
      "the deploy environment.",
  );
}

/** Absolute site origin for the sitemap, robots.txt and JSON-LD. */
export const SITE_URL = configured ?? "http://localhost:3000";
