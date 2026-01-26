import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      jquery: resolve(__dirname, 'node_modules/jquery/dist/jquery.js'),
      select2: resolve(__dirname, 'node_modules/select2/dist/js/select2.js'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        login: 'login.html',
      },
    },
  },
});