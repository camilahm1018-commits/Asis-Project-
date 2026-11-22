import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.js'],
    include: ['src/__tests__/**/*.test.{js,jsx}'],
    globals: true,
    clearMocks: true,
    restoreMocks: true,
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: '../qa-reportes/frontend-coverage',
      include: ['src/services/api.js', 'src/components/ProtectedRoute.jsx', 'src/pages/Login.jsx'],
    },
  },
});
