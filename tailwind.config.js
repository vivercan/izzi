/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/*/.{js,ts,jsx,tsx}",
    "./components/*/.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'fx-primary': '#1E66F5',
        'fx-bg': '#0B1220',
        'fx-surface': '#0F172A',
        'fx-text': '#FFFFFF',
        'fx-muted': '#94A3B8',
      },
      spacing: {
        'xs': '8px',
        'sm': '12px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
      },
      borderRadius: {
        'md': '12px',
        'lg': '16px',
      },
      fontFamily: {
        'exo': ['Exo 2', 'sans-serif'],
        'orbitron': ['Orbitron', 'sans-serif'],
      },
    },
  },
  plugins: [],
}