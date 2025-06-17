/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-mint': '#3ED2B9',
        'background-base': '#F2F2F2',
        'background-card': '#FFFFFF',
        'text-primary': '#2E2E2E',
        'text-secondary': '#6E6E6E',
        'error-red': '#E74C3C',
        'border-light': '#E6E6E6',
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', '"Noto Sans KR"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}