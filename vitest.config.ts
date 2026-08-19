import { availableParallelism } from "node:os";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Cap how many test workers boot at once. Vitest's worker start budget is a
 * hardcoded 60s (`START_TIMEOUT` in its pool runner — there is no config knob for
 * it). On a many-core machine Vitest boots ~CPUs-1 forks simultaneously, each
 * loading the Vite transform and, for `.test.tsx`, jsdom. When the machine is busy
 * (a parallel install, another suite, a VM starting) some of those boots exceed the
 * budget and the run dies with "[vitest-pool-runner]: Timeout waiting for worker to
 * respond": the affected files never run, and — because the summary line only counts
 * files that DID run — the tail reads e.g. "208 passed (208)" even though there are
 * 215. The run does fail (unhandled errors set exit code 1), but the summary alone
 * is misleading, so keep reading the exit code, not the last line.
 *
 * The cap can only ever reduce, never raise: it is a `min` against Vitest's own
 * default, so <=13-core machines (CI runners included) are untouched and only big
 * boxes are capped: 16 cores 15 -> 12, 24 cores 23 -> 12. Measured on the full suite
 * (215 files / 2300 tests) on an idle 24-core box: 23 workers 48.8s, 12 workers
 * 52.4s, 8 workers 61.9s. ~7% for markedly more headroom under load.
 */
const maxWorkers = Math.min(12, Math.max(1, availableParallelism() - 1));

export default defineConfig({
  // React plugin so component tests (.test.tsx) can use JSX + the automatic
  // runtime. Pure-logic tests (.test.ts, node env) are unaffected.
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // Default node env (fast) for logic tests; component tests opt into jsdom
    // per-file via `// @vitest-environment jsdom`.
    environment: "node",
    globals: true,
    maxWorkers,
    include: ["tests/**/*.test.{ts,tsx}"],
    // citeproc engine init is ~0.7s per render; with coverage instrumentation
    // the multi-render tests need more than the 5s default.
    testTimeout: 30_000,
    coverage: {
      provider: "v8",
      include: ["src/lib/**/*.ts"],
      // Network/DB modules are unit-tested with mocked fetch/Prisma. Only the
      // genuinely un-unit-testable bits stay excluded: the Playwright PDF path
      // (real Chromium) and the Prisma client singleton (a trivial instantiation).
      exclude: [
        "src/lib/render/pdf.ts", // Playwright / Chromium
        "src/lib/db.ts", // Prisma client singleton
        "**/*.d.ts",
      ],
      // Lines + functions are 100%; statements ~99%. Branch misses are the
      // residual defensive `??`/optional-coalescing fallbacks.
      thresholds: {
        statements: 98,
        branches: 87,
        functions: 99,
        lines: 99,
      },
    },
  },
});
