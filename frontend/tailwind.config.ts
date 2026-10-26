import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'var(--theme-bg)',
        panel: 'var(--theme-panel)',
        panel2: 'var(--theme-panel2)',
        line: 'var(--theme-line)',
        ink: 'var(--theme-text)',
        muted: 'var(--theme-muted)',
        cyan: '#5ee7ff',
        green: '#58e391',
        yellow: '#ffd166',
        red: '#ff647c',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(.16,1,.3,1)',
      },
      keyframes: {
        ping2: { '0%': { transform: 'scale(.6)', opacity: '.8' }, '100%': { transform: 'scale(2.2)', opacity: '0' } },
        sheen: { '0%,60%': { transform: 'translateX(-120%)' }, '100%': { transform: 'translateX(120%)' } },
        idleGlow: { '0%,100%': { boxShadow: '0 10px 30px rgba(94,231,255,.15)' }, '50%': { boxShadow: '0 10px 40px rgba(94,231,255,.35)' } },
        freeBreathe: { '0%,100%': { boxShadow: 'inset 0 0 0 1px rgba(53,216,121,.16), 0 0 8px rgba(53,216,121,.10)' }, '50%': { boxShadow: 'inset 0 0 0 1px rgba(53,216,121,.35), 0 0 22px rgba(53,216,121,.22)' } },
        headlight: { '0%,100%': { boxShadow: '0 0 4px 1px rgba(191,247,255,.5)' }, '50%': { boxShadow: '0 0 9px 3px rgba(191,247,255,.9)' } },
        idleBob: { from: { transform: 'translateY(1px)' }, to: { transform: 'translateY(-1.5px)' } },
        floatIdle: { from: { transform: 'translateY(0)' }, to: { transform: 'translateY(-5px)' } },
        tightPulse: { '0%,100%': { borderColor: 'var(--theme-line)' }, '50%': { borderColor: '#ff647c', boxShadow: '0 0 16px rgba(255,100,124,.25)' } },
        rippleAnim: { to: { transform: 'scale(18)', opacity: '0' } },
      },
      animation: {
        ping2: 'ping2 1.8s var(--tw-ease,cubic-bezier(.16,1,.3,1)) infinite',
        sheen: 'sheen 3.2s ease-in-out infinite',
        idleGlow: 'idleGlow 2.6s ease-in-out infinite',
        freeBreathe: 'freeBreathe 2.4s ease-in-out infinite',
        headlight: 'headlight 1.6s ease-in-out infinite',
        idleBob: 'idleBob 2.8s ease-in-out infinite alternate',
        floatIdle: 'floatIdle 4.5s ease-in-out infinite alternate',
        tightPulse: 'tightPulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
