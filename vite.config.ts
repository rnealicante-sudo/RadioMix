import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
const env = loadEnv(mode, process.cwd(), '')
return {
base: './',
plugins: [react()],
define: {
'process.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
'process.env.NODE_ENV': JSON.stringify(mode)
},
resolve: {
alias: {
'@': path.resolve(__dirname, './'),
},
},
build: {
outDir: 'dist',
assetsDir: 'assets',
emptyOutDir: true
}
}
})