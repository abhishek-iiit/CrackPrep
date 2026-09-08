export type Quote = { quote: string; name: string; role: string };

/**
 * Renders nothing without real, attributed quotes. Name and role are
 * required by the type, so an unattributed testimonial cannot compile.
 * Not currently rendered anywhere — wire it in when quotes are collected.
 */
export function Testimonials({ quotes }: { quotes: Quote[] }) {
  if (quotes.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1200px] px-4 py-16">
      <h2 className="text-2xl font-semibold tracking-tight">What readers say</h2>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quotes.map((item) => (
          <li key={item.quote} className="rounded-card border-2 border-structural bg-card p-5">
            <blockquote className="text-sm">{item.quote}</blockquote>
            <p className="mt-4 font-mono text-xs">
              <span className="block">{item.name}</span>
              <span className="block text-ink-muted">{item.role}</span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
