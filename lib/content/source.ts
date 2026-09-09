import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { modules as moduleRecords, type ModuleRecord } from "@/content/system-design/modules";
import { frontmatterSchema, moduleRecordSchema } from "./schema";
import type { Lesson, LessonMeta, Module } from "./types";

const COURSE_SLUG = "system-design";
const CONTENT_ROOT = join(process.cwd(), "content", COURSE_SLUG);

function lessonUrl(moduleSlug: string, slug: string): string {
  return `/${COURSE_SLUG}/${moduleSlug}/${slug}`;
}

/** Indented, one issue per line — a bare ZodError is unreadable in build output. */
function formatIssues(error: { issues: { path: PropertyKey[]; message: string }[] }): string {
  return error.issues
    .map((i) => `  ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
}

function readLessonFile(dir: string, file: string) {
  const raw = readFileSync(join(CONTENT_ROOT, dir, file), "utf8");
  const parsed = matter(raw);
  const result = frontmatterSchema.safeParse(parsed.data);
  if (!result.success) {
    throw new Error(
      `invalid frontmatter in content/${COURSE_SLUG}/${dir}/${file}:\n${formatIssues(result.error)}`,
    );
  }
  return { frontmatter: result.data, body: parsed.content };
}

/**
 * Like readLessonFile's parse, this names where the bad data lives. A bare
 * `.parse()` threw "Invalid input: expected string" with no hint that the
 * offending value is in the generated registry, let alone which record — and
 * that file holds 14 of them.
 */
function parseModuleRecord(record: ModuleRecord, index: number): ModuleRecord {
  const result = moduleRecordSchema.safeParse(record);
  if (!result.success) {
    throw new Error(
      `invalid module record in content/${COURSE_SLUG}/modules.ts (record ${
        index + 1
      }, id "${record.id}"):\n${formatIssues(result.error)}`,
    );
  }
  return result.data;
}

let cache: readonly Module[] | null = null;

/**
 * Recursively freezes the module tree.
 *
 * The cache is a process-wide singleton and Next reuses one process across many
 * static-generation calls, so handing it out by reference would let any caller
 * corrupt it for every later page with one in-place `.sort()`. Freezing costs
 * nothing per call (unlike copying on every read) and turns that silent
 * corruption into an immediate TypeError at the offending call site.
 *
 * A shallow freeze is NOT enough — the nested `lessons` arrays and the lesson
 * objects inside them stay mutable unless frozen individually.
 */
function freezeModules(modules: Module[]): readonly Module[] {
  for (const mod of modules) {
    for (const lesson of mod.lessons) Object.freeze(lesson);
    Object.freeze(mod.lessons);
    Object.freeze(mod);
  }
  return Object.freeze(modules);
}

/** Builds the full module tree once per process. Metadata only — no bodies. */
export function loadModules(): readonly Module[] {
  if (cache) return cache;

  const built: Module[] = moduleRecords.map((record, index) => {
    const validated = parseModuleRecord(record, index);

    const files = readdirSync(join(CONTENT_ROOT, validated.dir))
      .filter((f) => f.endsWith(".mdx"))
      .sort();

    const lessons: LessonMeta[] = files
      .map((file) => {
        const { frontmatter } = readLessonFile(validated.dir, file);
        const slug = file.replace(/\.mdx$/, "");
        return {
          courseSlug: COURSE_SLUG,
          moduleId: validated.id,
          moduleSlug: validated.slug,
          slug,
          url: lessonUrl(validated.slug, slug),
          ...frontmatter,
        } satisfies LessonMeta;
      })
      .sort((a, b) => a.number.localeCompare(b.number));

    if (lessons.length !== validated.topicCount) {
      throw new Error(
        `module ${validated.id} declares ${validated.topicCount} topics but ${lessons.length} .mdx files were found in ${validated.dir}`,
      );
    }

    return {
      id: validated.id,
      slug: validated.slug,
      title: validated.title,
      blurb: validated.blurb,
      colorKey: validated.colorKey,
      url: `/${COURSE_SLUG}/${validated.slug}`,
      lessons,
      publishedCount: lessons.filter((l) => l.status === "published").length,
      totalCount: lessons.length,
    };
  });

  cache = freezeModules(built);
  return cache;
}

/** Reads one lesson including its MDX body. */
export function loadLesson(moduleSlug: string, lessonSlug: string): Lesson | null {
  const mod = loadModules().find((m) => m.slug === moduleSlug);
  if (!mod) return null;
  const meta = mod.lessons.find((l) => l.slug === lessonSlug);
  if (!meta) return null;

  const record = moduleRecords.find((r) => r.slug === moduleSlug);
  if (!record) return null;

  const { body } = readLessonFile(record.dir, `${lessonSlug}.mdx`);
  return { ...meta, body };
}

export const courseSlug = COURSE_SLUG;
