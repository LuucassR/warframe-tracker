/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wf: {
          dark: '#0f0f15',   // Fondo oscuro
          panel: '#1a1a24',  // Paneles
          accent: '#23d9ea', // Cyan Warframe
          gold: '#d4af37',   // Prime Gold
          danger: '#ef4444',
        }
      }
    },
  },
  plugins: [],
}