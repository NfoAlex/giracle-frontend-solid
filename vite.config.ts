import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import pkg from './package.json' with { type: "json" };

export default defineConfig({
  plugins: [solidPlugin()],
  define: {
    __VERSION__: `"${pkg.version}"`,
  },
  server: {
    port: 3333,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/ws": {
        target: "http://localhost:3000",
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
