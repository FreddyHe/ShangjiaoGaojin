/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FEF5F0',
          100: '#FDE8DC',
          200: '#FBD4BC',
          300: '#F8B68D',
          400: '#F4925D',
          500: '#C96442',
          600: '#B8533A',
          700: '#974432',
          800: '#7A3A2D',
          900: '#633028',
        },
        background: {
          50: '#FAF9F7',
          100: '#F5F0EB',
          200: '#EDE6DE',
          300: '#E2D9CF',
        },
        surface: {
          50: '#FEFEFE',
          100: '#FAFAFA',
          200: '#F5F5F5',
        },
        text: {
          primary: '#2D2B2A',
          secondary: '#5C5A58',
          tertiary: '#8A8886',
          muted: '#A8A6A4',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'SF Pro Display', 'Inter', 'Noto Sans SC', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(45, 43, 42, 0.04)',
        'medium': '0 4px 16px rgba(45, 43, 42, 0.08)',
        'glow': '0 0 20px rgba(201, 100, 66, 0.3)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
