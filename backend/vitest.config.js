import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 30000,
    setupFiles: ['./tests/setup.js'],
    globalSetup: ['./tests/setup.js'],
    fileParallelism: false,
  },
});
