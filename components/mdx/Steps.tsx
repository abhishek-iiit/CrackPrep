import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

type StepProps = { title: string; index?: number; children?: React.ReactNode };

function isStep(child: ReactNode): child is ReactElement<StepProps> {
  return isValidElement(child) && child.type === Step;
}

/**
 * A numbered walkthrough.
 *
 * The numbers are real DOM text, injected here, rather than a CSS counter.
 * The `[counter-reset:step]` this used to carry was never paired with a
 * `counter-increment`, and Tailwind's preflight zeroes the <ol> marker, so
 * every "numbered walkthrough" in the curriculum rendered unnumbered —
 * which is why one lesson hand-numbered all eleven of its steps into their
 * titles. A `counter-increment` + `::before` would fix the display, but
 * generated content is not selectable, is not copied with the text, and
 * cannot be asserted from any test: `getComputedStyle(el, "::before").content`
 * returns the literal `counter(step)` even in a real browser, so the fix
 * would have had no guard. Numbering in the DOM is testable, copyable, and
 * announced.
 *
 * Injected by cloneElement rather than by a context, because MDX components
 * render inside the server component tree and createContext is unavailable
 * there — a context would have cost a client component, and the seven are
 * fixed. Only <Step> children are numbered and only they are cloned, so
 * anything else passes through untouched.
 */
export function Steps({ children }: { children: React.ReactNode }) {
  // Position among the <Step> children, derived rather than accumulated: a
  // counter incremented inside the map callback is a render-phase mutation
  // that the React Compiler lint rejects. toArray hands back stable
  // references, so indexOf is exact, and anything that is not a <Step>
  // passes through unnumbered and unaltered instead of being dropped.
  const items = Children.toArray(children);
  const steps = items.filter(isStep);

  return (
    <ol className="my-6 space-y-4 border-l-2 border-hairline pl-6">
      {items.map((child) =>
        isStep(child) ? cloneElement(child, { index: steps.indexOf(child) + 1 }) : child,
      )}
    </ol>
  );
}

// Both markers sit on the rail: `left` puts their centre on the <ol>'s
// border, and the <li> is the positioned ancestor, so nesting the badge
// inside the title paragraph does not move it.
const RAIL = "absolute -left-[calc(1.5rem+1px)] top-1 -translate-x-1/2";

export function Step({ title, index, children }: StepProps) {
  return (
    <li className="relative">
      {/* <p>, not a heading: an <h4> here skipped a level under the lesson's
          <h2>s, and a component-emitted heading never reaches rehype-slug, so
          the table of contents could not see it either. Same reasoning as
          Tradeoff's and KeyTakeaways' titles. */}
      <p className="font-medium">
        {index === undefined ? (
          // A <Step> outside a <Steps> has no position to report, so it keeps
          // the plain marker rather than showing an empty badge.
          <span aria-hidden className={`${RAIL} size-2 rounded-full bg-ink`} />
        ) : (
          <>
            <span
              className={`${RAIL} grid size-5 place-items-center rounded-full border-2 border-structural bg-paper font-mono text-[10px]`}
            >
              {index}
            </span>
            {/* Inside the paragraph and followed by a space, so the step reads
                and copies as "1 Append the record to the WAL" rather than
                "1Append…". The badge is out of flow, so the space collapses
                to nothing visually. */}
            {" "}
          </>
        )}
        {title}
      </p>
      {children && <div className="mt-1 text-sm text-ink-muted">{children}</div>}
    </li>
  );
}
