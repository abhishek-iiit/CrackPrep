const FOR = [
  "Complete beginners who want one ordered path into interviews",
  "Engineers preparing for senior and staff system design interviews",
  "Candidates rehearsing Design X prompts — Drive, YouTube, WhatsApp, and the rest",
  "Candidates working a curated LeetCode roadmap instead of a random grind",
  "Developers learning design patterns as decision tools, not UML trivia",
];

const NOT_FOR = [
  "Anyone looking for memorisable answers rather than tradeoffs",
];

export function Audience() {
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-16">
      <h2 className="text-2xl font-semibold tracking-tight">Who this is for</h2>
      <p className="mt-3 max-w-prose text-ink-muted">
        Four live paths — system design, LeetCode, design patterns, and Design X
        case studies — written for the same reader.
      </p>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div>
          <h3 className="font-mono text-xs uppercase tracking-wider">Written for</h3>
          <ul className="mt-4 space-y-3 text-sm">
            {FOR.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span aria-hidden className="shrink-0 font-mono leading-5">
                  +
                </span>
                <span className="min-w-0 leading-5">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-mono text-xs uppercase tracking-wider">Not written for</h3>
          <ul className="mt-4 space-y-3 text-sm text-ink-muted">
            {NOT_FOR.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span aria-hidden className="shrink-0 font-mono leading-5">
                  −
                </span>
                <span className="min-w-0 leading-5">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
