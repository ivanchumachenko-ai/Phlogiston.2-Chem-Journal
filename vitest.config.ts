import { defineConfig } from "vitest/config";
import path from "path";

// Separate from vite.config.ts so unit tests don't load the PWA / Replit plugins.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  test: {
    include: ["client/src/**/*.test.ts"],
    environment: "node",
  },
});
