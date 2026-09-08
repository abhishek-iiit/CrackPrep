import { Callout } from "./Callout";
import { InlineCode, Pre } from "./CodeBlock";
import { Figure } from "./Figure";
import { Formula } from "./Formula";
import { KeyTakeaways } from "./KeyTakeaways";
import { Step, Steps } from "./Steps";
import { Tradeoff } from "./Tradeoff";

/** Passed to compileMDX. Element overrides keep wide content inside its box. */
export const mdxComponents = {
  Callout,
  Tradeoff,
  KeyTakeaways,
  Figure,
  Steps,
  Step,
  Formula,

  h2: (p: React.ComponentPropsWithoutRef<"h2">) => (
    <h2 {...p} className="mt-12 scroll-mt-24 text-2xl font-semibold tracking-tight" />
  ),
  h3: (p: React.ComponentPropsWithoutRef<"h3">) => (
    <h3 {...p} className="mt-8 scroll-mt-24 text-lg font-semibold" />
  ),
  p: (p: React.ComponentPropsWithoutRef<"p">) => <p {...p} className="mt-4" />,
  ul: (p: React.ComponentPropsWithoutRef<"ul">) => (
    <ul {...p} className="mt-4 list-disc space-y-2 pl-6" />
  ),
  ol: (p: React.ComponentPropsWithoutRef<"ol">) => (
    <ol {...p} className="mt-4 list-decimal space-y-2 pl-6" />
  ),
  a: (p: React.ComponentPropsWithoutRef<"a">) => (
    <a {...p} className="text-link underline underline-offset-2" />
  ),
  blockquote: (p: React.ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote {...p} className="my-6 border-l-2 border-structural pl-4 italic" />
  ),
  table: (p: React.ComponentPropsWithoutRef<"table">) => (
    <div className="scroll-x my-6 rounded-card border-2 border-structural">
      <table {...p} className="w-full border-collapse text-sm" />
    </div>
  ),
  th: (p: React.ComponentPropsWithoutRef<"th">) => (
    <th {...p} className="border-b-2 border-hairline px-3 py-2 text-left font-mono text-xs uppercase" />
  ),
  td: (p: React.ComponentPropsWithoutRef<"td">) => (
    <td {...p} className="border-b border-hairline px-3 py-2 align-top" />
  ),
  pre: Pre,
  code: InlineCode,
};
