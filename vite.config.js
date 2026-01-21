import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Adicione esta linha
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        login: 'login.html',
      },
    },
  },
});