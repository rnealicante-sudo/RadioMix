import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
const env = loadEnv(mode, process.cwd(), '')
return {
// Usamos la ruta vacía para máxima compatibilidad
base: '',
plugins: [react()],
define: {
'process.env': env
},
resolve: {
alias: {
'@': path.resolve(__dirname, './'),
},
},
build: {
outDir: 'dist',
assetsDir: 'assets',
emptyOutDir: true,
// Esto evita que los nombres de archivos cambien y se pierdan
rollupOptions: {
output: {
manualChunks: undefined,
},
},
}
}
})