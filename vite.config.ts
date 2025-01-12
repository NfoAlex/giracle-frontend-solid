import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solidPlugin()],
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
