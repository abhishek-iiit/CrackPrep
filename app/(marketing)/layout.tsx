import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { courseSlug, getCourseStats } from "@/lib/content";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const stats = getCourseStats(courseSlug);

  return (
    <>
      {/* First tab stop on every page. A lesson page has ~34 focusable
          elements — header, search, sidebar tree — before the prose starts,
          and nothing linked to the #main that was already there. Visible only
          while focused, so it costs sighted users nothing. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-card focus:border-2 focus:border-structural focus:bg-paper focus:px-4 focus:py-2 focus:text-sm focus:shadow-hard"
      >
        Skip to content
      </a>
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
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </>
  );
}
