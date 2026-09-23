/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// ADR-006: Frank serves the console and MCP from one origin in production,
// so the UI calls '/mcp' and '/healthz' as relative paths with no CORS.
// This proxy keeps `npm run dev` on that same same-origin story against a
// locally running `npm run dev` in server/ (default port 3000).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/mcp": "http://localhost:3000",
      "/healthz": "http://localhost:3000",
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
  },
});
