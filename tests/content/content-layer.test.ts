import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  getAllLessonParams, getCourse, getCourses, getCourseStats, getLesson,
  getLessonNeighbours, getLessons, getModule, getModules, getSearchIndex,
  type LessonMeta, type Module,
} from "@/lib/content";
import { parseSyllabus } from "@/scripts/lib/parse-syllabus";

const COURSE = "system-design";
const syllabus = parseSyllabus(readFileSync("SDsyllabus.md", "utf8"));

describe("courses", () => {
  it("registers system-design as the only live course", () => {
    const live = getCourses().filter((c) => c.status === "live");
    expect(live).toHaveLength(1);
    expect(live[0].slug).toBe(COURSE);
  });

  it("registers three placeholder planned courses", () => {
    expect(getCourses().filter((c) => c.status === "planned")).toHaveLength(3);
  });

  it("gives every course a distinct colour key", () => {
    const keys = getCourses().map((c) => c.colorKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("returns null for an unknown course", () => {
    expect(getCourse("does-not-exist")).toBeNull();
  });
});

describe("modules", () => {
  const modules = getModules(COURSE);

  it("exposes 14 modules", () => {
    expect(modules).toHaveLength(14);
  });

  it("matches the syllabus module titles and order", () => {
    expect(modules.map((m) => m.id)).toEqual(syllabus.modules.map((m) => m.id));
    expect(modules.map((m) => m.title)).toEqual(syllabus.modules.map((m) => m.title));
  });

  it("counts lessons per module exactly as the syllabus declares", () => {
    for (const expected of syllabus.modules) {
      const mod = modules.find((m) => m.id === expected.id);
      expect(mod, `module ${expected.id} missing`).toBeDefined();
      expect(mod!.totalCount).toBe(expected.topics.length);
      expect(mod!.lessons).toHaveLength(expected.topics.length);
    }
  });

  it("builds urls under the course slug", () => {
    for (const mod of modules) {
      expect(mod.url).toBe(`/${COURSE}/${mod.slug}`);
    }
  });

  it("returns null for an unknown module", () => {
    expect(getModule(COURSE, "nope")).toBeNull();
  });
});

describe("lessons", () => {
  it("resolves every syllabus topic to exactly one lesson", () => {
    for (const mod of syllabus.modules) {
      for (const topic of mod.topics) {
        const lesson = getLesson(COURSE, mod.slug, topic.slug);
        expect(lesson, `${topic.number} ${topic.title} did not resolve`).not.toBeNull();
        expect(lesson!.number).toBe(topic.number);
        expect(lesson!.title).toBe(topic.title);
      }
    }
  });

  it("totals 179 lessons", () => {
    expect(getCourseStats(COURSE).topicCount).toBe(179);
  });

  it("keeps lesson numbers unique across the course", () => {
    const numbers = getModules(COURSE).flatMap((m) => m.lessons.map((l) => l.number));
    expect(new Set(numbers).size).toBe(179);
  });

  it("keeps lesson slugs unique within a module", () => {
    for (const mod of getModules(COURSE)) {
      const slugs = mod.lessons.map((l) => l.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });

  it("orders lessons by number within a module", () => {
    for (const mod of getModules(COURSE)) {
      const numbers = mod.lessons.map((l) => l.number);
      expect(numbers).toEqual([...numbers].sort());
    }
  });

  it("returns a body only from getLesson, never from listings", () => {
    const first = getModules(COURSE)[0];
    expect(first.lessons[0]).not.toHaveProperty("body");
    const full = getLesson(COURSE, first.slug, first.lessons[0].slug);
    expect(typeof full!.body).toBe("string");
  });

  it("returns null for an unknown lesson", () => {
    expect(getLesson(COURSE, "foundations", "nope")).toBeNull();
  });

  it("validates frontmatter on every one of the 179 files", () => {
    // getLesson throws on a schema violation, so touching all of them is the assertion.
    for (const mod of getModules(COURSE)) {
      for (const meta of mod.lessons) {
        expect(() => getLesson(COURSE, mod.slug, meta.slug)).not.toThrow();
      }
    }
  });
});

describe("getAllLessonParams", () => {
  const params = getAllLessonParams();

  it("returns one entry per lesson", () => {
    expect(params).toHaveLength(179);
  });

  it("returns unique module/topic pairs", () => {
    const keys = params.map((p) => `${p.module}/${p.topic}`);
    expect(new Set(keys).size).toBe(179);
  });

  it("returns params that all resolve", () => {
    for (const p of params) {
      expect(getLesson(COURSE, p.module, p.topic)).not.toBeNull();
    }
  });
});

describe("getLessonNeighbours forms one unbroken chain", () => {
  const published = getModules(COURSE)
    .flatMap((m) => m.lessons.map((l) => ({ mod: m.slug, lesson: l })))
    .filter((x) => x.lesson.status === "published");

  it("gives the first published lesson no previous", () => {
    if (published.length === 0) return;
    const first = published[0];
    expect(getLessonNeighbours(COURSE, first.mod, first.lesson.slug).prev).toBeNull();
  });

  it("gives the last published lesson no next", () => {
    if (published.length === 0) return;
    const last = published[published.length - 1];
    expect(getLessonNeighbours(COURSE, last.mod, last.lesson.slug).next).toBeNull();
  });

  it("links next and prev symmetrically", () => {
    for (let i = 0; i < published.length - 1; i++) {
      const here = published[i];
      const there = published[i + 1];
      const next = getLessonNeighbours(COURSE, here.mod, here.lesson.slug).next;
      expect(next?.number).toBe(there.lesson.number);
      const back = getLessonNeighbours(COURSE, there.mod, there.lesson.slug).prev;
      expect(back?.number).toBe(here.lesson.number);
    }
  });

  it("never points a lesson at itself", () => {
    for (const { mod, lesson } of published) {
      const { prev, next } = getLessonNeighbours(COURSE, mod, lesson.slug);
      expect(prev?.number).not.toBe(lesson.number);
      expect(next?.number).not.toBe(lesson.number);
    }
  });

  it("excludes drafts from the chain", () => {
    const draftNumbers = new Set(
      getModules(COURSE)
        .flatMap((m) => m.lessons)
        .filter((l) => l.status === "draft")
        .map((l) => l.number),
    );
    for (const { mod, lesson } of published) {
      const { prev, next } = getLessonNeighbours(COURSE, mod, lesson.slug);
      if (prev) expect(draftNumbers.has(prev.number)).toBe(false);
      if (next) expect(draftNumbers.has(next.number)).toBe(false);
    }
  });
});

describe("the cached module tree is immutable", () => {
  // The cache is a process-wide singleton reused across static generation, so
  // an in-place mutation by any caller would corrupt every later page. These
  // assert the freeze holds at every level — a shallow freeze leaves the
  // nested lessons arrays mutable, which would be the easy mistake.
  it("rejects mutation of the modules array", () => {
    const mods = getModules(COURSE);
    expect(() => (mods as Module[]).push(mods[0])).toThrow(TypeError);
    expect(() => (mods as Module[]).sort()).toThrow(TypeError);
  });

  it("rejects mutation of a module object", () => {
    const mod = getModules(COURSE)[0];
    expect(() => {
      (mod as { title: string }).title = "hacked";
    }).toThrow(TypeError);
  });

  it("rejects mutation of a module's lessons array", () => {
    const lessons = getModules(COURSE)[0].lessons;
    expect(() => (lessons as LessonMeta[]).push(lessons[0])).toThrow(TypeError);
    expect(() => (lessons as LessonMeta[]).reverse()).toThrow(TypeError);
  });

  it("rejects mutation of a lesson object", () => {
    const lesson = getModules(COURSE)[0].lessons[0];
    expect(() => {
      (lesson as { title: string }).title = "hacked";
    }).toThrow(TypeError);
  });

  it("still returns the same cached reference on repeated calls", () => {
    expect(getModules(COURSE)).toBe(getModules(COURSE));
  });
});

describe("search index", () => {
  it("contains only published lessons", () => {
    const index = getSearchIndex(COURSE);
    const publishedCount = getCourseStats(COURSE).publishedCount;
    expect(index).toHaveLength(publishedCount);
  });

  it("carries no lesson body", () => {
    for (const doc of getSearchIndex(COURSE)) {
      expect(doc).not.toHaveProperty("body");
      expect(Object.keys(doc).sort()).toEqual(
        ["module", "number", "summary", "title", "url"],
      );
    }
  });
});
