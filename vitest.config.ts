import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/server/**/*.test.ts'],
      setupFiles: ['tests/unit/setup.ts'],
      // The downloads read print colours from tokens.css?raw (src/lib/printColours.ts).
      css: { include: [/tokens\.css/] },
    },
  }),
);
