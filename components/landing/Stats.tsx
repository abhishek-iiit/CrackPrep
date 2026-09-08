export function Stats({
  moduleCount, topicCount, publishedCount,
}: {
  moduleCount: number;
  topicCount: number;
  publishedCount: number;
}) {
  const items = [
    { value: String(moduleCount), label: "Modules" },
    { value: String(topicCount), label: "Topics" },
    ...(publishedCount > 0
      ? [{ value: String(publishedCount), label: "Written" }]
      : []),
    { value: "Free", label: "To read" },
  ];

  return (
    <section className="border-y-2 border-structural bg-card">
      <dl className="mx-auto flex max-w-[1200px] flex-wrap justify-center gap-x-12 gap-y-6 px-4 py-8">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <dd className="font-pixel text-3xl">{item.value}</dd>
            <dt className="mt-1 font-mono text-xs uppercase tracking-wider text-ink-muted">
              {item.label}
            </dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
