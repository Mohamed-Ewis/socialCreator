/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app.vue',
    './components/**/*.{vue,js}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './composables/**/*.js'
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          raised: 'rgb(var(--ink-raised) / <alpha-value>)',
          overlay: 'rgb(var(--ink-overlay) / <alpha-value>)',
          chrome: 'rgb(var(--ink-chrome) / <alpha-value>)'
        },
        paper: {
          DEFAULT: 'rgb(var(--paper) / <alpha-value>)',
          muted: 'rgb(var(--paper-muted) / <alpha-value>)'
        },
        line: 'rgb(var(--line) / <alpha-value>)',
        gold: {
          DEFAULT: 'rgb(var(--gold) / <alpha-value>)',
          strong: 'rgb(var(--gold-strong) / <alpha-value>)'
        },
        steel: 'rgb(var(--steel) / <alpha-value>)',
        economy: 'rgb(var(--economy) / <alpha-value>)',
        sports: 'rgb(var(--sports) / <alpha-value>)',
        trend: 'rgb(var(--trend) / <alpha-value>)'
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        panel: '0 10px 28px rgb(0 0 0 / 0.28)'
      }
    }
  }
}
