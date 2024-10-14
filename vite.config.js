import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  base: "./",
  build: {
    outDir: 'dist', // Make sure this matches where you want the files to be built
  },
});