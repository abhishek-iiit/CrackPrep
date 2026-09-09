import type { ColorKey } from "@/lib/design/modules";

export type Difficulty = "intro" | "core" | "deep";
export type Status = "published" | "draft";

/** Lesson metadata without the MDX body. Used by every listing. */
export type LessonMeta = {
  courseSlug: string;
  moduleId: string;
  moduleSlug: string;
  slug: string;
  number: string;
  title: string;
  summary: string;
  status: Status;
  free: boolean;
  difficulty: Difficulty;
  estMinutes: number;
  tags: string[];
  updated: string | null;
  url: string;
};

/** A lesson with its raw MDX body. Only getLesson returns this. */
export type Lesson = LessonMeta & { body: string };

export type Module = {
  id: string;
  slug: string;
  title: string;
  blurb: string;
  colorKey: ColorKey;
  url: string;
  // readonly, because freezeModules() freezes this array at runtime: the type
  // said LessonMeta[] while a `.push()` threw, and the immutability test
  // needed a cast to prove it — the tell that the type was lying.
  lessons: readonly LessonMeta[];
  publishedCount: number;
  totalCount: number;
};

export type Course = {
  slug: string;
  title: string;
  eyebrow: string;
  blurb: string;
  bullets: string[];
  status: "live" | "planned";
  colorKey: ColorKey;
  moduleCount: number;
  topicCount: number;
  url: string;
};

export type LessonRef = { title: string; number: string; url: string };

export type SearchDoc = {
  number: string;
  title: string;
  summary: string;
  module: string;
  url: string;
};

export type CourseStats = {
  moduleCount: number;
  topicCount: number;
  publishedCount: number;
};
