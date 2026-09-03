import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // The CRM SPA is served under /crm/* in production (the API mounts its
  // hashed assets there), so every asset URL must be prefixed to match.
  base: '/crm/',
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': new URL('./src/', import.meta.url).pathname } },
  // @rieltor/shared is a CJS package linked through a workspace symlink. By default Vite
  // skips "linked" packages during optimizeDeps and serves them as source, so the browser
  // tries to import a raw CommonJS file as ESM and fails with "does not provide an export
  // named". Forcing it into pre-bundling makes esbuild convert it to ESM first.
  optimizeDeps: { include: ['@rieltor/shared'] },
  server: {
    // Distinct from @rieltor/web (5173) and @rieltor/agent (5174) so all dev
    // servers can run side by side.
    port: 5175,
    // In dev the API and images come from NestJS; in production they share one origin.
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
      '/images': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    // The production build is served publicly, so source maps are disabled to avoid
    // leaving .js.map files exposed.
    sourcemap: false,
    commonjsOptions: { include: [/packages\/shared/, /node_modules/] },
  },
});
