"use client";

import { Button } from "@/components/ui/Button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-4 text-center">
      <p className="font-pixel text-5xl">Oops</p>
      <h1 className="mt-4 text-2xl font-semibold">Something broke rendering this page</h1>
      <p className="mt-3 text-ink-muted">
        This is a bug on our side, not something you did.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button href="/" variant="secondary">
          Home
        </Button>
      </div>
    </div>
  );
}
