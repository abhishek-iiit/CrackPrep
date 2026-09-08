import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Audience } from "@/components/landing/Audience";
import { Features } from "@/components/landing/Features";
import { Hero } from "@/components/landing/Hero";
import { ModuleGrid } from "@/components/landing/ModuleGrid";
import { PathCards } from "@/components/landing/PathCards";
import { Stats } from "@/components/landing/Stats";
import { Subscribe } from "@/components/landing/Subscribe";
import { courseSlug, getCourses, getCourseStats, getModules } from "@/lib/content";

export default function HomePage() {
  const stats = getCourseStats(courseSlug);

  return (
    <>
      <AnnouncementBar
        id="launch-2026-09"
        message={`System design is live — ${stats.moduleCount} modules, ${stats.topicCount} topics`}
        href="/system-design"
        cta="Start reading"
      />
      <Hero moduleCount={stats.moduleCount} topicCount={stats.topicCount} />
      <Stats {...stats} />
      <PathCards courses={getCourses()} />
      <ModuleGrid modules={getModules(courseSlug)} />
      <Features />
      <Audience />
      <Subscribe />
    </>
  );
}
