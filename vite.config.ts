import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: true,
    port: 5173,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React must be in its own chunk and load first
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          // UI components
          "radix-vendor": [
            "@radix-ui/react-accordion",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-label",
            "@radix-ui/react-popover",
            "@radix-ui/react-select",
            "@radix-ui/react-slot",
            "@radix-ui/react-switch",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-tooltip",
          ],
          // Charts
          "charts-vendor": ["recharts"],
          // Forms
          "forms-vendor": ["react-hook-form", "@hookform/resolvers", "zod"],
          // Query
          "query-vendor": ["@tanstack/react-query"],
          // Icons
          "icons-vendor": ["lucide-react"],
          // Date utilities
          "date-vendor": ["date-fns", "react-day-picker"],
        },
      },
    },
  },
}));
