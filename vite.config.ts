import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      {
        name: 'vite-dual-entry-html',
        transformIndexHtml: {
          order: 'pre',
          handler(html) {
            const startMarker = '<!-- STANDALONE_BOOT_START -->';
            const endMarker = '<!-- STANDALONE_BOOT_END -->';
            const startIdx = html.indexOf(startMarker);
            const endIdx = html.indexOf(endMarker);
            if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
              return html;
            }
            return (
              html.slice(0, startIdx) +
              '<script type="module" src="/src/main.tsx"></script>' +
              html.slice(endIdx + endMarker.length)
            );
          },
        },
      },
      react(),
      tailwindcss(),
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      entries: ['src/main.tsx'],
      include: ['react', 'react-dom', 'react-dom/client', 'lucide-react'],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
