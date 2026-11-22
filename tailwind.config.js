/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eaf1ff',
          100: '#c9d9ff',
          200: '#8eb3ff',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1246ab',
          800: '#111f40',
          900: '#0b1530',
        },
      },
      fontFamily: {
        sans: ['var(--font-primary)', 'Inter', 'Segoe UI', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
