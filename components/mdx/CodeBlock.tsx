import { cn } from "@/lib/cn";

type PreProps = React.ComponentPropsWithoutRef<"pre"> & {
  "data-language"?: string;
};

export function Pre({ children, className, ...props }: PreProps) {
  const language = props["data-language"];
  return (
    <div className="my-6 overflow-hidden rounded-card border-2 border-structural bg-card">
      {language && (
        <p className="border-b-2 border-hairline px-4 py-1.5 font-mono text-[11px] uppercase tracking-wider text-ink-muted">
          {language}
        </p>
      )}
      <pre {...props} className={cn("scroll-x p-4 text-sm leading-relaxed", className)}>
        {children}
      </pre>
    </div>
  );
}

type CodeProps = React.ComponentPropsWithoutRef<"code"> & {
  "data-language"?: string;
};

/**
 * MDX maps EVERY `code` element to this component — both inline `code` spans
 * and the `<code>` that rehype-pretty-code nests inside `<pre>`. Block code
 * must pass through untouched, or the inline pill styling (border, background,
 * padding) wraps the whole highlighted block.
 *
 * rehype-pretty-code sets `data-language` on the block `<code>`; inline code
 * has no such attribute, which is what distinguishes the two.
 */
export function InlineCode({ children, ...props }: CodeProps) {
  if (props["data-language"] !== undefined) {
    return <code {...props}>{children}</code>;
  }

  return (
    <code
      {...props}
      className="rounded border border-hairline bg-card px-1 py-0.5 font-mono text-[0.9em]"
    >
      {children}
    </code>
  );
}
