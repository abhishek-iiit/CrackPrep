import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { modules as systemDesignModules } from "@/content/system-design/modules";
import { modules as leetcodeModules } from "@/content/leetcode/modules";
import { modules as designPatternsModules } from "@/content/design-patterns/modules";
import { modules as caseStudiesModules } from "@/content/case-studies/modules";
import { frontmatterSchema, moduleRecordSchema } from "./schema";
import { leetCodeProblemUrl } from "./leetcode-urls";
import type { Lesson, LessonMeta, Module } from "./types";
import type { ModuleRecord } from "@/content/system-design/modules";

/** Primary / default course — marketing CTAs and backward-compatible exports. */
export const courseSlug = "system-design";

const COURSE_MODULES: Record<string, readonly ModuleRecord[]> = {
  "system-design": systemDesignModules,
  leetcode: leetcodeModules,
  "design-patterns": designPatternsModules,
  "case-studies": caseStudiesModules,
};

/** Courses that have an on-disk modules registry (live or not). */
export function registeredContentCourses(): string[] {
  return Object.keys(COURSE_MODULES);
}

function lessonUrl(course: string, moduleSlug: string, slug: string): string {
  return `/${course}/${moduleSlug}/${slug}`;
}

/** Indented, one issue per line — a bare ZodError is unreadable in build output. */
function formatIssues(error: { issues: { path: PropertyKey[]; message: string }[] }): string {
  return error.issues
    .map((i) => `  ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
}

function contentRoot(course: string): string {
  return join(process.cwd(), "content", course);
}

function readLessonFile(course: string, dir: string, file: string) {
  const raw = readFileSync(join(contentRoot(course), dir, file), "utf8");
  const parsed = matter(raw);
  const result = frontmatterSchema.safeParse(parsed.data);
  if (!result.success) {
    throw new Error(
      `invalid frontmatter in content/${course}/${dir}/${file}:\n${formatIssues(result.error)}`,
    );
  }
  return { frontmatter: result.data, body: parsed.content };
}

function parseModuleRecord(
  course: string,
  record: ModuleRecord,
  index: number,
): ModuleRecord {
  const result = moduleRecordSchema.safeParse(record);
  if (!result.success) {
    throw new Error(
      `invalid module record in content/${course}/modules.ts (record ${
        index + 1
      }, id "${record.id}"):\n${formatIssues(result.error)}`,
    );
  }
  return result.data;
}

const caches = new Map<string, readonly Module[]>();

/**
 * Recursively freezes the module tree.
 *
 * The cache is a process-wide singleton and Next reuses one process across many
 * static-generation calls, so handing it out by reference would let any caller
 * corrupt it for every later page with one in-place `.sort()`. Freezing costs
 * nothing per call (unlike copying on every read) and turns that silent
 * corruption into an immediate TypeError at the offending call site.
 *
 * In development the cache is skipped so frontmatter edits (e.g. draft →
 * published) show up without restarting the Next process.
 */
function freezeModules(modules: Module[]): readonly Module[] {
  for (const mod of modules) {
    for (const lesson of mod.lessons) Object.freeze(lesson);
    Object.freeze(mod.lessons);
    Object.freeze(mod);
  }
  return Object.freeze(modules);
}

/** Builds the full module tree once per course per process. Metadata only. */
export function loadModules(course: string): readonly Module[] {
  if (process.env.NODE_ENV !== "development") {
    const hit = caches.get(course);
    if (hit) return hit;
  }

  const moduleRecords = COURSE_MODULES[course];
  if (!moduleRecords) {
    throw new Error(`unknown content course: ${course}`);
  }

  const built: Module[] = moduleRecords.map((record, index) => {
    const validated = parseModuleRecord(course, record, index);

    const files = readdirSync(join(contentRoot(course), validated.dir))
      .filter((f) => f.endsWith(".mdx"))
      .sort();

    const lessons: LessonMeta[] = files
      .map((file) => {
        const { frontmatter } = readLessonFile(course, validated.dir, file);
        const slug = file.replace(/\.mdx$/, "");
        const problemUrl =
          course === "leetcode" ? leetCodeProblemUrl(frontmatter.number) : null;
        if (course === "leetcode" && !problemUrl) {
          throw new Error(
            `no LeetCode URL in LeetCodeSyllabus.md for lesson ${frontmatter.number} (${file})`,
          );
        }
        return {
          courseSlug: course,
          moduleId: validated.id,
          moduleSlug: validated.slug,
          slug,
          url: lessonUrl(course, validated.slug, slug),
          problemUrl,
          ...frontmatter,
        } satisfies LessonMeta;
      })
      .sort((a, b) => a.number.localeCompare(b.number));

    if (lessons.length !== validated.topicCount) {
      throw new Error(
        `module ${validated.id} declares ${validated.topicCount} topics but ${lessons.length} .mdx files were found in ${course}/${validated.dir}`,
      );
    }

    return {
      id: validated.id,
      slug: validated.slug,
      title: validated.title,
      blurb: validated.blurb,
      colorKey: validated.colorKey,
      url: `/${course}/${validated.slug}`,
      lessons,
      publishedCount: lessons.filter((l) => l.status === "published").length,
      totalCount: lessons.length,
    };
  });

  const frozen = freezeModules(built);
  if (process.env.NODE_ENV !== "development") {
    caches.set(course, frozen);
  }
  return frozen;
}

/** Reads one lesson including its MDX body. */
export function loadLesson(
  course: string,
  moduleSlug: string,
  lessonSlug: string,
): Lesson | null {
  const mod = loadModules(course).find((m) => m.slug === moduleSlug);
  if (!mod) return null;
  const meta = mod.lessons.find((l) => l.slug === lessonSlug);
  if (!meta) return null;

  const moduleRecords = COURSE_MODULES[course];
  const record = moduleRecords?.find((r) => r.slug === moduleSlug);
  if (!record) return null;

  const { body } = readLessonFile(course, record.dir, `${lessonSlug}.mdx`);
  return { ...meta, body };
}
