import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { courseSlug, getSearchIndex } from "@/lib/content";

const OUT_DIR = join(process.cwd(), "public");
const OUT_FILE = join(OUT_DIR, "search-index.json");

const docs = getSearchIndex(courseSlug);
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_FILE, JSON.stringify(docs), "utf8");

console.log(`search index written: ${docs.length} published lesson(s) -> public/search-index.json`);
