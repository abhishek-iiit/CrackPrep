/**
 * The dismissal contract for the announcement bar.
 *
 * The bar is server-rendered and must not need hydration to know it was
 * dismissed: `hidden={dismissed}` behind a useMounted() gate is absent from
 * the static HTML, so a dismissed bar painted and then disappeared, shifting
 * everything below it by its own height. Instead the script below runs
 * BEFORE the bar's markup is parsed and stamps an attribute on <html>, and
 * `html[data-announce-dismissed] [data-announcement]` in globals.css keeps the
 * bar hidden from the first paint. Same technique as next-themes' own
 * no-flash script, which the root layout already ships.
 *
 * ANNOUNCEMENT_ID lives here, next to the storage key and the script that
 * reads it, so the writer (AnnouncementBar's dismiss handler) and the reader
 * (the inline script) cannot drift. Bumping the id re-shows the bar to
 * everyone who dismissed the previous announcement, which is the intent.
 */
export const ANNOUNCEMENT_ID = "launch-2026-09";

/** Attribute stamped on <html> when the current announcement is dismissed. */
export const ANNOUNCEMENT_DISMISSED_ATTR = "data-announce-dismissed";

export const announcementStorageKey = `announce:${ANNOUNCEMENT_ID}`;

/**
 * Blocking inline script. Rendered as the first child of <body> in the root
 * layout, so it executes before the bar exists in the DOM — the bar therefore
 * cannot be painted in its undismissed state. Kept to one statement and
 * wrapped in try/catch: private browsing and blocked site data both throw on
 * `localStorage` access, and a throw here would abort parsing the rest of it.
 */
export const announcementDismissScript = `try{if(localStorage.getItem(${JSON.stringify(
  announcementStorageKey,
)})==="dismissed")document.documentElement.setAttribute(${JSON.stringify(
  ANNOUNCEMENT_DISMISSED_ATTR,
)},"")}catch(e){}`;
