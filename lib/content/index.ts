import { courses as courseRecords } from "@/content/courses";
import {
  courseSlug,
  loadLesson,
  loadModules,
  registeredContentCourses,
} from "./source";
import type {
  Course, CourseStats, Lesson, LessonMeta, LessonRef, Module, SearchDoc,
} from "./types";

export type {
  Course, CourseStats, Difficulty, Lesson, LessonMeta, LessonRef, Module,
  SearchDoc, Status,
} from "./types";

function courseRecord(slug: string) {
  return courseRecords.find((c) => c.slug === slug);
}

/** A course is live when the registry says so and content exists on disk. */
export function isLiveCourse(slug: string): boolean {
  return (
    courseRecord(slug)?.status === "live" &&
    registeredContentCourses().includes(slug)
  );
}

export function getLiveCourseSlugs(): string[] {
  return courseRecords.filter((c) => isLiveCourse(c.slug)).map((c) => c.slug);
}

export function getCourses(): Course[] {
  return courseRecords.map((record) => {
    const live = isLiveCourse(record.slug);
    const { moduleCount, topicCount } = live
      ? getCourseStats(record.slug)
      : { moduleCount: 0, topicCount: 0 };
    return { ...record, moduleCount, topicCount, url: live ? `/${record.slug}` : "" };
  });
}

export function getCourse(slug: string): Course | null {
  return getCourses().find((c) => c.slug === slug) ?? null;
}

// Returns readonly views: the underlying tree is a frozen process-wide cache,
// so the types tell callers to copy before sorting rather than discovering it
// as a TypeError at runtime.
export function getModules(course: string): readonly Module[] {
  return isLiveCourse(course) ? loadModules(course) : [];
}

export function getModule(course: string, moduleSlug: string): Module | null {
  return getModules(course).find((m) => m.slug === moduleSlug) ?? null;
}

export function getLessons(course: string, moduleSlug: string): readonly LessonMeta[] {
  return getModule(course, moduleSlug)?.lessons ?? [];
}

export function getLesson(
  course: string,
  moduleSlug: string,
  lessonSlug: string,
): Lesson | null {
  return isLiveCourse(course) ? loadLesson(course, moduleSlug, lessonSlug) : null;
}

/** Published lessons in course order — the spine for prev/next. */
function publishedChain(course: string): LessonMeta[] {
  return getModules(course)
    .flatMap((m) => m.lessons)
    .filter((l) => l.status === "published")
    .sort((a, b) => a.number.localeCompare(b.number));
}

/**
 * Draft-aware neighbour chain for courses that are mostly stubs: walk every
 * lesson in number order so prev/next still works before content is published.
 */
function lessonChain(course: string): LessonMeta[] {
  const published = publishedChain(course);
  if (published.length > 0) return published;
  return getModules(course)
    .flatMap((m) => m.lessons)
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
  const chain = lessonChain(course);
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

/** Published lessons across every live course — used by the search index build. */
export function getAllSearchIndex(): SearchDoc[] {
  return getLiveCourseSlugs()
    .flatMap((slug) => getSearchIndex(slug))
    .sort((a, b) => a.url.localeCompare(b.url));
}

export function getAllLessonParams(
  course: string = courseSlug,
): { module: string; topic: string }[] {
  return getModules(course).flatMap((m) =>
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

/** Sum of published lessons across live courses — search palette placeholder. */
export function getTotalPublishedCount(): number {
  return getLiveCourseSlugs().reduce(
    (sum, slug) => sum + getCourseStats(slug).publishedCount,
    0,
  );
}

export { courseSlug };
