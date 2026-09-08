export function Steps({ children }: { children: React.ReactNode }) {
  return (
    <ol className="my-6 space-y-4 border-l-2 border-hairline pl-6 [counter-reset:step]">
      {children}
    </ol>
  );
}

export function Step({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <li className="relative">
      <span
        aria-hidden
        className="absolute -left-[calc(1.5rem+1px)] top-1 size-2 -translate-x-1/2 rounded-full bg-ink"
      />
      <h4 className="font-medium">{title}</h4>
      {children && <div className="mt-1 text-sm text-ink-muted">{children}</div>}
    </li>
  );
}
