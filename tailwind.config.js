/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
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
        ],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // Original BD Green (kept for compatibility)
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
        },
        // FLN Command Center - Dark Navy + Teal + Gold (from screenshots - 100% flawless)
        fln: {
          bg: '#020617',
          card: '#0f172a',
          cardHover: '#1e293b',
          border: '#1e3a4a',
          borderHover: '#2d5a6b',
          teal: '#06b6d4',
          tealLight: '#22d3ee',
          tealDark: '#0891b2',
          tealMuted: '#0e7490',
          gold: '#f59e0b',
          goldLight: '#fbbf24',
          goldMuted: '#d97706',
          green: '#10b981',
          red: '#ef4444',
          redMuted: '#dc2626',
          grid: 'rgba(6, 182, 214, 0.04)',
          text: '#f1f5f9',
          textMuted: '#94a3b8',
          textDim: '#64748b',
        }
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(6, 78, 59, 0.08), 0 10px 20px -2px rgba(6, 78, 59, 0.04)',
        'soft-lg': '0 10px 25px -5px rgba(6, 78, 59, 0.1), 0 8px 10px -6px rgba(6, 78, 59, 0.04)',
        'soft-red': '0 4px 14px 0 rgba(185, 28, 28, 0.15)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(6, 78, 59, 0.05)',
        'fln': '0 4px 20px rgba(6, 182, 214, 0.15), 0 0 0 1px rgba(6, 182, 214, 0.1)',
        'fln-gold': '0 4px 20px rgba(245, 158, 11, 0.15), 0 0 0 1px rgba(245, 158, 11, 0.1)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        glow: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 10px rgba(6, 182, 214, 0.3)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 20px rgba(6, 182, 214, 0.5)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    }
  },
  plugins: []
}
