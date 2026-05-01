import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        fifa: {
          black: '#0a0a0a',
          dark: '#111111',
          card: '#1a1a1a',
          border: '#2a2a2a',
          muted: '#3a3a3a',
          text: '#999999',
          light: '#cccccc',
          white: '#f5f5f5',
        },
        gold: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#c9a84c',
          500: '#b8962e',
          600: '#a07d1a',
          700: '#7c5e14',
          800: '#5c4510',
          900: '#3d2e0a',
        },
        accent: {
          green: '#2ecc71',
          red: '#e74c3c',
          blue: '#3498db',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow-gold': '0 0 20px rgba(201, 168, 76, 0.15)',
        'glow-gold-lg': '0 0 40px rgba(201, 168, 76, 0.2)',
        'card': '0 2px 12px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 4px 24px rgba(0, 0, 0, 0.6)',
      },
    },
  },
  plugins: [],
};

export default config;
