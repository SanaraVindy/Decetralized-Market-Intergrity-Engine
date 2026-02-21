/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        audit: {
          dark: '#020617',
          surface: '#0a0f1c',
          border: '#1e293b',
          accent: '#3b82f6'
        }
      }
    },
  },
  plugins: [],
}