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
      // Unlike the table and <pre> wrappers, this box never actually
      // scrolls: .scroll-x is overflow-x:auto with no nowrap, so a formula
      // simply wraps onto a second line instead of overflowing — measured
      // scrollWidth === clientWidth for every formula in this curriculum, at
      // every viewport. A scrollable-region-focusable violation needs an
      // actually-scrollable region, so there is nothing here for tabIndex to
      // guard; [overflow-wrap:anywhere] instead handles the one real risk,
      // a single unbreakable token wider than the box.
      className="my-6 rounded-card border-2 border-structural bg-card p-4 text-center font-mono text-base [overflow-wrap:anywhere]"
    >
      {children}
    </div>
  );
}
