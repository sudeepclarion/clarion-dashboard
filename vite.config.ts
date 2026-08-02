import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * `/api` is proxied to the backend in development so the app makes same-origin
 * requests and needs no CORS handling or base-URL configuration.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.CLARION_API_URL ?? "http://localhost:5080",
        changeOrigin: true,
      },
    },
  },
});
