import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { evaluate, type EvaluateOptions } from "@mdx-js/mdx";
import * as jsxRuntime from "react/jsx-runtime";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { mdxComponents } from "@/components/mdx";
import { CourseJsonLd } from "@/components/seo/CourseJsonLd";
import { LessonHeader } from "@/components/lesson/LessonHeader";
import { LessonNav } from "@/components/lesson/LessonNav";
import { ProgressTracker } from "@/components/lesson/ProgressTracker";
import { SidebarTree } from "@/components/lesson/SidebarTree";
import { TableOfContents } from "@/components/lesson/TableOfContents";
import {
  getAllLessonParams, getCourse, getLesson, getLessonNeighbours, getModule, getModules,
} from "@/lib/content";
import { extractHeadings } from "@/lib/content/headings";

const COURSE = "case-studies";

type Params = { module: string; topic: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return getAllLessonParams(COURSE);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { module: moduleSlug, topic } = await params;
  const lesson = getLesson(COURSE, moduleSlug, topic);
  if (!lesson) return {};
  return {
    title: `${lesson.number} ${lesson.title}`,
    description: lesson.summary,
    openGraph: { title: lesson.title, description: lesson.summary, type: "article" },
    twitter: { card: "summary_large_image", title: lesson.title, description: lesson.summary },
  };
}

const MDX_OPTIONS = {
  development: false,
  remarkPlugins: [remarkGfm],
  rehypePlugins: [
    rehypeSlug,
    [rehypeAutolinkHeadings, { behavior: "wrap" }],
    [
      rehypePrettyCode,
      { theme: { light: "github-light", dark: "github-dark-high-contrast" }, keepBackground: false },
    ],
  ],
} satisfies Partial<EvaluateOptions>;

export default async function LessonPage({ params }: { params: Promise<Params> }) {
  const { module: moduleSlug, topic } = await params;

  const course = getCourse(COURSE);
  const mod = getModule(COURSE, moduleSlug);
  const lesson = getLesson(COURSE, moduleSlug, topic);
  if (!course || !mod || !lesson) notFound();

  const { default: MDXBody } = await evaluate(lesson.body, {
    ...jsxRuntime,
    ...MDX_OPTIONS,
  } as EvaluateOptions);

  const headings = extractHeadings(lesson.body);
  const { prev, next } = getLessonNeighbours(COURSE, moduleSlug, topic);

  return (
    <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-10 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_220px]">
      <SidebarTree
        modules={getModules(COURSE).map((m) => ({
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
        <CourseJsonLd lesson={lesson} module={mod} course={course} />
        <LessonHeader lesson={lesson} module={mod} />
        <div className="prose-lesson mt-8">
          <MDXBody components={mdxComponents} />
        </div>
        <ProgressTracker lessonKey={`${COURSE}/${moduleSlug}/${topic}`} />
        <LessonNav prev={prev} next={next} />
      </article>

      <TableOfContents headings={headings} className="hidden xl:block" />
    </div>
  );
}
