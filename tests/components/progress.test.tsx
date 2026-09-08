// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { ProgressTracker } from "@/components/lesson/ProgressTracker";
import { progressStore } from "@/lib/progress/store";

const KEY = "cineshek:progress:v1";

beforeEach(() => {
  window.localStorage.clear();
  // Drops the module-level cache. Without this, clear() would leave a
  // populated cache behind and the three storage-failure tests below would
  // never reach the read/parse path they exist to cover.
  progressStore.__resetForTests();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("progressStore", () => {
  it("starts empty", () => {
    expect(progressStore.count()).toBe(0);
  });

  it("toggles a key on and off", () => {
    progressStore.toggle("foundations/requirements-clarification");
    expect(progressStore.has("foundations/requirements-clarification")).toBe(true);
    progressStore.toggle("foundations/requirements-clarification");
    expect(progressStore.has("foundations/requirements-clarification")).toBe(false);
  });

  it("persists to localStorage under a versioned key", () => {
    progressStore.toggle("a/b");
    expect(JSON.parse(window.localStorage.getItem(KEY)!)).toEqual(["a/b"]);
  });

  it("notifies subscribers on change", () => {
    const seen = vi.fn();
    const unsubscribe = progressStore.subscribe(seen);
    progressStore.toggle("a/b");
    expect(seen).toHaveBeenCalledTimes(1);
    unsubscribe();
    progressStore.toggle("c/d");
    expect(seen).toHaveBeenCalledTimes(1);
  });

  it("returns a stable server snapshot representing nothing completed", () => {
    expect(progressStore.getServerSnapshot()).toBe(progressStore.getServerSnapshot());
    expect(JSON.parse(progressStore.getServerSnapshot())).toEqual([]);
  });

  it("survives unreadable storage", () => {
    vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => progressStore.count()).not.toThrow();
    expect(progressStore.count()).toBe(0);
  });

  it("survives unwritable storage", () => {
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => progressStore.toggle("a/b")).not.toThrow();
    expect(progressStore.has("a/b")).toBe(true);
  });

  it("ignores corrupt stored data", () => {
    window.localStorage.setItem(KEY, "{not json");
    expect(() => progressStore.count()).not.toThrow();
    expect(progressStore.count()).toBe(0);
  });

  it("hydrates existing progress from storage on first read", () => {
    window.localStorage.setItem(KEY, JSON.stringify(["a/b", "c/d"]));
    expect(progressStore.count()).toBe(2);
    expect(progressStore.has("a/b")).toBe(true);
  });

  it("discards non-string entries in stored data", () => {
    window.localStorage.setItem(KEY, JSON.stringify(["a/b", 42, null]));
    expect(progressStore.count()).toBe(1);
  });
});

describe("ProgressTracker", () => {
  it("offers to mark the lesson complete", () => {
    render(<ProgressTracker lessonKey="foundations/requirements-clarification" />);
    expect(screen.getByRole("button", { name: /mark complete/i })).toBeInTheDocument();
  });

  it("reflects completion in text, not colour alone", () => {
    render(<ProgressTracker lessonKey="foundations/requirements-clarification" />);
    act(() => {
      screen.getByRole("button", { name: /mark complete/i }).click();
    });
    expect(screen.getByRole("button", { name: /completed/i })).toBeInTheDocument();
  });

  it("exposes pressed state to assistive technology", () => {
    render(<ProgressTracker lessonKey="a/b" />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-pressed", "false");
    act(() => button.click());
    expect(button).toHaveAttribute("aria-pressed", "true");
  });
});
