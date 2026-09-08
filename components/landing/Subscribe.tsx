export function Subscribe() {
  // Read inside the component, not at module scope: a module-level constant is
  // captured at import time, which makes vi.stubEnv in the test a no-op. Next
  // still inlines NEXT_PUBLIC_* at build time, so this stays a Server
  // Component with no client JavaScript.
  const endpoint = process.env.NEXT_PUBLIC_SUBSCRIBE_ENDPOINT;
  const configured = Boolean(endpoint && endpoint.length > 0);

  return (
    <section className="mx-auto max-w-[1200px] px-4 py-16">
      <div className="rounded-card border-2 border-structural bg-card p-8 shadow-hard">
        <h2 className="text-2xl font-semibold tracking-tight">
          Get told when a module lands
        </h2>

        {configured ? (
          <form
            action={endpoint}
            method="post"
            className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <label htmlFor="subscribe-email" className="block font-mono text-xs uppercase tracking-wider">
                Email address
              </label>
              <input
                id="subscribe-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="mt-2 min-h-11 w-full rounded-card border-2 border-structural bg-paper px-3 text-base"
              />
            </div>
            <button
              type="submit"
              className="min-h-11 rounded-card border-2 border-structural bg-ink px-5 font-medium text-paper transition-brut hover:shadow-hard"
            >
              Notify me
            </button>
          </form>
        ) : (
          // No backend exists yet. Saying so beats a form that pretends to work.
          <p className="mt-4 max-w-prose text-sm text-ink-muted">
            Email signup is not yet configured, so there is no list to join
            right now. In the meantime the whole syllabus is already readable —
            no account needed.
          </p>
        )}
      </div>
    </section>
  );
}
