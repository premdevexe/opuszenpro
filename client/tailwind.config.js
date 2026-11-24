/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#00D0FE',
          50: '#f0fbff',
          100: '#e0f7fe',
          200: '#b8eeff',
          300: '#7ae2fe',
          400: '#33d3fe',
          500: '#00D0FE', // Main electric cyan primary color
          600: '#00b5de',
          700: '#0090b2',
          800: '#00728d',
          900: '#065d73',
          950: '#023c4d',
        },
        secondary: {
          DEFAULT: '#0ea5e9',
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        anthropic: {
          orange: '#d97706',
          warm: '#cc785c',
          light: '#e0a96d',
          sand: '#efe9dc'
        },
        dark: {
          950: '#07080c',
          900: '#0b0d14',
          850: '#10131d',
          800: '#161a29',
          750: '#1c2135',
          700: '#232942',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 3s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { opacity: 0.4, filter: 'blur(20px)' },
          '100%': { opacity: 0.8, filter: 'blur(30px)' },
        }
      }
    },
  },
  plugins: [],
}
