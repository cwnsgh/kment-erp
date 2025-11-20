/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#111b2e',
          dark: '#0c1324',
          light: '#1c2840'
        },
        accent: {
          DEFAULT: '#2b5cff',
          soft: '#e2e9ff'
        },
        primary: {
          DEFAULT: '#2b5cff',
          foreground: '#ffffff'
        },
        background: '#eef3fb',
        surface: '#ffffff',
        muted: '#f3f6fb'
      },
      boxShadow: {
        card: '0 20px 40px -24px rgba(17, 27, 46, 0.25)'
      },
      borderRadius: {
        xl: '1.25rem',
        '2xl': '1.75rem'
      }
    }
  },
  plugins: []
};


