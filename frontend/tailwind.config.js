/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7ff',
          100: '#e6ebff',
          200: '#d0d9ff',
          300: '#a6b9ff',
          500: '#3b5ddd',
          600: '#2f49b0',
          700: '#253a8c',
          800: '#1e2f70'
        }
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
