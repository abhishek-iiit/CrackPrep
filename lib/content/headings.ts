import GithubSlugger from "github-slugger";

export type Heading = { id: string; text: string; level: 2 | 3 };

const FENCE = /^(`{3,}|~{3,})/;
const HEADING = /^(#{2,3})\s+(.*\S)\s*$/;

/** Removes inline code, emphasis, and link syntax from heading text. */
function plain(text: string): string {
  return text
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .trim();
}

/**
 * Extracts h2 and h3 headings from raw MDX for the table of contents.
 *
 * Ids come from the same slugger rehype-slug uses, including its duplicate
 * suffixing, so the ids here always match the ids in the rendered HTML.
 * Lines inside fenced code blocks are skipped — shell comments start with `#`
 * and would otherwise be mistaken for headings.
 */
export function extractHeadings(body: string): Heading[] {
  const slugger = new GithubSlugger();
  const headings: Heading[] = [];

  // Tracks WHICH delimiter opened the current fence and HOW LONG it was, not
  // merely that one is open. CommonMark requires the closing fence to use the
  // same character AND be at least as long as the opening one — a character-only
  // check would let a shorter "```" line inside a "````"-opened block close it
  // early and expose the shell comments inside as headings.
  let fenceChar: "`" | "~" | null = null;
  let fenceLen = 0;

  for (const line of body.split(/\r?\n/)) {
    const fence = FENCE.exec(line.trim());
    if (fence) {
      const marker = fence[1];
      const char = marker[0] as "`" | "~";
      if (fenceChar === null) {
        fenceChar = char;
        fenceLen = marker.length;
      } else if (fenceChar === char && marker.length >= fenceLen) {
        fenceChar = null;
        fenceLen = 0;
      }
      // A non-matching or too-short marker inside a fence is content — ignore it.
      continue;
    }
    if (fenceChar !== null) continue;

    const match = HEADING.exec(line);
    if (!match) continue;

    const text = plain(match[2]);
    if (!text) continue;

    headings.push({
      id: slugger.slug(text),
      text,
      level: match[1].length as 2 | 3,
    });
  }

  return headings;
}
