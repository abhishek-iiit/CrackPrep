import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export default function CourseLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
