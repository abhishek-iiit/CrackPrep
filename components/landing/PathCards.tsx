import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Pill } from "@/components/ui/Pill";
import { PLANNED_CARD_OPACITY, moduleColors } from "@/lib/design/modules";
import type { Course } from "@/lib/content";

function Inner({ course }: { course: Course }) {
  return (
    <>
      <div aria-hidden className="mb-6 flex justify-center">
        {/* Stacked-card motif, echoing the reference illustration. */}
        <div className="relative h-24 w-32">
          <span className="absolute inset-0 translate-x-3 translate-y-3 rounded-card border-2 border-structural opacity-40" />
          <span className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-card border-2 border-structural opacity-70" />
          <span className="absolute inset-0 grid place-items-center rounded-card border-2 border-structural bg-[var(--surface)] font-pixel text-xs">
            {course.slug.replace(/-/g, " ")}
          </span>
        </div>
      </div>

      <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider">
        {course.eyebrow}
        {course.status === "planned" && <Pill tone="inverse">Soon</Pill>}
      </p>

      <h3 className="mt-3 font-pixel text-2xl">{course.title}</h3>
      {/* No opacity here, ever. Element opacity on a coloured surface
          composites the ink as well as the surface (see PLANNED_CARD_OPACITY
          below), and a SECOND, nested opacity on top of that compounds in a
          way tests/design/contrast.test.ts's card-level guard cannot see —
          it modeled the card's one compositing step, not two. That nested
          opacity used to live here (a de-emphasis on the blurb text) and
          three colour keys (teal, orange, fuchsia) rendered sub-AA the
          moment they were used, with the axe suite blind to it too, since
          axe composites accumulated text opacity against the page
          background rather than the card surface it actually sits on.
          text-sm against the title's larger pixel font already carries the
          hierarchy; the planned card still reads as muted overall via
          PLANNED_CARD_OPACITY, the "Soon" pill, and not being a link. */}
      <p className="mt-3 text-sm">{course.blurb}</p>

      <ul className="mt-4 space-y-1 text-sm">
        {course.bullets.map((bullet) => (
          <li key={bullet} className="flex gap-2">
            <span aria-hidden className="font-mono">+</span>
            {bullet}
          </li>
        ))}
      </ul>

      {course.status === "live" && (
        <>
          <p className="mt-5 font-mono text-[11px] uppercase tracking-wider">
            {course.moduleCount} modules · {course.topicCount} topics
          </p>
          <span className="mt-4 flex items-center gap-2 font-medium">
            Open course
            <ArrowRight aria-hidden className="ml-auto size-4" />
          </span>
        </>
      )}
    </>
  );
}

export function PathCards({ courses }: { courses: Course[] }) {
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-16">
      <h2 className="text-2xl font-semibold tracking-tight">Choose where to start</h2>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {courses.map((course) => {
          const pair = moduleColors[course.colorKey];
          const style = {
            "--surface": pair.surface,
            "--on-surface": pair.ink,
          } as React.CSSProperties;
          const shell =
            "flex h-full flex-col rounded-card border-2 border-structural bg-[var(--surface)] p-5 text-[var(--on-surface)]";

          return (
            <li key={course.slug} className="flex">
              {course.status === "live" ? (
                <Link
                  href={course.url}
                  style={style}
                  className={`${shell} transition-brut hover:-translate-y-0.5 hover:shadow-hard`}
                >
                  <Inner course={course} />
                </Link>
              ) : (
                // Planned paths are not links: there is nowhere to go yet.
                // Element `opacity` composites the ink as well as the
                // surface onto the page background, so a token pair that
                // passes contrastRatio() in isolation can still fail once
                // it's actually rendered here — PLANNED_CARD_OPACITY is the
                // one value both this component and
                // tests/design/contrast.test.ts read, so they cannot drift.
                <div
                  style={{ ...style, opacity: PLANNED_CARD_OPACITY }}
                  className={shell}
                >
                  <Inner course={course} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
