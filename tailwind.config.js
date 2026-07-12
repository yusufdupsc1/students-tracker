/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Noto Sans Bengali',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif'
        ]
      },
      colors: {
        maroon: {
          DEFAULT: '#811B22',
          dark: '#5E1318',
          light: '#A8323B'
        }
      }
    }
  },
  plugins: []
}
