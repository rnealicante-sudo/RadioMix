import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Carga las variables de entorno (.env en local, Secrets en GitHub)
    const env = loadEnv(mode, '.', '');
    
    return {
      // IMPORTANTE: Sustituye 'revoxmix' por el nombre exacto de tu repositorio en GitHub
      base: '/RadioMix/', 
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // Esto permite que la app use la API KEY de Gemini de forma segura
        'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
