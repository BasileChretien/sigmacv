import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

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
