/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Legacy tokens (kept for any components still using them) ──
        sky: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        mint: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
        },
        space: {
          950: '#050816',
          900: '#0a0f1e',
          800: '#0d1b2a',
          700: '#1a2744',
        },
        cyan: {
          400: '#22d3ee',
          300: '#67e8f9',
        },
        primary: '#38bdf8',
        secondary: '#fbbf24',
        accent: '#22c55e',
        surface: '#ffffff',
        background: '#f0f9ff',
        text: '#0f172a',
        muted: '#64748b',

        // ── Neo-Brutalism Palette ─────────────────────────────────────
        'brutal-yellow':   '#FFE135',
        'brutal-coral':    '#FF6B6B',
        'brutal-mint':     '#4ECDC4',
        'brutal-sky':      '#74C0FC',
        'brutal-lavender': '#C77DFF',
        'brutal-orange':   '#FF9A3C',
        'brutal-white':    '#FFFEF7',
        'brutal-black':    '#1A1A2E',
      },
      fontFamily: {
        sans:   ['Nunito', 'Outfit', 'Inter', 'ui-sans-serif', 'system-ui'],
        nunito: ['Nunito', 'Outfit', 'sans-serif'],
        mono:   ['JetBrains Mono', 'ui-monospace'],
      },
      backgroundImage: {},
      boxShadow: {
        'brutal-sm':    '2px 2px 0px 0px #1A1A2E',
        'brutal':       '4px 4px 0px 0px #1A1A2E',
        'brutal-lg':    '8px 8px 0px 0px #1A1A2E',
        'brutal-xl':    '12px 12px 0px 0px #1A1A2E',
        'brutal-color': '4px 4px 0px 0px #FF6B6B',
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
        'pulse-dot':   'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {},
    },
  },
  plugins: [],
}
