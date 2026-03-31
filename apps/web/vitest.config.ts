import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "happy-dom",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@fitos/shared": path.resolve(__dirname, "../../packages/shared/src/index.ts"),
      "@fitos/theme": path.resolve(__dirname, "../../packages/theme/src/index.ts"),
    },
  },
});
