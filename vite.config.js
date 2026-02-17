import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // NOTA: Eliminamos la línea "base: './'" que era para Electron. 
  // Vercel prefiere la configuración por defecto.
})