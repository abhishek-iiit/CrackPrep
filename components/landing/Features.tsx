import { GitCompare, ListOrdered, Ruler } from "lucide-react";

const FEATURES = [
  {
    icon: ListOrdered,
    title: "Sequenced, not searched",
    body: "Topics are ordered so each one rests on the last. You can read straight through.",
  },
  {
    icon: GitCompare,
    title: "Tradeoffs made explicit",
    body: "Every design choice is presented as what it buys and what it costs, side by side.",
  },
  {
    icon: Ruler,
    title: "Numbers, not vibes",
    body: "Capacity estimates, latency budgets, and amplification factors, worked out.",
  },
];

export function Features() {
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-16">
      <ul className="grid gap-4 sm:grid-cols-3">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <li
              key={feature.title}
              className="rounded-card border-2 border-structural bg-card p-5"
            >
              <Icon aria-hidden className="size-6" />
              <h3 className="mt-3 font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-ink-muted">{feature.body}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
