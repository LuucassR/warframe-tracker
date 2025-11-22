import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// REEMPLAZA 'NOMBRE_DE_TU_REPO' con el nombre exacto de tu repo en GitHub
// Ejemplo: si tu repo es https://github.com/juan/wf-tracker, pon '/wf-tracker/'
export default defineConfig({
  plugins: [react()],
  base: '/warframe-tracker/', 
})