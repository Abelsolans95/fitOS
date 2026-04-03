import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "happy-dom",
    server: {
      deps: {
        fallbackCJS: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@fitos/shared": path.resolve(__dirname, "../../packages/shared/src/index.ts"),
      "@fitos/theme": path.resolve(__dirname, "../../packages/theme/src/index.ts"),
      "react": path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    },
  },
});
