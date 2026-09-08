"use client";

import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/cn";
import { useProgress } from "@/lib/progress/useProgress";

export function ProgressTracker({ lessonKey }: { lessonKey: string }) {
  const { isComplete, toggle } = useProgress();
  const done = isComplete(lessonKey);

  return (
    <div className="mt-12 border-t-2 border-hairline pt-6">
      <button
        type="button"
        aria-pressed={done}
        onClick={() => toggle(lessonKey)}
        className={cn(
          "inline-flex min-h-11 items-center gap-2 rounded-card border-2 border-structural px-4 text-sm font-medium transition-brut hover:shadow-hard",
          done ? "bg-ink text-paper" : "bg-card text-ink",
        )}
      >
        {done ? <Check aria-hidden className="size-4" /> : <Circle aria-hidden className="size-4" />}
        {done ? "Completed" : "Mark complete"}
      </button>
      <p className="mt-2 font-mono text-xs text-ink-muted">
        Progress is stored in this browser only.
      </p>
    </div>
  );
}

/** Consumed by Task 11's course page to summarise progress across a course's lessons. */
export function CourseProgress({ total }: { total: number }) {
  const { completed } = useProgress();
  const done = completed.size;

  // Render nothing until there is progress. A "0 / 179 complete" bar on a first
  // visit is noise, and it would announce a progressbar at aria-valuenow=0 to
  // screen-reader users for no information gain. Same reasoning as ModuleCard
  // hiding its written-count at zero.
  if (done === 0) return null;

  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;

  return (
    <div className="flex items-center gap-3">
      <div
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label="Course progress"
        className="h-2 flex-1 overflow-hidden rounded-card border-2 border-structural bg-card"
      >
        {/* transform, not width: width is layout-forcing, scaleX is compositor-only. */}
        <div
          className="h-full origin-left bg-ink transition-brut"
          style={{ transform: `scaleX(${pct / 100})` }}
        />
      </div>
      <span className="font-mono text-xs text-ink-muted">
        {done} / {total} complete
      </span>
    </div>
  );
}
