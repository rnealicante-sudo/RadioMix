import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    // Carga las variables de entorno (.env local o los Secrets de GitHub)
    const env = loadEnv(mode, '.', '');
    
    return {
      // Configuramos la base con el nombre de tu repositorio
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
          // Permite usar el alias @ para referirse a la raíz
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});