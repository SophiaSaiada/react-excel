// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "**/*.d.ts",
        "*.config.js",
        ".eslintrc.cjs",
        "src/core/types.ts", // types only
        "src/core/FunctionName.ts", // types only
      ],
    },
  },
});
