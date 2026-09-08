import "@testing-library/jest-dom/vitest";

// jsdom 30 has no IntersectionObserver, and TableOfContents constructs one.
// Guarded so a jsdom release that provides the real implementation wins.
if (!("IntersectionObserver" in globalThis)) {
  class IntersectionObserverStub implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = "";
    readonly thresholds: readonly number[] = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  Object.defineProperty(globalThis, "IntersectionObserver", {
    value: IntersectionObserverStub,
    writable: true,
    configurable: true,
  });
}
