import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-4 text-center">
      <p className="font-pixel text-6xl">404</p>
      <h1 className="mt-4 text-2xl font-semibold">That page is not here</h1>
      <p className="mt-3 text-ink-muted">
        The lesson may have been renamed. The syllabus lists every topic that exists.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href="/syllabus">Browse syllabus</Button>
        <Button href="/" variant="secondary">
          Home
        </Button>
      </div>
    </div>
  );
}
