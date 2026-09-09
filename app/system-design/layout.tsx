import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export default function CourseLayout({ children }: { children: React.ReactNode }) {
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
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </>
  );
}
