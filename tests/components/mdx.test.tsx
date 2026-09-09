// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Callout } from "@/components/mdx/Callout";
import { Figure } from "@/components/mdx/Figure";
import { Formula } from "@/components/mdx/Formula";
import { KeyTakeaways } from "@/components/mdx/KeyTakeaways";
import { Step, Steps } from "@/components/mdx/Steps";
import { Tradeoff } from "@/components/mdx/Tradeoff";
import { InlineCode } from "@/components/mdx/CodeBlock";
import { mdxComponents } from "@/components/mdx";

describe("Callout", () => {
  it("names its type in text, not colour alone", () => {
    render(<Callout type="gotcha">Watch the clock skew.</Callout>);
    expect(screen.getByText("Gotcha")).toBeInTheDocument();
    expect(screen.getByText("Watch the clock skew.")).toBeInTheDocument();
  });

  it("uses a semantic aside with an accessible name", () => {
    render(<Callout type="warn">Careful.</Callout>);
    expect(screen.getByRole("note", { name: /warning/i })).toBeInTheDocument();
  });

  it("gives each of the four types a different glyph", () => {
    // `AlertTriangle` is lucide's deprecated ALIAS for `TriangleAlert` — the
    // identical component object — so `warn` and `gotcha` used to render the
    // same icon, and with one shared tint the four variants differed by a
    // single word of label text. Compares the drawn paths, not the imported
    // names, so a re-aliased icon cannot pass.
    const shapes = (["note", "warn", "tip", "gotcha"] as const).map((type) => {
      const { container, unmount } = render(<Callout type={type}>Body.</Callout>);
      const svg = container.querySelector("svg")!.innerHTML;
      unmount();
      return svg;
    });
    expect(new Set(shapes).size).toBe(4);
  });
});

describe("Tradeoff", () => {
  it("renders both columns with their headings and items", () => {
    render(
      <Tradeoff
        forTitle="Reach for it when"
        againstTitle="Avoid it when"
        forItems={["Reads dominate", "Staleness is tolerable"]}
        againstItems={["Writes dominate"]}
      />,
    );
    // Titles are <p>, not headings: an <h4> under a lesson's <h2>s skipped a
    // level, and a heading emitted by a component never reaches rehype-slug,
    // so the table of contents could not list it anyway.
    expect(screen.queryAllByRole("heading")).toHaveLength(0);
    expect(screen.getByText("Reach for it when")).toBeInTheDocument();
    expect(screen.getByText("Avoid it when")).toBeInTheDocument();
    expect(screen.getByText("Reads dominate")).toBeInTheDocument();
    expect(screen.getByText("Writes dominate")).toBeInTheDocument();
  });

  it("drops empty items so stub placeholders render nothing", () => {
    render(
      <Tradeoff forTitle="For" againstTitle="Against" forItems={["", ""]} againstItems={[""]} />,
    );
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });
});

describe("KeyTakeaways", () => {
  it("renders a titled list", () => {
    render(<KeyTakeaways items={["One", "Two"]} />);
    // <p>, not <h3> — see Tradeoff above.
    expect(screen.queryAllByRole("heading")).toHaveLength(0);
    expect(screen.getByText(/key takeaways/i)).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("renders nothing when every item is blank", () => {
    const { container } = render(<KeyTakeaways items={["", "", ""]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("Steps", () => {
  it("numbers its steps in the rendered output", () => {
    // The <ol> carried `[counter-reset:step]` and nothing ever incremented
    // it, and Tailwind's preflight zeroes the list marker — so a "numbered
    // walkthrough" rendered with no numbers at all, which is why one lesson
    // hand-numbered its steps into their titles.
    render(
      <Steps>
        <Step title="Append the record to the WAL">Sequential append.</Step>
        <Step title="Insert into the memtable">Sorted insert.</Step>
        <Step title="Acknowledge">Durable and visible.</Step>
      </Steps>,
    );
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent(/^1 Append the record to the WAL/);
    expect(items[1]).toHaveTextContent(/^2 Insert into the memtable/);
    expect(items[2]).toHaveTextContent(/^3 Acknowledge/);
  });

  it("keeps numbering the remaining steps when one is removed", () => {
    // The point of numbering in the component rather than in the prose: the
    // lesson that hand-numbered its titles would have gone 1, 2, 4 the first
    // time anyone dropped a step.
    render(
      <Steps>
        <Step title="First" />
        <Step title="Second" />
      </Steps>,
    );
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent(/^1 First$/);
    expect(items[1]).toHaveTextContent(/^2 Second$/);
  });

  it("emits no heading, so it cannot skip a level under the lesson's h2s", () => {
    render(
      <Steps>
        <Step title="Only step" />
      </Steps>,
    );
    expect(screen.queryAllByRole("heading")).toHaveLength(0);
  });
});

describe("Formula", () => {
  it("carries its label as the accessible name of the math region", () => {
    // `label` is the only thing that tells a screen-reader user what the
    // monospace expression is, and role="math" without a name announces as
    // an unlabelled region.
    render(<Formula label="Bloom filter false positive rate">(1 - e^(-kn/m))^k</Formula>);
    const math = screen.getByRole("math", {
      name: "Bloom filter false positive rate",
    });
    expect(math).toHaveTextContent("(1 - e^(-kn/m))^k");
  });
});

describe("Figure", () => {
  it("requires alt text", () => {
    // @ts-expect-error alt is intentionally omitted to prove the guard fires
    expect(() => render(<Figure src="/d.svg" caption="A diagram" />)).toThrow(/alt/i);
  });

  it("throws on empty alt text", () => {
    expect(() => render(<Figure src="/d.svg" alt="   " caption="A diagram" />)).toThrow(/alt/i);
  });

  it("renders a figure with caption and alt", () => {
    render(<Figure src="/d.svg" alt="LSM write path" caption="Writes land in the memtable" width={640} height={360} />);
    expect(screen.getByRole("img", { name: "LSM write path" })).toBeInTheDocument();
    expect(screen.getByText("Writes land in the memtable")).toBeInTheDocument();
  });
});

describe("InlineCode vs block code", () => {
  it("styles inline code as a pill", () => {
    const { container } = render(<InlineCode>npm test</InlineCode>);
    expect(container.querySelector("code")?.className).toMatch(/border-hairline/);
  });

  it("leaves block code untouched so the pill does not wrap a whole block", () => {
    // rehype-pretty-code sets data-language on the <code> inside <pre>;
    // MDX routes that element through this same component.
    const { container } = render(
      <InlineCode data-language="ts">{"const x = 1;"}</InlineCode>,
    );
    const code = container.querySelector("code")!;
    expect(code.className).toBe("");
    expect(code).toHaveAttribute("data-language", "ts");
  });
});

describe("mdxComponents map", () => {
  it("exposes every custom component the stub template uses", () => {
    for (const name of ["Callout", "Tradeoff", "KeyTakeaways", "Figure", "Steps", "Formula"]) {
      expect(mdxComponents).toHaveProperty(name);
    }
  });

  it("overrides table and pre so wide content scrolls inside itself", () => {
    expect(mdxComponents).toHaveProperty("table");
    expect(mdxComponents).toHaveProperty("pre");
  });
});
