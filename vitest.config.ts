import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load .env.test (or .env) vars so the env module validates at test time
  const testEnv = loadEnv('test', process.cwd(), '');
  return {
    plugins: [react()],
    test: {
      env: { ...testEnv, NODE_ENV: 'test' },
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/__tests__/setup.ts'],
      // Use forks pool for Bun compatibility
      pool: 'forks',
      // Test files that use jose (JWT) must run in the node environment so
      // that TextEncoder and Uint8Array share the same realm and the
      // jose `instanceof Uint8Array` check does not fail.
      environmentMatchGlobs: [
        ['**/*session*', 'node'],
        ['**/api/auth/**', 'node'],
        ['**/healthz-smoke*/**', 'node'],
      ],
      deps: {
        // zod v3.25+ is ESM-only; inlining prevents undefined-module errors
        // when running tests in the forks pool with jsdom environment.
        inline: ['zod'],
      },
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'src/__tests__/',
          '**/*.test.ts',
          '**/*.test.tsx',
        ],
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
