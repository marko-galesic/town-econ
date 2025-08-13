import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['node_modules/', 'dist/', 'coverage/', '**/*.d.ts', '**/*.config.*', '**/*.spec.ts', '**/*.test.ts', 'src/main.ts'],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 75,
        statements: 85,
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
