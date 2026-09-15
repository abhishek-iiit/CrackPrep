import { readFileSync } from "node:fs";
import { join } from "node:path";

const LINE =
  /^- (\d{2}\.\d{2}) .+? — (https:\/\/leetcode\.com\/problems\/[a-z0-9-]+\/)\s*$/;

let cached: ReadonlyMap<string, string> | null = null;

/**
 * Lesson number → LeetCode problem URL, parsed once from LeetCodeSyllabus.md.
 * That file is the source of truth (slug on disk can differ, e.g. linked-list-cycle).
 */
export function leetCodeProblemUrls(): ReadonlyMap<string, string> {
  if (cached) return cached;

  const raw = readFileSync(join(process.cwd(), "LeetCodeSyllabus.md"), "utf8");
  const map = new Map<string, string>();
  for (const line of raw.split("\n")) {
    const match = line.match(LINE);
    if (!match) continue;
    const [, number, url] = match;
    if (map.has(number)) {
      throw new Error(`duplicate LeetCode URL for ${number} in LeetCodeSyllabus.md`);
    }
    map.set(number, url);
  }

  if (map.size !== 150) {
    throw new Error(
      `LeetCodeSyllabus.md: expected 150 problem URLs, found ${map.size}`,
    );
  }

  cached = map;
  return cached;
}

export function leetCodeProblemUrl(number: string): string | null {
  return leetCodeProblemUrls().get(number) ?? null;
}
