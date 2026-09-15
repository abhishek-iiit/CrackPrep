import { Audience } from "@/components/landing/Audience";
import { Features } from "@/components/landing/Features";
import { Hero } from "@/components/landing/Hero";
import { PathCards } from "@/components/landing/PathCards";
import { Stats } from "@/components/landing/Stats";
import { Subscribe } from "@/components/landing/Subscribe";
import { getCourses, getTotalPublishedCount } from "@/lib/content";

export default function HomePage() {
  const courses = getCourses().filter((c) => c.status === "live");
  const topicCount = courses.reduce((n, c) => n + c.topicCount, 0);
  const publishedCount = getTotalPublishedCount();

  return (
    <>
      <Hero pathCount={courses.length} topicCount={topicCount} />
      <Stats
        pathCount={courses.length}
        topicCount={topicCount}
        publishedCount={publishedCount}
      />
      <PathCards courses={getCourses()} />
      <Features />
      <Audience />
      <Subscribe />
    </>
  );
}
