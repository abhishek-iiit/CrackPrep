import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MUTED_ON_SURFACE_OPACITY, moduleColors } from "@/lib/design/modules";
import type { Module } from "@/lib/content";

export function ModuleCard({ module: mod }: { module: Module }) {
  const pair = moduleColors[mod.colorKey];

  return (
    <Link
      href={mod.url}
      style={
        { "--surface": pair.surface, "--on-surface": pair.ink } as React.CSSProperties
      }
      className="group flex flex-col rounded-card border-2 border-structural bg-[var(--surface)] p-5 text-[var(--on-surface)] transition-brut hover:-translate-y-0.5 hover:shadow-hard"
    >
      <span className="font-pixel text-2xl">{mod.id}</span>
      <h3 className="mt-3 text-lg font-semibold">{mod.title}</h3>
      {/* The opacity comes from the shared constant, not the `opacity-90`
          utility, so the contrast guard measures the value actually rendered
          — see MUTED_ON_SURFACE_OPACITY. */}
      <p style={{ opacity: MUTED_ON_SURFACE_OPACITY }} className="mt-2 flex-1 text-sm">
        {mod.blurb}
      </p>
      <span className="mt-4 flex items-center gap-2 font-mono text-xs uppercase tracking-wider">
        {/* One string, not a fragment: JSX strips the trailing whitespace before
            a newline, so `topics{cond && <>· …</>}` renders "13 topics· 1
            written" — and the parent's `gap-2` cannot help, because both runs
            are text inside a single anonymous flex item. Same idiom as
            app/system-design/[module]/page.tsx. */}
        {mod.totalCount} topics
        {mod.publishedCount > 0 && ` · ${mod.publishedCount} written`}
        <ArrowRight aria-hidden className="ml-auto size-4" />
      </span>
    </Link>
  );
}
