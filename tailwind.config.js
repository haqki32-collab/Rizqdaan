/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#002f34',
          light: '#f7f8f9',
          dark: '#001a1d',
        },
        secondary: '#64748B',
        accent: {
          blue: '#3A77FF',
          yellow: '#FFC800',
          teal: '#23E5DB',
        },
        dark: {
          bg: '#18181B',
          surface: '#27272A',
          text: '#E4E4E7',
          primary: '#004a52', 
        }
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      }
    }
  },
  plugins: [],
}