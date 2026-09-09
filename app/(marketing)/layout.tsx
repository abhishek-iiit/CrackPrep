import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { courseSlug, getCourseStats } from "@/lib/content";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const stats = getCourseStats(courseSlug);

  return (
    <>
      <Header />
      {/* Above <main>, not inside it: a site-wide banner is not part of the
          main landmark. It lives in the layout rather than the home page
          because that is the only way to place it outside <main> without a
          client component — and a launch banner belongs on every marketing
          page anyway. One dismissal covers all of them. */}
      <AnnouncementBar
        message={`System design is live — ${stats.moduleCount} modules, ${stats.topicCount} topics`}
        href="/system-design"
        cta="Start reading"
      />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
