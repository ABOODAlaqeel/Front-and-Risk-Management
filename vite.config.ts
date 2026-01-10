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
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          // Keep the main app bundle smaller and cache vendors better.
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) return 'react-vendor';
          if (id.includes('@tanstack')) return 'query-vendor';
          if (id.includes('@radix-ui')) return 'radix-vendor';
          if (id.includes('recharts')) return 'charts-vendor';
          if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) return 'forms-vendor';
          if (id.includes('date-fns') || id.includes('react-day-picker')) return 'date-vendor';
          if (id.includes('lucide-react')) return 'icons-vendor';

          return 'vendor';
        },
      },
    },
  },
}));
