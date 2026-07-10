/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#111827',
          primary: '#10b981',
          secondary: '#1f2937',
          accent: '#34d399',
          hover: '#059669'
        }
      }
    },
  },
  plugins: [],
}
