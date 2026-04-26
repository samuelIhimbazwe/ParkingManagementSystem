/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Outfit"', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef8ff',
          100: '#d9efff',
          200: '#bce0ff',
          300: '#8ec8ff',
          400: '#58a8ff',
          500: '#3188f7',
          600: '#1b6ae4',
          700: '#1554b8',
          800: '#164896',
          900: '#173f77',
        },
      },
      boxShadow: {
        card: '0 4px 6px -1px rgb(0 0 0 / 0.06), 0 10px 20px -4px rgb(15 23 42 / 0.08)',
      },
    },
  },
  plugins: [],
}
