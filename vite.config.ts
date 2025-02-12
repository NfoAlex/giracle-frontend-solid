import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa'
import solidPlugin from 'vite-plugin-solid';
import pkg from './package.json' with { type: "json" };
import 'dotenv/config';

const apiURI = process.env.VITE_CORS_ORIGIN || "http://localhost:3000";

export default defineConfig({
  plugins: [
    solidPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {enabled: true},
      manifest: {
        lang: "ja"
      }
    })
  ],
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
