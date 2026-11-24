import type { Config } from 'tailwindcss';

// Every colour maps to a CSS variable in src/styles/tokens.css. Do not add raw hex values here.
const v = (name: string) => `var(--${name})`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: v('white'),
      ink: v('ink'),
      muted: v('muted'),
      surface: v('surface'),
      field: v('field'),
      border: v('border'),
      sage: { 100: v('sage-100'), 300: v('sage-300'), 500: v('sage-500') },
      green: { 600: v('green-600'), 700: v('green-700'), 800: v('green-800'), 900: v('green-900') },
      plum: { 100: v('plum-100'), 500: v('plum-500'), 700: v('plum-700') },
      success: v('success'),
      warning: v('warning'),
      error: v('error'),
      info: v('info'),
      highlighter: v('highlighter'),
      grid: v('grid'),
      margin: v('margin'),
      rule: v('rule'),
      'rule-strong': v('rule-strong'),
    },
    fontFamily: {
      heading: v('font-heading'),
      body: v('font-body'),
      margin: v('font-margin'),
    },
    borderRadius: { none: '0', DEFAULT: v('radius') },
    screens: { sm: '640px', lg: '1024px', xl: '1280px' },
    extend: {
      spacing: { margin: v('margin-col'), content: v('content-start'), tap: v('tap-min') },
      maxWidth: { prose: '68ch', page: '600px' },
      transitionDuration: { DEFAULT: v('dur') },
      transitionTimingFunction: { DEFAULT: v('ease') },
    },
  },
  plugins: [],
} satisfies Config;
