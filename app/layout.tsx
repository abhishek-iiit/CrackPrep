import type { Metadata } from "next";
import { Geist, Geist_Mono, Geist_Pixel } from "next/font/google";
import { announcementDismissScript } from "@/lib/announcement";
import { courseSlug, getCourseStats } from "@/lib/content";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// Single-weight display face. It has no override metrics, so an explicit
// fallback is supplied here and an explicit line-height in globals.css.
const geistPixel = Geist_Pixel({
  variable: "--font-geist-pixel",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  preload: true,
  fallback: ["ui-monospace", "monospace"],
});

// Derived, not literal. Every user-facing count must come from the content
// layer: this project adds curriculum over time, and a hardcoded number in a
// meta description goes stale silently — nobody re-audits SEO text.
export async function generateMetadata(): Promise<Metadata> {
  const stats = getCourseStats(courseSlug);
  return {
    title: {
      default: "Cineshek — System design, in depth",
      template: "%s · Cineshek",
    },
    description: `A sequenced system design curriculum: ${stats.moduleCount} modules, ${stats.topicCount} topics, from requirements clarification to storage engines.`,
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geist.variable} ${geistMono.variable} ${geistPixel.variable}`}
    >
      <body className="min-h-dvh bg-paper text-ink">
        {/* Blocking, and first in <body> so it runs before any markup below is
            parsed: a dismissed announcement bar is hidden by CSS from the
            first paint instead of being removed after hydration, which
            painted it and then shifted the page by its height. Mirrors the
            no-flash script next-themes' ThemeProvider emits just below.
            React 19 wants inline scripts as children, not dangerouslySetInnerHTML.
            See lib/announcement.ts. */}
        <script>{announcementDismissScript}</script>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
