import { defineConfig } from "vite";
export default defineConfig({
  server: {
    proxy: {
      "/api": process.env.API_PROXY || "http://127.0.0.1:8000",
      "/healthz": process.env.API_PROXY || "http://127.0.0.1:8000",
    },
  },
});
