import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Callout } from "@/components/mdx/Callout";
import { Figure } from "@/components/mdx/Figure";
import { KeyTakeaways } from "@/components/mdx/KeyTakeaways";
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
    expect(screen.getByRole("heading", { name: "Reach for it when" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Avoid it when" })).toBeInTheDocument();
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
    expect(screen.getByRole("heading", { name: /key takeaways/i })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("renders nothing when every item is blank", () => {
    const { container } = render(<KeyTakeaways items={["", "", ""]} />);
    expect(container).toBeEmptyDOMElement();
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
