/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'c-base':      '#0e1015',
        'c-surface':   '#16191f',
        'c-elevated':  '#1e2129',
        'c-border':    '#2a2d36',
        'c-border-strong': '#3d4150',
        'c-text':      '#e8eaf0',
        'c-text-2':    '#8b90a0',
        'c-text-3':    '#4d5163',
        'c-accent':    '#5b8dee',
        'c-win':       '#4ade80',
        'c-loss':      '#f87171',
        'c-draw':      '#94a3b8',
        'c-warning':   '#fbbf24',
      },
      fontFamily: {
        ui:   ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        sm: '3px',
        md: '4px',
        lg: '6px',
      },
    },
  },
  plugins: [],
};
