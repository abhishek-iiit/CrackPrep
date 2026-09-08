const FOR = [
  "Engineers preparing for senior and staff system design interviews",
  "Backend developers who can build services but want the reasoning behind the choices",
  "Anyone who has read scattered blog posts and wants one ordered path",
];

const NOT_FOR = [
  "Complete beginners — this assumes you have written and shipped a service",
  "Anyone looking for memorisable answers rather than tradeoffs",
];

export function Audience() {
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-16">
      <h2 className="text-2xl font-semibold tracking-tight">Who this is for</h2>

      <div className="mt-8 flex flex-col gap-4 md:flex-row">
        <div className="flex-1 rounded-card border-2 border-structural bg-card p-5">
          <h3 className="font-mono text-xs uppercase tracking-wider">Written for</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {FOR.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden className="font-mono">+</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex-1 rounded-card border-2 border-structural bg-card p-5">
          <h3 className="font-mono text-xs uppercase tracking-wider">Not written for</h3>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            {NOT_FOR.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden className="font-mono">−</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
