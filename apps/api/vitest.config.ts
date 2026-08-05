import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts', 'prisma/**/*.{test,spec}.ts'],
    root: './',
  },
  // NestJS decorators need emitDecoratorMetadata: esbuild does not emit it, SWC does.
  plugins: [swc.vite({ module: { type: 'es6' } })],
});
