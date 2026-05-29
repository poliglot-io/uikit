import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["./src/test-setup.ts"],
    // Forks (not threads) keep real process stdio, which native deps need.
    pool: "forks",
    poolOptions: {
      forks: { singleFork: true },
    },
    // Run test files sequentially to keep peak memory low on CI.
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 60000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "src/lib/**/*.ts",
        "src/tools/**/*.ts",
        "src/components/**/*.tsx",
        "src/hooks/**/*.ts",
      ],
      exclude: ["**/*.test.ts", "**/*.test.tsx", "**/*.d.ts"],
    },
  },
});
