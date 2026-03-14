import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  adapter: node({
    mode: 'standalone',
  }),
  server: {
    port: 3000,
  },
  security: {
    checkOrigin: false,
  },
});
