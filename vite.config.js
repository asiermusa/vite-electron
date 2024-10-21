import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  base: "./",
  build: {
    outDir: 'dist', // Make sure this matches where you want the files to be built
  },
  rollupOptions: {
    input: './main.js', // Entry point
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // Assuming your components are in the 'src' folder
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler' // or "modern"
      }
    }
  }
});