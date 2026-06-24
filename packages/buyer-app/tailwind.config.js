/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          main: '#01406D',
          light: '#01B4BA',
          dark: '#012a4a',
          hover: '#013258',
        },
        bg: {
          light: '#F5FEFE',
        },
        accent: {
          orange: '#FF7A0F',
          orangeHover: '#e06b0d',
        },
        teal: '#01B4BA',
        navy: '#01406D',
      },
      fontFamily: {
        artz: ['HWT Artz', 'Georgia', 'serif'],
        inter: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 8px 30px rgb(0, 0, 0, 0.06)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.08)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'float-badge': 'floatBadge 4s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 2s infinite ease-in-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        floatBadge: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-6px) scale(1.05)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        }
      }
    },
  },
  plugins: [],
}
