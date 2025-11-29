/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#ff6000',
          dark: '#e55400',
          light: '#ff8533',
        },
        secondary: {
          DEFAULT: '#4a5568',
          dark: '#2d3748',
          light: '#718096',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
