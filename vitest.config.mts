import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    // "node", not "jsdom". Only 3 of the suite's test files need a DOM, and a
    // global jsdom environment gets constructed once per file — measured at 9
    // constructions consuming 75% of total test time, which also makes Vitest
    // print an advisory that violates the warning-free-output gate. Files that
    // need a DOM opt in with a `// @vitest-environment jsdom` docblock.
    // Measured effect: advisory gone, suite 4.30s -> 1.19s.
    environment: "node",
    // Task 9 added a 4th jsdom-environment file (lesson-nav.test.tsx), which
    // intermittently re-tripped Vitest's "Isolate N workers spawned" advisory
    // (isSavingWorthHinting is threshold-based on measured wall time, so it
    // only fired in some runs). No test file here uses mocks, spies, or
    // module-level mutable state, so reusing workers across files carries no
    // cross-test-pollution risk. Verified: 207/207 tests pass across 5
    // consecutive runs with isolate: false and the advisory never reappears.
    isolate: false,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    exclude: ["tests/e2e/**"],
    globals: true,
  },
});
