import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa'
import solidPlugin from 'vite-plugin-solid';
import pkg from './package.json' with { type: "json" };
import 'dotenv/config';

console.log("vite.config :: process.env.VITE_CORS_ORIGIN", process.env.VITE_CORS_ORIGIN);

//.envの変数、説明については.env.sampleファイル参照
const apiURI = process.env.VITE_CORS_ORIGIN || "http://localhost:3000";
const prodPort: number = parseInt(process.env.VITE_PROD_PORT || "4173");
const prodDomain: string[]  = [process.env.VITE_PROD_DOMAIN || ""];

export default defineConfig({
  plugins: [
    solidPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectManifest: {
        injectionPoint: undefined,
      },
      devOptions: {enabled: true, type: 'module'},
      manifest: {
        name: "Giracle",
        short_name: "Giracle",
        description: "Giracle チャットクライアント",
        lang: "ja",
        theme_color: "#000000",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        scope: "/",
        "icons": [
          {
            "src": "/pwa-64x64.png",
            "sizes": "64x64",
            "type": "image/png"
          },
          {
            "src": "/pwa-192x192.png",
            "sizes": "192x192",
            "type": "image/png"
          },
          {
            "src": "/pwa-512x512.png",
            "sizes": "512x512",
            "type": "image/png"
          },
          {
            "src": "/maskable-icon-512x512.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "maskable"
          }
        ]
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
        rewrite: (path) => path.replace(/^\/api/, "")
      },
      "/ws": {
        target: apiURI,
        ws: true,
      },
    },
  },
  preview: {
    port: prodPort,
    allowedHosts: prodDomain
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
