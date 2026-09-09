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
