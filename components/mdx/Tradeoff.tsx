type Props = {
  forTitle: string;
  againstTitle: string;
  forItems: string[];
  againstItems: string[];
};

function Column({ title, items }: { title: string; items: string[] }) {
  const real = items.filter((i) => i.trim().length > 0);
  return (
    <div className="flex-1 rounded-card border-2 border-structural bg-card p-4">
      <h4 className="font-mono text-xs uppercase tracking-wider">{title}</h4>
      {real.length > 0 && (
        <ul className="mt-3 space-y-2 text-sm">
          {/* Index keys: the list is static and its items are plain strings,
              so two identical items would collide on a value key. */}
          {real.map((item, index) => (
            <li key={index} className="flex gap-2">
              <span aria-hidden className="font-mono">+</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Side-by-side comparison — the workhorse structure for system design. */
export function Tradeoff({ forTitle, againstTitle, forItems, againstItems }: Props) {
  return (
    <div className="my-6 flex flex-col gap-4 md:flex-row">
      <Column title={forTitle} items={forItems} />
      <Column title={againstTitle} items={againstItems} />
    </div>
  );
}
