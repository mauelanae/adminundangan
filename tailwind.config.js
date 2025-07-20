/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        dmsans: ['DM Sans', 'sans-serif'],
        spicyrice: ['Spicy Rice', 'cursive'],
      },
      colors: {
        blue: '#0F0E83',
      },
      animation: {
        slideUp: "slideUp 0.4s", // 💡 animasi muncul dari bawah
      },
      keyframes: {
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(40px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}