/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'c-base':      'var(--c-base)',
        'c-surface':   'var(--c-surface)',
        'c-elevated':  'var(--c-elevated)',
        'c-border':    'var(--c-border)',
        'c-border-mid': 'var(--c-border-mid)',
        'c-text':      'var(--c-text)',
        'c-text-2':    'var(--c-text-2)',
        'c-text-3':    'var(--c-text-3)',
        'c-gold':      'var(--c-gold)',
        'c-gold-dim':  'var(--c-gold-dim)',
        'c-gold-glow': 'var(--c-gold-glow)',
        'c-win':       'var(--c-win)',
        'c-loss':      'var(--c-loss)',
        'c-draw':      'var(--c-draw)',
        'c-warn':      'var(--c-warn)',
      },
      fontFamily: {
        ui:      ['var(--font-ui)'],
        mono:    ['var(--font-mono)'],
        display: ['var(--font-display)'],
      },
      borderRadius: {
        sm:   'var(--radius-sm)',
        md:   'var(--radius-md)',
        lg:   'var(--radius-lg)',
        full: 'var(--radius-full)',
      },
    },
  },
  plugins: [],
};
