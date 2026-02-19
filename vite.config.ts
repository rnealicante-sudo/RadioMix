import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
const env = loadEnv(mode, process.cwd(), '')
return {
// Usamos el nombre exacto de tu repo
base: '/RadioMix/',
plugins: [react()],
define: {
'process.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY)
},
resolve: {
alias: {
'@': path.resolve(__dirname, './'),
},
},
build: {
outDir: 'dist',
assetsDir: 'assets',
// Esto evita conflictos de archivos viejos
emptyOutDir: true,
// Esto asegura que los nombres de archivos sean compatibles
rollupOptions: {
output: {
assetFileNames: 'assets/[name].[ext]',
chunkFileNames: 'assets/[name].js',
entryFileNames: 'assets/[name].js',
},
},
}
}
})