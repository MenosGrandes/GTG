import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    testTimeout: 60000,
    exclude: ['node_modules/**', 'output/**', 'build/**'],
    fileParallelism: false,
  },
});
