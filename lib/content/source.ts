import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { modules as moduleRecords } from "@/content/system-design/modules";
import { frontmatterSchema, moduleRecordSchema } from "./schema";
import type { Lesson, LessonMeta, Module } from "./types";

const COURSE_SLUG = "system-design";
const CONTENT_ROOT = join(process.cwd(), "content", COURSE_SLUG);

function lessonUrl(moduleSlug: string, slug: string): string {
  return `/${COURSE_SLUG}/${moduleSlug}/${slug}`;
}

function readLessonFile(dir: string, file: string) {
  const raw = readFileSync(join(CONTENT_ROOT, dir, file), "utf8");
  const parsed = matter(raw);
  const result = frontmatterSchema.safeParse(parsed.data);
  if (!result.success) {
    throw new Error(
      `invalid frontmatter in content/${COURSE_SLUG}/${dir}/${file}:\n${result.error.issues
        .map((i) => `  ${i.path.join(".") || "(root)"}: ${i.message}`)
        .join("\n")}`,
    );
  }
  return { frontmatter: result.data, body: parsed.content };
}

let cache: Module[] | null = null;

/** Builds the full module tree once per process. Metadata only — no bodies. */
export function loadModules(): Module[] {
  if (cache) return cache;

  cache = moduleRecords.map((record) => {
    const validated = moduleRecordSchema.parse(record);

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
