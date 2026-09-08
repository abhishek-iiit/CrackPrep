import type { ColorKey } from "@/lib/design/modules";

const MODULE_ID = /^(\d{2})$/;
const TOPIC_NO = /^(\d{2})\.(\d{2})$/;
const COUNT = /^(\d+)\s+TOPICS$/i;

export type ParsedTopic = { number: string; title: string; slug: string };

export type ParsedModule = {
  id: string;
  title: string;
  blurb: string;
  declared: number;
  slug: string;
  topics: ParsedTopic[];
};

export type ParsedSyllabus = { modules: ParsedModule[]; totalTopics: number };

/** Directory slug per module id. Fixed by the spec; URLs depend on these. */
export const MODULE_SLUGS: Record<string, string> = {
  "01": "foundations",
  "02": "apis-services-protocols",
  "03": "data-modeling-sql",
  "04": "nosql-partitioning-ids",
  "05": "caching-fast-reads",
  "06": "distributed-coordination",
  "07": "storage-engines",
  "08": "async-work-streams",
  "09": "search-retrieval",
  "10": "analytics-sketches",
  "11": "realtime-social-feeds",
  "12": "geo-matching-recs",
  "13": "media-files-cdn",
  "14": "reliability-operations",
};

export const MODULE_COLORS: Record<string, ColorKey> = {
  "01": "cobalt",
  "02": "amber",
  "03": "mint",
  "04": "violet",
  "05": "rose",
  "06": "ink",
  "07": "teal",
  "08": "lime",
  "09": "orange",
  "10": "cyan",
  "11": "fuchsia",
  "12": "sky",
  "13": "cream",
  "14": "lavender",
};

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type Draft = {
  id: string;
  title: string | null;
  blurb: string | null;
  declared: number | null;
  topics: Map<string, ParsedTopic>;
};

function isStructural(line: string | undefined): boolean {
  if (!line) return true;
  return MODULE_ID.test(line) || TOPIC_NO.test(line) || COUNT.test(line);
}

/**
 * Parses SDsyllabus.md into modules and topics.
 *
 * The source file lists every module more than once: an opening
 * table-of-contents pass with ids, titles and counts but no topics, then the
 * real content, then a partial repeat with `---` separators and stray
 * "N TOPICS" fragments. Topics are therefore accumulated across every
 * occurrence and deduped by number, while title, blurb and declared count take
 * the first non-null value seen. Keeping only the first occurrence wholesale
 * would return 14 empty modules.
 */
export function parseSyllabus(raw: string): ParsedSyllabus {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && l !== "---");

  const drafts = new Map<string, Draft>();
  const draft = (id: string): Draft => {
    let d = drafts.get(id);
    if (!d) {
      d = { id, title: null, blurb: null, declared: null, topics: new Map() };
      drafts.set(id, d);
    }
    return d;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const topicMatch = TOPIC_NO.exec(line);
    if (topicMatch) {
      const title = lines[i + 1];
      if (!isStructural(title)) {
        const d = draft(topicMatch[1]);
        if (!d.topics.has(line)) {
          d.topics.set(line, { number: line, title, slug: slugify(title) });
        }
        i++;
      }
      continue;
    }

    const moduleMatch = MODULE_ID.exec(line);
    if (!moduleMatch) continue;

    const title = lines[i + 1];
    if (isStructural(title)) continue;

    const d = draft(moduleMatch[1]);
    d.title ??= title;

    const next = lines[i + 2];
    if (next && !isStructural(next)) {
      d.blurb ??= next;
      const countMatch = COUNT.exec(lines[i + 3] ?? "");
      if (countMatch) d.declared ??= Number(countMatch[1]);
    } else if (next) {
      const countMatch = COUNT.exec(next);
      if (countMatch) d.declared ??= Number(countMatch[1]);
    }
  }

  const modules: ParsedModule[] = Array.from(drafts.values())
    .sort((a, b) => {
      // Replicate JavaScript's Object.keys behavior: canonical numeric keys (e.g., "10")
      // are array indices and sort first numerically, then string keys (e.g., "01") sort by number.
      const aNum = Number(a.id);
      const bNum = Number(b.id);
      const aIsCanonicalNumeric = String(aNum) === a.id;
      const bIsCanonicalNumeric = String(bNum) === b.id;

      if (aIsCanonicalNumeric !== bIsCanonicalNumeric) {
        return aIsCanonicalNumeric ? -1 : 1;
      }
      return aNum - bNum;
    })
    .map((d) => {
      const topics = [...d.topics.values()].sort((a, b) =>
        a.number.localeCompare(b.number),
      );
      if (!d.title) throw new Error(`module ${d.id} has no title`);
      if (!d.blurb) throw new Error(`module ${d.id} has no blurb`);
      if (d.declared === null) {
        throw new Error(`module ${d.id} has no declared topic count`);
      }
      if (d.declared !== topics.length) {
        throw new Error(
          `module ${d.id} declares ${d.declared} topics but found ${topics.length}`,
        );
      }
      const slug = MODULE_SLUGS[d.id];
      if (!slug) throw new Error(`module ${d.id} has no slug in MODULE_SLUGS`);
      return {
        id: d.id,
        title: d.title,
        blurb: d.blurb,
        declared: d.declared,
        slug,
        topics,
      };
    });

  return {
    modules,
    totalTopics: modules.reduce((sum, m) => sum + m.topics.length, 0),
  };
}
