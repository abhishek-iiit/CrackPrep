import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { cn } from "@/lib/cn";

describe("verification harness", () => {
  it("runs vitest", () => {
    expect(1 + 1).toBe(2);
  });

  it("renders react into jsdom", () => {
    render(<span>harness ok</span>);
    expect(screen.getByText("harness ok")).toBeInTheDocument();
  });

  it("resolves the @/* path alias", () => {
    expect(cn("a", false, "b")).toBe("a b");
  });
});
