/**
 * A displayed formula. Rendered as monospace text rather than typeset maths —
 * the curriculum's formulas are short, and this keeps the page dependency-free
 * and selectable. `label` names it for screen readers.
 */
export function Formula({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <div
      role="math"
      aria-label={label}
      className="scroll-x my-6 rounded-card border-2 border-structural bg-card p-4 text-center font-mono text-base"
    >
      {children}
    </div>
  );
}
