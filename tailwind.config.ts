/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        osi: {
          primary: "#fbad37",
          "primary-dark": "#e09520",
          secondary: "#596376",
          "secondary-light": "#7a8699",
          bg: "#f8f7f5",
          dark: "#1A1A2E",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
