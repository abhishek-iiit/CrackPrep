import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function Hero({
  pathCount,
  topicCount,
}: {
  pathCount: number;
  topicCount: number;
}) {
  return (
    <section className="relative mx-auto max-w-[1200px] px-4 pt-16 pb-12 text-center">
      {/* Decorative tilted cards. Hidden below md and from assistive tech. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden md:block">
        <div className="absolute left-4 top-8 h-40 w-32 -rotate-12 rounded-card border-2 border-structural bg-card shadow-hard" />
        <div className="absolute right-6 top-20 h-36 w-28 rotate-[8deg] rounded-card border-2 border-structural bg-card shadow-hard" />
        <div className="absolute bottom-0 left-16 h-28 w-40 rotate-6 rounded-card border-2 border-structural bg-card shadow-hard" />
      </div>

      <div className="relative">
        <h1 className="mx-auto max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
          Everything a senior engineer knows.{" "}
          <span className="font-pixel">Mapped.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg text-ink-muted">
          Interview prep across {pathCount} paths — system design, LeetCode, design
          patterns, and Design X case studies. {topicCount} lessons, sequenced.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button href="/courses" size="lg">
            Choose a path
            <ArrowRight aria-hidden className="size-4" />
          </Button>
          <Button href="/system-design" variant="secondary" size="lg">
            Start system design
          </Button>
        </div>
      </div>
    </section>
  );
}
