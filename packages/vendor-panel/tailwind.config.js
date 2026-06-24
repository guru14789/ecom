/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { main: '#01406D', light: '#01B4BA', dark: '#012a4a', hover: '#013258' },
        bg: { light: '#F5FEFE' },
        accent: { orange: '#FF7A0F', orangeHover: '#e06b0d' },
        teal: '#01B4BA', navy: '#01406D',
      },
      fontFamily: {
        artz: ['HWT Artz', 'Georgia', 'serif'],
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
