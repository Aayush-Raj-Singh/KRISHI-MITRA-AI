import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "manifest.json",
        "offline.html",
        "pwa-192x192.png",
        "pwa-512x512.png",
        "assets/logo/krishimitra-ai-logo.png"
      ],
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectManifest: {
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        additionalManifestEntries: [
          { url: "/offline.html", revision: null },
          { url: "/manifest.json", revision: null }
        ]
      },
      manifest: {
        name: "KrishiMitra-AI",
        short_name: "KrishiMitra",
        description: "Rural decision intelligence powered by AI",
        theme_color: "#2f7d4d",
        background_color: "#f4f1e8",
        display: "standalone",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    host: true
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }
          if (id.includes("@mui/icons-material")) {
            return "mui-icons";
          }
          if (id.includes("@mui/material") || id.includes("@emotion/react") || id.includes("@emotion/styled")) {
            return "mui-core";
          }
          if (id.includes("chart.js") || id.includes("react-chartjs-2")) {
            return "charts";
          }
          if (id.includes("@reduxjs/toolkit") || id.includes("react-redux") || id.includes("@tanstack/react-query")) {
            return "state";
          }
          if (id.includes("i18next") || id.includes("react-i18next")) {
            return "i18n";
          }
          if (
            id.includes("react-router-dom") ||
            id.includes("\\node_modules\\react\\") ||
            id.includes("/node_modules/react/") ||
            id.includes("react-dom")
          ) {
            return "react";
          }
          if (id.includes("axios")) {
            return "network";
          }
          return undefined;
        }
      }
    }
  }
});
