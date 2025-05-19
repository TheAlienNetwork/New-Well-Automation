import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { tempo } from "tempo-devtools/dist/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tempo()],
  base: process.env.ELECTRON_RENDERER_URL ? "" : "./",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Add an empty module alias for serialport in browser builds
      serialport: path.resolve(__dirname, "./src/lib/empty-module.js"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          ...defineConfig.build?.rollupOptions?.output?.manualChunks,
        },
      },
    },
  },
  server: {
    // @ts-ignore
    allowedHosts: process.env.TEMPO === "true" ? true : undefined,
    // Increase timeouts to prevent connection resets
    hmr: {
      timeout: 120000,
    },
    watch: {
      usePolling: true,
      interval: 1000,
    },
  },
  build: {
    sourcemap: false,
    minify: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          ui: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-tabs",
          ],
          charts: ["recharts"],
        },
      },
    },
  },
});
