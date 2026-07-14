/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Hind Siliguri', 'Noto Sans Bengali', 'system-ui', 'sans-serif'],
        body: ['Hind Siliguri', 'Noto Sans Bengali', 'system-ui', 'sans-serif'],
        sans: [
          'Hind Siliguri',
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
        'bd-green': {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22'
        },
        'bd-red': {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d'
        },
        gold: {
          DEFAULT: '#C9A227',
          light: '#F0D878',
          dark: '#A6851F'
        }
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(6, 78, 59, 0.08), 0 10px 20px -2px rgba(6, 78, 59, 0.04)',
        'soft-lg': '0 10px 25px -5px rgba(6, 78, 59, 0.1), 0 8px 10px -6px rgba(6, 78, 59, 0.04)',
        'soft-red': '0 4px 14px 0 rgba(185, 28, 28, 0.15)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(6, 78, 59, 0.05)'
      }
    }
  },
  plugins: []
}
