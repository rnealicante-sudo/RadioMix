import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/RadioMix/', // IMPORTANTE: Esto permite que los archivos se encuentren en GitHub Pages
  build: {
    outDir: 'dist',
  }
})
