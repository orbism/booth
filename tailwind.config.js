/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/app/**/*.{js,ts,jsx,tsx}",
      "./src/components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: {
            DEFAULT: '#3B82F6', // blue-500
            dark: '#1E40AF', // blue-800
          },
          secondary: {
            DEFAULT: '#1E40AF', // blue-800
            dark: '#1E3A8A', // blue-900
          },
        },
        fontFamily: {
          sans: ['var(--font-geist-sans)'],
          mono: ['var(--font-geist-mono)'],
        },
      },
    },
    plugins: [
      require('@tailwindcss/forms'),
    ],
  }