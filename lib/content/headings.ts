import GithubSlugger from "github-slugger";

export type Heading = { id: string; text: string; level: 2 | 3 };

const FENCE = /^(```|~~~)/;
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
  let inFence = false;

  for (const line of body.split(/\r?\n/)) {
    if (FENCE.test(line.trim())) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

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
