import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': new URL('./src/', import.meta.url).pathname } },
  // @rieltor/shared - workspace ichida symlink orqali ulangan CJS paket. Vite standart holatda
  // "linked" paketlarni optimizeDeps'dan chetlab o'tadi va manba sifatida xizmat qiladi — natijada
  // brauzer xom CommonJS faylni to'g'ridan-to'g'ri ESM sifatida import qilishga urinadi va
  // "does not provide an export named" xatosini beradi. Shuning uchun uni majburan esbuild orqali
  // ESM'ga oldindan bog'lashga (pre-bundle) kiritamiz.
  optimizeDeps: { include: ['@rieltor/shared'] },
  server: {
    port: 5173,
    // Dev'da API va rasmlar NestJS'dan keladi — prod'da ular bir xil originda bo'ladi.
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
      '/images': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    // Prod build public serve qilinadi — source map'lar .js.map sifatida
    // ochiq qolib ketmasligi uchun o'chirilgan.
    sourcemap: false,
    commonjsOptions: { include: [/packages\/shared/, /node_modules/] },
  },
});
