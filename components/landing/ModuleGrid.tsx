import { ModuleCard } from "@/components/course/ModuleCard";
import type { Module } from "@/lib/content";

// readonly: getModules() returns a frozen, readonly view of the process-wide
// cache, and a mutable Module[] prop would not accept it.
export function ModuleGrid({ modules }: { modules: readonly Module[] }) {
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-16">
      {/* Derived, not spelled out: a hardcoded count is stale the moment a
          module is added, and nobody re-audits headline prose. */}
      <h2 className="text-2xl font-semibold tracking-tight">
        The {modules.length} modules
      </h2>
      <p className="mt-2 max-w-prose text-ink-muted">
        In order. Each one assumes the ones before it.
      </p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((mod) => (
          <li key={mod.slug} className="flex">
            <ModuleCard module={mod} />
          </li>
        ))}
      </ul>
    </section>
  );
}
