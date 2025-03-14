// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
      lib: {
        entry: 'src/svg-datatable.ts',
        name: 'datatable',
        fileName: (format) => `datatable.${format}.js`,
      }
  },
  plugins: [],
});