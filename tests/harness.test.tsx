import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

describe("verification harness", () => {
  it("runs vitest", () => {
    expect(1 + 1).toBe(2);
  });

  it("renders react into jsdom", () => {
    render(<span>harness ok</span>);
    expect(screen.getByText("harness ok")).toBeInTheDocument();
  });
});
