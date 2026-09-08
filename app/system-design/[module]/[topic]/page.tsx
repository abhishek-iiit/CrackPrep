import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { evaluate } from "@mdx-js/mdx";
import * as jsxRuntime from "react/jsx-runtime";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { mdxComponents } from "@/components/mdx";
import { LessonHeader } from "@/components/lesson/LessonHeader";
import { LessonNav } from "@/components/lesson/LessonNav";
import { ProgressTracker } from "@/components/lesson/ProgressTracker";
import { SidebarTree } from "@/components/lesson/SidebarTree";
import { TableOfContents } from "@/components/lesson/TableOfContents";
import {
  courseSlug, getAllLessonParams, getLesson, getLessonNeighbours, getModule, getModules,
} from "@/lib/content";
import { extractHeadings } from "@/lib/content/headings";

type Params = { module: string; topic: string };

// Every lesson is known at build time, so an unlisted param is a 404 rather
// than an on-demand render.
export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return getAllLessonParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { module: moduleSlug, topic } = await params;
  const lesson = getLesson(courseSlug, moduleSlug, topic);
  if (!lesson) return {};
  return {
    title: `${lesson.number} ${lesson.title}`,
    description: lesson.summary,
    openGraph: { title: lesson.title, description: lesson.summary, type: "article" },
    twitter: { card: "summary_large_image", title: lesson.title, description: lesson.summary },
  };
}

/**
 * MDX evaluation options.
 *
 * Uses `@mdx-js/mdx` directly rather than `next-mdx-remote`: that package
 * silently drops every MDX expression attribute, so `<Tradeoff forItems={[...]}>`
 * and `<KeyTakeaways items={[...]}>` — which appear in all 179 stubs — would
 * receive `undefined` and throw. Verified: `evaluate()` passes arrays, numbers
 * and objects through intact.
 *
 * No frontmatter option is needed. `lib/content/source.ts` already strips
 * frontmatter (see that file's loader), so `lesson.body` is clean MDX.
 *
 * Deliberately not `as const`: that would make the plugin arrays readonly
 * tuples, and the plugin options expect a mutable PluggableList.
 */
const MDX_OPTIONS = {
  development: false,
  remarkPlugins: [remarkGfm],
  rehypePlugins: [
    rehypeSlug,
    [rehypeAutolinkHeadings, { behavior: "wrap" }],
    [
      rehypePrettyCode,
      { theme: { light: "github-light", dark: "github-dark" }, keepBackground: false },
    ],
  ],
};

export default async function LessonPage({ params }: { params: Promise<Params> }) {
  const { module: moduleSlug, topic } = await params;

  const mod = getModule(courseSlug, moduleSlug);
  const lesson = getLesson(courseSlug, moduleSlug, topic);
  if (!mod || !lesson) notFound();

  // evaluate() compiles and evaluates the MDX at build time and returns a
  // component; `components` is supplied at render, not compile, time.
  const { default: MDXBody } = await evaluate(lesson.body, {
    ...jsxRuntime,
    ...MDX_OPTIONS,
  } as Parameters<typeof evaluate>[1]);

  const headings = extractHeadings(lesson.body);
  const { prev, next } = getLessonNeighbours(courseSlug, moduleSlug, topic);

  return (
    <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-10 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_220px]">
      <SidebarTree
        modules={getModules(courseSlug).map((m) => ({
          id: m.id,
          slug: m.slug,
          title: m.title,
          colorKey: m.colorKey,
          lessons: m.lessons.map((l) => ({
            slug: l.slug,
            number: l.number,
            title: l.title,
            url: l.url,
            status: l.status,
          })),
        }))}
        currentModule={moduleSlug}
        currentLesson={topic}
      />

      <article className="min-w-0">
        <LessonHeader lesson={lesson} module={mod} />
        <div className="prose-lesson mt-8">
          <MDXBody components={mdxComponents} />
        </div>
        <ProgressTracker lessonKey={`${moduleSlug}/${topic}`} />
        <LessonNav prev={prev} next={next} />
      </article>

      <TableOfContents headings={headings} className="hidden xl:block" />
    </div>
  );
}
