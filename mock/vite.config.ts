import path from "node:path";
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import mockApi from "./mock/server.ts";

// 既存の index.html / src をそのまま使うため root はリポジトリルート
const repoRoot = path.resolve(import.meta.dirname, "..");

export default defineConfig({
  root: repoRoot,
  plugins: [solidPlugin(), mockApi()],
  define: {
    __VERSION__: JSON.stringify("0.0.0-mock"),
  },
  resolve: {
    alias: {
      "~/": "/src/",
    },
  },
  server: {
    port: 4444,
    strictPort: true,
  },
});
