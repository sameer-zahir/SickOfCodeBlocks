import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    testTimeout: 20000, // generous: integration tests build + spawn the binary on Windows CI
    pool: "forks",
  },
});
