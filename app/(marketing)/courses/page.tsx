import type { Metadata } from "next";
import { PathCards } from "@/components/landing/PathCards";
import { getCourses } from "@/lib/content";

export const metadata: Metadata = {
  title: "Paths",
  description: "Learning paths on Cineshek. System design is live; more are planned.",
};

export default function CoursesPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-12">
      <h1 className="font-pixel text-4xl">Paths</h1>
      <p className="mt-3 max-w-prose text-ink-muted">
        System design is written and readable now. The rest are planned, not promised.
      </p>
      <PathCards courses={getCourses()} />
    </div>
  );
}
