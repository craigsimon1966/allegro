import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// Cloudflare Pages sets CF_PAGES_COMMIT_SHA during its build. /version.txt and a meta tag show
// which commit a deploy is serving, so "is the new version live?" can be checked in a browser.
const build = (process.env.CF_PAGES_COMMIT_SHA ?? 'local').slice(0, 7);
const buildStamp = {
  name: 'allegro-build-stamp',
  transformIndexHtml: (html: string) =>
    html.replace('</head>', `  <meta name="allegro-build" content="${build}" />\n  </head>`),
  generateBundle(this: {
    emitFile: (f: { type: 'asset'; fileName: string; source: string }) => void;
  }) {
    this.emitFile({
      type: 'asset',
      fileName: 'version.txt',
      source: `${build} ${process.env.CF_PAGES_BRANCH ?? ''} ${new Date().toISOString()}\n`,
    });
  },
};

export default defineConfig({
  plugins: [react(), buildStamp],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
      '@content': fileURLToPath(new URL('./content', import.meta.url)),
    },
  },
  // /api/* is served by Pages Functions via `wrangler pages dev` on 8788 (npm run dev).
  server: { port: 5173, proxy: { '/api': 'http://localhost:8788' } },
});
