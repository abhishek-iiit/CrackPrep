import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { getSearchIndex, courseSlug } from "@/lib/content";

const OUT = "public/search-index.json";

describe("build-search-index script", () => {
  beforeAll(() => {
    rmSync(OUT, { force: true });
    execFileSync("npx", ["tsx", "scripts/build-search-index.ts"], { stdio: "pipe" });
  });

  it("writes the index file", () => {
    expect(existsSync(OUT)).toBe(true);
  });

  it("matches what the content layer reports", () => {
    const written = JSON.parse(readFileSync(OUT, "utf8"));
    expect(written).toEqual(getSearchIndex(courseSlug));
  });

  it("carries only the five search fields", () => {
    const written: Array<Record<string, unknown>> = JSON.parse(readFileSync(OUT, "utf8"));
    for (const doc of written) {
      expect(Object.keys(doc).sort()).toEqual(["module", "number", "summary", "title", "url"]);
    }
  });

  it("stays small enough to fetch on demand", () => {
    const bytes = readFileSync(OUT).byteLength;
    expect(bytes).toBeLessThan(200_000);
  });
});
