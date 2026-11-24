/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFF8E7',
          100: '#FFEFD0',
          200: '#FFDEA1',
          300: '#FFC960',
          400: '#FFB02E',
          500: '#FF9500',
          600: '#E67E00',
          700: '#B35F00',
          800: '#8B4A00',
          900: '#6B3B00',
        },
        coffee: {
          light: '#F5F0EB',
          DEFAULT: '#8B6914',
          dark: '#5D4510',
        }
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
      },
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
      }
    },
  },
  plugins: [],
}