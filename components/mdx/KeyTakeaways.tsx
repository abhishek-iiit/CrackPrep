export function KeyTakeaways({ items }: { items: string[] }) {
  const real = items.filter((i) => i.trim().length > 0);
  if (real.length === 0) return null;

  return (
    <section className="my-8 rounded-card border-2 border-structural bg-card p-5 shadow-hard-sm">
      <h3 className="font-mono text-xs uppercase tracking-wider">Key takeaways</h3>
      <ul className="mt-3 space-y-2">
        {/* Index keys — see Tradeoff: a value key collides on duplicates. */}
        {real.map((item, index) => (
          <li key={index} className="flex gap-2 text-sm">
            <span aria-hidden className="font-mono">→</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
