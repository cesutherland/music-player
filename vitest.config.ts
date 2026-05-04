import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.spec.ts'],
    testTimeout: 15_000,
  },
});
