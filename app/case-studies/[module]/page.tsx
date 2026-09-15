import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { MUTED_ON_SURFACE_OPACITY, moduleColors } from "@/lib/design/modules";
import { getModule, getModules } from "@/lib/content";

const COURSE = "case-studies";

type Params = { module: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return getModules(COURSE).map((m) => ({ module: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { module: slug } = await params;
  const mod = getModule(COURSE, slug);
  if (!mod) return {};
  return {
    title: `${mod.id} ${mod.title}`,
    description: mod.blurb,
  };
}

export default async function ModulePage({ params }: { params: Promise<Params> }) {
  const { module: slug } = await params;
  const mod = getModule(COURSE, slug);
  if (!mod) notFound();

  const pair = moduleColors[mod.colorKey];

  return (
    <div className="mx-auto max-w-[900px] px-4 py-12">
      <nav aria-label="Breadcrumb" className="font-mono text-xs uppercase tracking-wider">
        <Link href="/case-studies" className="text-link underline">
          Case studies
        </Link>
      </nav>

      <div
        style={{ "--surface": pair.surface, "--on-surface": pair.ink } as React.CSSProperties}
        className="mt-4 rounded-card border-2 border-structural bg-[var(--surface)] p-6 text-[var(--on-surface)]"
      >
        <span className="font-pixel text-3xl">{mod.id}</span>
        <h1 className="mt-2 text-3xl font-semibold">{mod.title}</h1>
        <p style={{ opacity: MUTED_ON_SURFACE_OPACITY }} className="mt-2 max-w-prose">
          {mod.blurb}
        </p>
        <p className="mt-4 font-mono text-xs uppercase tracking-wider">
          {mod.totalCount} case studies
          {mod.publishedCount > 0 && ` · ${mod.publishedCount} written`}
        </p>
      </div>

      <ol className="mt-8 divide-y-2 divide-hairline border-y-2 border-hairline">
        {mod.lessons.map((lesson) => (
          <li key={lesson.slug}>
            <Link
              href={lesson.url}
              className="group flex min-h-14 items-center gap-4 py-3 transition-brut hover:bg-card"
            >
              <span className="w-12 shrink-0 font-mono text-xs text-ink-muted">
                {lesson.number}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{lesson.title}</span>
                <span className="block truncate text-sm text-ink-muted">{lesson.summary}</span>
              </span>
              <span className="hidden shrink-0 font-mono text-xs text-ink-muted sm:block">
                {lesson.estMinutes} min
              </span>
              <Badge status={lesson.status} />
              <ArrowRight aria-hidden className="size-4 shrink-0" />
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
