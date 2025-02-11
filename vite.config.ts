import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import pkg from './package.json' with { type: "json" };
import 'dotenv/config';

const apiURI = process.env.VITE_CORS_ORIGIN || "http://localhost:3000";

export default defineConfig({
  plugins: [solidPlugin()],
  define: {
    __VERSION__: `"${pkg.version}"`,
  },
  server: {
    port: 3333,
    proxy: {
      "/api": {
        target: apiURI,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/ws": {
        target: apiURI,
        ws: true,
      },
    },
  },
  resolve: {
    alias: {
      "~/": "/src/",
    }
  },
  build: {
    target: 'esnext',
  },
});
