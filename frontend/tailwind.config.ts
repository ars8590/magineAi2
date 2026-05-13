import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './pages/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#4b2bee',
        'primary-hover': '#3a21b8',
        'background-light': '#f6f6f8',
        'background-dark': '#131022',
        'surface-light': '#ffffff',
        'surface-dark': '#1e1b2e',
        'text-main-light': '#100d1b',
        'text-main-dark': '#f9f8fc',
        'text-sub-light': '#594c9a',
        'text-sub-dark': '#9ca3af',
        'border-light': '#e9e7f3',
        'border-dark': '#2d2a40',
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#4b2bee',
          600: '#3a21b8',
          700: '#3641a8',
          800: '#27307a',
          900: '#19204d'
        }
      },
      fontFamily: {
        display: ['Manrope', 'sans-serif']
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        full: '9999px'
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.3)'
      },
      backdropBlur: {
        xs: '2px'
      }
    }
  },
  plugins: []
};

export default config;

