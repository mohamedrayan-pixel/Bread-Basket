import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the Vite dev server (5173) forwards /api calls to the Node backend (3001).
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:3001' } },
  preview: { proxy: { '/api': 'http://localhost:3001' } },
});
