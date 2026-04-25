import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  // Vite injects __APP_VERSION__ at build time via define in vite.config.ts.
  // Mirror it here so vitest doesn't choke on modules that consume it.
  define: {
    __APP_VERSION__: JSON.stringify("test"),
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // Playwright owns the e2e/ folder — keep vitest out of it.
    exclude: ["node_modules", "dist", ".idea", ".git", ".cache", "e2e/**"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
