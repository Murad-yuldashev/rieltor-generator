import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    root: './',
  },
  // NestJS dekoratorlari emitDecoratorMetadata talab qiladi — esbuild buni qilmaydi, SWC qiladi.
  plugins: [swc.vite({ module: { type: 'es6' } })],
});
