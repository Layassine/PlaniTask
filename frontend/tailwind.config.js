/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          from: '#EC4899',
          to: '#8B5CF6',
        },
        secondary: '#0EA5E9',
        accent: '#06B6D4',
        background: '#F8FAFC',
        textDark: '#0F172A',
        textGray: '#64748B',
      },
      fontFamily: {
        sans: ['Inter', 'Arial', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
