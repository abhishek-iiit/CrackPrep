import type { Metadata } from "next";
import { Geist, Geist_Mono, Geist_Pixel } from "next/font/google";
import { ThemeProvider } from "next-themes";
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

export const metadata: Metadata = {
  title: {
    default: "Cineshek — System design, in depth",
    template: "%s · Cineshek",
  },
  description:
    "A sequenced system design curriculum: 14 modules, 179 topics, from requirements clarification to storage engines.",
};

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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
