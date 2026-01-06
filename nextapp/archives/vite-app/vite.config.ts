import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@supabase/supabase-js'],
    exclude: ['lucide-react']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'chart-vendor': ['chart.js', 'react-chartjs-2'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
          'utils': ['zustand', 'papaparse']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false
  }
});