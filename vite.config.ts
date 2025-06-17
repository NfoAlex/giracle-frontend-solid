import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa'
import solidPlugin from 'vite-plugin-solid';
import pkg from './package.json' with { type: "json" };
import 'dotenv/config';

//.envの変数、説明については.env.sampleファイル参照
const apiURI = process.env.VITE_CORS_ORIGIN || "http://localhost:3000";
const prodPort: number = parseInt(process.env.VITE_PROD_PORT || "4173");
const prodDomain: string[]  = [process.env.VITE_PROD_DOMAIN || ""];

export default defineConfig({
  plugins: [
    solidPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {enabled: false},
      manifest: {
        lang: "ja",
        "icons": [
          {
            "src": "./src/assets/pwa-64x64.png",
            "sizes": "64x64",
            "type": "image/png"
          },
          {
            "src": "./src/assets/pwa-192x192.png",
            "sizes": "192x192",
            "type": "image/png"
          },
          {
            "src": "./src/assets/pwa-512x512.png",
            "sizes": "512x512",
            "type": "image/png"
          },
          {
            "src": "./src/assets/maskable-icon-512x512.png",
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
    port: 3000,
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
