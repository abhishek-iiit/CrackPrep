import { courses as courseRecords } from "@/content/courses";
import { courseSlug, loadLesson, loadModules } from "./source";
import type {
  Course, CourseStats, Lesson, LessonMeta, LessonRef, Module, SearchDoc,
} from "./types";

export type {
  Course, CourseStats, Difficulty, Lesson, LessonMeta, LessonRef, Module,
  SearchDoc, Status,
} from "./types";

function isLive(slug: string): boolean {
  return slug === courseSlug;
}

export function getCourses(): Course[] {
  return courseRecords.map((record) => {
    const live = record.status === "live" && isLive(record.slug);
    const mods = live ? loadModules() : [];
    return {
      ...record,
      moduleCount: mods.length,
      topicCount: mods.reduce((sum, m) => sum + m.totalCount, 0),
      url: live ? `/${record.slug}` : "",
    };
  });
}

export function getCourse(slug: string): Course | null {
  return getCourses().find((c) => c.slug === slug) ?? null;
}

export function getModules(course: string): Module[] {
  return isLive(course) ? loadModules() : [];
}

export function getModule(course: string, moduleSlug: string): Module | null {
  return getModules(course).find((m) => m.slug === moduleSlug) ?? null;
}

export function getLessons(course: string, moduleSlug: string): LessonMeta[] {
  return getModule(course, moduleSlug)?.lessons ?? [];
}

export function getLesson(
  course: string,
  moduleSlug: string,
  lessonSlug: string,
): Lesson | null {
  return isLive(course) ? loadLesson(moduleSlug, lessonSlug) : null;
}

/** Published lessons in course order — the spine for prev/next. */
function publishedChain(course: string): LessonMeta[] {
  return getModules(course)
    .flatMap((m) => m.lessons)
    .filter((l) => l.status === "published")
    .sort((a, b) => a.number.localeCompare(b.number));
}

function toRef(lesson: LessonMeta): LessonRef {
  return { title: lesson.title, number: lesson.number, url: lesson.url };
}

export function getLessonNeighbours(
  course: string,
  moduleSlug: string,
  lessonSlug: string,
): { prev: LessonRef | null; next: LessonRef | null } {
  const chain = publishedChain(course);
  const i = chain.findIndex(
    (l) => l.moduleSlug === moduleSlug && l.slug === lessonSlug,
  );
  if (i === -1) return { prev: null, next: null };
  return {
    prev: i > 0 ? toRef(chain[i - 1]) : null,
    next: i < chain.length - 1 ? toRef(chain[i + 1]) : null,
  };
}

export function getSearchIndex(course: string): SearchDoc[] {
  return getModules(course)
    .flatMap((m) =>
      m.lessons
        .filter((l) => l.status === "published")
        .map((l) => ({
          number: l.number,
          title: l.title,
          summary: l.summary,
          module: m.title,
          url: l.url,
        })),
    )
    .sort((a, b) => a.number.localeCompare(b.number));
}

export function getAllLessonParams(): { module: string; topic: string }[] {
  return getModules(courseSlug).flatMap((m) =>
    m.lessons.map((l) => ({ module: m.slug, topic: l.slug })),
  );
}

export function getCourseStats(course: string): CourseStats {
  const mods = getModules(course);
  return {
    moduleCount: mods.length,
    topicCount: mods.reduce((sum, m) => sum + m.totalCount, 0),
    publishedCount: mods.reduce((sum, m) => sum + m.publishedCount, 0),
  };
}

export { courseSlug };
